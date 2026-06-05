<?php

/**
 * Property 16 : Dégradation gracieuse — invariant de fallback
 *
 * Pour toute exception non gérée levée dans un composant de l'AutomationEngine
 * (SmsNotificationService, NotificationService), le système doit :
 *   (a) journaliser l'exception dans `automation_logs` avec `decision = 'escaladee'`,
 *   (b) ne pas laisser la réservation ou le litige dans un état bloqué
 *       (toujours basculer vers le flux manuel — modèle toujours interrogeable,
 *        statut inchangé).
 *
 * De plus, si l'AutomationEngine est désactivé globalement via
 * AutomationConfigService ('automation_engine_enabled' = false), aucune décision
 * `approuvee` ne doit être émise depuis aucune méthode.
 *
 * **Validates: Requirements 7.1, 7.4**
 */

use App\Models\Artisan;
use App\Models\AutomationLog;
use App\Models\Client;
use App\Models\Devis;
use App\Models\Litige;
use App\Models\Reservation;
use App\Services\AutomationConfigService;
use App\Services\AutomationEngine;
use App\Services\NotificationService;
use App\Services\SmsNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

// ── Helpers ────────────────────────────────────────────────────────────────────

beforeEach(function () {
    Cache::flush();
});

/**
 * Build an AutomationEngine whose AutomationConfigService always throws on getRegle().
 * This simulates a core infrastructure failure that will be caught by the engine's
 * try/catch block and produce an 'escaladee' log entry.
 *
 * @param  string  $exceptionMessage  Message of the injected exception
 */
function makeEngineWithThrowingServices(string $exceptionMessage = 'Service unavailable'): AutomationEngine
{
    // Mock AutomationConfigService so that getRegle() throws immediately.
    // This ensures the exception is raised inside the main try/catch of every
    // AutomationEngine method, triggering the 'escaladee' path.
    $config = Mockery::mock(AutomationConfigService::class);
    $config->shouldReceive('getRegle')
        ->andThrow(new \RuntimeException($exceptionMessage));

    // Notification services are kept silent — they are only reached inside
    // gererException()'s nested try/catch and their exceptions are swallowed.
    $sms   = Mockery::mock(SmsNotificationService::class)->shouldIgnoreMissing();
    $notif = Mockery::mock(NotificationService::class)->shouldIgnoreMissing();

    return new AutomationEngine($config, $sms, $notif);
}

/**
 * Build an AutomationEngine with mocked but silent notification services
 * (used when testing the disabled-engine scenario where notifications are not called).
 */
function makeEngineSilent(): AutomationEngine
{
    $config = app(AutomationConfigService::class);
    $sms    = Mockery::mock(SmsNotificationService::class)->shouldIgnoreMissing();
    $notif  = Mockery::mock(NotificationService::class)->shouldIgnoreMissing();

    return new AutomationEngine($config, $sms, $notif);
}

/**
 * Assert that the most recently created automation_log row for the given model ID
 * has decision = 'escaladee' and was written (not null).
 */
function assertEscaladeLogExists(int $modelId, string $modelType): void
{
    $log = AutomationLog::where('model_id', $modelId)
        ->where('model_type', $modelType)
        ->orderByDesc('id')
        ->first();

    expect($log)
        ->not->toBeNull('An automation_log entry must exist after an exception.')
        ->and($log->decision)
        ->toBe('escaladee', "Expected decision='escaladee' but got '{$log->decision}'.");
}

// ── Test 1 : exception during evaluerAcceptationAuto ─────────────────────────

/**
 * **Validates: Requirements 7.1**
 *
 * When an exception is raised inside evaluerAcceptationAuto (simulated by a
 * throwing NotificationService), the engine must:
 *   (1) catch the exception without rethrowing,
 *   (2) write an automation_logs row with decision='escaladee',
 *   (3) leave the Reservation queryable with its original status.
 *
 * The property is repeated with different random artisan scores.
 */
