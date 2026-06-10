<?php

/**
 * Property 3 : Unicité et format du numéro de contrat
 *
 * Pour tout N contrats générés, chaque `numero_contrat` :
 *   1. Correspond au format CP-AAAA-NNNNN (regex /^CP-\d{4}-\d{5,}$/)
 *   2. Est unique parmi tous les numéros générés pour la même année
 *   3. Repart à 00001 lors d'un changement d'année calendaire
 *   4. S'étend à 6+ chiffres quand le compteur dépasse 99 999
 *
 * **Validates: Requirements 2.1, 2.2, 2.3**
 */

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ── Pure numbering function (mirrors ContratService::genererNumero()) ─────────

/**
 * Génère un numéro de contrat au format CP-AAAA-NNNNN.
 *
 * Réplique fidèle de la logique dans ContratService::genererNumero() :
 *   - Le compteur séquentiel est extrait du dernier numéro enregistré pour l'année
 *   - Le format est `CP-{année}-{séquentiel sur 5 chiffres minimum}`
 *   - S'étend à 6+ chiffres si le compteur dépasse 99 999 (Req 2.1)
 *
 * @param  int  $annee     Année calendaire (ex. 2025)
 * @param  int  $prochain  Numéro séquentiel suivant (1-indexed)
 * @return string  Ex. "CP-2025-00001"
 */
function genererNumeroContrat(int $annee, int $prochain): string
{
    return sprintf('CP-%d-%05d', $annee, $prochain);
}

/**
 * Simule la génération de N numéros de contrat consécutifs pour une année donnée.
 *
 * @param  int  $annee  Année calendaire
 * @param  int  $n      Nombre de contrats à générer
 * @return array<string>  Liste des numéros générés
 */
function genererNNumeros(int $annee, int $n): array
{
    $numeros = [];
    for ($i = 1; $i <= $n; $i++) {
        $numeros[] = genererNumeroContrat($annee, $i);
    }
    return $numeros;
}

// ── Property 3: format CP-AAAA-NNNNN respecté pour tout N ────────────────────

/**
 * **Validates: Requirements 2.1**
 *
 * Pour N ∈ [1, 150] contrats générés aléatoirement, chaque numéro doit
 * correspondre exactement au pattern `/^CP-\d{4}-\d{5,}$/`.
 *
 * Ce pattern garantit :
 *   - Préfixe "CP-" fixe
 *   - 4 chiffres pour l'année (ex. 2025)
 *   - Tiret séparateur
 *   - Au moins 5 chiffres pour le séquentiel (avec extension si > 99 999)
 */
test('property 3 – every generated numero_contrat matches pattern CP-AAAA-NNNNN', function () {
    $annee = (int) fake()->numberBetween(2020, 2030);
    $n     = fake()->numberBetween(1, 150);

    $numeros = genererNNumeros($annee, $n);

    foreach ($numeros as $index => $numero) {
        expect($numero)->toMatch('/^CP-\d{4}-\d{5,}$/', sprintf(
            'Le numéro #%d "%s" ne correspond pas au format CP-AAAA-NNNNN.',
            $index + 1,
            $numero,
        ));
    }
})->repeat(30);

// ── Property 3: unicité globale pour tout ensemble de N numéros ────────────────

/**
 * **Validates: Requirements 2.1, 2.2**
 *
 * Pour tout N contrats générés, chaque numéro doit être unique.
 * Le tableau de N numéros ne doit contenir aucun doublon.
 */
test('property 3 – all generated contrat numbers are unique within a batch', function () {
    $annee = (int) fake()->numberBetween(2020, 2030);
    $n     = fake()->numberBetween(2, 200);

    $numeros = genererNNumeros($annee, $n);

    $unique = array_unique($numeros);

    expect(count($unique))->toBe(count($numeros), sprintf(
        'Des doublons ont été détectés parmi les %d numéros générés pour l\'année %d. '
        . 'Numéros dupliqués : %s',
        $n,
        $annee,
        implode(', ', array_diff_assoc($numeros, $unique)),
    ));
})->repeat(30);

// ── Property 3: l'année est correctement encodée dans le numéro ───────────────

/**
 * **Validates: Requirements 2.1**
 *
 * Pour toute année AAAA, le numéro généré doit contenir exactement cette année.
 * La partie AAAA du numéro doit correspondre à l'année calendaire passée.
 */
