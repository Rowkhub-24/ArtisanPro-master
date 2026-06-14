<?php

// tests/Feature/Devis/ArtisanDevisRepondreTest.php
//
// Task 2.6 — Tests d'intégration Feature pour ArtisanDevisRepondreController
// Valide : Requirements 2.4, 2.5, 3.1, 3.3, 3.5, 4.4, 5.1, 5.2

use App\Models\Artisan;
use App\Models\Client;
use App\Models\Devis;
use App\Models\DevisMateriel;
use App\Models\User;

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Crée artisan + client + devis en attente, retourne tout.
 *
 * @return array{devis: Devis, artisanUser: User, artisan: Artisan, clientUser: User, client: Client}
 */
function makeDevisEnAttente(array $devisAttrs = []): array
{
    $artisanUser = User::factory()->create(['type_utilisateur' => 'artisan']);
    // UserFactory auto-creates a Client record via afterCreating hook for 'client' users
    $clientUser  = User::factory()->create(['type_utilisateur' => 'client']);
    $artisan     = Artisan::factory()->create(['id_utilisateur' => $artisanUser->id]);

    // Use the auto-created client (created by UserFactory afterCreating hook)
    $client = $clientUser->client;

    $devis = Devis::create(array_merge([
        'id_client'           => $client->id,
        'id_artisan'          => $artisan->id,
        'description_travaux' => 'Travaux de plomberie',
        'date_demande'        => now(),
        'statut'              => 'en_attente',
    ], $devisAttrs));

    return compact('devis', 'artisanUser', 'artisan', 'clientUser', 'client');
}

function patchRepondre($test, Devis $devis, array $data): \Illuminate\Testing\TestResponse
{
    return $test->patch(route('artisan.devis.repondre', $devis->id), $data);
}

function lignesValides(int $count = 2): array
{
    $lignes = [];
    for ($i = 0; $i < $count; $i++) {
        $lignes[] = [
            'nom'           => "Matériel $i",
            'quantite'      => 2.5,
            'unite'         => 'kg',
            'prix_unitaire' => 1000.0,
        ];
    }
    return $lignes;
}

// ─── Cas nominal ──────────────────────────────────────────────────────────────

test('PATCH repondre crée les lignes en BDD et calcule sous_total_materiels correctement', function () {
    ['devis' => $devis, 'artisanUser' => $artisanUser] = makeDevisEnAttente();

    $this->actingAs($artisanUser)->patch(
        route('artisan.devis.repondre', $devis->id),
        [
            'montant_propose' => 10000,
            'materiels' => [
                ['nom' => 'Ciment', 'quantite' => 3,   'unite' => 'sacs', 'prix_unitaire' => 2000],
                ['nom' => 'Sable',  'quantite' => 1.5, 'unite' => 'm³',   'prix_unitaire' => 5000],
            ],
        ]
    )->assertRedirect();

    // 2 lignes créées
    expect(DevisMateriel::where('id_devis', $devis->id)->count())->toBe(2);

    // sous_total_materiels = (3 × 2000) + (1.5 × 5000) = 6000 + 7500 = 13500
    $devis->refresh();
    expect((float) $devis->sous_total_materiels)->toBe(13500.0);
    expect($devis->statut)->toBe('accepte');
});

test('PATCH repondre avec liste vide fixe sous_total_materiels à 0 et supprime les anciennes lignes', function () {
    ['devis' => $devis, 'artisanUser' => $artisanUser] = makeDevisEnAttente();

    // Pré-insérer une ligne existante
    DevisMateriel::create([
        'id_devis' => $devis->id, 'nom' => 'Ancien', 'quantite' => 1,
        'unite' => 'u', 'prix_unitaire' => 500, 'ordre' => 0,
    ]);

    $this->actingAs($artisanUser)->patch(
        route('artisan.devis.repondre', $devis->id),
        ['montant_propose' => 5000, 'materiels' => []]
    )->assertRedirect();

    expect(DevisMateriel::where('id_devis', $devis->id)->count())->toBe(0);

    $devis->refresh();
    expect((float) $devis->sous_total_materiels)->toBe(0.0);
});

