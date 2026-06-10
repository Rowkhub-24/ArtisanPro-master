<?php

/**
 * Property 1 : Idempotence de génération
 *
 * ∀ réservation confirmée, appeler `creerDepuisReservation()` N fois (N ∈ [2, 10])
 * sur la même réservation doit :
 *   1. Toujours retourner le même contrat (même id, même numero_contrat, même statut)
 *   2. N'insérer qu'un seul enregistrement en base pour cette réservation
 *
 * **Validates: Requirements 1.2**
 */

use App\Contracts\PdfGeneratorServiceInterface;
use App\Models\Artisan;
use App\Models\Client;
use App\Models\Contrat;
use App\Models\Reservation;
use App\Models\User;
use App\Services\ContratService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Crée un mock du PdfGeneratorServiceInterface qui retourne un chemin fictif.
 */
function makePdfMockIdempotence(): PdfGeneratorServiceInterface
{
    $mock = Mockery::mock(PdfGeneratorServiceInterface::class);
    $mock->shouldReceive('genererBrouillon')
        ->andReturn('contrats/test/brouillon.pdf')
        ->byDefault();
    $mock->shouldReceive('genererFinal')
        ->andReturn('contrats/test/final.pdf')
        ->byDefault();

    return $mock;
}

/**
 * Crée une réservation confirmée avec client et artisan uniques.
 */
function makeReservationPourIdempotence(): Reservation
{
    $userClient  = User::factory()->state(['type_utilisateur' => 'client'])->create();
    $userArtisan = User::factory()->state(['type_utilisateur' => 'artisan'])->create();

    $client  = Client::firstOrCreate(['id_utilisateur' => $userClient->id], ['telephone' => '+229' . fake()->numerify('9#######')]);
    $artisan = Artisan::factory()->create(['id_utilisateur' => $userArtisan->id]);

    return Reservation::factory()->confirmee()->create([
        'id_client'            => $client->id,
        'id_artisan'           => $artisan->id,
        'description_besoin'   => fake()->sentence(),
        'montant_total'        => fake()->randomFloat(2, 5000, 500000),
        'date_debut'           => now()->addDays(fake()->numberBetween(1, 10)),
        'date_fin'             => now()->addDays(fake()->numberBetween(11, 20)),
        'adresse_intervention' => fake()->address(),
    ]);
}

/**
 * Crée une instance du ContratService avec un mock PDF injecté.
 */
function makeServicePourIdempotence(): ContratService
{
    return new ContratService(makePdfMockIdempotence());
}

// ── Property 1 : N appels retournent toujours le même id de contrat ───────────

/**
 * **Validates: Requirements 1.2**
 *
 * Pour N ∈ [2, 10] appels de `creerDepuisReservation()` sur la même réservation,
 * chaque appel doit retourner un contrat avec le même `id`.
 *
 * Cela garantit que la méthode est strictement idempotente : aucun doublon
 * ne peut être créé quelle que soit la fréquence d'invocation.
 */
test('property 1 – N appels sur la même réservation retournent toujours le même id de contrat', function () {
    $reservation = makeReservationPourIdempotence();
    $service     = makeServicePourIdempotence();
    $n           = fake()->numberBetween(2, 10);

    $contratInitial = $service->creerDepuisReservation($reservation);
    $idAttendu      = $contratInitial->id;

    for ($i = 1; $i < $n; $i++) {
        $contrat = $service->creerDepuisReservation($reservation);

        expect($contrat->id)->toBe($idAttendu, sprintf(
            'L\'appel #%d a retourné un contrat avec l\'id %d au lieu de %d.',
            $i + 1,
            $contrat->id,
            $idAttendu,
        ));
    }
})->repeat(20);

// ── Property 1 : N appels retournent toujours le même numero_contrat ──────────

/**
 * **Validates: Requirements 1.2**
 *
 * Pour N ∈ [2, 10] appels de `creerDepuisReservation()` sur la même réservation,
 * chaque appel doit retourner un contrat avec le même `numero_contrat`.
 *
 * Le numéro de contrat étant unique et séquentiel, il ne doit être généré
 * qu'une seule fois, au premier appel.
 */
