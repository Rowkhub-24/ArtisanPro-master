<?php

/**
 * Tests de scénarios bout-en-bout — Module Contrat de Réservation
 *
 * Ces tests couvrent les quatre scénarios principaux du cycle de vie d'un contrat :
 *  - Scénario 1 : Workflow complet (génération → signatures → finalisation)
 *  - Scénario 2 : Signature partielle (un seul côté signé)
 *  - Scénario 3 : Annulation après génération
 *  - Scénario 4 : Double-signature idempotente (le client signe deux fois)
 */

use App\Contracts\PdfGeneratorServiceInterface;
use App\Events\ReservationAnnulee;
use App\Jobs\ContratFinaliseJob;
use App\Listeners\ContratAnnulationListener;
use App\Models\Artisan;
use App\Models\Client;
use App\Models\Contrat;
use App\Models\Reservation;
use App\Models\User;
use App\Services\ContratService;
use App\Services\SignatureService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Crée un utilisateur client avec son modèle Client associé.
 */
function makeClientUser(): array
{
    $user   = User::factory()->create(['type_utilisateur' => 'client']);
    $client = Client::factory()->create(['id_utilisateur' => $user->id]);

    return ['user' => $user, 'client' => $client];
}

/**
 * Crée un utilisateur artisan avec son modèle Artisan associé.
 */
function makeArtisanUser(): array
{
    $user    = User::factory()->create(['type_utilisateur' => 'artisan']);
    $artisan = Artisan::factory()->create(['id_utilisateur' => $user->id]);

    return ['user' => $user, 'artisan' => $artisan];
}

/**
 * Crée une réservation confirmée entre un client et un artisan donnés.
 */
function makeConfirmedReservation(Client $client, Artisan $artisan): Reservation
{
    return Reservation::factory()->create([
        'id_client'  => $client->id,
        'id_artisan' => $artisan->id,
        'statut'     => 'confirmee',
    ]);
}

/**
 * Configure le mock du PdfGeneratorServiceInterface (sans génération réelle).
 * Retourne l'instance mockée pour permettre des assertions supplémentaires si besoin.
 */
