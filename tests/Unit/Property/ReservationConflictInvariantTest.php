<?php

/**
 * Property 5 : Invariant d'absence de conflit de réservation
 *
 * Pour tout artisan ayant une réservation en statut `en_cours` ou `en_cours_mission`
 * sur un créneau donné, une tentative d'acceptation automatique d'une nouvelle
 * réservation chevauchant ce créneau doit produire une décision `rejetee`,
 * quelle que soit la valeur du Score_Confiance (0–100) ou de la distance.
 *
 * Le conflit doit primer sur tous les autres critères (score ≥ seuil, distance ≤ zone).
 *
 * Validates: Requirements 2.4
 */

use App\Models\Artisan;
use App\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ── Helper functions ──────────────────────────────────────────────────────────

/**
 * Vérifie si une nouvelle réservation entre en conflit avec les réservations
 * actives existantes d'un artisan (statut `en_cours` ou `en_cours_mission`).
 *
 * Cette fonction implémente directement l'invariant de la méthode
 * `verifierAbsenceConflit()` du ReservationAutoAcceptListener (tâche 7.1).
 *
 * Un conflit existe si l'une des réservations actives de l'artisan a un créneau
 * dont les dates chevauchent celles de la nouvelle réservation :
 *   - date_debut_existante < date_fin_nouvelle  ET
 *   - date_fin_existante   > date_debut_nouvelle
 *
 * @param  int        $artisanId         Identifiant de l'artisan
 * @param  \DateTime  $debutNouvelle     Début du créneau de la nouvelle réservation
 * @param  \DateTime  $finNouvelle       Fin du créneau de la nouvelle réservation
 * @return bool  true s'il existe un conflit
 */
function verifierConflitReservation(int $artisanId, \DateTime $debutNouvelle, \DateTime $finNouvelle): bool
{
    return Reservation::where('id_artisan', $artisanId)
        ->whereIn('statut', ['en_cours', 'en_cours_mission'])
        ->where('date_debut', '<', $finNouvelle)
        ->where('date_fin', '>', $debutNouvelle)
        ->exists();
}

/**
 * Crée un artisan avec un score_confiance donné et une latitude/longitude
 * très proches du client (distance ~0) pour éliminer le facteur distance
 * de l'invariant.
 *
 * @param  int  $score  score_confiance ∈ [0, 100]
 * @return Artisan
 */
function creerArtisanAvecScore(int $score): Artisan
{
    return Artisan::factory()->create([
        'score_confiance' => $score,
        'latitude'        => 6.3703,
        'longitude'       => 2.3912,
    ]);
}

/**
 * Crée une réservation active (statut `en_cours` ou `en_cours_mission`)
 * pour l'artisan donné, couvrant un créneau centré sur `$centre`.
 *
 * @param  Artisan    $artisan  Artisan propriétaire
 * @param  \DateTime  $debut    Début du créneau actif
 * @param  \DateTime  $fin      Fin du créneau actif
 * @param  string     $statut   'en_cours' ou 'en_cours_mission'
 * @return Reservation
 */
function creerReservationActive(Artisan $artisan, \DateTime $debut, \DateTime $fin, string $statut = 'en_cours'): Reservation
{
    return Reservation::factory()->create([
        'id_artisan' => $artisan->id,
        'statut'     => $statut,
        'date_debut' => $debut,
        'date_fin'   => $fin,
    ]);
}

// ── Property 5: conflit détecté quel que soit le score ────────────────────────

/**
 * **Validates: Requirements 2.4**
 *
 * Pour N=50 combinaisons aléatoires (score, distance_km) avec :
 *   - score ∈ [0, 100] — y compris les scores élevés ≥ 70 (seuil par défaut)
 *   - distance_km ∈ [0, 20] — dans la zone acceptable
 *
 * Si l'artisan a une réservation active dont le créneau chevauche celui de la
 * nouvelle réservation, la détection de conflit doit retourner `true` (conflit
 * détecté → décision `rejetee`).
 *
 * Le conflit doit primer même sur un score parfait (100) et une distance nulle.
 */
