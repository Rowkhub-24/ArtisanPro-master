<?php

/**
 * Property 2 : Complétude des logs d'automatisation
 *
 * Pour toute décision émise par l'AutomationEngine (quelle que soit l'action :
 * `auto_accept`, `auto_devis`, `auto_validate`, `auto_mission`, `auto_litige`,
 * `rate_limit_exceeded`), l'entrée créée dans `automation_logs` doit contenir
 * des valeurs non nulles pour chaque champ requis :
 *   `type_action`, `model_type`, `model_id`, `decision`,
 *   `score_confiance`, `regles_evaluees`, `raison`, `duree_ms`.
 *
 * Validates: Requirements 1.5
 */

use App\Models\AutomationLog;
use App\Models\Artisan;
use App\Models\Devis;
use App\Models\Litige;
use App\Models\Reservation;
use App\Services\AutomationConfigService;
use App\Services\AutomationEngine;
use App\Services\NotificationService;
use App\Services\SmsNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build an AutomationEngine with mocked notification services so no real
 * SMS/push calls are attempted during tests.
 */
function makeEngine(): AutomationEngine
{
    $config = new AutomationConfigService();
    $sms    = Mockery::mock(SmsNotificationService::class)->shouldIgnoreMissing();
    $notif  = Mockery::mock(NotificationService::class)->shouldIgnoreMissing();

    return new AutomationEngine($config, $sms, $notif);
}

/**
 * Assert that a single automation_log row is complete: every required field
 * must be non-null and, for string/numeric fields, non-empty / non-negative.
 */
function assertLogIsComplete(AutomationLog $log): void
{
    expect($log->type_action)->not->toBeNull()
        ->and($log->type_action)->not->toBe('')
        ->and($log->model_type)->not->toBeNull()
        ->and($log->model_type)->not->toBe('')
        ->and($log->model_id)->not->toBeNull()
        ->and((int) $log->model_id)->toBeGreaterThan(0)
        ->and($log->decision)->not->toBeNull()
        ->and($log->decision)->toBeIn(['approuvee', 'rejetee', 'escaladee'])
        ->and($log->score_confiance)->not->toBeNull()
        ->and((float) $log->score_confiance)->toBeGreaterThanOrEqual(0.0)
        ->and($log->regles_evaluees)->not->toBeNull()
        ->and($log->raison)->not->toBeNull()
        ->and($log->duree_ms)->not->toBeNull()
        ->and((int) $log->duree_ms)->toBeGreaterThanOrEqual(0);
}

// ── Property 2: evaluerAcceptationAuto logs a complete entry (auto_accept) ────

/**
 * **Validates: Requirements 1.5**
 *
 * For any call to `evaluerAcceptationAuto`, the resulting `automation_logs`
 * entry must have all required fields non-null.
 */
test('property 2 – evaluerAcceptationAuto always writes a complete automation_log', function () {
    $engine = makeEngine();

    // Run N iterations with different random artisan scores
    $iterations = fake()->numberBetween(3, 8);

    for ($i = 0; $i < $iterations; $i++) {
        $logCountBefore = AutomationLog::count();

        // Create a reservation with a random artisan score
        $artisan     = Artisan::factory()->create([
            'score_confiance' => fake()->numberBetween(0, 100),
        ]);
        $reservation = Reservation::factory()->create([
            'id_artisan' => $artisan->id,
        ]);

        $engine->evaluerAcceptationAuto($reservation);

        // Exactly one new log must have been created
        expect(AutomationLog::count())->toBe($logCountBefore + 1);

        $log = AutomationLog::latest('id')->first();

        assertLogIsComplete($log);

        // type_action must be one of the accepted values for this method
        expect($log->type_action)->toBeIn(['auto_accept', 'rate_limit_exceeded']);
    }
})->repeat(3);

// ── Property 2: genererDevisAuto logs a complete entry (auto_devis) ────────────

/**
 * **Validates: Requirements 1.5**
 *
 * For any call to `genererDevisAuto`, the resulting `automation_logs`
 * entry must have all required fields non-null.
 */
