<?php

use App\Exceptions\ContratAnnuleException;
use App\Jobs\ContratFinaliseJob;
use App\Models\Artisan;
use App\Models\Client;
use App\Models\Contrat;
use App\Models\Reservation;
use App\Models\User;
use App\Services\SignatureService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;

uses(RefreshDatabase::class);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crée un Contrat en base avec une réservation, un client et un artisan réels.
 *
 * Retourne le contrat ET les modèles User associés pour faciliter la signature.
 *
 * @return array{contrat: Contrat, userClient: User, userArtisan: User}
 */
function makeContratAvecParties(array $overrides = []): array
{
    // Users
    $userClient  = User::factory()->state(['type_utilisateur' => 'client'])->create();
    $userArtisan = User::factory()->state(['type_utilisateur' => 'artisan'])->create();

    // Modèles liés
    $client  = Client::factory()->create(['id_utilisateur' => $userClient->id]);
    $artisan = Artisan::factory()->create(['id_utilisateur' => $userArtisan->id]);

    // Réservation réelle pour respecter la contrainte FK
    $reservation = Reservation::factory()->confirmee()->create([
        'id_client'  => $client->id,
        'id_artisan' => $artisan->id,
    ]);

    $contrat = Contrat::create(array_merge([
        'id_reservation'         => $reservation->id,
        'id_client'              => $client->id,
        'id_artisan'             => $artisan->id,
        'numero_contrat'         => 'CP-' . now()->year . '-' . str_pad(random_int(1, 99999), 5, '0', STR_PAD_LEFT),
        'nom_client'             => 'Jean Dupont',
        'nom_artisan'            => 'Pierre Martin',
        'description_prestation' => 'Réparation toiture',
        'montant_total'          => 75000.00,
        'date_debut_prestation'  => now()->addDay(),
        'statut'                 => Contrat::STATUT_EN_ATTENTE_SIGNATURES,
        'clauses_litige'         => [],
        'genere_at'              => now(),
    ], $overrides));

    return [
        'contrat'     => $contrat,
        'userClient'  => $userClient,
        'userArtisan' => $userArtisan,
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// signer() — rejet si contrat annulé
// ─────────────────────────────────────────────────────────────────────────────

test('signer lève ContratAnnuleException si le statut est annule', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient] = makeContratAvecParties([
        'statut' => Contrat::STATUT_ANNULE,
    ]);

    $service = new SignatureService();

    expect(fn () => $service->signer($contrat, $userClient, 'client'))
        ->toThrow(ContratAnnuleException::class);
});

// ─────────────────────────────────────────────────────────────────────────────
// signer() — signature du client
// ─────────────────────────────────────────────────────────────────────────────

test('signer enregistre signature_client_at quand le client signe', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient] = makeContratAvecParties();
    $service = new SignatureService();

    $result = $service->signer($contrat, $userClient, 'client');
    $result->refresh();

    expect($result->signature_client_at)->not->toBeNull();
});

test('signer enregistre signature_client_hash quand le client signe', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient] = makeContratAvecParties();
    $service = new SignatureService();

    $result = $service->signer($contrat, $userClient, 'client');
    $result->refresh();

    expect($result->signature_client_hash)->not->toBeNull()
        ->and(strlen($result->signature_client_hash))->toBe(64); // HMAC-SHA256 = 64 hex chars
});

// ─────────────────────────────────────────────────────────────────────────────
// signer() — signature de l'artisan
// ─────────────────────────────────────────────────────────────────────────────

test('signer enregistre signature_artisan_at quand l\'artisan signe', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userArtisan' => $userArtisan] = makeContratAvecParties();
    $service = new SignatureService();

    $result = $service->signer($contrat, $userArtisan, 'artisan');
    $result->refresh();

    expect($result->signature_artisan_at)->not->toBeNull();
});

test('signer enregistre signature_artisan_hash quand l\'artisan signe', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userArtisan' => $userArtisan] = makeContratAvecParties();
    $service = new SignatureService();

    $result = $service->signer($contrat, $userArtisan, 'artisan');
    $result->refresh();

    expect($result->signature_artisan_hash)->not->toBeNull()
        ->and(strlen($result->signature_artisan_hash))->toBe(64);
});

// ─────────────────────────────────────────────────────────────────────────────
// signer() — transition de statut
// ─────────────────────────────────────────────────────────────────────────────

test('signer passe le statut à partiellement_signe après la première signature (client)', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient] = makeContratAvecParties();
    $service = new SignatureService();

    $result = $service->signer($contrat, $userClient, 'client');
    $result->refresh();

    expect($result->statut)->toBe(Contrat::STATUT_PARTIELLEMENT_SIGNE);
});

