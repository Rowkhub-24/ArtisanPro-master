# Implementation Plan: Devis — Liste de Matériels

## Overview

Implémentation de la fonctionnalité permettant à un artisan d'inclure une liste détaillée de matériels dans sa réponse à un devis, avec persistance en base de données, calcul automatique des sous-totaux et affichage en lecture seule côté client.

## Tasks

- [x] 1. Migration et modèles de données
  - [x] 1.1 Créer la migration pour la table `devis_materiels` et les nouvelles colonnes de `devis`
    - Créer `database/migrations/YYYY_MM_DD_HHMMSS_create_devis_materiels_table.php`
    - Table `devis_materiels` : colonnes `id`, `id_devis` (FK cascade), `nom`, `quantite` (DECIMAL 10,3), `unite` (DEFAULT 'unité'), `prix_unitaire` (DECIMAL 10,2), `ordre` (SMALLINT DEFAULT 0), `created_at`, `updated_at`
    - Index `idx_devis_materiels_id_devis` sur `id_devis`
    - Modifier la table `devis` pour ajouter `notes_artisan` (TEXT NULL) et `sous_total_materiels` (DECIMAL 10,2 NULL DEFAULT 0.00)
    - Implémenter `up()` et `down()` (rollback complet)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 1.2 Créer le modèle Eloquent `DevisMateriel`
    - Créer `app/Models/DevisMateriel.php` avec `$table = 'devis_materiels'`, `$fillable`, `casts()` (quantite DECIMAL:3, prix_unitaire DECIMAL:2, ordre integer)
    - Implémenter l'accesseur `getSousTotalAttribute()` : `round((float)$this->quantite * (float)$this->prix_unitaire, 2)`
    - Implémenter la relation `devis(): BelongsTo` vers `Devis` via `id_devis`
    - _Requirements: 4.3, 7.1_

  - [x] 1.3 Mettre à jour le modèle `Devis`
    - Ajouter `notes_artisan` et `sous_total_materiels` dans `$fillable`
    - Ajouter le cast `sous_total_materiels => 'decimal:2'` dans `casts()`
    - Ajouter la relation `materiels(): HasMany` vers `DevisMateriel` avec `orderBy('ordre')`
    - _Requirements: 3.6, 7.3_

  - [ ]* 1.4 Écrire le test de propriété pour l'accesseur `getSousTotalAttribute`
    - **Propriété 1 : Calcul du sous-total d'une ligne**
    - Pour tout couple `(quantite, prix_unitaire)` valide, vérifier que `getSousTotalAttribute()` retourne `round(quantite × prix_unitaire, 2)`
    - Tester avec quantités décimales (2.5, 0.001, 9999999) et prix variés (0, 0.01, 99999999.99)
    - **Valide : Requirements 1.3, 4.3**

  - [ ]* 1.5 Écrire les tests unitaires pour le modèle `Devis` — relation `materiels()`
    - Vérifier que `Devis::materiels()` retourne les lignes triées par `ordre` croissant
    - **Valide : Requirements 3.6**

