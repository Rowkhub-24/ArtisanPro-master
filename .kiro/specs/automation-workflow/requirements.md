# Requirements Document

## Introduction

Ce document formalise les exigences du moteur d'automatisation d'ArtisanPro. L'objectif est d'automatiser l'ensemble du cycle de vie d'une réservation — acceptation, génération de devis, validation, détection de fin de mission et résolution de litiges — tout en garantissant un fallback vers l'action manuelle à chaque étape. Chaque décision automatique est traçable via un journal d'audit complet, et toutes les règles métier sont configurables par l'administrateur.

## Glossary

- **AutomationEngine** : Service central coordinateur de toutes les décisions d'automatisation
- **AutoDecision** : Value object immutable encapsulant le résultat d'une évaluation automatique (approuvée, rejetée, escaladée)
- **ReservationAutoAcceptListener** : Listener Laravel déclenché sur `ReservationCreee`, responsable de l'acceptation automatique
- **DevisAutoGeneratorService** : Service générant un devis à partir de templates configurables par métier
- **DevisAutoValidatorListener** : Listener Laravel déclenché sur `DevisGenere`, responsable de la validation automatique
- **MissionTerminaisonDetector** : Job planifié détectant la fin de mission via GPS ou expiration de durée
- **LitigeAutoResolverService** : Service appliquant les règles métier de résolution automatique des litiges
- **AutomationConfigService** : Service gérant les règles d'automatisation configurables stockées en base de données
- **Automation_Rules** : Table de base de données stockant les règles d'automatisation configurables
- **Automation_Logs** : Table de base de données journalisant toutes les décisions automatiques
- **Devis_Templates** : Table de base de données contenant les templates de devis par métier
- **Score_Confiance** : Score de 0 à 100 calculé automatiquement pour chaque artisan (existant)
- **Haversine** : Formule de calcul de distance entre deux coordonnées GPS
- **FCFA** : Franc CFA, monnaie utilisée au Bénin (XOF)
- **Reservation** : Modèle Eloquent représentant un contrat de prestation entre un client et un artisan
- **Devis** : Modèle Eloquent représentant une proposition tarifaire d'un artisan
- **Litige** : Modèle Eloquent représentant un désaccord formel sur une réservation
- **Artisan** : Prestataire de services inscrit sur la plateforme
- **Client** : Utilisateur cherchant à réserver les services d'un artisan
- **Admin** : Administrateur de la plateforme ArtisanPro
- **KKiapay** : Passerelle de paiement mobile intégrée à la plateforme
- **HistoriqueGeolocalisation** : Table existante stockant les positions GPS des artisans
- **Fallback_Manuel** : Basculement vers une action humaine en cas d'échec ou de critères non satisfaits

---

## Requirements

### Requirement 1: Moteur de règles d'automatisation configurable

**User Story:** En tant qu'admin, je veux configurer les seuils et paramètres du moteur d'automatisation depuis l'interface d'administration, afin d'adapter les règles métier sans modifier le code.

#### Acceptance Criteria

