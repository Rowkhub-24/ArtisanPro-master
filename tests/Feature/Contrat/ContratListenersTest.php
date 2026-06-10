<?php

use App\Contracts\PdfGeneratorServiceInterface;
use App\Events\ReservationAnnulee;
use App\Events\ReservationConfirmee;
use App\Listeners\ContratAnnulationListener;
use App\Listeners\ContratGenerationListener;
use App\Models\Artisan;
use App\Models\Client;
use App\Models\Contrat;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Crée une réservation confirmée avec toutes ses relations (client, artisan, utilisateurs).
 */
function creerReservationConfirmee(array $attrs = []): Reservation
{
    $clientUser  = User::factory()->create(['type_utilisateur' => 'client']);
    $artisanUser = User::factory()->create(['type_utilisateur' => 'artisan']);

    $client  = Client::factory()->create(['id_utilisateur' => $clientUser->id]);
    $artisan = Artisan::factory()->create(['id_utilisateur' => $artisanUser->id]);

    return Reservation::factory()->create(array_merge([
        'id_client'  => $client->id,
        'id_artisan' => $artisan->id,
        'statut'     => 'confirmee',
    ], $attrs));
}

/**
 * Crée un contrat associé à une réservation existante.
 */
function creerContratPourReservation(Reservation $reservation, array $attrs = []): Contrat
{
    return Contrat::create(array_merge([
        'id_reservation'         => $reservation->id,
        'id_client'              => $reservation->id_client,
        'id_artisan'             => $reservation->id_artisan,
        'numero_contrat'         => 'CP-2025-00001',
        'nom_client'             => 'Client Test',
        'nom_artisan'            => 'Artisan Test',
        'description_prestation' => 'Travaux divers',
        'montant_total'          => 30000.00,
        'date_debut_prestation'  => now()->addDays(5),
        'adresse_intervention'   => 'Cotonou, Bénin',
        'statut'                 => Contrat::STATUT_GENERE,
        'genere_at'              => now(),
    ], $attrs));
}

// ─── Mocking du PdfGeneratorService ──────────────────────────────────────────

/**
 * Binds a no-op mock of PdfGeneratorServiceInterface to avoid real PDF generation.
 */
