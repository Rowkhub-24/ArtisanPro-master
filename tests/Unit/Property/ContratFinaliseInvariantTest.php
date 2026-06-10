<?php

/**
 * Property 2 : Invariant du contrat finalisé
 *
 * Pour tout ordre de signature (client en premier ou artisan en premier, choisi aléatoirement),
 * après que les deux parties aient signé via `SignatureService::signer()` :
 *   1. `statut = 'finalise'`
 *   2. `signature_client_at` et `signature_artisan_at` sont non-null
 *   3. `signature_client_hash` et `signature_artisan_hash` sont non-null
 *   4. Les hashes HMAC sont valides (vérifiables via `SignatureService::verifier()`)
 *   5. `ContratFinaliseJob` a été dispatché exactement une fois
 *
 * **Validates: Requirements 4.8, 5.4**
 */

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Crée un contrat avec client et artisan réels, prêt pour la double signature.
 *
 * @return array{contrat: Contrat, userClient: User, userArtisan: User}
 */
function makeContratPourFinalisation(): array
{
    $userClient  = User::factory()->state(['type_utilisateur' => 'client'])->create();
    $userArtisan = User::factory()->state(['type_utilisateur' => 'artisan'])->create();

    $client  = Client::factory()->create(['id_utilisateur' => $userClient->id]);
    $artisan = Artisan::factory()->create(['id_utilisateur' => $userArtisan->id]);

    $reservation = Reservation::factory()->confirmee()->create([
        'id_client'  => $client->id,
        'id_artisan' => $artisan->id,
    ]);

    $contrat = Contrat::create([
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
    ]);

    return [
        'contrat'     => $contrat,
        'userClient'  => $userClient,
        'userArtisan' => $userArtisan,
    ];
}

// ── Property 2 : statut = 'finalise' après double signature ──────────────────

/**
 * **Validates: Requirements 4.8, 5.4**
 *
 * Quel que soit l'ordre de signature (client d'abord ou artisan d'abord),
 * après les deux signatures le statut doit toujours être `finalise`.
 */
test('property 2 – statut est finalise après la double signature (ordre aléatoire)', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient, 'userArtisan' => $userArtisan]
        = makeContratPourFinalisation();

    $service    = new SignatureService();
    $clientFirst = fake()->boolean();

    if ($clientFirst) {
        $service->signer($contrat, $userClient, 'client');
        $contrat->refresh();
        $service->signer($contrat, $userArtisan, 'artisan');
    } else {
        $service->signer($contrat, $userArtisan, 'artisan');
        $contrat->refresh();
        $service->signer($contrat, $userClient, 'client');
    }

    $contrat->refresh();

    expect($contrat->statut)->toBe(Contrat::STATUT_FINALISE, sprintf(
        'Après double signature (ordre : %s en premier), le statut devrait être "%s" mais vaut "%s".',
        $clientFirst ? 'client' : 'artisan',
        Contrat::STATUT_FINALISE,
        $contrat->statut,
    ));
})->repeat(20);

// ── Property 2 : signature_client_at et signature_artisan_at non-null ─────────

/**
 * **Validates: Requirements 4.1, 4.2, 4.8**
 *
 * Quel que soit l'ordre de signature, après les deux signatures,
 * `signature_client_at` et `signature_artisan_at` doivent être non-null.
 */
test('property 2 – signature_client_at et signature_artisan_at sont non-null après finalisation', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient, 'userArtisan' => $userArtisan]
        = makeContratPourFinalisation();

    $service     = new SignatureService();
    $clientFirst = fake()->boolean();

    if ($clientFirst) {
        $service->signer($contrat, $userClient, 'client');
        $contrat->refresh();
        $service->signer($contrat, $userArtisan, 'artisan');
    } else {
        $service->signer($contrat, $userArtisan, 'artisan');
        $contrat->refresh();
        $service->signer($contrat, $userClient, 'client');
    }

    $contrat->refresh();

    expect($contrat->signature_client_at)->not->toBeNull(sprintf(
        'signature_client_at ne doit pas être null après la double signature (ordre : %s en premier).',
        $clientFirst ? 'client' : 'artisan',
    ));

    expect($contrat->signature_artisan_at)->not->toBeNull(sprintf(
        'signature_artisan_at ne doit pas être null après la double signature (ordre : %s en premier).',
        $clientFirst ? 'client' : 'artisan',
    ));
})->repeat(20);