1. THE AutomationConfigService SHALL stocker chaque règle d'automatisation dans la table `automation_rules` avec une clé unique (VARCHAR 100), une valeur JSON, une description (TEXT, max 500 caractères) et une catégorie parmi : `reservation`, `devis`, `mission`, `litige`.
2. WHEN l'Admin sauvegarde une règle d'automatisation, THE AutomationConfigService SHALL invalider le cache Redis associé à cette clé et appliquer la nouvelle valeur pour toutes les évaluations déclenchées après la sauvegarde.
3. THE AutomationConfigService SHALL exposer les règles configurables suivantes avec leurs valeurs par défaut et plages valides : `auto_accept_score_minimum` (défaut: 70, plage: [0, 100]), `auto_accept_zone_km_maximum` (défaut: 20, plage: [1, 200]), `auto_devis_enabled` (défaut: true, valeurs: true|false), `auto_validate_devis_montant_max` (défaut: 50000, plage: [1000, 500000] FCFA), `auto_validate_devis_score_minimum` (défaut: 60, plage: [0, 100]), `auto_mission_timeout_heures` (défaut: 2, plage: [1, 24]), `auto_litige_seuil_micro` (défaut: 5000, plage: [0, 50000] FCFA), `auto_litige_timeout_artisan_heures` (défaut: 72, plage: [24, 168]). IF l'Admin soumet une valeur hors plage, THEN THE AutomationConfigService SHALL rejeter la modification et retourner une erreur de validation sans modifier la règle existante.
4. WHEN une règle est lue, THE AutomationConfigService SHALL retourner la valeur depuis le cache Redis si disponible, sinon lire depuis la base de données et mettre à jour le cache avant de retourner la valeur.
5. WHEN l'AutomationEngine émet une décision, THE AutomationEngine SHALL journaliser cette décision dans `automation_logs` avec : `type_action`, `model_type`, `model_id`, `decision` (approuvee|rejetee|escaladee), `score_confiance` (DECIMAL 5,2, plage [0.00, 100.00]), `regles_evaluees` (JSON, tableau d'objets `{cle, valeur_attendue, valeur_reelle, resultat}`), `raison` (TEXT), `duree_ms` (INTEGER ≥ 0). IF l'un de ces champs est null au moment de l'écriture, THEN THE AutomationEngine SHALL substituer une valeur par défaut typée (0 pour les numériques, chaîne vide pour les textes, tableau vide pour les JSON arrays).
6. WHEN l'Admin active ou désactive l'automatisation pour un artisan spécifique ou globalement, THE Interface_Admin_Automation SHALL enregistrer la règle correspondante dans `automation_rules` et THE AutomationEngine SHALL émettre un AutoDecision avec `approuvee = false` et `necessite_intervention_humaine = true` pour tout artisan dont l'automatisation est désactivée, indépendamment de son Score_Confiance.

---

### Requirement 2: Acceptation automatique des réservations

**User Story:** En tant qu'artisan qualifié, je veux que les réservations compatibles avec mes critères soient automatiquement acceptées, afin de réduire mon temps de traitement et d'améliorer la réactivité envers les clients.

#### Acceptance Criteria

1. WHEN l'événement `ReservationCreee` est déclenché, THE ReservationAutoAcceptListener SHALL évaluer les critères d'acceptation automatique dans un délai de 30 secondes suivant la création de la réservation.
2. IF le Score_Confiance de l'artisan est supérieur ou égal au seuil `auto_accept_score_minimum` ET que l'artisan est disponible sur le créneau demandé ET que la distance Haversine entre le client et l'artisan est inférieure ou égale à `auto_accept_zone_km_maximum` ET qu'aucun conflit de réservation n'existe, THEN THE ReservationAutoAcceptListener SHALL marquer la réservation avec `source_acceptation = 'auto'`, mettre son statut à `acceptee` et déclencher l'événement `ReservationAutoAcceptee`.
3. IF le Score_Confiance de l'artisan est inférieur au seuil `auto_accept_score_minimum` OU que l'artisan n'est pas disponible sur le créneau demandé OU que la distance dépasse `auto_accept_zone_km_maximum`, THEN THE ReservationAutoAcceptListener SHALL déclencher une notification in-app et SMS à l'artisan via `SmsNotificationService` et `NotificationService` existants, et enregistrer la décision avec `decision = 'rejetee'` dans `automation_logs`.
4. THE ReservationAutoAcceptListener SHALL vérifier l'absence de réservation de l'artisan en statut `en_cours` ou `en_cours_mission` dont le créneau chevauche celui de la nouvelle réservation avant de valider l'acceptation automatique.
5. IF une exception technique survient lors de l'évaluation d'acceptation, THEN THE ReservationAutoAcceptListener SHALL enregistrer l'exception dans les logs applicatifs, enregistrer la décision avec `decision = 'escaladee'` dans `automation_logs`, et déclencher une notification in-app et SMS à l'artisan dans un délai de 30 minutes.
6. THE AutomationEngine SHALL respecter un rate limiting de 3 tentatives d'acceptation automatique par artisan par fenêtre glissante de 60 minutes. IF la limite est dépassée, THEN THE AutomationEngine SHALL enregistrer dans `automation_logs` avec `type_action = 'rate_limit_exceeded'` et router la réservation vers le flux manuel sans déclencher d'évaluation supplémentaire.
7. WHEN une réservation est acceptée automatiquement, THE AutomationEngine SHALL notifier le client par SMS et notification in-app en utilisant le `SmsNotificationService` et le `NotificationService` existants.

---

### Requirement 3: Génération automatique de devis

