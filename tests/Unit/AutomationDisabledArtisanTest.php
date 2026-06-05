<?php

/**
 * Property 3 : Exclusion des artisans désactivés
 *
 * Pour tout artisan dont l'automatisation est désactivée dans `automation_rules`,
 * toute évaluation automatique le concernant doit produire un AutoDecision avec
 * `approuvee = false` et `necessite_intervention_humaine = true`, indépendamment
 * du score_confiance ou de tout autre critère.
 *
 * Validates: Requirements 1.6, 10.5
 */

use App\Models\Artisan;
use App\Models\Reservation;
use App\Services\AutomationConfigService;
use App\Services\AutomationEngine;
use App\Services\NotificationService;
use App\Services\SmsNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Build a fully wired AutomationEngine instance with real services.
 */
function makeEngine(): AutomationEngine
{
    return new AutomationEngine(
        new AutomationConfigService(),
        new SmsNotificationService(),
        new NotificationService(),
    );
}

/**
 * Create an artisan with a specific score_confiance and disable its automation
 * via AutomationConfigService (key: artisan_{id}_automation_disabled = true).
 *
 * @param  int  $score  score_confiance ∈ [0, 100]
 * @return Artisan
 */
function createDisabledArtisan(int $score): Artisan
{
    /** @var Artisan $artisan */
    $artisan = Artisan::factory()->create(['score_confiance' => $score]);

    // Disable automation for this artisan via the config service.
    // The key "artisan_{id}_automation_disabled" is not among the 8 standard rules,
    // so AutomationConfigService::validerValeur() lets it through without throwing.
    $configService = new AutomationConfigService();
    $configService->setRegle("artisan_{$artisan->id}_automation_disabled", true);

    return $artisan;
}

/**
 * Create a Reservation linked to the given artisan.
 *
 * @param  Artisan  $artisan
 * @return Reservation
 */
function createReservationForArtisan(Artisan $artisan): Reservation
{
    /** @var Reservation $reservation */
    $reservation = Reservation::factory()->create([
        'id_artisan' => $artisan->id,
    ]);

    return $reservation;
}

// ── Property 3: disabled artisan → approuvee=false AND necessite_intervention_humaine=true ──

/**
 * **Validates: Requirements 1.6, 10.5**
 *
 * For any artisan with automation disabled, regardless of score_confiance ∈ [0,100],
 * `evaluerAcceptationAuto` must always return:
 *   - approuvee = false
 *   - necessite_intervention_humaine = true
 *
 * The property is run 20 times with random scores drawn uniformly from [0, 100].
 */
test('property 3 – disabled artisan always produces approuvee=false regardless of score_confiance', function () {
    // Generate a random score_confiance ∈ [0, 100]
    $score = fake()->numberBetween(0, 100);

    $artisan     = createDisabledArtisan($score);
    $reservation = createReservationForArtisan($artisan);
    $engine      = makeEngine();

    $decision = $engine->evaluerAcceptationAuto($reservation);

    expect($decision->approuvee)
        ->toBeFalse("Expected approuvee=false for disabled artisan (score={$score}), got true.");

    expect($decision->necessite_intervention_humaine)
        ->toBeTrue("Expected necessite_intervention_humaine=true for disabled artisan (score={$score}), got false.");
})->repeat(20);

/**
 * **Validates: Requirements 1.6, 10.5**
 *
 * Edge case: score_confiance = 100 (maximum possible).
 * Even the highest score must be overridden by the disabled flag.
 */
test('property 3 – disabled artisan with maximum score (100) is still excluded', function () {
    $artisan     = createDisabledArtisan(100);
    $reservation = createReservationForArtisan($artisan);
    $engine      = makeEngine();

    $decision = $engine->evaluerAcceptationAuto($reservation);

    expect($decision->approuvee)->toBeFalse();
    expect($decision->necessite_intervention_humaine)->toBeTrue();
});

