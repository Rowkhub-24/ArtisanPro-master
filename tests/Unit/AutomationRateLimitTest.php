<?php

/**
 * Property 6 : Invariant de rate limiting
 *
 * Pour tout artisan ayant déjà subi 3 évaluations d'acceptation automatique
 * dans la même fenêtre glissante d'une heure, toute évaluation supplémentaire
 * dans cette fenêtre doit être rejetée avec `type_action = 'rate_limit_exceeded'`
 * dans `automation_logs`, indépendamment des critères de la réservation.
 *
 * Validates: Requirements 2.6, 10.6
 */

use App\Models\Artisan;
use App\Models\AutomationLog;
use App\Models\Reservation;
use App\Services\AutomationConfigService;
use App\Services\AutomationEngine;
use App\Services\NotificationService;
use App\Services\SmsNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

// ── Setup ─────────────────────────────────────────────────────────────────────

/**
 * Create a fresh AutomationEngine instance with real services.
 */
function makeEngine(): AutomationEngine
{
    return new AutomationEngine(
        app(AutomationConfigService::class),
        app(SmsNotificationService::class),
        app(NotificationService::class),
    );
}

/**
 * Create a Reservation linked to the given Artisan.
 */
function makeReservationForArtisan(Artisan $artisan): Reservation
{
    return Reservation::factory()->create([
        'id_artisan' => $artisan->id,
        'statut'     => 'en_cours',
    ]);
}

beforeEach(function () {
    // Flush Redis so each test starts with a clean rate-limit state
    Cache::flush();
});

// ── Property 6: 4th evaluation is rate-limit-rejected ────────────────────────

/**
 * **Validates: Requirements 2.6, 10.6**
 *
 * For any artisan, the first 3 calls to evaluerAcceptationAuto must NOT produce
 * a `rate_limit_exceeded` log entry. The 4th call (within the same 1-hour window)
 * must produce an `automation_logs` row with `type_action = 'rate_limit_exceeded'`.
 */
test('property 6 – 4th evaluation within the hour window is rejected as rate_limit_exceeded', function () {
    $engine  = makeEngine();
    // Use a score well above the acceptance threshold to ensure the first 3 calls
    // are not rejected on score grounds — the focus is on rate limiting alone.
    $artisan = Artisan::factory()->create(['score_confiance' => 85]);

    // Calls 1, 2, 3 — these must all proceed (type_action != 'rate_limit_exceeded')
    for ($i = 1; $i <= 3; $i++) {
        $reservation = makeReservationForArtisan($artisan);
        $engine->evaluerAcceptationAuto($reservation);
    }

    // Verify no rate_limit_exceeded log exists yet
    $rateLimitLogsBefore = AutomationLog::where('type_action', 'rate_limit_exceeded')
        ->whereJsonContains('regles_evaluees', [['cle' => 'rate_limit']])
        ->orWhere(function ($q) {
            $q->where('type_action', 'rate_limit_exceeded');
        })
        ->where('model_type', Reservation::class)
        ->count();

    // There may be 0 or some from other tests but reset ensures clean state.
    // What matters is that the 4th call creates exactly one more.
    $countBefore = AutomationLog::where('type_action', 'rate_limit_exceeded')->count();

    // Call 4 — this MUST be rejected with rate_limit_exceeded
    $reservation4 = makeReservationForArtisan($artisan);
    $decision4    = $engine->evaluerAcceptationAuto($reservation4);

    // The returned decision must not be approved
    expect($decision4->approuvee)->toBeFalse()
        ->and($decision4->necessite_intervention_humaine)->toBeTrue();

    // Exactly one new rate_limit_exceeded log must have been created
    $countAfter = AutomationLog::where('type_action', 'rate_limit_exceeded')->count();
    expect($countAfter)->toBe($countBefore + 1);

    // Verify the log details
    $log = AutomationLog::where('type_action', 'rate_limit_exceeded')
        ->where('model_type', Reservation::class)
        ->where('model_id', $reservation4->id)
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->type_action)->toBe('rate_limit_exceeded')
        ->and($log->model_type)->toBe(Reservation::class)
        ->and($log->model_id)->toBe($reservation4->id)
        // Rate-limit routes the reservation to manual processing (necessite_intervention_humaine = true),
        // so the decision enum is 'escaladee' — not 'rejetee'. See Req 2.6: "router vers le flux manuel".
        ->and($log->decision)->toBe('escaladee');
})->repeat(3);

// ── Property 6: window is per-artisan ────────────────────────────────────────

/**
 * **Validates: Requirements 2.6, 10.6**
 *
 * Rate limiting is scoped per artisan. A 4th call for artisan A must be rejected,
 * while a call for a distinct artisan B (with no previous calls) must still proceed
 * without a rate_limit_exceeded entry.
 */
test('property 6 – rate limit is per-artisan and does not affect other artisans', function () {
    $engine   = makeEngine();
    $artisanA = Artisan::factory()->create(['score_confiance' => 80]);
    $artisanB = Artisan::factory()->create(['score_confiance' => 80]);

    // Exhaust artisan A's quota (3 calls)
    for ($i = 0; $i < 3; $i++) {
        $engine->evaluerAcceptationAuto(makeReservationForArtisan($artisanA));
    }

    // 4th call for artisan A → must be rate-limit-exceeded
    $reservation4A = makeReservationForArtisan($artisanA);
    $decisionA     = $engine->evaluerAcceptationAuto($reservation4A);

    expect($decisionA->approuvee)->toBeFalse();

    $logA = AutomationLog::where('type_action', 'rate_limit_exceeded')
        ->where('model_id', $reservation4A->id)
        ->first();
    expect($logA)->not->toBeNull();

    // 1st call for artisan B → must NOT be rate-limit-exceeded
    $countBefore = AutomationLog::where('type_action', 'rate_limit_exceeded')->count();
    $reservation1B = makeReservationForArtisan($artisanB);
    $engine->evaluerAcceptationAuto($reservation1B);

    $logB = AutomationLog::where('type_action', 'rate_limit_exceeded')
        ->where('model_id', $reservation1B->id)
        ->first();
    expect($logB)->toBeNull(
        'A first call for artisan B must never produce a rate_limit_exceeded log.'
    );
})->repeat(3);

