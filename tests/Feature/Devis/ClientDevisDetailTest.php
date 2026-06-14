<?php

// tests/Feature/Devis/ClientDevisDetailTest.php
//
// Task 3.6 — Tests d'intégration Feature pour ClientDevisDetailController
// Valide : Requirements 6.1, 6.4

use App\Models\Artisan;
use App\Models\Client;
use App\Models\Devis;
use App\Models\DevisMateriel;
use App\Models\User;

// ─── Helper (réutilise makeDevisEnAttente si disponible, sinon redéfinit) ──────

function makeClientDevis(string $statut = 'en_attente', array $devisAttrs = []): array
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
        'description_travaux' => 'Rénovation cuisine',
        'date_demande'        => now(),
        'statut'              => $statut,
    ], $devisAttrs));

    return compact('devis', 'clientUser', 'artisanUser', 'client', 'artisan');
}

// ─── Accès autorisé ──────────────────────────────────────────────────────────

test('GET client/devis/{id} retourne 200 pour le client propriétaire', function () {
    ['devis' => $devis, 'clientUser' => $clientUser] = makeClientDevis('accepte');

    $this->actingAs($clientUser)
        ->get(route('client.devis.show', $devis->id))
        ->assertStatus(200);
});

test('GET client/devis/{id} retourne les matériels avec sous_total_materiels', function () {
    ['devis' => $devis, 'clientUser' => $clientUser] = makeClientDevis('accepte', [
        'sous_total_materiels' => 7500.00,
    ]);

    DevisMateriel::create([
        'id_devis' => $devis->id, 'nom' => 'Carrelage', 'quantite' => 3,
        'unite' => 'm²', 'prix_unitaire' => 2500, 'ordre' => 0,
    ]);

    $response = $this->actingAs($clientUser)
        ->get(route('client.devis.show', $devis->id))
        ->assertStatus(200);

    $props = $response->original->getData()['page']['props'];
    expect($props['devis']['materiels'])->toHaveCount(1);
    expect($props['devis']['materiels'][0]['nom'])->toBe('Carrelage');
    expect($props['devis']['sous_total_materiels'])->not->toBeNull();
});

test('GET client/devis/{id} retourne les matériels triés par ordre croissant', function () {
    ['devis' => $devis, 'clientUser' => $clientUser] = makeClientDevis('accepte');

    // Insérer dans l'ordre inversé
    DevisMateriel::create(['id_devis' => $devis->id, 'nom' => 'C', 'quantite' => 1, 'unite' => 'u', 'prix_unitaire' => 100, 'ordre' => 2]);
    DevisMateriel::create(['id_devis' => $devis->id, 'nom' => 'A', 'quantite' => 1, 'unite' => 'u', 'prix_unitaire' => 100, 'ordre' => 0]);
    DevisMateriel::create(['id_devis' => $devis->id, 'nom' => 'B', 'quantite' => 1, 'unite' => 'u', 'prix_unitaire' => 100, 'ordre' => 1]);

    $response = $this->actingAs($clientUser)
        ->get(route('client.devis.show', $devis->id))
        ->assertStatus(200);

    $props = $response->original->getData()['page']['props'];
    $noms  = array_column($props['devis']['materiels'], 'nom');
    expect($noms)->toBe(['A', 'B', 'C']);
});

// ─── Accès refusé ─────────────────────────────────────────────────────────────

test('GET client/devis/{id} retourne 403 pour un autre client', function () {
    ['devis' => $devis] = makeClientDevis();

    // Autre client
    $autreUser = User::factory()->create(['type_utilisateur' => 'client']);
    Client::factory()->create(['id_utilisateur' => $autreUser->id]);

    $this->actingAs($autreUser)
        ->get(route('client.devis.show', $devis->id))
        ->assertStatus(403);
});

test('GET client/devis/{id} redirige vers login pour un visiteur non authentifié', function () {
    ['devis' => $devis] = makeClientDevis();

    $this->get(route('client.devis.show', $devis->id))
        ->assertRedirect(route('login'));
});