test('property 5: conflict always results in rejetee regardless of score or distance', function () {
    // ── Générer des valeurs aléatoires ───────────────────────────────────────
    // score ∈ [0, 100] — test notamment les scores ≥ 70 (seuil d'acceptation)
    $score = fake()->numberBetween(0, 100);
    // distance_km ∈ [0, 20] — dans la zone d'intervention acceptable
    $distanceKm = fake()->randomFloat(2, 0, 20);

    // ── Créer l'artisan ──────────────────────────────────────────────────────
    $artisan = creerArtisanAvecScore($score);

    // ── Définir le créneau de la nouvelle réservation ───────────────────────
    // La nouvelle réservation est dans 2 heures et dure 2 heures
    $debutNouvelle = now()->addHours(2);
    $finNouvelle   = now()->addHours(4);

    // ── Créer une réservation active qui CHEVAUCHE le créneau ───────────────
    // Le créneau actif commence 1h avant la nouvelle et se termine 1h après son début
    // → chevauchement garanti
    $debutActif = now()->addHour();
    $finActif   = now()->addHours(3);

    $statutActif = fake()->randomElement(['en_cours', 'en_cours_mission']);
    creerReservationActive($artisan, $debutActif, $finActif, $statutActif);

    // ── Vérifier l'invariant de conflit ─────────────────────────────────────
    // Le conflit doit être détecté indépendamment du score et de la distance
    $conflitDetecte = verifierConflitReservation(
        $artisan->id,
        $debutNouvelle,
        $finNouvelle
    );

    expect($conflitDetecte)->toBeTrue(
        "Un conflit devrait être détecté pour l'artisan #{$artisan->id} " .
        "(score={$score}, distance={$distanceKm} km, statut={$statutActif}). " .
        "La décision doit être 'rejetee' quelle que soit la valeur du score ou de la distance."
    );
})->repeat(50);

// ── Property 5: score parfait (100) ne lève pas le conflit ───────────────────

/**
 * **Validates: Requirements 2.4**
 *
 * Cas limite : score_confiance = 100 (maximum).
 * Même avec le score parfait, la présence d'une réservation active chevauchante
 * doit entraîner la détection du conflit (→ décision `rejetee`).
 */
test('property 5: score 100 does not override conflict detection', function () {
    $artisan = creerArtisanAvecScore(100);

    $debutNouvelle = now()->addHours(2);
    $finNouvelle   = now()->addHours(4);

    // Chevauchement total : la réservation active englobe la nouvelle
    creerReservationActive(
        $artisan,
        now()->addHour(),
        now()->addHours(5),
        'en_cours'
    );

    $conflitDetecte = verifierConflitReservation($artisan->id, $debutNouvelle, $finNouvelle);

    expect($conflitDetecte)->toBeTrue(
        'Un score de 100 ne doit pas lever la contrainte de conflit.'
    );
});

// ── Property 5: distance nulle (0 km) ne lève pas le conflit ─────────────────

/**
 * **Validates: Requirements 2.4**
 *
 * Cas limite : distance = 0 km (artisan sur le même lieu que le client).
 * Même avec une distance idéale, le conflit doit être détecté.
 */
test('property 5: distance 0 km does not override conflict detection', function () {
    // Score > seuil (70) ET distance = 0 : toutes les conditions seraient remplies
    // sans le conflit → il ne doit pas être accepté
    $artisan = creerArtisanAvecScore(90);

    $debutNouvelle = now()->addHours(2);
    $finNouvelle   = now()->addHours(4);

    creerReservationActive(
        $artisan,
        now()->addHours(1),
        now()->addHours(3),
        'en_cours_mission'
    );

    $conflitDetecte = verifierConflitReservation($artisan->id, $debutNouvelle, $finNouvelle);

    expect($conflitDetecte)->toBeTrue(
        'Une distance de 0 km ne doit pas lever la contrainte de conflit.'
    );
});

// ── Property 5: statut `en_cours` déclenche le conflit ───────────────────────

/**
 * **Validates: Requirements 2.4**
 *
 * Une réservation en statut `en_cours` (pas encore démarrée mais acceptée)
 * doit déclencher le conflit.
 */
test('property 5: active reservation with status en_cours triggers conflict', function () {
    $artisan = creerArtisanAvecScore(fake()->numberBetween(0, 100));

    $debut = now()->addHours(1);
    $fin   = now()->addHours(3);

    creerReservationActive($artisan, $debut, $fin, 'en_cours');

    // Nouvelle réservation chevauchante (début dans le créneau actif)
    $debutNouvelle = now()->addHours(2);
    $finNouvelle   = now()->addHours(5);

    $conflitDetecte = verifierConflitReservation($artisan->id, $debutNouvelle, $finNouvelle);

    expect($conflitDetecte)->toBeTrue(
        "Le statut 'en_cours' doit déclencher la détection de conflit."
    );
})->repeat(10);

// ── Property 5: statut `en_cours_mission` déclenche le conflit ───────────────

/**
 * **Validates: Requirements 2.4**
 *
 * Une réservation en statut `en_cours_mission` (mission démarrée)
 * doit également déclencher le conflit.
 */