test('PATCH repondre remplace complètement les lignes existantes (idempotence du remplacement)', function () {
    ['devis' => $devis, 'artisanUser' => $artisanUser] = makeDevisEnAttente();

    $payload = [
        'montant_propose' => 8000,
        'materiels' => [
            ['nom' => 'Fer', 'quantite' => 2, 'unite' => 'barres', 'prix_unitaire' => 3000],
        ],
    ];

    // Soumettre deux fois
    $this->actingAs($artisanUser)->patch(route('artisan.devis.repondre', $devis->id), $payload);

    // Le devis est maintenant 'accepte', pas 'en_attente' — on le remet pour le 2e appel
    $devis->update(['statut' => 'en_attente']);

    $this->actingAs($artisanUser)->patch(route('artisan.devis.repondre', $devis->id), $payload);

    // Exactement 1 ligne (pas d'accumulation)
    expect(DevisMateriel::where('id_devis', $devis->id)->count())->toBe(1);

    $devis->refresh();
    expect((float) $devis->sous_total_materiels)->toBe(6000.0);
});

// ─── Validation — limites ─────────────────────────────────────────────────────
// Inertia redirects on validation failure; we assert via session errors instead.

test('PATCH repondre avec 51 lignes est rejeté par la validation', function () {
    ['devis' => $devis, 'artisanUser' => $artisanUser] = makeDevisEnAttente();

    $this->actingAs($artisanUser)->patch(
        route('artisan.devis.repondre', $devis->id),
        ['montant_propose' => 1000, 'materiels' => lignesValides(51)]
    )->assertSessionHasErrors(['materiels']);

    // Aucune ligne insérée
    expect(DevisMateriel::where('id_devis', $devis->id)->count())->toBe(0);
});

test('PATCH repondre avec nom vide est rejeté par la validation sans modifier la base', function () {
    ['devis' => $devis, 'artisanUser' => $artisanUser] = makeDevisEnAttente();

    $this->actingAs($artisanUser)->patch(
        route('artisan.devis.repondre', $devis->id),
        [
            'montant_propose' => 1000,
            'materiels' => [
                ['nom' => '', 'quantite' => 1, 'unite' => 'u', 'prix_unitaire' => 100],
            ],
        ]
    )->assertSessionHasErrors(['materiels.0.nom']);

    expect(DevisMateriel::where('id_devis', $devis->id)->count())->toBe(0);
});

test('PATCH repondre avec quantite ≤ 0 est rejeté par la validation', function () {
    ['devis' => $devis, 'artisanUser' => $artisanUser] = makeDevisEnAttente();

    $this->actingAs($artisanUser)->patch(
        route('artisan.devis.repondre', $devis->id),
        [
            'montant_propose' => 1000,
            'materiels' => [
                ['nom' => 'Test', 'quantite' => 0, 'unite' => 'u', 'prix_unitaire' => 100],
            ],
        ]
    )->assertSessionHasErrors(['materiels.0.quantite']);
});

test('PATCH repondre avec prix_unitaire négatif est rejeté par la validation', function () {
    ['devis' => $devis, 'artisanUser' => $artisanUser] = makeDevisEnAttente();

    $this->actingAs($artisanUser)->patch(
        route('artisan.devis.repondre', $devis->id),
        [
            'montant_propose' => 1000,
            'materiels' => [
                ['nom' => 'Test', 'quantite' => 1, 'unite' => 'u', 'prix_unitaire' => -1],
            ],
        ]
    )->assertSessionHasErrors(['materiels.0.prix_unitaire']);
});

// ─── Contrôle d'accès ─────────────────────────────────────────────────────────

test('PATCH repondre par un artisan non propriétaire retourne HTTP 403 sans modifier les données', function () {
    ['devis' => $devis] = makeDevisEnAttente();

    // Autre artisan
    $autreUser    = User::factory()->create(['type_utilisateur' => 'artisan']);
    Artisan::factory()->create(['id_utilisateur' => $autreUser->id]);

    $this->actingAs($autreUser)->patch(
        route('artisan.devis.repondre', $devis->id),
        ['montant_propose' => 1000, 'materiels' => []]
    )->assertStatus(403);

    $devis->refresh();
    expect($devis->statut)->toBe('en_attente');
});

test('PATCH repondre sur un devis déjà accepte retourne HTTP 403', function () {
    ['devis' => $devis, 'artisanUser' => $artisanUser] = makeDevisEnAttente(['statut' => 'accepte']);

    $this->actingAs($artisanUser)->patch(
        route('artisan.devis.repondre', $devis->id),
        ['montant_propose' => 1000, 'materiels' => []]
    )->assertStatus(403);
});