function bindPdfMock(): \Mockery\MockInterface
{
    $pdfMock = \Mockery::mock(PdfGeneratorServiceInterface::class);
    $pdfMock->shouldReceive('genererBrouillon')->andReturn('contrats/test/brouillon.pdf');
    $pdfMock->shouldReceive('genererFinal')->andReturn('contrats/test/final.pdf');
    app()->instance(PdfGeneratorServiceInterface::class, $pdfMock);

    return $pdfMock;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scénario 1 — Workflow complet
// ─────────────────────────────────────────────────────────────────────────────

test('Scénario 1 : workflow complet — génération → signature client → signature artisan → ContratFinaliseJob dispatché', function () {
    Queue::fake();
    Mail::fake();
    bindPdfMock();

    // ── Arrangement ──────────────────────────────────────────────────────────
    ['user' => $clientUser, 'client' => $client]   = makeClientUser();
    ['user' => $artisanUser, 'artisan' => $artisan] = makeArtisanUser();

    $reservation = makeConfirmedReservation($client, $artisan);

    // ── Step 1 : Génération du contrat depuis la réservation ──────────────────
    /** @var ContratService $contratService */
    $contratService = app(ContratService::class);
    $contrat = $contratService->creerDepuisReservation($reservation);

    expect($contrat)->toBeInstanceOf(Contrat::class);
    expect($contrat->statut)->toBe(Contrat::STATUT_GENERE);
    expect($contrat->id_client)->toBe($client->id);
    expect($contrat->id_artisan)->toBe($artisan->id);
    expect($contrat->genere_at)->not->toBeNull();

    // ── Step 2 : Signature client ─────────────────────────────────────────────
    /** @var SignatureService $signatureService */
    $signatureService = app(SignatureService::class);

    // Avant la signature client : finalise_at doit être null (set par le job, qui est faké)
    $contrat->refresh();
    expect($contrat->finalise_at)->toBeNull();

    $contrat = $signatureService->signer($contrat, $clientUser, 'client');

    $contrat->refresh();
    expect($contrat->statut)->toBe(Contrat::STATUT_PARTIELLEMENT_SIGNE);
    expect($contrat->signature_client_at)->not->toBeNull();
    expect($contrat->signature_artisan_at)->toBeNull();

    // Le job ne doit pas encore être dispatché après la 1ère signature
    Queue::assertNotPushed(ContratFinaliseJob::class);

    // ── Step 3 : Signature artisan ────────────────────────────────────────────
    $contrat = $signatureService->signer($contrat, $artisanUser, 'artisan');

    $contrat->refresh();
    expect($contrat->statut)->toBe(Contrat::STATUT_FINALISE);
    expect($contrat->signature_client_at)->not->toBeNull();
    expect($contrat->signature_artisan_at)->not->toBeNull();

    // ── Assertions finales ────────────────────────────────────────────────────
    // ContratFinaliseJob dispatché exactement une fois
    Queue::assertPushed(ContratFinaliseJob::class, 1);

    // finalise_at est null avant l'exécution du job (le job est faké)
    expect($contrat->finalise_at)->toBeNull();

    // Les deux horodatages de signature sont non-null
    expect($contrat->signature_client_at)->not->toBeNull();
    expect($contrat->signature_artisan_at)->not->toBeNull();
});

// ─────────────────────────────────────────────────────────────────────────────
// Scénario 2 — Signature partielle (un seul côté)
// ─────────────────────────────────────────────────────────────────────────────

test('Scénario 2 : signature partielle — seul le client signe → statut partiellement_signe, job non dispatché', function () {
    Queue::fake();
    Mail::fake();
    bindPdfMock();

    // ── Arrangement ──────────────────────────────────────────────────────────
    ['user' => $clientUser, 'client' => $client]   = makeClientUser();
    ['artisan' => $artisan]                         = makeArtisanUser();

    $reservation = makeConfirmedReservation($client, $artisan);

    $contratService   = app(ContratService::class);
    $signatureService = app(SignatureService::class);

    // ── Génération du contrat ─────────────────────────────────────────────────
    $contrat = $contratService->creerDepuisReservation($reservation);

    // ── Seul le client signe ──────────────────────────────────────────────────
    $contrat = $signatureService->signer($contrat, $clientUser, 'client');

    // ── Assertions ───────────────────────────────────────────────────────────
    $contrat->refresh();
    expect($contrat->statut)->toBe(Contrat::STATUT_PARTIELLEMENT_SIGNE);
    expect($contrat->signature_client_at)->not->toBeNull();
    expect($contrat->signature_artisan_at)->toBeNull();

    // ContratFinaliseJob ne doit PAS être dispatché
    Queue::assertNotPushed(ContratFinaliseJob::class);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scénario 3 — Annulation après génération
// ─────────────────────────────────────────────────────────────────────────────

test("Scénario 3 : annulation après génération → statut passe à 'annule'", function () {
    Queue::fake();
    Mail::fake();
    bindPdfMock();

    // ── Arrangement ──────────────────────────────────────────────────────────
    ['client' => $client]   = makeClientUser();
    ['artisan' => $artisan] = makeArtisanUser();

    $reservation = makeConfirmedReservation($client, $artisan);

    // Créer un contrat avec statut 'genere' directement
    $contrat = Contrat::create([
        'id_reservation'         => $reservation->id,
        'id_client'              => $client->id,
        'id_artisan'             => $artisan->id,
        'numero_contrat'         => 'CP-2025-00099',
        'nom_client'             => 'Client Test',
        'nom_artisan'            => 'Artisan Test',
        'description_prestation' => 'Travaux divers',
        'montant_total'          => 25000.00,
        'date_debut_prestation'  => now()->addDays(7),
        'adresse_intervention'   => 'Cotonou, Bénin',
        'statut'                 => Contrat::STATUT_GENERE,
        'genere_at'              => now(),
    ]);

    expect($contrat->statut)->toBe(Contrat::STATUT_GENERE);

    // ── Déclencher l'annulation via ContratAnnulationListener ────────────────
    $listener = new ContratAnnulationListener();
    $listener->handle(new ReservationAnnulee($reservation, 'client'));

    // ── Assertions ───────────────────────────────────────────────────────────
    $contrat->refresh();
    expect($contrat->statut)->toBe(Contrat::STATUT_ANNULE);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scénario 4 — Double-signature idempotente
// ─────────────────────────────────────────────────────────────────────────────

test('Scénario 4 : double-signature client — idempotence, statut inchangé, job non dispatché', function () {
    Queue::fake();
    Mail::fake();
    bindPdfMock();

    // ── Arrangement ──────────────────────────────────────────────────────────
    ['user' => $clientUser, 'client' => $client]   = makeClientUser();
    ['artisan' => $artisan]                         = makeArtisanUser();

    $reservation = makeConfirmedReservation($client, $artisan);

    $contratService   = app(ContratService::class);
    $signatureService = app(SignatureService::class);

    // ── Génération ───────────────────────────────────────────────────────────
    $contrat = $contratService->creerDepuisReservation($reservation);

    // ── Première signature client ─────────────────────────────────────────────
    $contrat = $signatureService->signer($contrat, $clientUser, 'client');
    $contrat->refresh();

    $premierHash   = $contrat->signature_client_hash;
    $premiereDate  = $contrat->signature_client_at;

    expect($contrat->statut)->toBe(Contrat::STATUT_PARTIELLEMENT_SIGNE);

    // ── Deuxième signature client (idempotence) ───────────────────────────────
    $contrat = $signatureService->signer($contrat, $clientUser, 'client');
    $contrat->refresh();

    // ── Assertions ───────────────────────────────────────────────────────────
    // Statut inchangé (toujours partiellement_signe — artisan n'a pas signé)
    expect($contrat->statut)->toBe(Contrat::STATUT_PARTIELLEMENT_SIGNE);

    // La signature n'a pas été écrasée (mêmes valeurs)
    expect($contrat->signature_client_hash)->toBe($premierHash);
    expect($contrat->signature_client_at->timestamp)->toBe($premiereDate->timestamp);

    // L'artisan n'a toujours pas signé
    expect($contrat->signature_artisan_at)->toBeNull();

    // ContratFinaliseJob ne doit PAS être dispatché
    Queue::assertNotPushed(ContratFinaliseJob::class);
});