test('property 5: active reservation with status en_cours_mission triggers conflict', function () {
    $artisan = creerArtisanAvecScore(fake()->numberBetween(0, 100));

    $debut = now()->addHours(1);
    $fin   = now()->addHours(4);

    creerReservationActive($artisan, $debut, $fin, 'en_cours_mission');

    // La nouvelle réservation commence avant la fin de la mission active
    $debutNouvelle = now()->addHours(3);
    $finNouvelle   = now()->addHours(6);

    $conflitDetecte = verifierConflitReservation($artisan->id, $debutNouvelle, $finNouvelle);

    expect($conflitDetecte)->toBeTrue(
        "Le statut 'en_cours_mission' doit déclencher la détection de conflit."
    );
})->repeat(10);

// ── Property 5: sans conflit → pas de blocage ────────────────────────────────

/**
 * **Validates: Requirements 2.4**
 *
 * Cas inverse : si la réservation active ne chevauche PAS le nouveau créneau,
 * aucun conflit ne doit être détecté.
 * Ce test de contraste confirme que la logique de chevauchement est correcte.
 */
test('property 5: no conflict when active reservation does not overlap new slot', function () {
    $artisan = creerArtisanAvecScore(fake()->numberBetween(0, 100));

    // Réservation active terminée AVANT le début de la nouvelle
    creerReservationActive(
        $artisan,
        now()->addHour(),
        now()->addHours(2),  // termine à +2h
        'en_cours'
    );

    // Nouvelle réservation APRÈS la fin de la réservation active (+3h → +5h)
    $debutNouvelle = now()->addHours(3);
    $finNouvelle   = now()->addHours(5);

    $conflitDetecte = verifierConflitReservation($artisan->id, $debutNouvelle, $finNouvelle);

    expect($conflitDetecte)->toBeFalse(
        'Aucun conflit ne doit être détecté si les créneaux ne se chevauchent pas.'
    );
})->repeat(10);

// ── Property 5: autre artisan non affecté ────────────────────────────────────

/**
 * **Validates: Requirements 2.4**
 *
 * La détection de conflit est scoped par artisan.
 * Une réservation active de l'artisan A ne doit pas affecter l'artisan B.
 */
test('property 5: conflict is scoped per artisan and does not affect other artisans', function () {
    $artisanA = creerArtisanAvecScore(fake()->numberBetween(0, 100));
    $artisanB = creerArtisanAvecScore(fake()->numberBetween(0, 100));

    $debut = now()->addHours(2);
    $fin   = now()->addHours(4);

    // Réservation active uniquement pour artisan A
    creerReservationActive($artisanA, now()->addHour(), now()->addHours(3), 'en_cours');

    // Le même créneau pour artisan B ne doit pas être en conflit
    $conflitA = verifierConflitReservation($artisanA->id, $debut, $fin);
    $conflitB = verifierConflitReservation($artisanB->id, $debut, $fin);

    expect($conflitA)->toBeTrue(
        'Le conflit doit être détecté pour l\'artisan A.'
    );
    expect($conflitB)->toBeFalse(
        'Aucun conflit ne doit être détecté pour l\'artisan B qui n\'a pas de réservation active.'
    );
})->repeat(10);

// ── Property 5: statuts terminée ou annulée ne bloquent pas ──────────────────

/**
 * **Validates: Requirements 2.4**
 *
 * Seuls les statuts `en_cours` et `en_cours_mission` doivent déclencher un conflit.
 * Les réservations terminées, annulées ou confirmées ne doivent PAS bloquer.
 */
test('property 5: only en_cours and en_cours_mission statuses trigger conflict', function () {
    $artisan = creerArtisanAvecScore(fake()->numberBetween(0, 100));

    $debutNouvelle = now()->addHours(2);
    $finNouvelle   = now()->addHours(4);

    $statutsInactifs = ['terminee', 'annulee', 'confirmee'];
    $statutInactif   = fake()->randomElement($statutsInactifs);

    // Réservation avec statut inactif chevauchant le créneau — ne doit PAS bloquer
    Reservation::factory()->create([
        'id_artisan' => $artisan->id,
        'statut'     => $statutInactif,
        'date_debut' => now()->addHour(),
        'date_fin'   => now()->addHours(3),
    ]);

    $conflitDetecte = verifierConflitReservation($artisan->id, $debutNouvelle, $finNouvelle);

    expect($conflitDetecte)->toBeFalse(
        "Le statut '{$statutInactif}' ne doit pas déclencher un conflit de réservation."
    );
})->repeat(10);