**User Story:** En tant que client, je veux recevoir un devis généré automatiquement après l'acceptation de ma réservation, afin de connaître rapidement le coût estimé de la prestation.

#### Acceptance Criteria

1. WHEN l'événement `ReservationAutoAcceptee` est déclenché, IF `auto_devis_enabled` est à `true`, THEN THE DevisAutoGeneratorService SHALL générer un devis automatique et le persister dans un délai de 5 minutes suivant l'acceptation.
2. THE DevisAutoGeneratorService SHALL récupérer le template actif depuis `devis_templates` correspondant au métier de l'artisan et calculer le montant selon la formule : `tarif_base + (tarif_horaire × duree_estimee_min / 60)`. IF la réservation est marquée urgente, THEN THE DevisAutoGeneratorService SHALL multiplier le montant total par `majoration_urgence`.
3. IF aucun template actif n'existe pour le métier de l'artisan, THEN THE DevisAutoGeneratorService SHALL envoyer une notification in-app à l'artisan lui demandant de créer le devis manuellement et enregistrer `decision = 'rejetee'` dans `automation_logs`.
4. IF l'option IA est activée dans la configuration, THEN THE DevisAutoGeneratorService SHALL soumettre le devis généré au service `DiagnosticIAController` existant dans un délai de 30 secondes pour affiner le montant en fonction de la description du besoin. IF le service IA ne répond pas dans ce délai ou retourne une erreur, THEN THE DevisAutoGeneratorService SHALL conserver le montant calculé depuis le template et enregistrer `source_devis = 'auto'` sur la réservation.
5. WHEN un devis est généré automatiquement depuis un template sans affinement IA, THE DevisAutoGeneratorService SHALL enregistrer `source_devis = 'auto'` sur la réservation et déclencher l'événement `DevisGenere` avec `source = 'auto_template'`.
6. IF une exception technique survient lors de la génération du devis automatique, THEN THE DevisAutoGeneratorService SHALL envoyer une notification in-app à l'artisan pour création manuelle dans un délai de 5 minutes et enregistrer `decision = 'escaladee'` dans `automation_logs`.
7. THE Devis_Templates SHALL permettre de configurer pour chaque métier : `tarif_base` (DECIMAL ≥ 0 FCFA), `tarif_horaire` (DECIMAL ≥ 0 FCFA), `duree_estimee_min` (INTEGER entre 1 et 480 minutes), `materiaux_inclus` (BOOLEAN), et `majoration_urgence` (DECIMAL entre 1.00 et 3.00).
8. WHEN le service IA affine le montant avec succès, THE DevisAutoGeneratorService SHALL enregistrer `source_devis = 'ia'` sur la réservation et déclencher l'événement `DevisGenere` avec `source = 'auto_ia'`.

---

### Requirement 4: Validation automatique des devis

**User Story:** En tant que client, je veux que les devis de montant raisonnable provenant d'artisans de confiance soient automatiquement validés, afin de démarrer la prestation sans délai supplémentaire.

#### Acceptance Criteria

1. WHEN l'événement `DevisGenere` est déclenché, THE DevisAutoValidatorListener SHALL évaluer les critères de validation automatique du devis dans un délai de 500 millisecondes.
2. IF le montant du devis est inférieur ou égal au seuil `auto_validate_devis_montant_max` ET que le Score_Confiance de l'artisan est supérieur ou égal à `auto_validate_devis_score_minimum` ET que le ratio de litiges du client est strictement inférieur à 0.10 ET qu'aucun flag de fraude n'est détecté, THEN THE DevisAutoValidatorListener SHALL marquer le devis avec `statut = 'accepte'`, enregistrer `source_validation = 'auto'` sur la réservation et déclencher l'événement `DevisAutoValide`.
3. IF le montant du devis dépasse `auto_validate_devis_montant_max` OU que le Score_Confiance de l'artisan est inférieur à `auto_validate_devis_score_minimum` OU que le ratio de litiges du client est supérieur ou égal à 0.10 OU qu'un flag de fraude est détecté, THEN THE DevisAutoValidatorListener SHALL laisser le devis en statut `en_attente`, notifier le client par notification in-app pour validation manuelle et enregistrer `decision = 'rejetee'` dans `automation_logs`.
4. THE DevisAutoValidatorListener SHALL calculer le ratio de litiges du client comme : (nombre de litiges résolus en défaveur du client) / (nombre total de réservations terminées pour ce client). IF le client n'a aucune réservation terminée, THEN le ratio SHALL être 0.
5. WHEN un devis est validé automatiquement, THE AutomationEngine SHALL déclencher l'affichage du widget KKiapay au client pour initier le paiement du montant du devis.
6. IF une exception technique survient lors de la validation automatique, THEN THE DevisAutoValidatorListener SHALL notifier le client par notification in-app pour validation manuelle et enregistrer `decision = 'escaladee'` dans `automation_logs`.

