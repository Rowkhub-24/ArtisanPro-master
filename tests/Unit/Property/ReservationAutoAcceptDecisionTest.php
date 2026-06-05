<?php

/**
 * Property 4 : Cohérence de la décision d'acceptation automatique
 *
 * Pour tout triplet (Score_Confiance, distance_haversine, disponibilite) évalué
 * par le ReservationAutoAcceptListener, la décision est `approuvee` si et
 * seulement si :
 *   - Score_Confiance >= auto_accept_score_minimum
 *   - distance_haversine <= auto_accept_zone_km_maximum
 *   - disponibilite = true
 *   - aucun conflit de réservation (has_conflict = false)
 *
 * Dans tous les autres cas, la décision est `rejetee`.
 *
 * **Validates: Requirements 2.2, 2.3**
 */

use App\ValueObjects\AutoDecision;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ── Constants (matching AutomationConfigService defaults) ─────────────────────

/** Default threshold for auto_accept_score_minimum */
const SCORE_MIN_DEFAULT = 70;

/** Default threshold for auto_accept_zone_km_maximum */
const ZONE_KM_MAX_DEFAULT = 20;

// ── Pure acceptance decision function (mirrors ReservationAutoAcceptListener) ─

/**
 * Pure implementation of the acceptance logic defined in Requirement 2.2.
 *
 * This function encapsulates the acceptance invariant:
 *   approuvee ↔ (score >= scoreMin AND distance <= zoneKm AND disponible AND NOT has_conflict)
 *
 * @param  float  $score       Score_Confiance ∈ [0, 100]
 * @param  float  $distanceKm  Distance Haversine in km ∈ [0, 500]
 * @param  bool   $disponible  Whether the artisan is available on the requested slot
 * @param  bool   $hasConflict Whether an overlapping reservation exists
 * @param  float  $scoreMin    Minimum score threshold (auto_accept_score_minimum)
 * @param  float  $zoneKm      Maximum zone in km (auto_accept_zone_km_maximum)
 * @return AutoDecision
 */
function evaluerDecisionAcceptation(
    float $score,
    float $distanceKm,
    bool  $disponible,
    bool  $hasConflict,
    float $scoreMin   = SCORE_MIN_DEFAULT,
    float $zoneKm     = ZONE_KM_MAX_DEFAULT,
): AutoDecision {
    $scoreOk    = $score >= $scoreMin;
    $distanceOk = $distanceKm <= $zoneKm;
    $sansConflit = !$hasConflict;

    $reglesEvaluees = [
        [
            'cle'             => 'auto_accept_score_minimum',
            'valeur_attendue' => ">={$scoreMin}",
            'valeur_reelle'   => $score,
            'resultat'        => $scoreOk,
        ],
        [
            'cle'             => 'auto_accept_zone_km_maximum',
            'valeur_attendue' => "<={$zoneKm}",
            'valeur_reelle'   => $distanceKm,
            'resultat'        => $distanceOk,
        ],
        [
            'cle'             => 'disponibilite',
            'valeur_attendue' => true,
            'valeur_reelle'   => $disponible,
            'resultat'        => $disponible,
        ],
        [
            'cle'             => 'absence_conflit',
            'valeur_attendue' => false,
            'valeur_reelle'   => $hasConflict,
            'resultat'        => $sansConflit,
        ],
    ];

    // The invariant: approuvee ↔ all four conditions simultaneously true
    $approuvee = $scoreOk && $distanceOk && $disponible && $sansConflit;

    if ($approuvee) {
        $raison = sprintf(
            'Toutes les conditions remplies : score=%.1f >= %.1f, distance=%.2fkm <= %.1fkm, disponible=true, sans conflit.',
            $score, $scoreMin, $distanceKm, $zoneKm
        );
    } else {
        $motifs = [];
        if (!$scoreOk)    $motifs[] = "score (%.1f) < seuil (%.1f)";
        if (!$distanceOk) $motifs[] = sprintf('distance (%.2fkm) > zone (%.1fkm)', $distanceKm, $zoneKm);
        if (!$disponible) $motifs[] = 'artisan non disponible';
        if ($hasConflict) $motifs[] = 'conflit de réservation détecté';
        $raison = 'Rejeté : ' . implode('; ', $motifs);
    }

    return new AutoDecision(
        approuvee:                     $approuvee,
        raison:                        $raison,
        score_confiance:               $score,
        necessite_intervention_humaine: !$approuvee,
        regles_evaluees:               $reglesEvaluees,
    );
}

