<?php

/**
 * Property 18 : Immuabilité de l'audit trail
 *
 * Pour tout enregistrement créé dans `automation_logs`, une tentative de mise à jour
 * ou de suppression de cet enregistrement (via quelque mécanisme que ce soit,
 * y compris les méthodes Eloquent `update`, `delete`, `save`) doit être rejetée
 * ou renvoyer l'enregistrement original inchangé.
 *
 * Validates: Requirements 10.4
 */

use App\Models\AutomationLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Create N AutomationLog records via factory and return them fresh from DB.
 *
 * @param  int  $n
 * @return \Illuminate\Support\Collection<int, AutomationLog>
 */
function createLogs(int $n): \Illuminate\Support\Collection
{
    return AutomationLog::factory()->count($n)->create();
}

// ── Property 18: update() is blocked ─────────────────────────────────────────

/**
 * **Validates: Requirements 10.4**
 *
 * For any existing AutomationLog, calling Eloquent `update()` with modified data
 * must leave the database record unchanged.
 */
test('property 18 – update() does not modify existing automation_log records', function () {
    // Generate between 3 and 8 logs to exercise multiple records
    $count = fake()->numberBetween(3, 8);
    $logs  = createLogs($count);

    foreach ($logs as $log) {
        $originalTypeAction    = $log->type_action;
        $originalModelType     = $log->model_type;
        $originalDecision      = $log->decision;
        $originalRaison        = $log->raison;
        $originalScoreConfiance = $log->score_confiance;

        // Attempt to update with completely different values
        $log->update([
            'type_action'    => 'tampered_action',
            'model_type'     => 'TamperedModel',
            'decision'       => 'approuvee',
            'raison'         => 'This should never be persisted',
            'score_confiance' => 99.99,
        ]);

        // Reload from database
        $fresh = AutomationLog::find($log->id);

        expect($fresh)->not->toBeNull()
            ->and($fresh->type_action)->toBe($originalTypeAction)
            ->and($fresh->model_type)->toBe($originalModelType)
            ->and($fresh->decision)->toBe($originalDecision)
            ->and($fresh->raison)->toBe($originalRaison)
            ->and((float) $fresh->score_confiance)->toBe((float) $originalScoreConfiance);
    }
})->with([
    'batch of random logs' => fn () => null,
]);

// ── Property 18: delete() is blocked ─────────────────────────────────────────

/**
 * **Validates: Requirements 10.4**
 *
 * For any existing AutomationLog, calling Eloquent `delete()` must not remove
 * the record from the database.
 */
test('property 18 – delete() does not remove existing automation_log records', function () {
    $count = fake()->numberBetween(3, 8);
    $logs  = createLogs($count);

    $ids = $logs->pluck('id')->all();

    foreach ($logs as $log) {
        $log->delete();
    }

    // Every record must still exist
    foreach ($ids as $id) {
        expect(AutomationLog::find($id))->not->toBeNull();
    }

    expect(AutomationLog::count())->toBe($count);
});

// ── Property 18: save() on dirty model is blocked ────────────────────────────

/**
 * **Validates: Requirements 10.4**
 *
 * For any existing AutomationLog, mutating an attribute and calling `save()` must
 * not persist the change to the database.
 */
test('property 18 – save() on a dirty existing automation_log record is blocked', function () {
    $count = fake()->numberBetween(3, 8);
    $logs  = createLogs($count);

    foreach ($logs as $log) {
        $originalRaison      = $log->raison;
        $originalTypeAction  = $log->type_action;
        $originalDecision    = $log->decision;

        // Mutate attributes directly
        $log->raison      = 'Mutated raison – should not be saved';
        $log->type_action = 'mutated_action';
        $log->decision    = 'rejetee';

        $result = $log->save();

        // save() should return false (observer cancelled the operation)
        expect($result)->toBeFalse();

        // Database record must remain unchanged
        $fresh = AutomationLog::find($log->id);

        expect($fresh)->not->toBeNull()
            ->and($fresh->raison)->toBe($originalRaison)
            ->and($fresh->type_action)->toBe($originalTypeAction)
            ->and($fresh->decision)->toBe($originalDecision);
    }
});

// ── Property 18: new records CAN be created (no false positive) ──────────────

/**
 * **Validates: Requirements 10.4**
 *
 * The observer must only block mutations/deletions on *existing* records.
 * New records (inserts) must be allowed through normally.
 */
test('property 18 – new automation_log records can be created normally', function () {
    $count = fake()->numberBetween(3, 8);
    $logs  = createLogs($count);

    // Every log was persisted
    expect(AutomationLog::count())->toBe($count);

    foreach ($logs as $log) {
        expect($log->exists)->toBeTrue()
            ->and($log->id)->toBeGreaterThan(0);
    }
});

// ── Property 18: Log::warning is emitted on blocked mutations ────────────────

/**
 * **Validates: Requirements 10.4**
 *
 * The observer must log a warning when a mutation attempt is blocked.
 */
test('property 18 – observer logs a warning when update is blocked', function () {
    Log::spy();

    $log = AutomationLog::factory()->create();

    $log->update(['raison' => 'should be blocked']);

    Log::shouldHaveReceived('warning')->atLeast()->once();
});

test('property 18 – observer logs a warning when delete is blocked', function () {
    Log::spy();

    $log = AutomationLog::factory()->create();

    $log->delete();

    Log::shouldHaveReceived('warning')->atLeast()->once();
});

test('property 18 – observer logs a warning when save on existing record is blocked', function () {
    Log::spy();

    $log = AutomationLog::factory()->create();
    $log->raison = 'tampered';
    $log->save();

    Log::shouldHaveReceived('warning')->atLeast()->once();
});