---

### Requirement 5: Détection automatique de fin de mission

**User Story:** En tant qu'artisan, je veux que la fin de ma mission soit détectée automatiquement via ma position GPS ou la durée estimée, afin de ne pas avoir à signaler manuellement la fin de chaque intervention.

#### Acceptance Criteria

1. WHILE une réservation est en statut `en_cours_mission`, THE MissionTerminaisonDetector SHALL interroger la table `HistoriqueGeolocalisation` toutes les 2 minutes pour surveiller la position GPS de l'artisan.
2. WHEN la position GPS de l'artisan est à plus de 500 mètres de l'adresse d'intervention de manière continue pendant plus de 10 minutes consécutives (au moins 5 points GPS successifs hors zone sur la fenêtre), THE MissionTerminaisonDetector SHALL appeler `confirmerFinMission` avec `source = 'gps'` et déclencher l'événement `MissionTermineeAuto`.
3. WHEN la somme `date_debut + duree_estimee_min (en minutes) + 30 minutes de buffer` est dépassée sans confirmation manuelle de fin de mission, THE MissionTerminaisonDetector SHALL envoyer une alerte notification in-app et SMS à l'artisan et au client.
4. WHEN 2 heures supplémentaires s'écoulent après l'alerte de dépassement de durée sans confirmation de l'artisan ou du client, THE MissionTerminaisonDetector SHALL enregistrer `source_terminaison = 'auto_timeout'` sur la réservation et déclencher l'événement `MissionTermineeAuto` avec `source = 'timeout'`.
5. WHEN l'événement `MissionTermineeAuto` est déclenché, THE AutomationEngine SHALL déclencher la libération des fonds séquestrés de l'artisan via le mécanisme de séquestre existant et envoyer au client une notification SMS et in-app l'invitant à laisser un avis.
6. IF THE MissionTerminaisonDetector calcule une vitesse implicite supérieure à 200 km/h entre deux points GPS consécutifs (distance Haversine / intervalle de temps), THEN THE MissionTerminaisonDetector SHALL ignorer le second point, enregistrer une entrée dans `automation_logs` avec `type_action = 'gps_anomaly'` et conserver le dernier point GPS valide pour les calculs suivants.
7. IF aucune donnée GPS n'est disponible pour l'artisan de la réservation en cours (aucun enregistrement dans `HistoriqueGeolocalisation` depuis le début de la mission), THEN THE MissionTerminaisonDetector SHALL ignorer le mécanisme GPS et s'appuyer uniquement sur les critères de durée définis aux critères 3 et 4.

---

### Requirement 6: Résolution automatique des litiges

**User Story:** En tant que client ou artisan, je veux que les litiges aux cas clairs soient résolus automatiquement selon des règles équitables, afin d'obtenir une décision rapide sans attendre une intervention administrative.

#### Acceptance Criteria