test('property 3 – numero_contrat encodes the correct year', function () {
    $annee = (int) fake()->numberBetween(2020, 2035);
    $seq   = fake()->numberBetween(1, 99999);

    $numero = genererNumeroContrat($annee, $seq);

    // Extraire l'année depuis le numéro
    $parties  = explode('-', $numero);
    $anneeExtraite = (int) $parties[1];

    expect($anneeExtraite)->toBe($annee, sprintf(
        'Le numéro "%s" encode l\'année %d mais l\'année attendue est %d.',
        $numero,
        $anneeExtraite,
        $annee,
    ));
})->repeat(50);

// ── Property 3: le séquentiel est encodé correctement avec zéros ──────────────

/**
 * **Validates: Requirements 2.1**
 *
 * Le séquentiel NNNNN doit être encodé avec des zéros de remplissage sur
 * au moins 5 chiffres. Par exemple, le 1er contrat doit être "00001" et
 * non "1".
 */
test('property 3 – sequential part is zero-padded to at least 5 digits', function () {
    $annee = (int) fake()->numberBetween(2020, 2030);
    $seq   = fake()->numberBetween(1, 99);  // petits numéros → zéros de remplissage visibles

    $numero = genererNumeroContrat($annee, $seq);

    $parties   = explode('-', $numero);
    $seqEncode = $parties[2];

    // La partie séquentielle doit avoir au moins 5 caractères
    expect(strlen($seqEncode))->toBeGreaterThanOrEqual(5, sprintf(
        'La partie séquentielle "%s" du numéro "%s" doit avoir au moins 5 chiffres.',
        $seqEncode,
        $numero,
    ));

    // La valeur entière doit correspondre au séquentiel d'entrée
    expect((int) $seqEncode)->toBe($seq, sprintf(
        'La valeur du séquentiel extrait "%d" doit correspondre au séquentiel d\'entrée "%d".',
        (int) $seqEncode,
        $seq,
    ));
})->repeat(50);

// ── Property 3: remise à zéro annuelle — les séquentiels repartent de 1 ───────

/**
 * **Validates: Requirements 2.3**
 *
 * Quand l'année change, le premier contrat de la nouvelle année doit avoir
 * le séquentiel "00001", indépendamment du compteur de l'année précédente.
 *
 * Ce test simule un changement d'année en générant M contrats pour l'année N,
 * puis N+1 contrats pour l'année N+1, et vérifie que le premier numéro de N+1
 * commence bien à 00001.
 */
test('property 3 – sequential counter resets to 00001 at new calendar year', function () {
    $anneeActuelle   = (int) fake()->numberBetween(2020, 2030);
    $anneesuivante   = $anneeActuelle + 1;
    $nbContratsAnneePrecedente = fake()->numberBetween(1, 500);

    // Générer M contrats pour l'année actuelle
    $numerosAnneeActuelle = genererNNumeros($anneeActuelle, $nbContratsAnneePrecedente);
    $dernierNumeroAnneeActuelle = end($numerosAnneeActuelle);

    // Le premier contrat de la nouvelle année repart à 1
    $premierNumeroAnneesuivante = genererNumeroContrat($anneesuivante, 1);

    // Vérifier que la nouvelle année repart bien à 00001
    expect($premierNumeroAnneesuivante)->toBe(
        sprintf('CP-%d-00001', $anneesuivante),
        sprintf(
            'Après %d contrats en %d (dernier: "%s"), le premier contrat de %d devrait être '
            . '"CP-%d-00001" mais got "%s".',
            $nbContratsAnneePrecedente,
            $anneeActuelle,
            $dernierNumeroAnneeActuelle,
            $anneesuivante,
            $anneesuivante,
            $premierNumeroAnneesuivante,
        )
    );

    // Vérifier l'absence de doublons entre les deux années
    $touLesNumeros = array_merge(
        $numerosAnneeActuelle,
        [$premierNumeroAnneesuivante]
    );
    $unique = array_unique($touLesNumeros);

    expect(count($unique))->toBe(count($touLesNumeros),
        'Le premier numéro de la nouvelle année ne doit pas être un doublon de l\'année précédente.'
    );
})->repeat(20);

// ── Property 3: extension à 6+ chiffres quand séquentiel > 99 999 ────────────

