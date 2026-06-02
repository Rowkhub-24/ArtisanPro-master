<?php

use App\Events\ArtisanValide;
use App\Events\PaiementValide;
use App\Events\ReservationAnnulee;
use App\Events\ReservationConfirmee;
use App\Events\ReservationCreee;
use App\Events\ReservationTerminee;
use App\Events\UserRegistered;
use App\Listeners\EnvoyerSmsAnnulation;
use App\Listeners\EnvoyerSmsArtisanValide;
use App\Listeners\EnvoyerSmsConfirmationReservation;
use App\Listeners\EnvoyerSmsInscription;
use App\Listeners\EnvoyerSmsMissionTerminee;
use App\Listeners\EnvoyerSmsNouvelleReservation;
use App\Listeners\EnvoyerSmsPaiement;
use App\Models\Artisan;
use App\Models\Client;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ── Listener registration ─────────────────────────────────────────────────────

function assertListenerRegisteredForEvent(string $event, string $listener): void
{
    // Dispatch un événement factice pour forcer le chargement des listeners
    // puis vérifier via la liste de l'EventServiceProvider
    $dispatcher  = app('events');

    // Récupérer les listeners sous leur forme brute
    $rawListeners = $dispatcher->getRawListeners();
    $eventListeners = $rawListeners[$event] ?? [];

    $found = false;
    foreach ($eventListeners as $l) {
        // Les listeners ShouldQueue sont wrappés dans un tableau ou une string
        if (is_array($l)) {
            $class = is_object($l[0]) ? get_class($l[0]) : (string) $l[0];
            if ($class === $listener || str_contains($class, class_basename($listener))) {
                $found = true;
                break;
            }
        } elseif (is_string($l)) {
            if ($l === $listener || str_contains($l, $listener) || str_contains($l, class_basename($listener))) {
                $found = true;
                break;
            }
        }
    }

    // Fallback: chercher aussi dans les listeners résolus
    if (! $found) {
        $resolvedListeners = $dispatcher->getListeners($event);
        foreach ($resolvedListeners as $l) {
            $repr = '';
            if (is_array($l) && isset($l[0])) {
                $repr = is_object($l[0]) ? get_class($l[0]) : (string) $l[0];
            } elseif (is_object($l)) {
                $repr = get_class($l);
            } elseif (is_string($l)) {
                $repr = $l;
            }
            if (str_contains($repr, $listener) || str_contains($repr, class_basename($listener))) {
                $found = true;
                break;
            }
        }
    }

    expect($found)->toBeTrue("Listener {$listener} not found for {$event}");
}

test('UserRegistered has EnvoyerSmsInscription listener', function () {
    assertListenerRegisteredForEvent(UserRegistered::class, EnvoyerSmsInscription::class);
});

test('ReservationCreee has EnvoyerSmsNouvelleReservation listener', function () {
    assertListenerRegisteredForEvent(ReservationCreee::class, EnvoyerSmsNouvelleReservation::class);
});

test('ReservationConfirmee has EnvoyerSmsConfirmationReservation listener', function () {
    assertListenerRegisteredForEvent(ReservationConfirmee::class, EnvoyerSmsConfirmationReservation::class);
});

test('ReservationAnnulee has EnvoyerSmsAnnulation listener', function () {
    assertListenerRegisteredForEvent(ReservationAnnulee::class, EnvoyerSmsAnnulation::class);
});

test('ReservationTerminee has EnvoyerSmsMissionTerminee listener', function () {
    assertListenerRegisteredForEvent(ReservationTerminee::class, EnvoyerSmsMissionTerminee::class);
});

test('PaiementValide has EnvoyerSmsPaiement listener', function () {
    assertListenerRegisteredForEvent(PaiementValide::class, EnvoyerSmsPaiement::class);
});

test('ArtisanValide has EnvoyerSmsArtisanValide listener', function () {
    assertListenerRegisteredForEvent(ArtisanValide::class, EnvoyerSmsArtisanValide::class);
});

// ── SMS dispatched on inscription ─────────────────────────────────────────────

