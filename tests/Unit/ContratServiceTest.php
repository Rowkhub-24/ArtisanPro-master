<?php

use App\Contracts\PdfGeneratorServiceInterface;
use App\Models\Artisan;
use App\Models\Client;
use App\Models\Contrat;
use App\Models\Reservation;
use App\Models\User;
use App\Services\ContratService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crée un mock du PdfGeneratorServiceInterface qui retourne un chemin fictif.
 */
function makePdfGeneratorMock(string $cheminRetourne = 'contrats/1/brouillon.pdf'): PdfGeneratorServiceInterface
{
    $mock = Mockery::mock(PdfGeneratorServiceInterface::class);
    $mock->shouldReceive('genererBrouillon')
        ->andReturn($cheminRetourne)
        ->byDefault();
    $mock->shouldReceive('genererFinal')
        ->andReturn('contrats/1/final.pdf')
        ->byDefault();

    return $mock;
}

/**
 * Crée une réservation confirmée avec client et artisan associés (avec user liés).
 */
function makeReservationConfirmee(array $overrides = []): Reservation
{
    $userClient  = User::factory()->state(['type_utilisateur' => 'client', 'prenom' => 'Jean', 'nom' => 'Dupont'])->create();
    $userArtisan = User::factory()->state(['type_utilisateur' => 'artisan', 'prenom' => 'Pierre', 'nom' => 'Martin'])->create();

    $client  = Client::firstOrCreate(['id_utilisateur' => $userClient->id], ['telephone' => '+22997000001']);
    $artisan = Artisan::factory()->create(['id_utilisateur' => $userArtisan->id]);

    return Reservation::factory()->confirmee()->create(array_merge([
        'id_client'             => $client->id,
        'id_artisan'            => $artisan->id,
        'description_besoin'    => 'Réparation toiture urgente',
        'montant_total'         => 75000.00,
        'date_debut'            => now()->addDay(),
        'date_fin'              => now()->addDays(2),
        'adresse_intervention'  => '12 rue des Acacias, Cotonou',
    ], $overrides));
}

/**
 * Crée une instance du ContratService avec un mock PDF injecté.
 */
function makeContratService(?PdfGeneratorServiceInterface $pdfGenerator = null): ContratService
{
    return new ContratService($pdfGenerator ?? makePdfGeneratorMock());
}

// ─────────────────────────────────────────────────────────────────────────────
// creerDepuisReservation — création initiale
// ─────────────────────────────────────────────────────────────────────────────

test('creerDepuisReservation crée un nouveau contrat avec statut genere', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    expect($contrat)->toBeInstanceOf(Contrat::class)
        ->and($contrat->statut)->toBe(Contrat::STATUT_GENERE)
        ->and($contrat->id)->not->toBeNull();
});

test('creerDepuisReservation copie l\'id_reservation dans le snapshot', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    expect($contrat->id_reservation)->toBe($reservation->id);
});

test('creerDepuisReservation copie les ids client et artisan', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    expect($contrat->id_client)->toBe($reservation->id_client)
        ->and($contrat->id_artisan)->toBe($reservation->id_artisan);
});

test('creerDepuisReservation copie la description_prestation depuis description_besoin', function () {
    $reservation = makeReservationConfirmee(['description_besoin' => 'Travaux de plomberie spécifiques']);
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    expect($contrat->description_prestation)->toBe('Travaux de plomberie spécifiques');
});

test('creerDepuisReservation copie le montant_total', function () {
    $reservation = makeReservationConfirmee(['montant_total' => 50000.00]);
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    expect((float) $contrat->montant_total)->toBe(50000.00);
});

test('creerDepuisReservation copie date_debut_prestation depuis date_debut', function () {
    $dateDebut   = now()->addDays(3)->startOfMinute();
    $reservation = makeReservationConfirmee(['date_debut' => $dateDebut]);
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    expect($contrat->date_debut_prestation->timestamp)->toBe($dateDebut->timestamp);
});

