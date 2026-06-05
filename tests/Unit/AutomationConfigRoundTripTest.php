<?php

/**
 * Property 1 : AutomationConfig — Round-trip de persistance
 *
 * Pour toute paire (clé, valeur) d'une règle d'automatisation, stocker via
 * `setRegle` puis lire via `getRegle` doit retourner une valeur strictement
 * équivalente à celle stockée.
 *
 * Validates: Requirements 1.1, 1.2, 3.7
 */

use App\Services\AutomationConfigService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generate a valid random value for each of the 8 configurable rules.
 *
 * Returns an array of [cle => valeur] pairs where each value is
 * within the rule's declared valid range.
 *
 * @return array<string, mixed>
 */
function generateValidRulePairs(): array
{
    return [
        'auto_accept_score_minimum'          => fake()->numberBetween(0, 100),
        'auto_accept_zone_km_maximum'        => fake()->numberBetween(1, 200),
        'auto_devis_enabled'                 => fake()->boolean(),
        'auto_validate_devis_montant_max'    => fake()->numberBetween(1000, 500000),
        'auto_validate_devis_score_minimum'  => fake()->numberBetween(0, 100),
        'auto_mission_timeout_heures'        => fake()->numberBetween(1, 24),
        'auto_litige_seuil_micro'            => fake()->numberBetween(0, 50000),
        'auto_litige_timeout_artisan_heures' => fake()->numberBetween(24, 168),
    ];
}

// ── Property 1: round-trip equality for all 8 rules ──────────────────────────

/**
 * **Validates: Requirements 1.1, 1.2, 3.7**
 *
 * For each of the 8 configurable automation rules, storing a valid random value
 * via `setRegle` and immediately reading it back via `getRegle` must return a
 * value strictly equal to the stored value.
 *
 * This test is run N times with different randomly generated values to exercise
 * the full valid input space.
 */
test('property 1 – setRegle then getRegle returns the stored value (round-trip)', function () {
    $service = new AutomationConfigService();
    $pairs   = generateValidRulePairs();

    foreach ($pairs as $cle => $valeur) {
        // Act: persist the rule
        $service->setRegle($cle, $valeur);

        // Assert: reading back returns the same value
        $retrieved = $service->getRegle($cle);

        if (is_bool($valeur)) {
            expect($retrieved)->toBeBool()
                ->and((bool) $retrieved)->toBe($valeur);
        } else {
            // Numeric rules: compare as numbers to avoid int vs float mismatch
            expect((float) $retrieved)->toBe((float) $valeur);
        }
    }
})->repeat(10); // Run 10 times with fresh random values each iteration

// ── Property 1: each individual rule independently ───────────────────────────

/**
 * **Validates: Requirements 1.1, 1.2**
 *
 * Individual round-trip checks for each named rule to make failures easier
 * to diagnose and to ensure every rule is exercised in isolation.
 */
test('property 1 – round-trip for auto_accept_score_minimum', function () {
    $service = new AutomationConfigService();
    $value   = fake()->numberBetween(0, 100);

    $service->setRegle('auto_accept_score_minimum', $value);

    expect((float) $service->getRegle('auto_accept_score_minimum'))->toBe((float) $value);
})->repeat(5);

test('property 1 – round-trip for auto_accept_zone_km_maximum', function () {
    $service = new AutomationConfigService();
    $value   = fake()->numberBetween(1, 200);

    $service->setRegle('auto_accept_zone_km_maximum', $value);

    expect((float) $service->getRegle('auto_accept_zone_km_maximum'))->toBe((float) $value);
})->repeat(5);

test('property 1 – round-trip for auto_devis_enabled', function () {
    $service = new AutomationConfigService();
    $value   = fake()->boolean();

    $service->setRegle('auto_devis_enabled', $value);

    expect((bool) $service->getRegle('auto_devis_enabled'))->toBe($value);
})->repeat(5);

test('property 1 – round-trip for auto_validate_devis_montant_max', function () {
    $service = new AutomationConfigService();
    $value   = fake()->numberBetween(1000, 500000);

    $service->setRegle('auto_validate_devis_montant_max', $value);

    expect((float) $service->getRegle('auto_validate_devis_montant_max'))->toBe((float) $value);
})->repeat(5);

test('property 1 – round-trip for auto_validate_devis_score_minimum', function () {
    $service = new AutomationConfigService();
    $value   = fake()->numberBetween(0, 100);

    $service->setRegle('auto_validate_devis_score_minimum', $value);

    expect((float) $service->getRegle('auto_validate_devis_score_minimum'))->toBe((float) $value);
})->repeat(5);