/**
 * **Validates: Requirements 1.6, 10.5**
 *
 * Edge case: score_confiance = 0 (minimum possible).
 * Disabled flag is consistent even for the lowest score.
 */
test('property 3 – disabled artisan with minimum score (0) is excluded', function () {
    $artisan     = createDisabledArtisan(0);
    $reservation = createReservationForArtisan($artisan);
    $engine      = makeEngine();

    $decision = $engine->evaluerAcceptationAuto($reservation);

    expect($decision->approuvee)->toBeFalse();
    expect($decision->necessite_intervention_humaine)->toBeTrue();
});

/**
 * **Validates: Requirements 1.6, 10.5**
 *
 * Contrast test: an enabled artisan with a score above the default threshold (70)
 * must be approved, confirming that only the disabled flag — not score logic —
 * drives the exclusion in the disabled case.
 */
test('property 3 – enabled artisan with high score is approved (contrast check)', function () {
    // Artisan with a score well above the default threshold of 70
    $score = fake()->numberBetween(80, 100);

    /** @var Artisan $artisan */
    $artisan = Artisan::factory()->create(['score_confiance' => $score]);

    // Clear any pre-existing cache to guarantee a fresh read
    Cache::forget("automation_rule:artisan_{$artisan->id}_automation_disabled");

    $reservation = createReservationForArtisan($artisan);
    $engine      = makeEngine();

    $decision = $engine->evaluerAcceptationAuto($reservation);

    expect($decision->approuvee)
        ->toBeTrue("Expected enabled artisan (score={$score}) to be approved.");
    expect($decision->necessite_intervention_humaine)
        ->toBeFalse();
})->repeat(5);

/**
 * **Validates: Requirements 1.6, 10.5**
 *
 * Re-enabling an artisan (setting disabled = false) must allow the decision to
 * be approuvee again when the score meets the threshold.
 */
test('property 3 – re-enabling a previously disabled artisan allows approval for high scores', function () {
    $score = fake()->numberBetween(80, 100);

    $artisan = createDisabledArtisan($score);

    // Confirm it is initially excluded
    $reservation = createReservationForArtisan($artisan);
    $engine      = makeEngine();

    $disabledDecision = $engine->evaluerAcceptationAuto($reservation);
    expect($disabledDecision->approuvee)->toBeFalse();

    // Re-enable by setting the rule to false
    $configService = new AutomationConfigService();
    $configService->setRegle("artisan_{$artisan->id}_automation_disabled", false);

    // Need a fresh reservation to reset rate-limit counter context
    $reservation2 = createReservationForArtisan($artisan);
    // Clear the rate-limit counter that was incremented on the first call
    Cache::forget("automation_rate_limit:artisan:{$artisan->id}");

    $enabledDecision = $engine->evaluerAcceptationAuto($reservation2);
    expect($enabledDecision->approuvee)->toBeTrue(
        "After re-enabling artisan (score={$score}), expected approuvee=true."
    );
})->repeat(5);

/**
 * **Validates: Requirements 1.6, 10.5**
 *
 * Multiple distinct disabled artisans — each with a different random score —
 * are all excluded in a single test run.
 * This validates that the exclusion rule is applied independently per-artisan.
 */
test('property 3 – multiple disabled artisans are all excluded independently', function () {
    $engine = makeEngine();

    // Generate 5 distinct artisans with random scores, all disabled
    $scores = array_map(fn () => fake()->numberBetween(0, 100), range(1, 5));

    foreach ($scores as $score) {
        $artisan     = createDisabledArtisan($score);
        $reservation = createReservationForArtisan($artisan);

        $decision = $engine->evaluerAcceptationAuto($reservation);

        expect($decision->approuvee)
            ->toBeFalse("Artisan (score={$score}) should be excluded.");
        expect($decision->necessite_intervention_humaine)
            ->toBeTrue("Artisan (score={$score}) should require human intervention.");
    }
})->repeat(5);