test('sms dispatched when user registered with phone', function () {
    // Avec QUEUE_CONNECTION=sync, les ShouldQueue listeners s'executent
    // synchronously. On verifie que l'event est dispatch et que le log SMS est cree.
    config(['africastalking.provider' => 'stub']);

    $user = User::factory()->create([
        'type_utilisateur'          => 'client',
        'telephone'                 => '+22990000001',
        'sms_notifications_enabled' => true,
    ]);

    UserRegistered::dispatch($user);

    // Le listener EnvoyerSmsInscription dispatch SendSmsJob en sync
    // -> SendSmsJob::handle() est appele -> SmsLog est cree
    expect(\App\Models\SmsLog::where('type', 'bienvenue')->exists())->toBeTrue();
});

test('no sms dispatched when user has no phone', function () {
    config(['africastalking.provider' => 'stub']);

    $user = User::factory()->create([
        'type_utilisateur'          => 'client',
        'telephone'                 => null,
        'sms_notifications_enabled' => true,
    ]);

    UserRegistered::dispatch($user);

    expect(\App\Models\SmsLog::where('type', 'bienvenue')->exists())->toBeFalse();
});

test('no sms dispatched when sms notifications disabled', function () {
    config(['africastalking.provider' => 'stub']);

    $user = User::factory()->create([
        'type_utilisateur'          => 'client',
        'telephone'                 => '+22990000002',
        'sms_notifications_enabled' => false,
    ]);

    UserRegistered::dispatch($user);

    expect(\App\Models\SmsLog::where('type', 'bienvenue')->exists())->toBeFalse();
});

// ── SMS dispatched on nouvelle reservation ────────────────────────────────────

test('sms dispatched to artisan on nouvelle reservation', function () {
    config(['africastalking.provider' => 'stub']);

    $artisanUser = User::factory()->create([
        'type_utilisateur'          => 'artisan',
        'telephone'                 => '+22997000001',
        'sms_notifications_enabled' => true,
    ]);
    $artisan = Artisan::factory()->create(['id_utilisateur' => $artisanUser->id]);

    $clientUser = User::factory()->create(['type_utilisateur' => 'client']);
    $client     = Client::factory()->create(['id_utilisateur' => $clientUser->id]);

    $reservation = Reservation::factory()->create([
        'id_artisan' => $artisan->id,
        'id_client'  => $client->id,
    ]);
    $reservation->load(['artisan.user', 'client.user']);

    ReservationCreee::dispatch($reservation);

    // Le listener execute SendSmsJob en sync -> SmsLog cree
    expect(\App\Models\SmsLog::where('type', 'nouvelle_demande')->exists())->toBeTrue();
});

// ── SMS dispatched on paiement valide ─────────────────────────────────────────

test('two sms logs created on paiement valide (artisan + client)', function () {
    config(['africastalking.provider' => 'stub']);

    $artisanUser = User::factory()->create([
        'type_utilisateur'          => 'artisan',
        'telephone'                 => '+22997000002',
        'sms_notifications_enabled' => true,
    ]);
    $artisan = Artisan::factory()->create(['id_utilisateur' => $artisanUser->id]);

    $clientUser = User::factory()->create([
        'type_utilisateur'          => 'client',
        'telephone'                 => '+22990000003',
        'sms_notifications_enabled' => true,
    ]);
    $client = Client::factory()->create(['id_utilisateur' => $clientUser->id]);

    $reservation = Reservation::factory()->create([
        'id_artisan'    => $artisan->id,
        'id_client'     => $client->id,
        'montant_total' => 5000,
    ]);
    $reservation->load(['artisan.user', 'client.user']);

    $paiement = Paiement::factory()->create([
        'id_reservation'  => $reservation->id,
        'id_utilisateur'  => $clientUser->id,
        'montant'         => 1500,
        'statut'          => 'reussi',
    ]);

    PaiementValide::dispatch($paiement, $reservation, 'TXN-TEST');

    // Au moins 2 SMS logs crees (artisan + client), type 'paiement'
    expect(\App\Models\SmsLog::where('type', 'paiement')->count())
        ->toBeGreaterThanOrEqual(2);
});