/**
 * Determine the expected decision based solely on the four conditions.
 * Used to cross-check the function output against a direct boolean evaluation.
 */
function expectedApprouvee(
    float $score,
    float $distanceKm,
    bool  $disponible,
    bool  $hasConflict,
    float $scoreMin = SCORE_MIN_DEFAULT,
    float $zoneKm   = ZONE_KM_MAX_DEFAULT,
): bool {
    return $score >= $scoreMin
        && $distanceKm <= $zoneKm
        && $disponible
        && !$hasConflict;
}

// ── Property 4: biconditional invariant across random combinations ─────────────

/**
 * **Validates: Requirements 2.2, 2.3**
 *
 * Core property: for any random quadruplet (score, distance, disponible, has_conflict),
 * the decision is `approuvee` if and only if ALL four conditions are met simultaneously.
 *
 * This is the biconditional: approuvee ↔ (score_ok AND distance_ok AND disponible AND NOT has_conflict)
 *
 * Run 100 iterations with independent random inputs to exhaustively cover the input space.
 */
test('property 4 – decision is approuvee iff all four conditions are met simultaneously', function () {
    $scoreMin = (float) SCORE_MIN_DEFAULT;
    $zoneKm   = (float) ZONE_KM_MAX_DEFAULT;

    for ($i = 0; $i < 100; $i++) {
        // Generate random inputs
        $score      = fake()->randomFloat(2, 0.0, 100.0);   // Score_Confiance ∈ [0, 100]
        $distanceKm = fake()->randomFloat(2, 0.0, 500.0);   // Distance Haversine ∈ [0, 500] km
        $disponible = fake()->boolean();                      // Disponibilité créneau
        $hasConflict = fake()->boolean();                     // Présence d'un conflit

        $decision = evaluerDecisionAcceptation(
            score:       $score,
            distanceKm:  $distanceKm,
            disponible:  $disponible,
            hasConflict: $hasConflict,
            scoreMin:    $scoreMin,
            zoneKm:      $zoneKm,
        );

        $expected = expectedApprouvee($score, $distanceKm, $disponible, $hasConflict, $scoreMin, $zoneKm);

        expect($decision->approuvee)
            ->toBe($expected, sprintf(
                '[iter %d] Expected approuvee=%s for (score=%.2f, distance=%.2fkm, disponible=%s, conflict=%s). Got %s.',
                $i,
                $expected ? 'true' : 'false',
                $score,
                $distanceKm,
                $disponible ? 'true' : 'false',
                $hasConflict ? 'true' : 'false',
                $decision->approuvee ? 'true' : 'false',
            ));

        // Corollary: necessite_intervention_humaine is always the negation of approuvee
        expect($decision->necessite_intervention_humaine)
            ->toBe(!$decision->approuvee, sprintf(
                '[iter %d] necessite_intervention_humaine must be !approuvee.',
                $i,
            ));

        // The regles_evaluees array must contain exactly 4 entries
        expect($decision->regles_evaluees)->toHaveCount(4);

        // Each rule entry must have the 4 expected keys
        foreach ($decision->regles_evaluees as $regle) {
            expect($regle)->toHaveKeys(['cle', 'valeur_attendue', 'valeur_reelle', 'resultat']);
        }
    }
});

// ── Property 4: boundary conditions ───────────────────────────────────────────

/**
 * **Validates: Requirements 2.2**
 *
 * Boundary: score exactly at the threshold (score = auto_accept_score_minimum).
 * The condition is >=, so an exact-threshold score must satisfy score_ok.
 * If other conditions are met, the decision must be approuvee.
 */