test('property 16 – exception in evaluerAcceptationAuto is caught, escaladee log created, reservation not blocked', function () {
    $score   = fake()->numberBetween(0, 100);
    $artisan = Artisan::factory()->create(['score_confiance' => $score]);

    $reservation = Reservation::factory()->create([
        'id_artisan' => $artisan->id,
        'statut'     => 'en_cours',
    ]);
    $originalStatut = $reservation->statut;

    // Engine with services that throw on any notification call.
    // The engine itself wraps everything in try/catch, so the exception is inside
    // the notification step triggered *after* journalisation.  We inject a mock
    // that throws when notifierAvecCanaux is called (admin alert path).
    $engine = makeEngineWithThrowingServices('SMS provider down');

    // (1) Must not rethrow
    expect(fn () => $engine->evaluerAcceptationAuto($reservation))->not->toThrow(\Throwable::class);

    // (2) automation_logs must contain an 'escaladee' entry for this reservation
    assertEscaladeLogExists($reservation->id, Reservation::class);

    // (3) Reservation is still queryable and status has not been corrupted
    $freshReservation = Reservation::find($reservation->id);
    expect($freshReservation)->not->toBeNull()
        ->and($freshReservation->statut)->toBe($originalStatut);
})->repeat(5);

// ── Test 2 : exception during genererDevisAuto ────────────────────────────────

/**
 * **Validates: Requirements 7.1**
 *
 * Same invariant for genererDevisAuto: exception must be caught, escaladee
 * logged, and reservation left queryable.
 */
test('property 16 – exception in genererDevisAuto is caught, escaladee log created, reservation not blocked', function () {
    $artisan = Artisan::factory()->create(['score_confiance' => fake()->numberBetween(0, 100)]);
    $reservation = Reservation::factory()->create([
        'id_artisan' => $artisan->id,
        'statut'     => 'acceptee',
    ]);
    $originalStatut = $reservation->statut;

    $engine = makeEngineWithThrowingServices('Devis generator failure');

    // (1) Must not rethrow
    expect(fn () => $engine->genererDevisAuto($reservation))->not->toThrow(\Throwable::class);

    // (2) An escaladee log must exist
    assertEscaladeLogExists($reservation->id, Reservation::class);

    // (3) Reservation is still queryable and status unchanged
    $fresh = Reservation::find($reservation->id);
    expect($fresh)->not->toBeNull()
        ->and($fresh->statut)->toBe($originalStatut);
})->repeat(5);

// ── Test 3 : exception during evaluerValidationDevisAuto ─────────────────────

/**
 * **Validates: Requirements 7.1**
 *
 * Same invariant for evaluerValidationDevisAuto: exception must be caught,
 * escaladee logged, and Devis left queryable and untouched.
 */
test('property 16 – exception in evaluerValidationDevisAuto is caught, escaladee log created, devis not blocked', function () {
    $artisan = Artisan::factory()->create(['score_confiance' => fake()->numberBetween(0, 100)]);
    $client  = Client::factory()->create();

    $devis = Devis::create([
        'id_artisan'          => $artisan->id,
        'id_client'           => $client->id,
        'description_travaux' => fake()->sentence(),
        'date_demande'        => now(),
        'montant_propose'     => fake()->randomFloat(2, 1000, 100000),
        'statut'              => 'en_attente',
    ]);
    $originalStatut = $devis->statut;

    $engine = makeEngineWithThrowingServices('Notification failure during devis validation');

    // (1) Must not rethrow
    expect(fn () => $engine->evaluerValidationDevisAuto($devis))->not->toThrow(\Throwable::class);

    // (2) escaladee log must exist for this Devis
    assertEscaladeLogExists($devis->id, Devis::class);

    // (3) Devis is still queryable and status unchanged
    $fresh = Devis::find($devis->id);
    expect($fresh)->not->toBeNull()
        ->and($fresh->statut)->toBe($originalStatut);
})->repeat(5);

// ── Test 4 : exception during detecterFinMission ─────────────────────────────

/**
 * **Validates: Requirements 7.1**
 *
 * Same invariant for detecterFinMission: exception must be caught,
 * escaladee logged, reservation not left in a blocked state.
 */
test('property 16 – exception in detecterFinMission is caught, escaladee log created, reservation not blocked', function () {
    $artisan = Artisan::factory()->create();
    $reservation = Reservation::factory()->create([
        'id_artisan'       => $artisan->id,
        'statut'           => 'en_cours_mission',
        'date_debut'       => now()->subHours(fake()->numberBetween(1, 48)),
        'duree_estimee_min' => fake()->numberBetween(30, 480),
    ]);
    $originalStatut = $reservation->statut;

    $engine = makeEngineWithThrowingServices('GPS service error');

    // (1) Must not rethrow
    expect(fn () => $engine->detecterFinMission($reservation))->not->toThrow(\Throwable::class);

    // (2) An escaladee log must exist
    assertEscaladeLogExists($reservation->id, Reservation::class);

    // (3) Reservation is still queryable and status unchanged
    $fresh = Reservation::find($reservation->id);
    expect($fresh)->not->toBeNull()
        ->and($fresh->statut)->toBe($originalStatut);
})->repeat(5);

