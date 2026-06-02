<?php

use App\Events\PaiementValide;
use App\Models\Artisan;
use App\Models\Client;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

function makeClientReservation(float $montant = 10000): array
{
    $clientUser = User::factory()->create([
        'type_utilisateur' => 'client',
        'sms_notifications_enabled' => true,
    ]);
    // Créer le Client lié directement à ce User
    $client = Client::factory()->create(['id_utilisateur' => $clientUser->id]);

    $artisanUser = User::factory()->create([
        'type_utilisateur' => 'artisan',
        'sms_notifications_enabled' => true,
    ]);
    $artisan = Artisan::factory()->create(['id_utilisateur' => $artisanUser->id]);

    $reservation = Reservation::factory()->create([
        'id_client'     => $client->id,
        'id_artisan'    => $artisan->id,
        'statut'        => 'confirmee',
        'montant_total' => $montant,
    ]);

    return compact('clientUser', 'client', 'artisanUser', 'artisan', 'reservation');
}

// ── Authentication required ───────────────────────────────────────────────────

test('kkiapay confirm requires authentication', function () {
    $this->postJson(route('client.paiements.kkiapay.confirm'), [
        'transaction_id' => 'TXN-001',
        'reservation_id' => 1,
    ])->assertStatus(401);
});

// ── Validation ────────────────────────────────────────────────────────────────

test('kkiapay confirm validates required fields', function () {
    $user = User::factory()->create(['type_utilisateur' => 'client']);
    Client::factory()->create(['id_utilisateur' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('client.paiements.kkiapay.confirm'), [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['transaction_id', 'reservation_id']);
});

// ── Success ───────────────────────────────────────────────────────────────────

test('kkiapay confirm creates paiement with 30% amount and dispatches event', function () {
    Event::fake([PaiementValide::class]);
    config(['africastalking.provider' => 'stub']);

    $data = makeClientReservation(10000);
    /** @var User $clientUser */
    $clientUser  = $data['clientUser'];
    $reservation = $data['reservation'];

    // S'assurer que la relation client est accessible
    expect($clientUser->client)->not->toBeNull();

    $response = $this->actingAs($clientUser)
        ->postJson(route('client.paiements.kkiapay.confirm'), [
            'transaction_id' => 'TXN-ABC-123',
            'reservation_id' => $reservation->id,
        ]);

    $response->assertOk()
        ->assertJsonFragment(['ok' => true]);

    // 30% de 10000 = 3000
    expect(Paiement::where('id_reservation', $reservation->id)
        ->where('reference_transaction', 'TXN-ABC-123')
        ->where('statut', 'reussi')
        ->where('montant', 3000)
        ->exists()
    )->toBeTrue();

    // Reservation mise a jour
    $reservation->refresh();
    expect((float) $reservation->acompte_verse)->toBe(3000.0)
        ->and($reservation->statut)->toBe('en_cours');

    Event::assertDispatched(PaiementValide::class);
});

// ── Idempotence ───────────────────────────────────────────────────────────────

test('kkiapay confirm is idempotent for same transaction_id', function () {
    Event::fake([PaiementValide::class]);
    config(['africastalking.provider' => 'stub']);

    $data = makeClientReservation(5000);
    $clientUser  = $data['clientUser'];
    $reservation = $data['reservation'];

    $payload = ['transaction_id' => 'TXN-DOUBLE', 'reservation_id' => $reservation->id];

    $this->actingAs($clientUser)
        ->postJson(route('client.paiements.kkiapay.confirm'), $payload)
        ->assertOk();

    $this->actingAs($clientUser)
        ->postJson(route('client.paiements.kkiapay.confirm'), $payload)
        ->assertOk()
        ->assertJsonFragment(['already_exists' => true]);

    expect(Paiement::count())->toBe(1);
});

// ── Authorization ─────────────────────────────────────────────────────────────

test('cannot confirm payment for another clients reservation', function () {
    Event::fake([PaiementValide::class]);

    ['reservation' => $reservation] = makeClientReservation();

    $otherUser = User::factory()->create(['type_utilisateur' => 'client']);
    Client::factory()->create(['id_utilisateur' => $otherUser->id]);

    $this->actingAs($otherUser)
        ->postJson(route('client.paiements.kkiapay.confirm'), [
            'transaction_id' => 'TXN-HACK',
            'reservation_id' => $reservation->id,
        ])
        ->assertStatus(403);

    expect(Paiement::count())->toBe(0);
    Event::assertNotDispatched(PaiementValide::class);
});