test('property 2 – genererDevisAuto always writes a complete automation_log', function () {
    $engine = makeEngine();

    $iterations = fake()->numberBetween(3, 8);

    for ($i = 0; $i < $iterations; $i++) {
        $logCountBefore = AutomationLog::count();

        $artisan     = Artisan::factory()->create();
        $reservation = Reservation::factory()->create([
            'id_artisan' => $artisan->id,
        ]);

        $engine->genererDevisAuto($reservation);

        expect(AutomationLog::count())->toBe($logCountBefore + 1);

        $log = AutomationLog::latest('id')->first();
        assertLogIsComplete($log);
        expect($log->type_action)->toBe('auto_devis');
    }
})->repeat(3);

// ── Property 2: evaluerValidationDevisAuto logs a complete entry (auto_validate) ──

/**
 * **Validates: Requirements 1.5**
 *
 * For any call to `evaluerValidationDevisAuto`, the resulting `automation_logs`
 * entry must have all required fields non-null.
 */
test('property 2 – evaluerValidationDevisAuto always writes a complete automation_log', function () {
    $engine = makeEngine();

    $iterations = fake()->numberBetween(3, 8);

    for ($i = 0; $i < $iterations; $i++) {
        $logCountBefore = AutomationLog::count();

        $artisan = Artisan::factory()->create([
            'score_confiance' => fake()->numberBetween(0, 100),
        ]);

        // Create a minimal Devis directly (no factory available — use create())
        $devis = Devis::create([
            'id_artisan'          => $artisan->id,
            'id_client'           => \App\Models\Client::factory()->create()->id,
            'description_travaux' => fake()->sentence(),
            'date_demande'        => now(),
            'montant_propose'     => fake()->randomFloat(2, 1000, 200000),
            'statut'              => 'en_attente',
        ]);

        $engine->evaluerValidationDevisAuto($devis);

        expect(AutomationLog::count())->toBe($logCountBefore + 1);

        $log = AutomationLog::latest('id')->first();
        assertLogIsComplete($log);
        expect($log->type_action)->toBe('auto_validate_devis');
    }
})->repeat(3);

// ── Property 2: detecterFinMission logs a complete entry (auto_mission) ────────

/**
 * **Validates: Requirements 1.5**
 *
 * For any call to `detecterFinMission`, the resulting `automation_logs`
 * entry must have all required fields non-null.
 */
test('property 2 – detecterFinMission always writes a complete automation_log', function () {
    $engine = makeEngine();

    $iterations = fake()->numberBetween(3, 8);

    for ($i = 0; $i < $iterations; $i++) {
        $logCountBefore = AutomationLog::count();

        $artisan     = Artisan::factory()->create();
        $reservation = Reservation::factory()->create([
            'id_artisan'      => $artisan->id,
            'statut'          => 'en_cours_mission',
            'date_debut'      => now()->subHours(fake()->numberBetween(1, 48)),
            'duree_estimee_min' => fake()->numberBetween(30, 480),
        ]);

        $engine->detecterFinMission($reservation);

        expect(AutomationLog::count())->toBe($logCountBefore + 1);

        $log = AutomationLog::latest('id')->first();
        assertLogIsComplete($log);
        expect($log->type_action)->toBe('auto_mission');
    }
})->repeat(3);

// ── Property 2: resoudreLitigeAuto logs a complete entry (auto_litige) ──────────

/**
 * **Validates: Requirements 1.5**
 *
 * For any call to `resoudreLitigeAuto`, the resulting `automation_logs`
 * entry must have all required fields non-null.
 */
test('property 2 – resoudreLitigeAuto always writes a complete automation_log', function () {
    $engine = makeEngine();

    $iterations = fake()->numberBetween(3, 8);

    for ($i = 0; $i < $iterations; $i++) {
        $logCountBefore = AutomationLog::count();

        $artisan     = Artisan::factory()->create();
        $client      = \App\Models\Client::factory()->create();
        $reservation = Reservation::factory()->create([
            'id_artisan'   => $artisan->id,
            'id_client'    => $client->id,
            'montant_total' => fake()->randomFloat(2, 100, 100000),
        ]);

        // Randomise GPS score to cover multiple branches: 0, 1, ambiguous, or null
        $gpsScenario = fake()->randomElement(['zero', 'one', 'ambiguous', 'null']);
        $scoreGps = match ($gpsScenario) {
            'zero'      => 0.0,
            'one'       => 1.0,
            'ambiguous' => fake()->randomFloat(2, 0.01, 0.99),
            'null'      => null,
        };

        $litige = Litige::create([
            'id_artisan'         => $artisan->id,
            'id_client'          => $client->id,
            'id_reservation'     => $reservation->id,
            'description_litige' => fake()->sentence(),
            'date_ouverture'     => now(),
            'statut'             => 'ouvert',
            'fonds_geles'        => true,
            'escalade'           => false,
            'score_preuve_gps'   => $scoreGps,
        ]);

        $engine->resoudreLitigeAuto($litige);

        expect(AutomationLog::count())->toBe($logCountBefore + 1);

        $log = AutomationLog::latest('id')->first();
        assertLogIsComplete($log);
        expect($log->type_action)->toBe('auto_litige');
    }
})->repeat(3);