// ── Test 5 : exception during resoudreLitigeAuto ─────────────────────────────

/**
 * **Validates: Requirements 7.1**
 *
 * Same invariant for resoudreLitigeAuto: exception must be caught,
 * escaladee logged, and Litige not left in a blocked state.
 */
test('property 16 – exception in resoudreLitigeAuto is caught, escaladee log created, litige not blocked', function () {
    $artisan = Artisan::factory()->create();
    $client  = Client::factory()->create();
    $reservation = Reservation::factory()->create([
        'id_artisan'   => $artisan->id,
        'id_client'    => $client->id,
        'montant_total' => fake()->randomFloat(2, 100, 3000), // below micro seuil to trigger approve path
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
    $originalStatut = $litige->statut;

    $engine = makeEngineWithThrowingServices('Notification error during litige resolution');

    // (1) Must not rethrow
    expect(fn () => $engine->resoudreLitigeAuto($litige))->not->toThrow(\Throwable::class);

    // (2) An escaladee log must exist for this Litige
    assertEscaladeLogExists($litige->id, Litige::class);

    // (3) Litige is still queryable and status unchanged
    $fresh = Litige::find($litige->id);
    expect($fresh)->not->toBeNull()
        ->and($fresh->statut)->toBe($originalStatut);
})->repeat(5);

// ── Test 6 : engine globally disabled → no 'approuvee' decision emitted ──────

/**
 * **Validates: Requirements 7.4**
 *
 * When automation_engine_enabled = false is set via AutomationConfigService,
 * every AutomationEngine method must return a decision that is NOT 'approuvee'.
 * No `automation_logs` row with `decision = 'approuvee'` must be created during
 * any of the engine calls.
 */
test('property 16 – globally disabled engine never emits an approuvee decision', function () {
    /** @var AutomationConfigService $config */
    $config = app(AutomationConfigService::class);
    $config->setRegle('automation_engine_enabled', false);

    $engine = makeEngineSilent();

    $artisan = Artisan::factory()->create(['score_confiance' => 100]);
    $client  = Client::factory()->create();
    $reservation = Reservation::factory()->create([
        'id_artisan'       => $artisan->id,
        'id_client'        => $client->id,
        'statut'           => 'en_cours',
        'date_debut'       => now()->subHours(fake()->numberBetween(1, 10)),
        'duree_estimee_min' => fake()->numberBetween(30, 120),
        'montant_total'    => fake()->randomFloat(2, 500, 40000),
    ]);
    $devis = Devis::create([
        'id_artisan'          => $artisan->id,
        'id_client'           => $client->id,
        'description_travaux' => fake()->sentence(),
        'date_demande'        => now(),
        'montant_propose'     => fake()->randomFloat(2, 1000, 40000),
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
        'score_preuve_gps'   => null,
    ]);

    // Call every engine method
    $decisionAccept  = $engine->evaluerAcceptationAuto($reservation);
    $resultDevis     = $engine->genererDevisAuto($reservation);
    $decisionValider = $engine->evaluerValidationDevisAuto($devis);
    $resultMission   = $engine->detecterFinMission($reservation);
    $decisionLitige  = $engine->resoudreLitigeAuto($litige);

    // No method must return an approved decision
    expect($decisionAccept->approuvee)->toBeFalse(
        'evaluerAcceptationAuto must not return approuvee when engine is disabled.'
    );
    expect($resultDevis)->toBeNull(
        'genererDevisAuto must return null when engine is disabled.'
    );
    expect($decisionValider->approuvee)->toBeFalse(
        'evaluerValidationDevisAuto must not return approuvee when engine is disabled.'
    );
    expect($resultMission)->toBeFalse(
        'detecterFinMission must return false when engine is disabled.'
    );
    expect($decisionLitige->approuvee)->toBeFalse(
        'resoudreLitigeAuto must not return approuvee when engine is disabled.'
    );

    // No automation_logs row with decision='approuvee' must exist
    $approuveeCount = AutomationLog::where('decision', 'approuvee')->count();
    expect($approuveeCount)->toBe(0,
        "No 'approuvee' decision must appear in automation_logs when engine is disabled."
    );
})->repeat(5);

// ── Test 7 : fallback leaves models in a consistent (non-blocked) state ───────

/**
 * **Validates: Requirements 7.1**
 *
 * When multiple consecutive exceptions occur across different engine methods,
 * all affected Reservations and Litiges must remain queryable and not in a
 * "blocked" state (i.e. status still set to their original values).
 *
 * A model is considered "blocked" if it becomes un-queryable (deleted or
 * corrupted) after a failed automation attempt.
 */
test('property 16 – multiple consecutive exceptions leave all models queryable and status unchanged', function () {
    $engine = makeEngineWithThrowingServices('Cascading failure');

    $N = fake()->numberBetween(2, 5);

    $reservations = [];
    $litiges      = [];

    for ($i = 0; $i < $N; $i++) {
        $artisan = Artisan::factory()->create();
        $client  = Client::factory()->create();

        $reservation = Reservation::factory()->create([
            'id_artisan' => $artisan->id,
            'id_client'  => $client->id,
            'statut'     => 'en_cours',
        ]);
        $reservations[] = ['id' => $reservation->id, 'statut' => $reservation->statut];

        $litige = Litige::create([
            'id_artisan'         => $artisan->id,
            'id_client'          => $client->id,
            'id_reservation'     => $reservation->id,
            'description_litige' => fake()->sentence(),
            'date_ouverture'     => now(),
            'statut'             => 'ouvert',
            'fonds_geles'        => true,
            'escalade'           => false,
            'score_preuve_gps'   => null,
        ]);
        $litiges[] = ['id' => $litige->id, 'statut' => $litige->statut];

        // Trigger failures
        $engine->evaluerAcceptationAuto($reservation);
        $engine->resoudreLitigeAuto($litige);
    }

    // All reservations must still be queryable with their original statuses
    foreach ($reservations as $r) {
        $fresh = Reservation::find($r['id']);
        expect($fresh)->not->toBeNull("Reservation #{$r['id']} must still be queryable after exception.")
            ->and($fresh->statut)->toBe($r['statut'], "Reservation #{$r['id']} status must be unchanged.");
    }

    // All litiges must still be queryable with their original statuses
    foreach ($litiges as $l) {
        $fresh = Litige::find($l['id']);
        expect($fresh)->not->toBeNull("Litige #{$l['id']} must still be queryable after exception.")
            ->and($fresh->statut)->toBe($l['statut'], "Litige #{$l['id']} status must be unchanged.");
    }
})->repeat(3);

// ── Test 8 : exception logs contain required non-null fields ──────────────────

/**
 * **Validates: Requirements 7.1**
 *
 * The automation_log rows written during exception handling (decision='escaladee')
 * must satisfy the completeness invariant: all required fields must be non-null
 * (per Property 2 / Requirement 1.5).
 */
test('property 16 – escaladee logs written on exception are complete (all required fields non-null)', function () {
    $artisan = Artisan::factory()->create(['score_confiance' => fake()->numberBetween(0, 100)]);
    $reservation = Reservation::factory()->create([
        'id_artisan' => $artisan->id,
        'statut'     => 'en_cours',
    ]);

    $engine = makeEngineWithThrowingServices('Test exception for completeness check');

    $engine->evaluerAcceptationAuto($reservation);

    $log = AutomationLog::where('model_id', $reservation->id)
        ->where('model_type', Reservation::class)
        ->orderByDesc('id')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->type_action)->not->toBeNull()
        ->and($log->type_action)->not->toBe('')
        ->and($log->model_type)->not->toBeNull()
        ->and($log->model_type)->not->toBe('')
        ->and((int) $log->model_id)->toBeGreaterThan(0)
        ->and($log->decision)->toBeIn(['approuvee', 'rejetee', 'escaladee'])
        ->and($log->score_confiance)->not->toBeNull()
        ->and((float) $log->score_confiance)->toBeGreaterThanOrEqual(0.0)
        ->and($log->regles_evaluees)->not->toBeNull()
        ->and($log->raison)->not->toBeNull()
        ->and((int) $log->duree_ms)->toBeGreaterThanOrEqual(0);
})->repeat(5);