test('property 1 – N appels sur la même réservation retournent toujours le même numero_contrat', function () {
    $reservation   = makeReservationPourIdempotence();
    $service       = makeServicePourIdempotence();
    $n             = fake()->numberBetween(2, 10);

    $contratInitial  = $service->creerDepuisReservation($reservation);
    $numeroAttendu   = $contratInitial->numero_contrat;

    for ($i = 1; $i < $n; $i++) {
        $contrat = $service->creerDepuisReservation($reservation);

        expect($contrat->numero_contrat)->toBe($numeroAttendu, sprintf(
            'L\'appel #%d a retourné le numero_contrat "%s" au lieu de "%s".',
            $i + 1,
            $contrat->numero_contrat,
            $numeroAttendu,
        ));
    }
})->repeat(20);

// ── Property 1 : N appels retournent toujours le même statut ─────────────────

/**
 * **Validates: Requirements 1.2**
 *
 * Pour N ∈ [2, 10] appels de `creerDepuisReservation()` sur la même réservation,
 * chaque appel doit retourner un contrat avec le même `statut`.
 *
 * Le statut initial `genere` ne doit jamais être réinitialisé par un appel
 * redondant.
 */
test('property 1 – N appels sur la même réservation retournent toujours le même statut', function () {
    $reservation  = makeReservationPourIdempotence();
    $service      = makeServicePourIdempotence();
    $n            = fake()->numberBetween(2, 10);

    $contratInitial = $service->creerDepuisReservation($reservation);
    $statutAttendu  = $contratInitial->statut;

    for ($i = 1; $i < $n; $i++) {
        $contrat = $service->creerDepuisReservation($reservation);

        expect($contrat->statut)->toBe($statutAttendu, sprintf(
            'L\'appel #%d a retourné le statut "%s" au lieu de "%s".',
            $i + 1,
            $contrat->statut,
            $statutAttendu,
        ));
    }
})->repeat(20);

// ── Property 1 : exactement 1 enregistrement en base après N appels ──────────

/**
 * **Validates: Requirements 1.2**
 *
 * Pour N ∈ [2, 10] appels de `creerDepuisReservation()` sur la même réservation,
 * la table `contrats` doit contenir exactement 1 enregistrement associé à
 * cette réservation, quelle que soit la valeur de N.
 *
 * C'est la vérification centrale de l'idempotence : aucun doublon ne doit
 * jamais être persisté en base de données.
 */
test('property 1 – exactement 1 enregistrement en base après N appels sur la même réservation', function () {
    $reservation = makeReservationPourIdempotence();
    $service     = makeServicePourIdempotence();
    $n           = fake()->numberBetween(2, 10);

    for ($i = 0; $i < $n; $i++) {
        $service->creerDepuisReservation($reservation);
    }

    $count = Contrat::where('id_reservation', $reservation->id)->count();

    expect($count)->toBe(1, sprintf(
        'Après %d appels de creerDepuisReservation(), la table contrats contient %d enregistrement(s) '
        . 'pour la réservation %d au lieu de 1 exactement.',
        $n,
        $count,
        $reservation->id,
    ));
})->repeat(20);

// ── Property 1 : réservations distinctes → contrats distincts ────────────────

/**
 * **Validates: Requirements 1.2**
 *
 * Corollaire de l'idempotence : deux réservations différentes doivent
 * produire deux contrats distincts (ids différents, numéros différents).
 *
 * Ce test vérifie que l'idempotence est bien ciblée par `id_reservation`
 * et n'empêche pas la création de contrats pour des réservations distinctes.
 */
test('property 1 – deux réservations distinctes produisent toujours deux contrats distincts', function () {
    $service      = makeServicePourIdempotence();
    $reservation1 = makeReservationPourIdempotence();
    $reservation2 = makeReservationPourIdempotence();

    $contrat1 = $service->creerDepuisReservation($reservation1);
    $contrat2 = $service->creerDepuisReservation($reservation2);

    expect($contrat1->id)->not->toBe($contrat2->id, sprintf(
        'Les réservations %d et %d ont produit le même contrat (id: %d).',
        $reservation1->id,
        $reservation2->id,
        $contrat1->id,
    ));

    expect($contrat1->numero_contrat)->not->toBe($contrat2->numero_contrat, sprintf(
        'Les réservations %d et %d partagent le même numero_contrat "%s".',
        $reservation1->id,
        $reservation2->id,
        $contrat1->numero_contrat,
    ));
})->repeat(20);