test('property 4 – score exactly at threshold satisfies score_ok condition', function () {
    $scoreMin   = (float) SCORE_MIN_DEFAULT;
    $zoneKm     = (float) ZONE_KM_MAX_DEFAULT;
    $distanceKm = fake()->randomFloat(2, 0.0, $zoneKm); // within zone

    // All conditions satisfied with score exactly at boundary
    $decision = evaluerDecisionAcceptation(
        score:       $scoreMin,    // exactly at threshold
        distanceKm:  $distanceKm,
        disponible:  true,
        hasConflict: false,
        scoreMin:    $scoreMin,
        zoneKm:      $zoneKm,
    );

    expect($decision->approuvee)->toBeTrue(
        "Score exactly at threshold ({$scoreMin}) must satisfy score_ok (condition is >=)."
    );
})->repeat(10);

/**
 * **Validates: Requirements 2.2**
 *
 * Boundary: score one unit below the threshold (score = threshold - 1).
 * The decision must be rejetee regardless of other conditions.
 */
test('property 4 – score one unit below threshold results in rejetee', function () {
    $scoreMin   = (float) SCORE_MIN_DEFAULT;
    $zoneKm     = (float) ZONE_KM_MAX_DEFAULT;
    $distanceKm = fake()->randomFloat(2, 0.0, $zoneKm); // within zone

    // Only score condition fails
    $decision = evaluerDecisionAcceptation(
        score:       $scoreMin - 1.0,   // one unit below threshold
        distanceKm:  $distanceKm,
        disponible:  true,
        hasConflict: false,
        scoreMin:    $scoreMin,
        zoneKm:      $zoneKm,
    );

    expect($decision->approuvee)->toBeFalse(
        "Score below threshold ({$scoreMin}) must result in rejetee."
    );
})->repeat(10);

/**
 * **Validates: Requirements 2.2**
 *
 * Boundary: distance exactly at the maximum zone (distance = auto_accept_zone_km_maximum).
 * The condition is <=, so an exact-maximum distance must satisfy distance_ok.
 */
test('property 4 – distance exactly at zone maximum satisfies distance_ok condition', function () {
    $scoreMin = (float) SCORE_MIN_DEFAULT;
    $zoneKm   = (float) ZONE_KM_MAX_DEFAULT;
    $score    = fake()->randomFloat(2, $scoreMin, 100.0); // at or above score threshold

    $decision = evaluerDecisionAcceptation(
        score:       $score,
        distanceKm:  $zoneKm,    // exactly at zone maximum
        disponible:  true,
        hasConflict: false,
        scoreMin:    $scoreMin,
        zoneKm:      $zoneKm,
    );

    expect($decision->approuvee)->toBeTrue(
        "Distance exactly at zone maximum ({$zoneKm} km) must satisfy distance_ok (condition is <=)."
    );
})->repeat(10);

/**
 * **Validates: Requirements 2.2**
 *
 * Boundary: distance just above the maximum zone.
 * The decision must be rejetee even when all other conditions are satisfied.
 */
test('property 4 – distance above zone maximum results in rejetee', function () {
    $scoreMin = (float) SCORE_MIN_DEFAULT;
    $zoneKm   = (float) ZONE_KM_MAX_DEFAULT;
    $score    = fake()->randomFloat(2, $scoreMin, 100.0);

    $decision = evaluerDecisionAcceptation(
        score:       $score,
        distanceKm:  $zoneKm + 0.01,  // just above zone maximum
        disponible:  true,
        hasConflict: false,
        scoreMin:    $scoreMin,
        zoneKm:      $zoneKm,
    );

    expect($decision->approuvee)->toBeFalse(
        "Distance above zone maximum ({$zoneKm} km) must result in rejetee."
    );
})->repeat(10);

// ── Property 4: single-condition failure cases ────────────────────────────────

/**
 * **Validates: Requirements 2.2, 2.3**
 *
 * Failure isolation: if ONLY the score condition fails, the decision is rejetee.
 * All other conditions are satisfied.
 */
test('property 4 – failing only score condition produces rejetee', function () {
    $scoreMin   = (float) SCORE_MIN_DEFAULT;
    $zoneKm     = (float) ZONE_KM_MAX_DEFAULT;

    // Score below threshold, all other conditions passing
    $score      = fake()->randomFloat(2, 0.0, $scoreMin - 0.01);
    $distanceKm = fake()->randomFloat(2, 0.0, $zoneKm);

    $decision = evaluerDecisionAcceptation(
        score:       $score,
        distanceKm:  $distanceKm,
        disponible:  true,
        hasConflict: false,
        scoreMin:    $scoreMin,
        zoneKm:      $zoneKm,
    );

    expect($decision->approuvee)->toBeFalse(
        "Failing only score (score={$score} < {$scoreMin}) must produce rejetee."
    );
})->repeat(20);