- [x] 2. Backend — Contrôleur `ArtisanDevisRepondreController`
  - [x] 2.1 Créer `app/Http/Controllers/Portal/ArtisanDevisRepondreController.php`
    - Implémenter la méthode `repondre(Request $request, Devis $devis): RedirectResponse`
    - Contrôle d'accès : vérifier `$devis->id_artisan === auth()->user()->artisan?->id`, sinon `abort(403)`
    - Contrôle de statut : si `$devis->statut !== 'en_attente'`, retourner `abort(403)` avec message "Ce devis a déjà été traité."
    - Validation Laravel avec les règles complètes (`montant_propose`, `notes_artisan`, `materiels`, `materiels.*.nom/quantite/unite/prix_unitaire`)
    - Calculer `sous_total_materiels = sum(quantite * prix_unitaire)` sur les lignes soumises
    - Mettre à jour `devis` : `montant_propose`, `notes_artisan`, `sous_total_materiels`, `date_reponse = now()`, `statut = 'accepte'`
    - Supprimer toutes les lignes `devis_materiels` existantes pour ce devis
    - Insérer les nouvelles lignes avec `ordre` = index du tableau soumis
    - Retourner `back()->with('success', ...)`
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 4.1, 4.4, 5.1, 5.2, 5.3_

  - [ ]* 2.2 Écrire le test de propriété pour la cohérence du total général
    - **Propriété 2 : Cohérence du total général des matériels**
    - Pour tout tableau de lignes valides, vérifier que `sous_total_materiels` en base = `SUM(quantite_i × prix_unitaire_i)`
    - Générer N tableaux aléatoires de 1 à 50 lignes avec quantités et prix variés
    - **Valide : Requirements 1.4, 3.3, 4.1**

  - [ ]* 2.3 Écrire le test de propriété pour l'idempotence du remplacement
    - **Propriété 4 : Idempotence du remplacement des matériels**
    - Soumettre la même liste deux fois et vérifier que l'état final en base est identique (même nombre de lignes, mêmes valeurs)
    - **Valide : Requirements 3.1, 3.3**

  - [ ]* 2.4 Écrire le test de propriété pour le rejet des données invalides
    - **Propriété 5 : Rejet des données invalides**
    - Pour toute ligne avec `nom` vide, `quantite ≤ 0`, `prix_unitaire < 0`, ou liste > 50 éléments : vérifier HTTP 422 sans aucune modification en base
    - **Valide : Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

  - [ ]* 2.5 Écrire le test de propriété pour le contrôle d'accès en écriture
    - **Propriété 6 : Contrôle d'accès en écriture**
    - Pour tout artisan A et devis D n'appartenant pas à A : vérifier que `PATCH /artisan/devis/{D.id}/repondre` retourne HTTP 403 sans modifier aucune donnée
    - **Valide : Requirements 5.1**

  - [ ]* 2.6 Écrire les tests d'intégration Feature pour `ArtisanDevisRepondreController`
    - `PATCH repondre` avec liste valide → vérifier création en BDD et `sous_total_materiels` correct
    - `PATCH repondre` avec liste vide → vérifier `sous_total_materiels = 0` et suppression des anciennes lignes
    - `PATCH repondre` avec 51 lignes → HTTP 422
    - `PATCH repondre` par un artisan non propriétaire → HTTP 403
    - `PATCH repondre` sur un devis déjà `accepte` → HTTP 403
    - _Requirements: 2.4, 2.5, 3.1, 3.3, 3.5, 4.4, 5.1, 5.2_

