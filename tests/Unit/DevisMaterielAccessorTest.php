<?php

// tests/Unit/DevisMaterielAccessorTest.php
//
// Task 1.4 — Propriété 1 : Calcul du sous-total d'une ligne (DevisMateriel::getSousTotalAttribute)
// Valide : Requirements 1.3, 4.3

use App\Models\DevisMateriel;

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Instancie un DevisMateriel en mémoire (sans persistance) avec les valeurs données.
 */
function makeLigne(float $quantite, float $prixUnitaire): DevisMateriel
{
    $m = new DevisMateriel();
    $m->quantite      = $quantite;
    $m->prix_unitaire = $prixUnitaire;
    return $m;
}

// ─── Cas de base ──────────────────────────────────────────────────────────────

test('sous_total = quantite × prix_unitaire arrondi à 2 décimales (cas nominal)', function () {
    $m = makeLigne(3.0, 5000.0);
    expect($m->sous_total)->toBe(round(3.0 * 5000.0, 2));
});

test('sous_total avec quantité décimale 2.5', function () {
    $m = makeLigne(2.5, 1200.0);
    expect($m->sous_total)->toBe(round(2.5 * 1200.0, 2));
});

test('sous_total avec prix_unitaire à 0 vaut 0', function () {
    $m = makeLigne(10.0, 0.0);
    expect($m->sous_total)->toBe(0.0);
});

test('sous_total avec prix très petit (0.01)', function () {
    $m = makeLigne(100.0, 0.01);
    expect($m->sous_total)->toBe(round(100.0 * 0.01, 2));
});

test('sous_total avec quantité très petite (0.001)', function () {
    $m = makeLigne(0.001, 99999.0);
    expect($m->sous_total)->toBe(round(0.001 * 99999.0, 2));
});

test('sous_total avec grandes valeurs (9999999 × 99999999.99)', function () {
    $m = makeLigne(9999999.0, 99999999.99);
    expect($m->sous_total)->toBe(round(9999999.0 * 99999999.99, 2));
});

// ─── Propriété : arrondi à 2 décimales pour éviter le drift flottant ──────────

test('sous_total est toujours arrondi à exactement 2 décimales', function (float $q, float $p) {
    $m = makeLigne($q, $p);
    $result = $m->sous_total;
    // Vérifie que result == round(result, 2)
    expect($result)->toBe(round($result, 2));
})->with([
    [1.1,   1.1],   // produit avec drift flottant connu
    [2.5,   1.3],
    [0.333, 3.0],
    [7.777, 0.1],
]);