1. WHEN l'événement `LitigeOuvert` est déclenché, THE LitigeAutoResolverService SHALL évaluer d'abord le seuil micro (critère 5), puis les preuves GPS, dans un délai de 5 minutes suivant l'ouverture du litige.
2. WHEN le `score_preuve_gps` calculé est égal à 0.0 (artisan absent de la zone d'intervention pendant toute la durée de la mission), THE LitigeAutoResolverService SHALL déclencher le remboursement du client, marquer `source_resolution = 'auto'`, enregistrer `decision = 'approuvee'` dans `automation_logs` et déclencher l'événement `LitigeResoluAuto`.
3. WHEN le `score_preuve_gps` est égal à 1.0 ET que le client n'a fourni aucune preuve documentaire (absence de fichiers joints au litige), THE LitigeAutoResolverService SHALL déclencher la libération des fonds en faveur de l'artisan, marquer `source_resolution = 'auto'`, enregistrer `decision = 'approuvee'` dans `automation_logs` et déclencher l'événement `LitigeResoluAuto`.
4. WHEN le délai défini par `auto_litige_timeout_artisan_heures` est dépassé sans qu'aucune réponse de l'artisan n'ait été enregistrée, THE LitigeAutoResolverService SHALL déclencher le remboursement automatique du client et enregistrer `decision = 'approuvee'` dans `automation_logs`.
5. WHEN le montant contesté du litige est strictement inférieur au seuil `auto_litige_seuil_micro`, THE LitigeAutoResolverService SHALL déclencher le remboursement automatique du client sans escalade vers l'admin, marquer `source_resolution = 'auto'` et enregistrer `decision = 'approuvee'` dans `automation_logs`, indépendamment des preuves GPS.
6. IF le `score_preuve_gps` est strictement compris dans l'intervalle ]0.0, 1.0[ OU que l'artisan a soumis des preuves documentaires OU que les données GPS sont contradictoires, THEN THE LitigeAutoResolverService SHALL escalader le litige vers l'Admin, envoyer une notification in-app à l'Admin et enregistrer `decision = 'escaladee'` dans `automation_logs`.
7. THE LitigeAutoResolverService SHALL calculer le `score_preuve_gps` comme la proportion du temps total de la mission pendant lequel l'artisan était présent dans un rayon de 500 mètres de l'adresse d'intervention. Le score doit être dans l'intervalle [0.0, 1.0]. IF aucune donnée GPS n'est disponible pour la mission, THEN `score_preuve_gps` SHALL être null et le litige SHALL être escaladé vers l'Admin (critère 6).
8. WHEN un litige est résolu automatiquement, THE AutomationEngine SHALL notifier le client et l'artisan par notification in-app et SMS via les services de notification existants, en incluant le détail de la décision et la raison.

---

### Requirement 7: Dégradation gracieuse et fallbacks

**User Story:** En tant qu'utilisateur, je veux que chaque défaillance du moteur d'automatisation soit transparente et n'interrompe pas mon parcours, afin de toujours pouvoir accomplir mon action manuellement si l'automatisation échoue.

#### Acceptance Criteria

1. IF une exception non gérée est levée dans un composant de l'AutomationEngine, THEN THE AutomationEngine SHALL enregistrer l'exception dans `automation_logs` avec `decision = 'escaladee'`, envoyer une alerte interne à l'Admin via notification in-app, et basculer vers l'action manuelle correspondante sans laisser la réservation ou le litige dans un état bloqué.
2. WHEN le fallback vers l'action manuelle est déclenché, THE AutomationEngine SHALL envoyer une notification in-app et SMS à la partie concernée (artisan pour acceptation/devis, client pour validation/paiement) en indiquant explicitement l'action manuelle attendue selon l'étape : acceptation → artisan notifié, génération devis → artisan notifié, validation devis → client notifié, fin mission → artisan et client notifiés, résolution litige → Admin notifié.
3. WHEN un fallback est déclenché, THE AutomationEngine SHALL respecter les délais maximaux suivants avant d'émettre la notification manuelle : 30 minutes pour l'acceptation automatique, 5 minutes pour la génération de devis, moins de 5 secondes pour la validation de devis si critères non satisfaits, 2 heures après dépassement de durée pour la fin de mission, 72 heures sans réponse artisan pour la résolution de litige.
4. IF l'AutomationEngine est désactivé globalement par l'Admin, THEN THE AutomationEngine SHALL ignorer tous les déclencheurs automatiques et router directement vers les notifications manuelles correspondantes sans émettre aucune décision `approuvee`.
5. THE AutomationEngine SHALL exposer un endpoint de healthcheck retournant le statut opérationnel (binaire: `ok` | `degraded`) de chaque composant : `AutomationConfigService`, `ReservationAutoAcceptListener`, `DevisAutoGeneratorService`, `DevisAutoValidatorListener`, `MissionTerminaisonDetector`, `LitigeAutoResolverService`. Le statut est `degraded` si le composant n'a émis aucune décision dans les 5 dernières minutes alors que des réservations actives existent.
6. WHEN un fallback est exécuté avec succès, THE AutomationEngine SHALL enregistrer dans `automation_logs` que la réservation ou le litige est passé en flux manuel, avec `decision = 'escaladee'` et la raison textuelle, garantissant qu'aucun enregistrement ne reste sans statut de décision.

---

### Requirement 8: Schéma de base de données et migrations

**User Story:** En tant que développeur, je veux que les tables de base de données nécessaires à l'automatisation soient créées via des migrations Laravel additives, afin de ne pas affecter les données existantes.

#### Acceptance Criteria

1. THE Plateforme SHALL créer la table `automation_rules` via une migration avec les colonnes : `id` (BIGINT UNSIGNED AUTO_INCREMENT PK), `cle` (VARCHAR 100, UNIQUE NOT NULL), `valeur` (JSON NOT NULL), `description` (TEXT), `categorie` (VARCHAR 50), `actif` (BOOLEAN DEFAULT TRUE), `modifie_par` (BIGINT UNSIGNED FK `users.id` NULLABLE), `created_at`, `updated_at`.
2. THE Plateforme SHALL créer la table `automation_logs` via une migration avec les colonnes : `id` (BIGINT UNSIGNED AUTO_INCREMENT PK), `type_action` (VARCHAR 100 NOT NULL), `model_type` (VARCHAR 100 NOT NULL), `model_id` (BIGINT UNSIGNED NOT NULL), `decision` (ENUM `approuvee`, `rejetee`, `escaladee` NOT NULL), `score_confiance` (DECIMAL(5,2) NOT NULL, plage [0.00, 100.00]), `regles_evaluees` (JSON NOT NULL), `raison` (TEXT NOT NULL), `duree_ms` (INTEGER NOT NULL DEFAULT 0), `created_at`, `updated_at`.
3. THE Plateforme SHALL créer la table `devis_templates` via une migration avec les colonnes : `id`, `metier` (VARCHAR 100 NOT NULL), `categorie_id` (BIGINT UNSIGNED FK nullable `categories.id`), `description_type` (TEXT), `tarif_base` (DECIMAL(10,2) NOT NULL DEFAULT 0), `tarif_horaire` (DECIMAL(10,2) NOT NULL DEFAULT 0), `duree_estimee_min` (INTEGER NOT NULL DEFAULT 60), `materiaux_inclus` (BOOLEAN DEFAULT FALSE), `majoration_urgence` (DECIMAL(5,2) NOT NULL DEFAULT 1.00, contrainte CHECK ≥ 1.00), `actif` (BOOLEAN DEFAULT TRUE), `created_at`, `updated_at`.
4. THE Plateforme SHALL ajouter à la table `reservations` via une migration additive : `adresse_intervention` (VARCHAR 500 NULLABLE), `latitude_client` (DECIMAL(10,8) NULLABLE), `longitude_client` (DECIMAL(11,8) NULLABLE), `duree_estimee_min` (INTEGER NULLABLE), `source_acceptation` (ENUM `auto`, `manuel` DEFAULT `manuel`), `source_devis` (ENUM `auto`, `ia`, `manuel` DEFAULT `manuel`), `source_validation` (ENUM `auto`, `manuel` DEFAULT `manuel`), `source_terminaison` (ENUM `auto_gps`, `auto_timeout`, `manuel` NULLABLE).
5. THE Plateforme SHALL ajouter à la table `litiges` via une migration additive : `source_resolution` (ENUM `auto`, `admin` DEFAULT `admin`), `score_preuve_gps` (DECIMAL(5,2) NULLABLE), `decision_auto` (JSON NULLABLE).
6. IF une migration additive échoue lors de l'exécution, THEN THE Plateforme SHALL effectuer un rollback complet de la migration en restaurant l'état des tables `reservations` et `litiges` à leur schéma d'avant la migration, vérifié par l'absence des colonnes ajoutées après rollback.

---

### Requirement 9: Événements Laravel du moteur d'automatisation

**User Story:** En tant que développeur, je veux que chaque décision automatique déclenche un Event Laravel typé, afin de permettre l'extension du système par de nouveaux Listeners sans modifier le moteur central.

#### Acceptance Criteria

1. WHEN une réservation est acceptée automatiquement, THE AutomationEngine SHALL dispatcher l'événement `ReservationAutoAcceptee` avec les propriétés non nulles `reservation` (instance Reservation) et `decision` (instance AutoDecision avec `approuvee = true`).
2. WHEN un devis est généré automatiquement, THE AutomationEngine SHALL dispatcher l'événement `DevisGenere` avec les propriétés non nulles `devis` (instance Devis), `reservation` (instance Reservation) et `source` (string strictement égal à `auto_template` ou `auto_ia`).
3. WHEN un devis est validé automatiquement, THE AutomationEngine SHALL dispatcher l'événement `DevisAutoValide` avec les propriétés non nulles `devis` (instance Devis) et `decision` (instance AutoDecision avec `approuvee = true`).
4. WHEN la fin de mission est confirmée automatiquement, THE AutomationEngine SHALL dispatcher l'événement `MissionTermineeAuto` avec les propriétés non nulles `reservation` (instance Reservation) et `source` (string strictement égal à `gps` ou `timeout`).
5. WHEN un litige est résolu automatiquement, THE AutomationEngine SHALL dispatcher l'événement `LitigeResoluAuto` avec les propriétés non nulles `litige` (instance Litige) et `decision` (instance AutoDecision avec `approuvee = true`).
6. THE AutoDecision SHALL être un value object PHP immutable (toutes propriétés `readonly`) avec : `approuvee` (bool), `raison` (string), `score_confiance` (float, plage [0.0, 100.0]), `necessite_intervention_humaine` (bool) et `regles_evaluees` (array, chaque élément contenant `cle`, `valeur_attendue`, `valeur_reelle`, `resultat`).
7. IF la décision AutomationEngine est `rejetee` ou `escaladee`, THEN THE AutomationEngine SHALL NE PAS dispatcher les événements `ReservationAutoAcceptee`, `DevisGenere`, `DevisAutoValide`, `MissionTermineeAuto` ou `LitigeResoluAuto`.

---

### Requirement 10: Sécurité et intégrité du moteur d'automatisation

**User Story:** En tant qu'admin, je veux que le moteur d'automatisation soit protégé contre les abus et que toutes les actions financières automatiques soient sécurisées, afin de garantir l'intégrité des transactions sur la plateforme.

#### Acceptance Criteria

1. IF le montant d'une action financière automatique (validation de devis, libération de fonds, remboursement) est supérieur à `auto_validate_devis_montant_max`, THEN THE AutomationEngine SHALL rejeter l'action, enregistrer `decision = 'rejetee'` dans `automation_logs` avec la raison `'montant_depasse_seuil'`, et router vers validation manuelle.
2. THE AutomationEngine SHALL accepter les mises à jour de position GPS uniquement depuis des requêtes authentifiées via le middleware d'authentification Laravel existant. Les positions reçues sans token d'authentification valide SHALL être ignorées sans journalisation.
3. IF la distance Haversine entre deux points GPS consécutifs d'un artisan divisée par l'intervalle de temps implique une vitesse supérieure à 200 km/h, THEN THE MissionTerminaisonDetector SHALL ignorer le second point, enregistrer une entrée dans `automation_logs` avec `type_action = 'gps_anomaly'` et utiliser le dernier point GPS valide pour les calculs suivants.
4. THE AutomationEngine SHALL garantir l'immuabilité des enregistrements `automation_logs` : toute tentative de modification ou suppression d'un log via les méthodes Eloquent `update()`, `delete()`, `save()` ou requête SQL directe SHALL être bloquée par un Observer Eloquent qui annule l'opération et journalise la tentative dans les logs applicatifs.
5. WHEN l'Admin désactive l'automatisation pour un artisan spécifique, THE AutomationEngine SHALL exclure cet artisan de toutes les évaluations automatiques futures. IF une évaluation est en cours au moment de la désactivation, THEN THE AutomationEngine SHALL terminer l'évaluation courante avec `decision = 'rejetee'` et ne plus initier d'évaluation pour cet artisan.
6. THE AutomationEngine SHALL limiter les évaluations d'acceptation automatique à 3 par artisan par fenêtre glissante de 60 minutes, comptabilisées via Redis. IF la 4e tentative survient dans la fenêtre, THEN THE AutomationEngine SHALL enregistrer dans `automation_logs` avec `type_action = 'rate_limit_exceeded'` et router la réservation vers le flux manuel sans évaluation.
7. IF une donnée GPS est reçue sans token d'authentification artisan valide, THEN THE AutomationEngine SHALL ignorer la donnée sans l'enregistrer dans `HistoriqueGeolocalisation` et retourner HTTP 401 à l'appelant.