- [x] 3. Backend — Route `PATCH /artisan/devis/{devis}/repondre` et mise à jour des routes GET
  - [x] 3.1 Enregistrer la route `PATCH artisan/devis/{devis}/repondre` dans `routes/web.php`
    - Ajouter dans le groupe `artisan` authentifié : `Route::patch('devis/{devis}/repondre', [ArtisanDevisRepondreController::class, 'repondre'])->name('artisan.devis.repondre')`
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 3.2 Mettre à jour la route GET `artisan/devis` pour inclure `materiels` et `sous_total_materiels`
    - Modifier la closure de la route `artisan.devis` dans `routes/web.php` pour eager-loader `materiels` sur chaque devis
    - Ajouter dans le mapping des données : `materiels`, `notes_artisan`, `montant_propose`, `sous_total_materiels`
    - _Requirements: 1.1, 6.1_

  - [x] 3.3 Mettre à jour (ou créer) la route GET `client/devis` pour inclure les matériels dans la vue détail
    - Modifier ou ajouter un endpoint `GET /client/devis/{devis}` (ou enrichir la route existante) qui eager-load `materiels` et retourne `materiels` + `sous_total_materiels` à l'Inertia render
    - Vérifier que le devis appartient au client authentifié, sinon `abort(403)`
    - _Requirements: 6.1, 6.4_

  - [ ]* 3.4 Écrire le test de propriété pour le round-trip de persistance
    - **Propriété 3 : Round-trip de persistance des matériels**
    - Pour tout tableau valide soumis via `PATCH repondre`, vérifier que `GET client/devis/{id}` retourne exactement les mêmes lignes (nom, quantite, unite, prix_unitaire) dans le même ordre
    - **Valide : Requirements 3.1, 3.2, 3.4, 6.1**

  - [ ]* 3.5 Écrire le test de propriété pour le tri par ordre
    - **Propriété 8 : Tri par ordre des matériels**
    - Pour tout tableau soumis avec des indices d'ordre distincts, vérifier que `Devis::materiels()` retourne les lignes triées par `ordre` croissant quelle que soit l'ordre d'insertion
    - **Valide : Requirements 3.5** *(Req 3.6 dans le requirements.md)*

  - [ ]* 3.6 Écrire le test d'intégration Feature pour `ClientDevisDetailController`
    - `GET /client/devis/{id}` par le bon client → vérifier que les matériels sont retournés avec `sous_total_materiels`
    - `GET /client/devis/{id}` par un autre client → HTTP 403
    - _Requirements: 6.1, 6.4_

  - [ ]* 3.7 Écrire le test de propriété pour le contrôle d'accès en lecture client
    - **Propriété 7 : Contrôle d'accès en lecture client**
    - Pour tout client C et devis D n'appartenant pas à C : vérifier que `GET /client/devis/{D.id}` retourne HTTP 403
    - **Valide : Requirements 6.4**

- [x] 4. Checkpoint — Tests backend
  - S'assurer que tous les tests backend passent (`php artisan test --filter=DevisMateriel`). Signaler toute anomalie avant de continuer.

- [x] 5. Frontend — Composant `MaterielsEditor`
  - [x] 5.1 Créer `resources/js/components/MaterielsEditor.tsx`
    - Définir les interfaces TypeScript `LigneMateriel` et `MaterielsEditorProps`
    - Rendre un tableau éditable avec colonnes `nom`, `quantite`, `unite`, `prix_unitaire`, `sous_total` (lecture seule) et une colonne action (suppression)
    - Calculer `sous_total` de chaque ligne en temps réel (`quantite × prix_unitaire`)
    - Afficher le total général des matériels formaté en FCFA (séparateurs de milliers + " FCFA")
    - Bouton "Ajouter une ligne" désactivé quand 50 lignes présentes (Req 1.7)
    - Mode `disabled` : tous les champs et boutons non interactifs (Req 1.6)
    - Valeur par défaut nouvelle ligne : `{ nom: '', quantite: 0, unite: '', prix_unitaire: 0 }`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 5.2 Implémenter la validation inline dans `MaterielsEditor`
    - Valider `nom` non vide (Req 2.1), `quantite > 0` et `≤ 9 999 999` (Req 2.2), `prix_unitaire ≥ 0` et `≤ 99 999 999.99` (Req 2.3), `unite` non vide (Req 2.6)
    - Afficher les messages d'erreur sous chaque champ invalide au moment de la soumission
    - Exposer un état `hasErrors: boolean` (ou une prop de callback) pour permettre au parent de désactiver le bouton de soumission
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

  - [ ]* 5.3 Écrire les tests unitaires pour `MaterielsEditor`
    - Tester l'ajout et la suppression de lignes
    - Tester le calcul du sous-total en temps réel
    - Tester la désactivation du bouton d'ajout à 50 lignes
    - Tester le mode `disabled`
    - Tester les messages d'erreur de validation inline
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.6_