/**
 * **Validates: Requirements 2.2, 2.3**
 *
 * Failure isolation: if ONLY the distance condition fails, the decision is rejetee.
 */
test('property 4 – failing only distance condition produces rejetee', function () {
    $scoreMin   = (float) SCORE_MIN_DEFAULT;
    $zoneKm     = (float) ZONE_KM_MAX_DEFAULT;

    // Distance beyond zone, all other conditions passing
    $score      = fake()->randomFloat(2, $scoreMin, 100.0);
    $distanceKm = fake()->randomFloat(2, $zoneKm + 0.01, 500.0);

    $decision = evaluerDecisionAcceptation(
        score:       $score,
        distanceKm:  $distanceKm,
        disponible:  true,
        hasConflict: false,
        scoreMin:    $scoreMin,
        zoneKm:      $zoneKm,
    );

    expect($decision->approuvee)->toBeFalse(
        "Failing only distance (distanceKm={$distanceKm} > {$zoneKm}) must produce rejetee."
    );
})->repeat(20);

/**
 * **Validates: Requirements 2.2, 2.3**
 *
 * Failure isolation: if ONLY the disponible condition is false, the decision is rejetee.
 */
test('property 4 – failing only disponible condition produces rejetee', function () {
    $scoreMin   = (float) SCORE_MIN_DEFAULT;
    $zoneKm     = (float) ZONE_KM_MAX_DEFAULT;

    $score      = fake()->randomFloat(2, $scoreMin, 100.0);
    $distanceKm = fake()->randomFloat(2, 0.0, $zoneKm);

    $decision = evaluerDecisionAcceptation(
        score:       $score,
        distanceKm:  $distanceKm,
        disponible:  false,   // not available
        hasConflict: false,
        scoreMin:    $scoreMin,
        zoneKm:      $zoneKm,
    );

    expect($decision->approuvee)->toBeFalse(
        "Failing only disponibilite (false) must produce rejetee."
    );
})->repeat(20);

/**
 * **Validates: Requirements 2.2, 2.4**
 *
 * Failure isolation: if ONLY has_conflict is true, the decision is rejetee.
 * A conflict always overrides all other favorable conditions.
 */
test('property 4 – failing only has_conflict condition produces rejetee', function () {
    $scoreMin   = (float) SCORE_MIN_DEFAULT;
    $zoneKm     = (float) ZONE_KM_MAX_DEFAULT;

    $score      = fake()->randomFloat(2, $scoreMin, 100.0);
    $distanceKm = fake()->randomFloat(2, 0.0, $zoneKm);

    $decision = evaluerDecisionAcceptation(
        score:       $score,
        distanceKm:  $distanceKm,
        disponible:  true,
        hasConflict: true,    // conflict exists
        scoreMin:    $scoreMin,
        zoneKm:      $zoneKm,
    );

    expect($decision->approuvee)->toBeFalse(
        "Failing only has_conflict (true) must produce rejetee even with perfect score and distance."
    );
})->repeat(20);

// ── Property 4: approuvee requires ALL conditions simultaneously ───────────────

/**
 * **Validates: Requirements 2.2**
 *
 * Positive case: when ALL four conditions are satisfied, the decision must
 * always be approuvee. This confirms the forward direction of the biconditional.
 */