// ── Property 2: rate_limit_exceeded logs a complete entry ─────────────────────

/**
 * **Validates: Requirements 1.5**
 *
 * When an artisan exceeds the rate limit, the `rate_limit_exceeded`
 * `automation_logs` entry must also have all required fields non-null.
 */
test('property 2 – rate_limit_exceeded action writes a complete automation_log', function () {
    $engine = makeEngine();

    $artisan     = Artisan::factory()->create([
        'score_confiance' => fake()->numberBetween(70, 100),
    ]);
    $reservation = Reservation::factory()->create([
        'id_artisan' => $artisan->id,
    ]);

    // Fire more than 3 evaluations in the same Redis window to trigger rate limiting.
    // We call the method 4 times; the 4th should produce a rate_limit_exceeded log.
    for ($call = 0; $call < 4; $call++) {
        $engine->evaluerAcceptationAuto($reservation);
    }

    // Find the rate_limit_exceeded log
    $rateLimitLog = AutomationLog::where('type_action', 'rate_limit_exceeded')->latest('id')->first();

    expect($rateLimitLog)->not->toBeNull();
    assertLogIsComplete($rateLimitLog);
    expect($rateLimitLog->type_action)->toBe('rate_limit_exceeded');
})->repeat(3);

// ── Property 2: all action types produce complete logs (comprehensive sweep) ──

/**
 * **Validates: Requirements 1.5**
 *
 * Comprehensive sweep: run all AutomationEngine methods N times each and
 * assert that every resulting `automation_logs` row is complete (no nulls).
 * This covers the full set of action types mentioned in the spec:
 * auto_accept, auto_devis, auto_validate, auto_mission, auto_litige.
 */
test('property 2 – every automation_log row created during N random decisions has all required fields non-null', function () {
    $engine = makeEngine();

    $n = fake()->numberBetween(2, 5);

    for ($i = 0; $i < $n; $i++) {
        $artisan     = Artisan::factory()->create(['score_confiance' => fake()->numberBetween(0, 100)]);
        $client      = \App\Models\Client::factory()->create();
        $reservation = Reservation::factory()->create([
            'id_artisan'      => $artisan->id,
            'id_client'       => $client->id,
            'date_debut'      => now()->subHours(fake()->numberBetween(1, 10)),
            'duree_estimee_min' => fake()->numberBetween(30, 120),
            'montant_total'   => fake()->randomFloat(2, 500, 80000),
        ]);
        $devis = Devis::create([
            'id_artisan'          => $artisan->id,
            'id_client'           => $client->id,
            'description_travaux' => fake()->sentence(),
            'date_demande'        => now(),
            'montant_propose'     => fake()->randomFloat(2, 1000, 200000),
            'statut'              => 'en_attente',
        ]);
        $litige = Litige::create([
            'id_artisan'         => $artisan->id,
            'id_client'          => $client->id,
            'id_reservation'     => $reservation->id,
            'description_litige' => fake()->sentence(),
            'date_ouverture'     => now(),
            'statut'             => 'ouvert',
            'fonds_geles'        => true,
            'escalade'           => false,
            'score_preuve_gps'   => fake()->randomElement([0.0, 1.0, null]),
        ]);

        // Call every engine method
        $engine->evaluerAcceptationAuto($reservation);
        $engine->genererDevisAuto($reservation);
        $engine->evaluerValidationDevisAuto($devis);
        $engine->detecterFinMission($reservation);
        $engine->resoudreLitigeAuto($litige);
    }

    // Verify every single log row in the database is complete
    AutomationLog::all()->each(function (AutomationLog $log) {
        assertLogIsComplete($log);
    });
})->repeat(3);