test('creerDepuisReservation copie date_fin_prestation depuis date_fin', function () {
    $dateFin     = now()->addDays(5)->startOfMinute();
    $reservation = makeReservationConfirmee(['date_fin' => $dateFin]);
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    expect($contrat->date_fin_prestation->timestamp)->toBe($dateFin->timestamp);
});

test('creerDepuisReservation copie l\'adresse_intervention', function () {
    $reservation = makeReservationConfirmee(['adresse_intervention' => 'Quartier Haie Vive, Lot 45, Cotonou']);
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    expect($contrat->adresse_intervention)->toBe('Quartier Haie Vive, Lot 45, Cotonou');
});

test('creerDepuisReservation renseigne nom_client depuis le user associé', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    // Le nom doit être "prenom nom" du user client (non vide)
    expect($contrat->nom_client)->not->toBeEmpty();
    expect($contrat->nom_client)->toContain('Jean'); // prénom défini dans makeReservationConfirmee
});

test('creerDepuisReservation renseigne nom_artisan depuis le user associé', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    expect($contrat->nom_artisan)->not->toBeEmpty();
    expect($contrat->nom_artisan)->toContain('Pierre'); // prénom défini dans makeReservationConfirmee
});

test('creerDepuisReservation renseigne genere_at', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    expect($contrat->genere_at)->not->toBeNull();
});

// ─────────────────────────────────────────────────────────────────────────────
// creerDepuisReservation — idempotence
// ─────────────────────────────────────────────────────────────────────────────

test('creerDepuisReservation est idempotent : retourne le contrat existant au second appel', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat1 = $service->creerDepuisReservation($reservation);
    $contrat2 = $service->creerDepuisReservation($reservation);

    expect($contrat2->id)->toBe($contrat1->id);
});

test('creerDepuisReservation n\'insère qu\'un seul enregistrement en base malgré deux appels', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $service->creerDepuisReservation($reservation);
    $service->creerDepuisReservation($reservation);

    expect(Contrat::where('id_reservation', $reservation->id)->count())->toBe(1);
});

// ─────────────────────────────────────────────────────────────────────────────
// creerDepuisReservation — numérotation CP-YYYY-NNNNN
// ─────────────────────────────────────────────────────────────────────────────

test('creerDepuisReservation génère un numero_contrat au format CP-AAAA-NNNNN', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    expect($contrat->numero_contrat)->toMatch('/^CP-\d{4}-\d{5,}$/');
});

test('creerDepuisReservation inclut l\'année courante dans le numero_contrat', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    $annee = now()->year;
    expect($contrat->numero_contrat)->toContain("CP-{$annee}-");
});

test('creerDepuisReservation génère CP-AAAA-00001 pour le premier contrat de l\'année', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    $annee = now()->year;
    expect($contrat->numero_contrat)->toBe("CP-{$annee}-00001");
});

test('creerDepuisReservation incrémente le séquentiel pour chaque nouveau contrat', function () {
    $service = makeContratService();
    $annee   = now()->year;

    $contrat1 = $service->creerDepuisReservation(makeReservationConfirmee());
    $contrat2 = $service->creerDepuisReservation(makeReservationConfirmee());
    $contrat3 = $service->creerDepuisReservation(makeReservationConfirmee());

    expect($contrat1->numero_contrat)->toBe("CP-{$annee}-00001");
    expect($contrat2->numero_contrat)->toBe("CP-{$annee}-00002");
    expect($contrat3->numero_contrat)->toBe("CP-{$annee}-00003");
});

// ─────────────────────────────────────────────────────────────────────────────
// creerDepuisReservation — clauses litige par défaut
// ─────────────────────────────────────────────────────────────────────────────

test('creerDepuisReservation initialise les clauses_litige avec exactement 4 clauses', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    expect($contrat->clauses_litige)->toBeArray()
        ->toHaveCount(4);
});

test('creerDepuisReservation inclut la clause delai_reclamation', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    $ids = array_column($contrat->clauses_litige, 'id');
    expect($ids)->toContain('delai_reclamation');
});

