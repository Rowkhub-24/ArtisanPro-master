<?php

use App\Models\Contrat;
use App\Services\PdfGeneratorService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crée un modèle Contrat sans persistance en base (make, pas create).
 * On force un id et id_reservation pour construire les chemins attendus.
 */
function makeContratStub(int $id = 1, int $idReservation = 42): Contrat
{
    $contrat = new Contrat([
        'id_reservation'        => $idReservation,
        'id_client'             => 1,
        'id_artisan'            => 1,
        'numero_contrat'        => 'CP-2025-00001',
        'nom_client'            => 'Jean Dupont',
        'nom_artisan'           => 'Pierre Martin',
        'description_prestation' => 'Réparation toiture urgente',
        'montant_total'         => 75000.00,
        'date_debut_prestation' => now()->addDay(),
        'statut'                => Contrat::STATUT_GENERE,
        'clauses_litige'        => [],
        'genere_at'             => now(),
    ]);

    // Forcer l'id car le modèle n'est pas persisté
    $contrat->id = $id;

    return $contrat;
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup — Storage::fake() et mock du Pdf facade pour tous les tests
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(function () {
    Storage::fake('local');

    // Mocker la classe concrète Barryvdh\DomPDF\PDF pour respecter le type de retour
    // de loadView() — un mock générique serait rejeté par PHP (TypeError).
    $fakePdfInstance = Mockery::mock(\Barryvdh\DomPDF\PDF::class);
    $fakePdfInstance->shouldReceive('setPaper')->andReturnSelf();
    $fakePdfInstance->shouldReceive('output')->andReturn('%PDF-1.4 fake content');

    // Mocker la façade Pdf pour éviter toute vraie génération DomPDF
    Pdf::shouldReceive('loadView')
        ->andReturn($fakePdfInstance);
});

// ─────────────────────────────────────────────────────────────────────────────
// genererBrouillon — chemin retourné
// ─────────────────────────────────────────────────────────────────────────────

test('genererBrouillon retourne le chemin relatif contrats/{id_reservation}/brouillon.pdf', function () {
    $contrat = makeContratStub(id: 1, idReservation: 42);
    $service = new PdfGeneratorService();

    $chemin = $service->genererBrouillon($contrat);

    expect($chemin)->toBe('contrats/42/brouillon.pdf');
});

test('genererBrouillon retourne un chemin contenant l\'id_reservation du contrat', function () {
    $contrat = makeContratStub(id: 5, idReservation: 99);
    $service = new PdfGeneratorService();

    $chemin = $service->genererBrouillon($contrat);

    expect($chemin)->toContain('99')
        ->and($chemin)->toContain('brouillon.pdf');
});

test('genererBrouillon retourne un chemin correspondant au pattern contrats/{id}/brouillon.pdf', function () {
    $contrat = makeContratStub(id: 3, idReservation: 7);
    $service = new PdfGeneratorService();

    $chemin = $service->genererBrouillon($contrat);

    expect($chemin)->toMatch('/^contrats\/\d+\/brouillon\.pdf$/');
});

// ─────────────────────────────────────────────────────────────────────────────
// genererBrouillon — fichier stocké
// ─────────────────────────────────────────────────────────────────────────────

test('genererBrouillon stocke le fichier dans le storage', function () {
    $contrat = makeContratStub(id: 1, idReservation: 42);
    $service = new PdfGeneratorService();

    $chemin = $service->genererBrouillon($contrat);

    Storage::assertExists($chemin);
});

test('genererBrouillon crée le répertoire de stockage s\'il n\'existe pas', function () {
    $contrat = makeContratStub(id: 1, idReservation: 123);
    $service = new PdfGeneratorService();

    // Le répertoire n'existe pas avant l'appel
    Storage::assertMissing('contrats/123/brouillon.pdf');

    $service->genererBrouillon($contrat);

    Storage::assertExists('contrats/123/brouillon.pdf');
});

test('genererBrouillon stocke un contenu PDF non vide', function () {
    $contrat = makeContratStub(id: 1, idReservation: 42);
    $service = new PdfGeneratorService();

    $chemin = $service->genererBrouillon($contrat);

    $contenu = Storage::get($chemin);
    expect($contenu)->not->toBeEmpty();
});

// ─────────────────────────────────────────────────────────────────────────────
// genererFinal — chemin retourné
// ─────────────────────────────────────────────────────────────────────────────

test('genererFinal retourne le chemin relatif contrats/{id_reservation}/final.pdf', function () {
    $contrat = makeContratStub(id: 1, idReservation: 42);
    $service = new PdfGeneratorService();

    $chemin = $service->genererFinal($contrat);

    expect($chemin)->toBe('contrats/42/final.pdf');
});

test('genererFinal retourne un chemin contenant l\'id_reservation du contrat', function () {
    $contrat = makeContratStub(id: 5, idReservation: 99);
    $service = new PdfGeneratorService();

    $chemin = $service->genererFinal($contrat);

    expect($chemin)->toContain('99')
        ->and($chemin)->toContain('final.pdf');
});

test('genererFinal retourne un chemin correspondant au pattern contrats/{id}/final.pdf', function () {
    $contrat = makeContratStub(id: 3, idReservation: 7);
    $service = new PdfGeneratorService();

    $chemin = $service->genererFinal($contrat);

    expect($chemin)->toMatch('/^contrats\/\d+\/final\.pdf$/');
});

// ─────────────────────────────────────────────────────────────────────────────
// genererFinal — fichier stocké
// ─────────────────────────────────────────────────────────────────────────────

test('genererFinal stocke le fichier dans le storage', function () {
    $contrat = makeContratStub(id: 1, idReservation: 42);
    $service = new PdfGeneratorService();

    $chemin = $service->genererFinal($contrat);

    Storage::assertExists($chemin);
});

test('genererFinal crée le répertoire de stockage s\'il n\'existe pas', function () {
    $contrat = makeContratStub(id: 1, idReservation: 456);
    $service = new PdfGeneratorService();

    Storage::assertMissing('contrats/456/final.pdf');

    $service->genererFinal($contrat);

    Storage::assertExists('contrats/456/final.pdf');
});

test('genererFinal stocke un contenu PDF non vide', function () {
    $contrat = makeContratStub(id: 1, idReservation: 42);
    $service = new PdfGeneratorService();

    $chemin = $service->genererFinal($contrat);

    $contenu = Storage::get($chemin);
    expect($contenu)->not->toBeEmpty();
});

// ─────────────────────────────────────────────────────────────────────────────
// Isolation entre brouillon et final — même réservation
// ─────────────────────────────────────────────────────────────────────────────

test('genererBrouillon et genererFinal produisent des fichiers distincts pour la même réservation', function () {
    $contrat = makeContratStub(id: 1, idReservation: 42);
    $service = new PdfGeneratorService();

    $cheminBrouillon = $service->genererBrouillon($contrat);
    $cheminFinal     = $service->genererFinal($contrat);

    expect($cheminBrouillon)->not->toBe($cheminFinal);
    Storage::assertExists($cheminBrouillon);
    Storage::assertExists($cheminFinal);
});

// ─────────────────────────────────────────────────────────────────────────────
// Cohérence du chemin stocké vs id_reservation du contrat
// ─────────────────────────────────────────────────────────────────────────────

test('le chemin retourné par genererBrouillon correspond exactement au fichier stocké', function () {
    $contrat = makeContratStub(id: 2, idReservation: 77);
    $service = new PdfGeneratorService();

    $chemin = $service->genererBrouillon($contrat);

    // Le chemin retourné doit être celui du fichier réellement créé
    Storage::assertExists($chemin);
    expect($chemin)->toBe("contrats/77/brouillon.pdf");
});

test('le chemin retourné par genererFinal correspond exactement au fichier stocké', function () {
    $contrat = makeContratStub(id: 2, idReservation: 77);
    $service = new PdfGeneratorService();

    $chemin = $service->genererFinal($contrat);

    Storage::assertExists($chemin);
    expect($chemin)->toBe("contrats/77/final.pdf");
});