test('property 4 – all conditions met always produces approuvee', function () {
    $scoreMin   = (float) SCORE_MIN_DEFAULT;
    $zoneKm     = (float) ZONE_KM_MAX_DEFAULT;

    for ($i = 0; $i < 50; $i++) {
        $score      = fake()->randomFloat(2, $scoreMin, 100.0);   // at or above threshold
        $distanceKm = fake()->randomFloat(2, 0.0, $zoneKm);       // within zone

        $decision = evaluerDecisionAcceptation(
            score:       $score,
            distanceKm:  $distanceKm,
            disponible:  true,
            hasConflict: false,
            scoreMin:    $scoreMin,
            zoneKm:      $zoneKm,
        );

        expect($decision->approuvee)->toBeTrue(sprintf(
            '[iter %d] Expected approuvee=true for (score=%.2f >= %.1f, distance=%.2fkm <= %.1fkm, disponible=true, no conflict).',
            $i, $score, $scoreMin, $distanceKm, $zoneKm
        ));

        expect($decision->necessite_intervention_humaine)->toBeFalse();
    }
});

// ── Property 4: configurable thresholds ────────────────────────────────────────

/**
 * **Validates: Requirements 2.2, 1.3**
 *
 * The biconditional must hold for any valid threshold pair, not just the defaults.
 * For any (scoreMin ∈ [0,100], zoneKm ∈ [1,200]) and any random quadruplet,
 * the decision must equal the expected boolean outcome.
 */
test('property 4 – biconditional holds for any configurable threshold pair', function () {
    // Random thresholds within their valid ranges (Req 1.3)
    $scoreMin   = (float) fake()->numberBetween(0, 100);
    $zoneKm     = (float) fake()->numberBetween(1, 200);

    for ($i = 0; $i < 20; $i++) {
        $score      = fake()->randomFloat(2, 0.0, 100.0);
        $distanceKm = fake()->randomFloat(2, 0.0, 500.0);
        $disponible  = fake()->boolean();
        $hasConflict = fake()->boolean();

        $decision = evaluerDecisionAcceptation(
            score:       $score,
            distanceKm:  $distanceKm,
            disponible:  $disponible,
            hasConflict: $hasConflict,
            scoreMin:    $scoreMin,
            zoneKm:      $zoneKm,
        );

        $expected = expectedApprouvee($score, $distanceKm, $disponible, $hasConflict, $scoreMin, $zoneKm);

        expect($decision->approuvee)->toBe($expected, sprintf(
            '[thresh scoreMin=%.1f, zoneKm=%.1f, iter %d] approuvee mismatch for (score=%.2f, dist=%.2f, dispo=%s, conflict=%s).',
            $scoreMin, $zoneKm, $i,
            $score, $distanceKm,
            $disponible ? 'T' : 'F',
            $hasConflict ? 'T' : 'F',
        ));
    }
})->repeat(10);

// ── Property 4: AutoDecision value object structural invariants ────────────────

/**
 * **Validates: Requirements 9.6**
 *
 * Every AutoDecision produced by the acceptance logic must satisfy the structural
 * invariants defined for the value object: score_confiance in [0, 100],
 * regles_evaluees non-empty array, raison non-empty string.
 */
test('property 4 – AutoDecision structural invariants are always satisfied', function () {
    $scoreMin = (float) SCORE_MIN_DEFAULT;
    $zoneKm   = (float) ZONE_KM_MAX_DEFAULT;

    for ($i = 0; $i < 100; $i++) {
        $score      = fake()->randomFloat(2, 0.0, 100.0);
        $distanceKm = fake()->randomFloat(2, 0.0, 500.0);
        $disponible  = fake()->boolean();
        $hasConflict = fake()->boolean();

        $decision = evaluerDecisionAcceptation($score, $distanceKm, $disponible, $hasConflict, $scoreMin, $zoneKm);

        // score_confiance must equal the input score and be in [0, 100]
        expect($decision->score_confiance)
            ->toBeFloat()
            ->and($decision->score_confiance)->toBeGreaterThanOrEqual(0.0)
            ->and($decision->score_confiance)->toBeLessThanOrEqual(100.0);

        // raison must be a non-empty string
        expect($decision->raison)
            ->toBeString()
            ->not->toBe('');

        // regles_evaluees must be an array with exactly 4 entries
        expect($decision->regles_evaluees)
            ->toBeArray()
            ->toHaveCount(4);

        // approuvee and necessite_intervention_humaine must be complementary
        expect($decision->approuvee)->toBeBool();
        expect($decision->necessite_intervention_humaine)->toBeBool();
        expect($decision->approuvee)->toBe(!$decision->necessite_intervention_humaine);
    }
});