test('signer passe le statut à partiellement_signe après la première signature (artisan)', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userArtisan' => $userArtisan] = makeContratAvecParties();
    $service = new SignatureService();

    $result = $service->signer($contrat, $userArtisan, 'artisan');
    $result->refresh();

    expect($result->statut)->toBe(Contrat::STATUT_PARTIELLEMENT_SIGNE);
});

test('signer passe le statut à finalise quand les deux parties ont signé', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient, 'userArtisan' => $userArtisan] = makeContratAvecParties();
    $service = new SignatureService();

    $service->signer($contrat, $userClient, 'client');
    $contrat->refresh();
    $result = $service->signer($contrat, $userArtisan, 'artisan');
    $result->refresh();

    expect($result->statut)->toBe(Contrat::STATUT_FINALISE);
});

// ─────────────────────────────────────────────────────────────────────────────
// signer() — dispatch de ContratFinaliseJob
// ─────────────────────────────────────────────────────────────────────────────

test('signer ne dispatche PAS ContratFinaliseJob après une seule signature', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient] = makeContratAvecParties();
    $service = new SignatureService();

    $service->signer($contrat, $userClient, 'client');

    Bus::assertNotDispatched(ContratFinaliseJob::class);
});

test('signer dispatche ContratFinaliseJob exactement une fois après les deux signatures', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient, 'userArtisan' => $userArtisan] = makeContratAvecParties();
    $service = new SignatureService();

    $service->signer($contrat, $userClient, 'client');
    $contrat->refresh();
    $service->signer($contrat, $userArtisan, 'artisan');

    Bus::assertDispatched(ContratFinaliseJob::class, 1);
});

// ─────────────────────────────────────────────────────────────────────────────
// signer() — idempotence
// ─────────────────────────────────────────────────────────────────────────────

test('signer est idempotent : un second appel sur le même rôle retourne le contrat inchangé', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient] = makeContratAvecParties();
    $service = new SignatureService();

    $premiere = $service->signer($contrat, $userClient, 'client');
    $premiere->refresh();
    $hashApresPremiereSignature = $premiere->signature_client_hash;
    $atApresPremiereSignature   = $premiere->signature_client_at->toIso8601String();

    // Second appel avec le même rôle
    $deuxieme = $service->signer($premiere, $userClient, 'client');
    $deuxieme->refresh();

    expect($deuxieme->signature_client_hash)->toBe($hashApresPremiereSignature)
        ->and($deuxieme->signature_client_at->toIso8601String())->toBe($atApresPremiereSignature);
});

test('signer idempotent : le second appel ne dispatche pas de job supplémentaire', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient] = makeContratAvecParties();
    $service = new SignatureService();

    $contrat = $service->signer($contrat, $userClient, 'client');
    // Deuxième appel sur le même rôle
    $service->signer($contrat, $userClient, 'client');

    // Aucun job ne doit être dispatché (une seule signature, idempotence)
    Bus::assertNotDispatched(ContratFinaliseJob::class);
});

// ─────────────────────────────────────────────────────────────────────────────
// verifier() — vérification HMAC
// ─────────────────────────────────────────────────────────────────────────────

test('verifier retourne false si signature_at est null', function () {
    ['contrat' => $contrat] = makeContratAvecParties([
        'signature_client_at'   => null,
        'signature_client_hash' => null,
    ]);

    $service = new SignatureService();

    expect($service->verifier($contrat, 'client'))->toBeFalse();
});

test('verifier retourne true quand le hash stocké correspond au hash recalculé', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient] = makeContratAvecParties();
    $service = new SignatureService();

    $contrat = $service->signer($contrat, $userClient, 'client');
    $contrat->refresh();

    expect($service->verifier($contrat, 'client'))->toBeTrue();
});

test('verifier retourne false si le hash a été altéré', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient] = makeContratAvecParties();
    $service = new SignatureService();

    $contrat = $service->signer($contrat, $userClient, 'client');
    $contrat->refresh();

    // Altérer le hash stocké
    $contrat->signature_client_hash = str_repeat('a', 64);
    $contrat->save();

    expect($service->verifier($contrat, 'client'))->toBeFalse();
});

test('verifier retourne false pour l\'artisan si signature_artisan_at est null', function () {
    ['contrat' => $contrat] = makeContratAvecParties([
        'signature_artisan_at'   => null,
        'signature_artisan_hash' => null,
    ]);

    $service = new SignatureService();

    expect($service->verifier($contrat, 'artisan'))->toBeFalse();
});

test('verifier retourne true pour l\'artisan après une signature valide', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userArtisan' => $userArtisan] = makeContratAvecParties();
    $service = new SignatureService();

    $contrat = $service->signer($contrat, $userArtisan, 'artisan');
    $contrat->refresh();

    expect($service->verifier($contrat, 'artisan'))->toBeTrue();
});