test('creerDepuisReservation inclut la clause motifs_litige', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    $ids = array_column($contrat->clauses_litige, 'id');
    expect($ids)->toContain('motifs_litige');
});

test('creerDepuisReservation inclut la clause mediation', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    $ids = array_column($contrat->clauses_litige, 'id');
    expect($ids)->toContain('mediation');
});

test('creerDepuisReservation inclut la clause arbitrage_fonds', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    $ids = array_column($contrat->clauses_litige, 'id');
    expect($ids)->toContain('arbitrage_fonds');
});

test('chaque clause contient un id, un titre et un contenu', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contrat = $service->creerDepuisReservation($reservation);

    foreach ($contrat->clauses_litige as $clause) {
        expect($clause)->toHaveKey('id')
            ->toHaveKey('titre')
            ->toHaveKey('contenu');
        expect($clause['id'])->not->toBeEmpty();
        expect($clause['titre'])->not->toBeEmpty();
        expect($clause['contenu'])->not->toBeEmpty();
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// creerDepuisReservation — délégation PDF
// ─────────────────────────────────────────────────────────────────────────────

test('creerDepuisReservation appelle genererBrouillon sur le PdfGeneratorService', function () {
    $reservation = makeReservationConfirmee();

    $mockPdf = Mockery::mock(PdfGeneratorServiceInterface::class);
    $mockPdf->shouldReceive('genererBrouillon')
        ->once()
        ->andReturn('contrats/99/brouillon.pdf');

    $service = makeContratService($mockPdf);
    $service->creerDepuisReservation($reservation);
});

test('creerDepuisReservation persiste le chemin_pdf_brouillon retourné par le PdfGenerator', function () {
    $reservation = makeReservationConfirmee();

    $mockPdf = Mockery::mock(PdfGeneratorServiceInterface::class);
    $mockPdf->shouldReceive('genererBrouillon')
        ->once()
        ->andReturn('contrats/42/brouillon.pdf');

    $service = makeContratService($mockPdf);
    $contrat = $service->creerDepuisReservation($reservation);

    // Recharger depuis la base pour vérifier la persistance
    $contrat->refresh();
    expect($contrat->chemin_pdf_brouillon)->toBe('contrats/42/brouillon.pdf');
});

test('creerDepuisReservation ne propage pas l\'exception si genererBrouillon échoue', function () {
    $reservation = makeReservationConfirmee();

    $mockPdf = Mockery::mock(PdfGeneratorServiceInterface::class);
    $mockPdf->shouldReceive('genererBrouillon')
        ->andThrow(new \RuntimeException('PDF generation failed'));

    $service = makeContratService($mockPdf);

    // Ne doit pas lever d'exception
    $contrat = $service->creerDepuisReservation($reservation);

    expect($contrat)->toBeInstanceOf(Contrat::class)
        ->and($contrat->statut)->toBe(Contrat::STATUT_GENERE);
});

// ─────────────────────────────────────────────────────────────────────────────
// getContratPourReservation
// ─────────────────────────────────────────────────────────────────────────────

test('getContratPourReservation retourne null si aucun contrat n\'existe pour la réservation', function () {
    $service = makeContratService();

    $resultat = $service->getContratPourReservation(9999);

    expect($resultat)->toBeNull();
});

test('getContratPourReservation retourne le contrat correct pour une réservation existante', function () {
    $reservation = makeReservationConfirmee();
    $service     = makeContratService();

    $contratCree = $service->creerDepuisReservation($reservation);
    $contratTrouve = $service->getContratPourReservation($reservation->id);

    expect($contratTrouve)->not->toBeNull()
        ->and($contratTrouve->id)->toBe($contratCree->id);
});

test('getContratPourReservation retourne null pour un id_reservation d\'une autre réservation', function () {
    $reservation1 = makeReservationConfirmee();
    $reservation2 = makeReservationConfirmee();
    $service      = makeContratService();

    // Créer un contrat pour la réservation 1 seulement
    $service->creerDepuisReservation($reservation1);

    $resultat = $service->getContratPourReservation($reservation2->id);

    expect($resultat)->toBeNull();
});
