# Requirements Document

## Introduction

Cette fonctionnalité enrichit le module de devis d'ArtisanPro en permettant à un artisan d'inclure une liste détaillée de matériels nécessaires à l'exécution d'un travail dans sa réponse à un devis. Chaque ligne de matériel comporte un nom, une quantité, une unité de mesure et un prix unitaire. Le sous-total des matériels est calculé automatiquement et intégré dans le montant total du devis. Le client peut consulter cette liste en lecture seule sur la page de détail du devis.

## Glossary

- **DevisMateriel** : Entité représentant une ligne individuelle de la liste de matériels associée à un devis.
- **MaterielsEditor** : Composant React permettant à l'artisan de saisir et modifier la liste de matériels dans le panneau de réponse au devis.
- **MaterielsReadOnly** : Composant React d'affichage en lecture seule de la liste de matériels pour le client.
- **DevisReponsePanel** : Composant React (existant, modifié) permettant à l'artisan de répondre à un devis.
- **ArtisanDevisRepondreController** : Contrôleur Laravel gérant le endpoint `PATCH /artisan/devis/{devis}/repondre`.
- **ClientDevisDetailController** : Contrôleur Laravel gérant le endpoint `GET /client/devis/{devis}`.
- **sous_total_materiels** : Champ dénormalisé sur la table `devis`, stockant la somme de tous les sous-totaux de lignes de matériels, recalculé à chaque sauvegarde.
- **sous_total** : Valeur calculée pour une ligne de matériel : `quantite × prix_unitaire`, non stockée en base de données.
- **Statut en_attente** : Statut d'un devis auquel l'artisan n'a pas encore répondu.
- **FCFA** : Franc CFA, devise utilisée pour tous les montants dans l'application.

## Requirements

### Requirement 1: Saisie de la liste de matériels par l'artisan

**User Story:** En tant qu'artisan, je veux ajouter une liste détaillée de matériels à ma réponse à un devis, afin que le client comprenne précisément la composition du montant proposé.

#### Acceptance Criteria

1. WHEN l'artisan ouvre le panneau de réponse à un devis en statut `en_attente`, THE MaterielsEditor SHALL afficher un tableau vide avec les en-têtes de colonnes `nom`, `quantite`, `unite`, `prix_unitaire` et `sous_total`, prêt à recevoir des lignes de matériels.
2. WHEN l'artisan clique sur le bouton d'ajout de ligne, THE MaterielsEditor SHALL ajouter une nouvelle ligne vierge avec les champs `nom`, `quantite`, `unite` et `prix_unitaire` initialisés à leurs valeurs par défaut (chaîne vide pour `nom` et `unite`, 0 pour `quantite` et `prix_unitaire`).
3. WHEN l'artisan modifie le champ `quantite` ou `prix_unitaire` d'une ligne, THE MaterielsEditor SHALL recalculer et afficher immédiatement le `sous_total` de cette ligne comme le produit `quantite × prix_unitaire`.
4. WHEN la valeur d'au moins une ligne est modifiée, THE MaterielsEditor SHALL recalculer et afficher immédiatement le total général des matériels comme la somme de tous les `sous_total` des lignes présentes.
5. WHEN l'artisan clique sur le bouton de suppression d'une ligne, THE MaterielsEditor SHALL retirer cette ligne du tableau et recalculer immédiatement le total général.
6. WHERE le composant est en mode `disabled`, THE MaterielsEditor SHALL rendre tous les champs de saisie et les boutons d'ajout et de suppression non modifiables et non cliquables.
7. IF le nombre de lignes présentes dans le tableau atteint 50, THEN THE MaterielsEditor SHALL désactiver le bouton d'ajout de ligne afin d'empêcher le dépassement de la limite.

### Requirement 2: Validation des données de matériels

**User Story:** En tant qu'artisan, je veux être informé immédiatement si une ligne de matériel est incomplète ou invalide, afin d'éviter les erreurs au moment de la soumission.

#### Acceptance Criteria