test('property 1 – round-trip for auto_mission_timeout_heures', function () {
    $service = new AutomationConfigService();
    $value   = fake()->numberBetween(1, 24);

    $service->setRegle('auto_mission_timeout_heures', $value);

    expect((float) $service->getRegle('auto_mission_timeout_heures'))->toBe((float) $value);
})->repeat(5);

test('property 1 – round-trip for auto_litige_seuil_micro', function () {
    $service = new AutomationConfigService();
    $value   = fake()->numberBetween(0, 50000);

    $service->setRegle('auto_litige_seuil_micro', $value);

    expect((float) $service->getRegle('auto_litige_seuil_micro'))->toBe((float) $value);
})->repeat(5);

test('property 1 – round-trip for auto_litige_timeout_artisan_heures', function () {
    $service = new AutomationConfigService();
    $value   = fake()->numberBetween(24, 168);

    $service->setRegle('auto_litige_timeout_artisan_heures', $value);

    expect((float) $service->getRegle('auto_litige_timeout_artisan_heures'))->toBe((float) $value);
})->repeat(5);

// ── Property 1: cache invalidation after setRegle ────────────────────────────

/**
 * **Validates: Requirements 1.2**
 *
 * After calling `setRegle`, the Redis cache entry for that key must be
 * invalidated. The next call to `getRegle` must read from DB (not stale cache)
 * and re-populate the cache with the new value.
 */
test('property 1 – setRegle invalidates the cache so the next getRegle reads from DB', function () {
    $service  = new AutomationConfigService();
    $cle      = 'auto_accept_score_minimum';
    $cacheKey = "automation_rule:{$cle}";

    // Seed an initial value so the cache is warm
    $initial = fake()->numberBetween(0, 50);
    $service->setRegle($cle, $initial);
    $service->getRegle($cle); // warms the cache

    expect(Cache::has($cacheKey))->toBeTrue();

    // Update with a different value — this must bust the cache
    $updated = fake()->numberBetween(51, 100);
    $service->setRegle($cle, $updated);

    // Immediately after setRegle, the cache entry must be gone
    expect(Cache::has($cacheKey))->toBeFalse();

    // Reading again populates the cache with the fresh value
    $retrieved = $service->getRegle($cle);

    expect((float) $retrieved)->toBe((float) $updated);
    expect(Cache::has($cacheKey))->toBeTrue();
})->repeat(5);

/**
 * **Validates: Requirements 1.2**
 *
 * Overwriting a rule multiple times in sequence must always return the
 * last stored value, never a stale intermediate value from cache.
 */
test('property 1 – sequential overwrites always return the last written value', function () {
    $service = new AutomationConfigService();
    $cle     = 'auto_accept_zone_km_maximum';

    $values = [
        fake()->numberBetween(1, 50),
        fake()->numberBetween(51, 100),
        fake()->numberBetween(101, 150),
        fake()->numberBetween(151, 200),
    ];

    foreach ($values as $value) {
        $service->setRegle($cle, $value);
        $retrieved = $service->getRegle($cle);

        expect((float) $retrieved)->toBe((float) $value,
            "After setRegle({$cle}, {$value}), getRegle returned {$retrieved} instead."
        );
    }
})->repeat(3);

// ── Property 1: stored value persists in DB (not only in cache) ──────────────

/**
 * **Validates: Requirements 1.1**
 *
 * The value stored via `setRegle` must be persisted in the `automation_rules`
 * table in the database, not only in the cache. After flushing the cache,
 * `getRegle` must still return the correct value.
 */
test('property 1 – stored value survives a cache flush (DB persistence)', function () {
    $service = new AutomationConfigService();
    $pairs   = generateValidRulePairs();

    foreach ($pairs as $cle => $valeur) {
        $service->setRegle($cle, $valeur);
    }

    // Flush the entire cache to force DB reads
    Cache::flush();

    foreach ($pairs as $cle => $valeur) {
        $retrieved = $service->getRegle($cle);

        if (is_bool($valeur)) {
            expect((bool) $retrieved)->toBe($valeur,
                "After cache flush, {$cle} expected bool({$valeur}) but got: " . var_export($retrieved, true)
            );
        } else {
            expect((float) $retrieved)->toBe((float) $valeur,
                "After cache flush, {$cle} expected {$valeur} but got: {$retrieved}"
            );
        }
    }
})->repeat(5);