- [x] 6. Frontend — Composant `MaterielsReadOnly`
  - [x] 6.1 Créer `resources/js/components/MaterielsReadOnly.tsx`
    - Définir l'interface TypeScript `MaterielsReadOnlyProps`
    - Rendre un tableau HTML non éditable avec colonnes `nom`, `quantite`, `unite`, `prix_unitaire`, `sous_total` (calculé comme `quantite × prix_unitaire` arrondi à 2 décimales)
    - Afficher le sous-total global formaté en FCFA (entier séparé par des espaces + suffixe " FCFA")
    - Si `materiels` est vide : afficher le tableau avec en-têtes et une ligne "Aucun matériel renseigné" (Req 6.3)
    - _Requirements: 6.2, 6.3_

  - [ ]* 6.2 Écrire les tests unitaires pour `MaterielsReadOnly`
    - Tester l'affichage d'une liste non vide avec les bonnes valeurs calculées
    - Tester l'affichage avec liste vide (message "Aucun matériel renseigné")
    - Tester le formatage FCFA du sous-total global
    - _Requirements: 6.2, 6.3_

- [x] 7. Frontend — Intégration dans `DevisReponsePanel` et la page artisan
  - [x] 7.1 Créer ou modifier le composant `DevisReponsePanel`
    - Créer `resources/js/components/DevisReponsePanel.tsx` (nouveau composant ou enrichissement d'un panneau existant dans `artisan/devis.tsx`)
    - Intégrer le champ `notes_artisan` (textarea optionnel)
    - Intégrer `MaterielsEditor` avec les données initiales de `devis.materiels`
    - Gérer le state `materiels: LigneMateriel[]` et le passer à `MaterielsEditor` via `onChange`
    - Afficher un avertissement non-bloquant si `montant_propose < sous_total_materiels` (Req 4.2)
    - Soumettre via `router.patch(route('artisan.devis.repondre', devis.id), { montant_propose, notes_artisan, materiels })` avec `preserveScroll: true`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.6, 4.1, 4.2_

  - [x] 7.2 Mettre à jour la page `resources/js/pages/artisan/devis.tsx`
    - Mettre à jour l'interface `DevisItem` pour inclure `materiels`, `notes_artisan`, `montant_propose`, `sous_total_materiels`
    - Remplacer les boutons "Accepter/Refuser" par l'ouverture du panneau `DevisReponsePanel` pour les devis `en_attente`
    - Passer `onSuccess` pour rafraîchir la liste après soumission réussie
    - _Requirements: 1.1, 4.1, 4.2_

- [x] 8. Frontend — Intégration dans la vue client
  - [x] 8.1 Mettre à jour la page `resources/js/pages/client/devis.tsx`
    - Mettre à jour l'interface `DevisItem` pour inclure `materiels`, `notes_artisan`, `sous_total_materiels`
    - Intégrer le composant `MaterielsReadOnly` dans la vue détail de chaque devis accepté (ou dans une page dédiée si une route `client.devis.show` est créée)
    - Afficher `notes_artisan` si présent
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 9. Checkpoint final — Tous les tests passent
  - Exécuter `php artisan test` et `npm run build` (ou `npx tsc --noEmit`) pour vérifier l'absence d'erreurs.
  - Vérifier que la migration `php artisan migrate` s'exécute sans erreur.
  - Signaler toute anomalie avant de clore l'implémentation.

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour un MVP rapide
- Chaque tâche référence les critères d'acceptation spécifiques du requirements.md pour la traçabilité
- Les checkpoints garantissent une validation incrémentale
- Les tests de propriétés (PBT) valident les garanties universelles de correction (calculs, idempotence, contrôle d'accès)
- Les tests unitaires et d'intégration valident les exemples concrets et les cas limites
- Toutes les opérations de persistance utilisent une stratégie DELETE + INSERT (remplacement complet), acceptable pour ≤ 50 lignes

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "1.5", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3"] },
    { "id": 5, "tasks": ["3.4", "3.5", "3.6", "3.7", "5.1"] },
    { "id": 6, "tasks": ["5.2", "6.1"] },
    { "id": 7, "tasks": ["5.3", "6.2", "7.1"] },
    { "id": 8, "tasks": ["7.2"] },
    { "id": 9, "tasks": ["8.1"] }
  ]
}
```