// ── Property 2 : signature_client_hash et signature_artisan_hash non-null ─────

/**
 * **Validates: Requirements 4.1, 4.2, 4.8, 7.1**
 *
 * Quel que soit l'ordre de signature, après les deux signatures,
 * `signature_client_hash` et `signature_artisan_hash` doivent être non-null.
 */
test('property 2 – signature_client_hash et signature_artisan_hash sont non-null après finalisation', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient, 'userArtisan' => $userArtisan]
        = makeContratPourFinalisation();

    $service     = new SignatureService();
    $clientFirst = fake()->boolean();

    if ($clientFirst) {
        $service->signer($contrat, $userClient, 'client');
        $contrat->refresh();
        $service->signer($contrat, $userArtisan, 'artisan');
    } else {
        $service->signer($contrat, $userArtisan, 'artisan');
        $contrat->refresh();
        $service->signer($contrat, $userClient, 'client');
    }

    $contrat->refresh();

    expect($contrat->signature_client_hash)->not->toBeNull(sprintf(
        'signature_client_hash ne doit pas être null après la double signature (ordre : %s en premier).',
        $clientFirst ? 'client' : 'artisan',
    ));

    expect($contrat->signature_artisan_hash)->not->toBeNull(sprintf(
        'signature_artisan_hash ne doit pas être null après la double signature (ordre : %s en premier).',
        $clientFirst ? 'client' : 'artisan',
    ));
})->repeat(20);

// ── Property 2 : les hashes HMAC sont valides (vérifiables) ──────────────────

/**
 * **Validates: Requirements 7.1, 7.2**
 *
 * Quel que soit l'ordre de signature, après les deux signatures,
 * `SignatureService::verifier()` doit retourner `true` pour les deux rôles.
 *
 * Cela garantit que les hashes stockés sont calculés correctement et
 * peuvent être vérifiés à posteriori.
 */
test('property 2 – les hashes HMAC sont valides pour les deux rôles après finalisation', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient, 'userArtisan' => $userArtisan]
        = makeContratPourFinalisation();

    $service     = new SignatureService();
    $clientFirst = fake()->boolean();

    if ($clientFirst) {
        $service->signer($contrat, $userClient, 'client');
        $contrat->refresh();
        $service->signer($contrat, $userArtisan, 'artisan');
    } else {
        $service->signer($contrat, $userArtisan, 'artisan');
        $contrat->refresh();
        $service->signer($contrat, $userClient, 'client');
    }

    $contrat->refresh();

    expect($service->verifier($contrat, 'client'))->toBeTrue(sprintf(
        'Le hash HMAC du client devrait être valide après la double signature (ordre : %s en premier).',
        $clientFirst ? 'client' : 'artisan',
    ));

    expect($service->verifier($contrat, 'artisan'))->toBeTrue(sprintf(
        'Le hash HMAC de l\'artisan devrait être valide après la double signature (ordre : %s en premier).',
        $clientFirst ? 'client' : 'artisan',
    ));
})->repeat(20);

// ── Property 2 : ContratFinaliseJob dispatché exactement une fois ─────────────

/**
 * **Validates: Requirements 4.8, 5.4**
 *
 * Quel que soit l'ordre de signature, `ContratFinaliseJob` doit être dispatché
 * exactement une fois après les deux signatures — jamais zéro, jamais deux.
 */
test('property 2 – ContratFinaliseJob est dispatché exactement une fois après la double signature', function () {
    Bus::fake();

    ['contrat' => $contrat, 'userClient' => $userClient, 'userArtisan' => $userArtisan]
        = makeContratPourFinalisation();

    $service     = new SignatureService();
    $clientFirst = fake()->boolean();

    if ($clientFirst) {
        $service->signer($contrat, $userClient, 'client');
        $contrat->refresh();
        $service->signer($contrat, $userArtisan, 'artisan');
    } else {
        $service->signer($contrat, $userArtisan, 'artisan');
        $contrat->refresh();
        $service->signer($contrat, $userClient, 'client');
    }

    Bus::assertDispatched(ContratFinaliseJob::class, 1);
})->repeat(20);
