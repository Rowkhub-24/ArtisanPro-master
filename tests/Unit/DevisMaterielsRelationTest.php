<?php

// tests/Unit/DevisMaterielsRelationTest.php
//
// Task 1.5 — Relation Devis::materiels() triée par ordre croissant
// Valide : Requirements 3.6

use App\Models\Artisan;
use App\Models\Client;
use App\Models\Devis;
use App\Models\DevisMateriel;
use App\Models\User;

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeDevis(): Devis
{
    $clientUser  = User::factory()->create(['type_utilisateur' => 'client']);
    $artisanUser = User::factory()->create(['type_utilisateur' => 'artisan']);
    $artisan     = Artisan::factory()->create(['id_utilisateur' => $artisanUser->id]);

    // Use the auto-created client (UserFactory afterCreating hook handles this for 'client' users)
    $client = $clientUser->client;

    return Devis::create([
        'id_client'          => $client->id,
        'id_artisan'         => $artisan->id,
        'description_travaux'=> 'Test',
        'date_demande'       => now(),
        'statut'             => 'en_attente',
    ]);
}

function addLigne(Devis $devis, int $ordre, string $nom = 'Matériel'): DevisMateriel
{
    return DevisMateriel::create([
        'id_devis'      => $devis->id,
        'nom'           => $nom,
        'quantite'      => 1,
        'unite'         => 'u',
        'prix_unitaire' => 100,
        'ordre'         => $ordre,
    ]);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('materiels() retourne les lignes triées par ordre croissant (insertion dans le désordre)', function () {
    $devis = makeDevis();

    // Insérer intentionnellement dans l'ordre inversé
    addLigne($devis, 2, 'Troisième');
    addLigne($devis, 0, 'Premier');
    addLigne($devis, 1, 'Deuxième');

    $noms = $devis->materiels()->pluck('nom')->toArray();

    expect($noms)->toBe(['Premier', 'Deuxième', 'Troisième']);
});

test('materiels() retourne une collection vide si aucun matériel', function () {
    $devis = makeDevis();

    expect($devis->materiels)->toHaveCount(0);
});

test('materiels() retourne une seule ligne si un seul matériel', function () {
    $devis = makeDevis();
    addLigne($devis, 0, 'Ciment');

    expect($devis->materiels)->toHaveCount(1);
    expect($devis->materiels->first()->nom)->toBe('Ciment');
});

test('materiels() tri stable : lignes avec le même ordre gardent leur ordre d\'insertion', function () {
    $devis = makeDevis();

    addLigne($devis, 0, 'A');
    addLigne($devis, 1, 'B');
    addLigne($devis, 2, 'C');

    $ordres = $devis->materiels()->pluck('ordre')->toArray();

    expect($ordres)->toBe([0, 1, 2]);
});