1. IF le champ `nom` d'une ligne de matériel est vide ou composé uniquement d'espaces au moment de la soumission, THEN THE MaterielsEditor SHALL afficher un message d'erreur sous le champ `nom` de cette ligne et désactiver le bouton de soumission du formulaire.
2. IF le champ `quantite` d'une ligne de matériel est inférieur ou égal à zéro, ou supérieur à 9 999 999, au moment de la soumission, THEN THE MaterielsEditor SHALL afficher un message d'erreur sous le champ `quantite` de cette ligne et désactiver le bouton de soumission du formulaire.
3. IF le champ `prix_unitaire` d'une ligne de matériel est négatif ou supérieur à 99 999 999.99 au moment de la soumission, THEN THE MaterielsEditor SHALL afficher un message d'erreur sous le champ `prix_unitaire` de cette ligne et désactiver le bouton de soumission du formulaire.
4. IF le nombre de lignes de matériels dans la liste dépasse 50, THEN THE ArtisanDevisRepondreController SHALL retourner une réponse HTTP 422 avec le message "La liste de matériels ne peut pas dépasser 50 lignes." sans modifier la table `devis_materiels` ni le champ `sous_total_materiels`.
5. WHEN l'ArtisanDevisRepondreController reçoit une requête avec des matériels, THE ArtisanDevisRepondreController SHALL valider que `nom` n'est pas vide et ne dépasse pas 255 caractères, que `quantite` est strictement supérieure à 0 et ne dépasse pas 9 999 999, que `unite` n'est pas vide et ne dépasse pas 50 caractères, et que `prix_unitaire` est supérieur ou égal à 0 et ne dépasse pas 99 999 999.99 ; en cas d'échec, SHALL retourner HTTP 422 sans modifier aucune donnée en base.
6. IF le champ `unite` d'une ligne de matériel est vide au moment de la soumission, THEN THE MaterielsEditor SHALL afficher un message d'erreur sous le champ `unite` de cette ligne et désactiver le bouton de soumission du formulaire.

### Requirement 3: Persistance des matériels en base de données

**User Story:** En tant qu'artisan, je veux que ma liste de matériels soit sauvegardée avec ma réponse au devis, afin qu'elle soit consultable ultérieurement par le client et par moi-même.

#### Acceptance Criteria

1. WHEN l'artisan soumet le formulaire de réponse avec une liste de matériels dont chaque ligne respecte les règles (`nom` ≤ 255 caractères non vide, `quantite` ∈ ]0 ; 9 999 999], `unite` ≤ 50 caractères non vide, `prix_unitaire` ∈ [0 ; 99 999 999.99], maximum 50 lignes), THE ArtisanDevisRepondreController SHALL supprimer toutes les lignes `devis_materiels` existantes pour ce devis avant d'insérer les nouvelles lignes.
2. WHEN l'artisan soumet le formulaire de réponse avec une liste de matériels valide, THE ArtisanDevisRepondreController SHALL insérer une ligne dans la table `devis_materiels` pour chaque élément de la liste soumise, en assignant la valeur de `ordre` correspondant à l'index (base 0) du tableau.
3. WHEN l'artisan soumet le formulaire de réponse avec une liste de matériels valide, THE ArtisanDevisRepondreController SHALL mettre à jour le champ `sous_total_materiels` du devis avec la valeur exacte de `SUM(quantite_i × prix_unitaire_i)` pour toutes les lignes soumises.
4. THE sous_total_materiels du devis SHALL toujours être strictement égal à la somme mathématique `SUM(quantite_i × prix_unitaire_i)` de toutes les lignes `devis_materiels` associées après toute sauvegarde.
5. WHEN l'artisan soumet le formulaire de réponse sans lignes de matériels, THE ArtisanDevisRepondreController SHALL supprimer toutes les lignes `devis_materiels` existantes pour ce devis et SHALL fixer `sous_total_materiels` à 0.00.
6. THE Devis SHALL exposer une relation `materiels()` retournant les `DevisMateriel` associés triés par la colonne `ordre` de façon croissante.
7. IF la validation des données de matériels échoue (champ invalide ou nombre de lignes > 50), THEN THE ArtisanDevisRepondreController SHALL retourner HTTP 422 sans effectuer aucune modification dans la table `devis_materiels` ni dans le champ `sous_total_materiels`.

### Requirement 4: Calcul et mise à jour du montant du devis

**User Story:** En tant qu'artisan, je veux que le sous-total des matériels soit intégré dans le montant du devis, afin que la proposition financière reflète l'ensemble des coûts de matériaux.

#### Acceptance Criteria

1. WHEN l'artisan soumet le formulaire de réponse, THE ArtisanDevisRepondreController SHALL mettre à jour les champs `montant_propose`, `notes_artisan`, `sous_total_materiels` (calculé comme `SUM(quantite_i × prix_unitaire_i)`), `date_reponse` (fixé à l'horodatage de la requête) et `statut` (fixé à `accepte`) du devis.
2. IF le champ `montant_propose` soumis est inférieur à `sous_total_materiels` (y compris lorsque `montant_propose` est égal à zéro et `sous_total_materiels` est supérieur à zéro), THEN THE MaterielsEditor SHALL afficher un message d'avertissement non-bloquant visible à l'artisan indiquant l'incohérence potentielle entre le montant proposé et le sous-total des matériels.
3. THE DevisMateriel SHALL exposer un accesseur `sous_total` calculant `quantite × prix_unitaire` arrondi à 2 décimales sans stocker cette valeur en base de données.
4. IF le devis ciblé a un statut différent de `en_attente`, THEN THE ArtisanDevisRepondreController SHALL retourner HTTP 403 et ne pas modifier le devis ni ses matériels.