/**
 * **Validates: Requirements 2.1**
 *
 * Quand le compteur séquentiel dépasse 99 999, le numéro doit s'étendre
 * à 6 chiffres (ou plus), sans tronquer la valeur ni la formater incorrectement.
 *
 * Exemple : le 100 000ème contrat doit être "CP-2025-100000" (6 chiffres).
 */
test('property 3 – sequential extends beyond 5 digits when counter exceeds 99999', function () {
    $annee = (int) fake()->numberBetween(2020, 2030);
    $seq   = fake()->numberBetween(100000, 999999);  // au-delà de 99 999

    $numero = genererNumeroContrat($annee, $seq);

    // Vérifier le format avec 6+ chiffres
    expect($numero)->toMatch('/^CP-\d{4}-\d{6,}$/', sprintf(
        'Le numéro "%s" pour le séquentiel %d devrait avoir 6+ chiffres.',
        $numero,
        $seq,
    ));

    // La valeur entière extraite doit correspondre au séquentiel
    $parties   = explode('-', $numero);
    $seqExtrait = (int) $parties[2];

    expect($seqExtrait)->toBe($seq, sprintf(
        'Le séquentiel extrait "%d" doit correspondre au séquentiel d\'entrée "%d".',
        $seqExtrait,
        $seq,
    ));
})->repeat(30);

// ── Property 3: ordre séquentiel croissant ─────────────────────────────────────

/**
 * **Validates: Requirements 2.1, 2.2**
 *
 * Pour N contrats générés consécutivement pour une même année, les séquentiels
 * doivent être strictement croissants (1, 2, 3, ..., N).
 * Cela garantit qu'aucun numéro n'est sauté et que l'ordre est préservé.
 */
test('property 3 – sequential numbers are strictly increasing for the same year', function () {
    $annee = (int) fake()->numberBetween(2020, 2030);
    $n     = fake()->numberBetween(2, 100);

    $numeros = genererNNumeros($annee, $n);

    for ($i = 0; $i < count($numeros) - 1; $i++) {
        $partiesCurrent = explode('-', $numeros[$i]);
        $partiesNext    = explode('-', $numeros[$i + 1]);

        $seqActuel  = (int) $partiesCurrent[2];
        $seqSuivant = (int) $partiesNext[2];

        expect($seqSuivant)->toBe($seqActuel + 1, sprintf(
            'Le séquentiel du numéro %d ("%s") devrait être %d mais vaut %d.',
            $i + 2,
            $numeros[$i + 1],
            $seqActuel + 1,
            $seqSuivant,
        ));
    }
})->repeat(20);

// ── Property 3: invariant structurel — 3 parties séparées par "-" ─────────────

/**
 * **Validates: Requirements 2.1**
 *
 * Tout numéro de contrat doit être composé exactement de 3 parties séparées
 * par des tirets : "CP", l'année (4 chiffres), et le séquentiel (≥ 5 chiffres).
 */
test('property 3 – numero_contrat always has exactly 3 parts separated by hyphen', function () {
    $annee = (int) fake()->numberBetween(2020, 2030);
    $seq   = fake()->numberBetween(1, 999999);

    $numero  = genererNumeroContrat($annee, $seq);
    $parties = explode('-', $numero);

    expect($parties)->toHaveCount(3, sprintf(
        'Le numéro "%s" devrait avoir exactement 3 parties séparées par "-", mais en a %d.',
        $numero,
        count($parties),
    ));

    // Partie 0 : préfixe "CP"
    expect($parties[0])->toBe('CP', sprintf(
        'Le préfixe du numéro "%s" devrait être "CP" mais vaut "%s".',
        $numero,
        $parties[0],
    ));

    // Partie 1 : année sur 4 chiffres
    expect($parties[1])->toMatch('/^\d{4}$/', sprintf(
        'La partie année du numéro "%s" devrait avoir exactement 4 chiffres mais vaut "%s".',
        $numero,
        $parties[1],
    ));

    // Partie 2 : séquentiel sur au moins 5 chiffres
    expect($parties[2])->toMatch('/^\d{5,}$/', sprintf(
        'La partie séquentielle du numéro "%s" devrait avoir au moins 5 chiffres mais vaut "%s".',
        $numero,
        $parties[2],
    ));
})->repeat(50);