function mockPdfGenerator(): void
{
    $pdfMock = \Mockery::mock(PdfGeneratorServiceInterface::class);
    $pdfMock->shouldReceive('genererBrouillon')->andReturn('contrats/test/brouillon.pdf');
    $pdfMock->shouldReceive('genererFinal')->andReturn('contrats/test/final.pdf');
    app()->instance(PdfGeneratorServiceInterface::class, $pdfMock);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ContratGenerationListener — ReservationConfirmee
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Test 1 : Dispatching ReservationConfirmee crée un Contrat ────────────────

test('dispatching ReservationConfirmee crée un nouveau contrat en base', function () {
    // Queue::fake() empêche le listener ShouldQueue d'être mis en queue.
    // On appelle handle() directement pour tester la logique métier.
    Queue::fake();
    mockPdfGenerator();

    $reservation = creerReservationConfirmee();

    // Aucun contrat ne doit exister avant
    expect(Contrat::where('id_reservation', $reservation->id)->count())->toBe(0);

    // Appel direct du listener (simule le job dequeuable)
    $listener = new ContratGenerationListener();
    $listener->handle(new ReservationConfirmee($reservation));

    // Un contrat doit exister après
    expect(Contrat::where('id_reservation', $reservation->id)->count())->toBe(1);
});

test("le contrat créé par le listener a le statut 'genere'", function () {
    Queue::fake();
    mockPdfGenerator();

    $reservation = creerReservationConfirmee();

    $listener = new ContratGenerationListener();
    $listener->handle(new ReservationConfirmee($reservation));

    $contrat = Contrat::where('id_reservation', $reservation->id)->firstOrFail();

    expect($contrat->statut)->toBe(Contrat::STATUT_GENERE);
    expect($contrat->genere_at)->not->toBeNull();
    expect($contrat->id_client)->toBe($reservation->id_client);
    expect($contrat->id_artisan)->toBe($reservation->id_artisan);
});

// ─── Test 2 : Idempotence — deux dispatches créent seulement 1 contrat ────────

test('dispatching ReservationConfirmee deux fois pour la même réservation ne crée qu\'un seul contrat', function () {
    Queue::fake();
    mockPdfGenerator();

    $reservation = creerReservationConfirmee();

    $listener = new ContratGenerationListener();

    // Premier appel
    $listener->handle(new ReservationConfirmee($reservation));

    // Deuxième appel (idempotence)
    $listener->handle(new ReservationConfirmee($reservation));

    // Il doit toujours y avoir exactement 1 contrat
    expect(Contrat::where('id_reservation', $reservation->id)->count())->toBe(1);
});

test("l'idempotence retourne le même contrat les deux fois", function () {
    Queue::fake();
    mockPdfGenerator();

    $reservation = creerReservationConfirmee();

    $listener = new ContratGenerationListener();

    $listener->handle(new ReservationConfirmee($reservation));
    $contratApresPremiereCreation = Contrat::where('id_reservation', $reservation->id)->first();

    $listener->handle(new ReservationConfirmee($reservation));
    $contratApresDeuxiemeAppel = Contrat::where('id_reservation', $reservation->id)->first();

    // L'ID doit être identique — même enregistrement
    expect($contratApresDeuxiemeAppel->id)->toBe($contratApresPremiereCreation->id);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  ContratAnnulationListener — ReservationAnnulee
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Test 3 : Dispatching ReservationAnnulee passe le contrat en 'annule' ─────

test("dispatching ReservationAnnulee passe le statut du contrat à 'annule'", function () {
    $reservation = creerReservationConfirmee();
    $contrat     = creerContratPourReservation($reservation, [
        'statut' => Contrat::STATUT_GENERE,
    ]);

    $listener = new ContratAnnulationListener();
    $listener->handle(new ReservationAnnulee($reservation, 'client'));

    $contrat->refresh();
    expect($contrat->statut)->toBe(Contrat::STATUT_ANNULE);
});

test("ReservationAnnulee annule aussi un contrat en statut 'partiellement_signe'", function () {
    $reservation = creerReservationConfirmee();
    $contrat     = creerContratPourReservation($reservation, [
        'statut'              => Contrat::STATUT_PARTIELLEMENT_SIGNE,
        'signature_client_at' => now()->subMinutes(10),
        'signature_client_hash' => 'some-hash',
    ]);

    $listener = new ContratAnnulationListener();
    $listener->handle(new ReservationAnnulee($reservation, 'artisan'));

    $contrat->refresh();
    expect($contrat->statut)->toBe(Contrat::STATUT_ANNULE);
});

// ─── Test 4 : ReservationAnnulee sans contrat ne lève pas d'exception ─────────

test("dispatching ReservationAnnulee quand aucun contrat existe ne lève pas d'exception", function () {
    $reservation = creerReservationConfirmee();

    // S'assurer qu'aucun contrat n'existe
    expect(Contrat::where('id_reservation', $reservation->id)->count())->toBe(0);

    $listener = new ContratAnnulationListener();

    // Ne doit pas lever d'exception
    expect(fn () => $listener->handle(new ReservationAnnulee($reservation, 'client')))
        ->not->toThrow(\Throwable::class);
});

// ─── Test 5 : ReservationAnnulee ne modifie pas un contrat 'finalise' ─────────

test("ReservationAnnulee ne modifie pas le statut d'un contrat déjà finalisé", function () {
    $reservation = creerReservationConfirmee();
    $contrat     = creerContratPourReservation($reservation, [
        'statut'               => Contrat::STATUT_FINALISE,
        'signature_client_at'  => now()->subHour(),
        'signature_client_hash'  => 'client-hash',
        'signature_artisan_at' => now()->subMinutes(30),
        'signature_artisan_hash' => 'artisan-hash',
        'finalise_at'          => now()->subMinutes(15),
    ]);

    $listener = new ContratAnnulationListener();
    $listener->handle(new ReservationAnnulee($reservation, 'client'));

    $contrat->refresh();

    // Le statut doit rester 'finalise', non écrasé par 'annule'
    expect($contrat->statut)->toBe(Contrat::STATUT_FINALISE);
});

test("ReservationAnnulee ne touche pas un contrat 'finalise' (finalise_at inchangé)", function () {
    $finaliseAt  = now()->subMinutes(15);
    $reservation = creerReservationConfirmee();
    $contrat     = creerContratPourReservation($reservation, [
        'statut'               => Contrat::STATUT_FINALISE,
        'signature_client_at'  => now()->subHour(),
        'signature_client_hash'  => 'client-hash',
        'signature_artisan_at' => now()->subMinutes(30),
        'signature_artisan_hash' => 'artisan-hash',
        'finalise_at'          => $finaliseAt,
    ]);

    $listener = new ContratAnnulationListener();
    $listener->handle(new ReservationAnnulee($reservation, 'artisan'));

    $contrat->refresh();

    // finalise_at ne doit pas avoir changé
    expect($contrat->finalise_at->timestamp)
        ->toBe($finaliseAt->timestamp);
});