### Requirement 5: Contrôle d'accès et sécurité

**User Story:** En tant qu'artisan, je veux être le seul à pouvoir modifier ma réponse à mes propres devis, afin de garantir l'intégrité des données.

#### Acceptance Criteria

1. IF l'artisan authentifié n'est pas le propriétaire du devis ciblé, THEN THE ArtisanDevisRepondreController SHALL retourner une réponse HTTP 403 sans modifier aucune donnée.
2. IF le devis ciblé a un statut différent de `en_attente`, THEN THE ArtisanDevisRepondreController SHALL retourner une réponse HTTP 403 et ne pas modifier le devis ni ses matériels.
3. WHEN l'ArtisanDevisRepondreController reçoit une requête, THE ArtisanDevisRepondreController SHALL valider côté serveur tous les champs suivants indépendamment de toute validation côté client : `montant_propose` (requis, numérique, ∈ [0 ; 99 999 999]), `notes_artisan` (optionnel, chaîne ≤ 2 000 caractères), `materiels` (optionnel, tableau ≤ 50 éléments), `materiels.*.nom` (requis, chaîne ≤ 255 caractères), `materiels.*.quantite` (requis, numérique ∈ ]0 ; 9 999 999]), `materiels.*.unite` (requis, chaîne ≤ 50 caractères), `materiels.*.prix_unitaire` (requis, numérique ∈ [0 ; 99 999 999]) ; en cas d'échec, SHALL retourner HTTP 422 sans modifier le devis ni ses matériels.

### Requirement 6: Consultation de la liste de matériels par le client

**User Story:** En tant que client, je veux consulter la liste des matériels inclus dans un devis qui m'est adressé, afin de comprendre le détail du montant proposé par l'artisan.

#### Acceptance Criteria

1. WHEN le client authentifié accède à la page de détail d'un devis lui appartenant, THE ClientDevisDetailController SHALL retourner le devis avec la liste complète de ses `DevisMateriel` (triée par `ordre` croissant) et la valeur `sous_total_materiels`.
2. WHEN les matériels sont retournés au client, THE MaterielsReadOnly SHALL afficher un tableau non éditable avec les colonnes `nom`, `quantite`, `unite`, `prix_unitaire` et `sous_total` (calculé comme `quantite × prix_unitaire` arrondi à 2 décimales) pour chaque ligne, ainsi que le sous-total global des matériels formaté en FCFA (format : entier séparé par des espaces comme séparateurs de milliers suivi du suffixe " FCFA").
3. WHILE la liste de matériels du devis est vide, THE MaterielsReadOnly SHALL afficher le tableau avec ses en-têtes de colonnes et une ligne indiquant qu'aucun matériel n'a été renseigné, sans afficher de lignes de données.
4. IF le client authentifié n'est pas le propriétaire du devis ciblé ou si le devis n'existe pas, THEN THE ClientDevisDetailController SHALL retourner une réponse HTTP 403.

### Requirement 7: Migration et modèle de données

**User Story:** En tant que développeur, je veux que la structure de base de données soit correctement mise en place, afin que les données de matériels soient persistées de façon fiable et performante.

#### Acceptance Criteria

1. THE système SHALL créer une table `devis_materiels` avec les colonnes suivantes et leurs types exacts : `id` (BIGINT UNSIGNED, clé primaire auto-incrémentée), `id_devis` (BIGINT UNSIGNED, NOT NULL, clé étrangère vers `devis.id` avec suppression en cascade), `nom` (VARCHAR(255), NOT NULL), `quantite` (DECIMAL(10,3), NOT NULL), `unite` (VARCHAR(50), NOT NULL, DEFAULT 'unité'), `prix_unitaire` (DECIMAL(10,2), NOT NULL, DEFAULT 0.00), `ordre` (SMALLINT, NOT NULL, DEFAULT 0), `created_at` (TIMESTAMP, NULL) et `updated_at` (TIMESTAMP, NULL) ; et SHALL supprimer cette table lors du rollback de la migration.
2. IF la table `devis_materiels` a été créée avec succès, THEN THE système SHALL ajouter un index sur la colonne `id_devis` de cette table afin d'optimiser les lectures par eager loading.
3. THE système SHALL ajouter les colonnes `notes_artisan` (TEXT NULL) et `sous_total_materiels` (DECIMAL(10,2) NULL DEFAULT 0.00) à la table `devis` existante ; et SHALL supprimer ces deux colonnes lors du rollback de la migration.
4. IF une ligne `devis` est supprimée, THEN THE système SHALL supprimer automatiquement toutes les lignes `devis_materiels` associées via la contrainte de clé étrangère avec cascade, sans nécessiter d'action applicative supplémentaire.