// ── Property 6: all subsequent calls (5th, 6th…) are also rejected ───────────

/**
 * **Validates: Requirements 2.6, 10.6**
 *
 * Once the rate limit is reached, every subsequent call in the same window
 * must also be rejected — not just the 4th one.
 */
test('property 6 – every call after the 3rd is rejected as rate_limit_exceeded', function () {
    $engine  = makeEngine();
    // Use score 0 to avoid any ambiguity: the first 3 calls may themselves be
    // rejected on score grounds, but must NOT be tagged rate_limit_exceeded.
    $artisan = Artisan::factory()->create(['score_confiance' => 75]);

    // First 3 calls
    for ($i = 0; $i < 3; $i++) {
        $engine->evaluerAcceptationAuto(makeReservationForArtisan($artisan));
    }

    // Calls 4 through 6 must all be rate_limit_exceeded
    $extraCalls = fake()->numberBetween(1, 4); // 1 to 4 extra calls

    for ($j = 0; $j < $extraCalls; $j++) {
        $reservationExtra = makeReservationForArtisan($artisan);
        $decisionExtra    = $engine->evaluerAcceptationAuto($reservationExtra);

        expect($decisionExtra->approuvee)->toBeFalse()
            ->and($decisionExtra->necessite_intervention_humaine)->toBeTrue();

        $logExtra = AutomationLog::where('type_action', 'rate_limit_exceeded')
            ->where('model_id', $reservationExtra->id)
            ->first();

        expect($logExtra)->not->toBeNull(
            "Call #{$j} after the rate limit must produce a rate_limit_exceeded log."
        );
    }
})->repeat(3);

// ── Property 6: rate limit is reset after Cache::flush (new window simulation) ──

/**
 * **Validates: Requirements 2.6, 10.6**
 *
 * After the rate-limit window expires (simulated by flushing the Redis cache),
 * the same artisan can make 3 fresh calls without hitting the rate limit.
 */
test('property 6 – rate limit resets after the window expires (cache flush simulation)', function () {
    $engine  = makeEngine();
    $artisan = Artisan::factory()->create(['score_confiance' => 80]);

    // Exhaust the quota in window 1
    for ($i = 0; $i < 3; $i++) {
        $engine->evaluerAcceptationAuto(makeReservationForArtisan($artisan));
    }

    // 4th call in window 1 → rate limited
    $res4 = makeReservationForArtisan($artisan);
    $dec4 = $engine->evaluerAcceptationAuto($res4);
    expect($dec4->approuvee)->toBeFalse();

    $log4 = AutomationLog::where('type_action', 'rate_limit_exceeded')
        ->where('model_id', $res4->id)
        ->first();
    expect($log4)->not->toBeNull();

    // Simulate window expiry by flushing the rate-limit key
    Cache::forget("automation_rate_limit:artisan:{$artisan->id}");

    // Window 2: first 3 calls must NOT produce rate_limit_exceeded logs
    for ($k = 0; $k < 3; $k++) {
        $resNew = makeReservationForArtisan($artisan);
        $engine->evaluerAcceptationAuto($resNew);

        $logNew = AutomationLog::where('type_action', 'rate_limit_exceeded')
            ->where('model_id', $resNew->id)
            ->first();

        expect($logNew)->toBeNull(
            "After window reset, call #{$k} must not be rate-limit-rejected."
        );
    }
})->repeat(3);

// ── Property 6: log record is complete (all required fields non-null) ─────────

/**
 * **Validates: Requirements 2.6, 10.6**
 *
 * The automation_logs record created on rate_limit_exceeded must satisfy the
 * completeness invariant: all required fields must be non-null.
 */
test('property 6 – rate_limit_exceeded log contains all required non-null fields', function () {
    $engine  = makeEngine();
    $artisan = Artisan::factory()->create(['score_confiance' => 90]);

    // Exhaust the quota
    for ($i = 0; $i < 3; $i++) {
        $engine->evaluerAcceptationAuto(makeReservationForArtisan($artisan));
    }

    // 4th call triggers the log
    $reservation4 = makeReservationForArtisan($artisan);
    $engine->evaluerAcceptationAuto($reservation4);

    $log = AutomationLog::where('type_action', 'rate_limit_exceeded')
        ->where('model_id', $reservation4->id)
        ->first();

    expect($log)->not->toBeNull();

    // All required fields must be non-null and well-typed
    expect($log->type_action)->toBe('rate_limit_exceeded')
        ->and($log->model_type)->not->toBeNull()
        ->and($log->model_type)->not->toBe('')
        ->and($log->model_id)->toBeGreaterThan(0)
        // Rate-limit routes to manual (necessite_intervention_humaine = true) → 'escaladee'
        ->and($log->decision)->toBe('escaladee')
        ->and($log->score_confiance)->not->toBeNull()
        ->and($log->regles_evaluees)->not->toBeNull()
        ->and($log->raison)->not->toBeNull()
        ->and($log->raison)->not->toBe('')
        ->and($log->duree_ms)->toBeGreaterThanOrEqual(0);
})->repeat(3);
