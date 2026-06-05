# Implementation Plan: Automation Workflow (ArtisanPro)

## Overview

Plan d'implémentation du moteur d'automatisation Laravel pour ArtisanPro. Couvre le cycle de vie complet d'une réservation : acceptation automatique, génération de devis, validation, détection de fin de mission et résolution de litiges. Chaque étape intègre un fallback vers l'action manuelle, un journal d'audit complet et des règles configurables par l'admin.

**Stack** : Laravel (PHP), MySQL, Redis, PestPHP, `pest-plugin-faker`

**Ordre d'exécution recommandé** : Migrations → Value Object + Events → Services core → Listeners/Jobs → UI Admin → Healthcheck → Tests

---

## Tasks

- [x] 1. Créer les migrations de base de données
  - Créer `database/migrations/..._create_automation_rules_table.php` : colonnes `id`, `cle` (VARCHAR 100 UNIQUE NOT NULL), `valeur` (JSON NOT NULL), `description` (TEXT), `categorie` (VARCHAR 50), `actif` (BOOLEAN DEFAULT TRUE), `modifie_par` (FK `users.id` NULLABLE), `created_at`, `updated_at`
  - Créer `database/migrations/..._create_automation_logs_table.php` : colonnes `id`, `type_action` (VARCHAR 100 NOT NULL), `model_type` (VARCHAR 100 NOT NULL), `model_id` (BIGINT UNSIGNED NOT NULL), `decision` (ENUM `approuvee`,`rejetee`,`escaladee` NOT NULL), `score_confiance` (DECIMAL(5,2) NOT NULL), `regles_evaluees` (JSON NOT NULL), `raison` (TEXT NOT NULL), `duree_ms` (INTEGER NOT NULL DEFAULT 0), `created_at`, `updated_at`
  - Créer `database/migrations/..._create_devis_templates_table.php` : colonnes `id`, `metier` (VARCHAR 100 NOT NULL), `categorie_id` (FK `categories.id` NULLABLE), `description_type` (TEXT), `tarif_base` (DECIMAL(10,2) NOT NULL DEFAULT 0), `tarif_horaire` (DECIMAL(10,2) NOT NULL DEFAULT 0), `duree_estimee_min` (INTEGER NOT NULL DEFAULT 60), `materiaux_inclus` (BOOLEAN DEFAULT FALSE), `majoration_urgence` (DECIMAL(5,2) NOT NULL DEFAULT 1.00, CHECK ≥ 1.00), `actif` (BOOLEAN DEFAULT TRUE), timestamps
  - Créer `database/migrations/..._add_automation_fields_to_reservations_table.php` : ajouter `adresse_intervention` (VARCHAR 500 NULLABLE), `latitude_client` (DECIMAL(10,8) NULLABLE), `longitude_client` (DECIMAL(11,8) NULLABLE), `duree_estimee_min` (INTEGER NULLABLE), `source_acceptation` (ENUM `auto`,`manuel` DEFAULT `manuel`), `source_devis` (ENUM `auto`,`ia`,`manuel` DEFAULT `manuel`), `source_validation` (ENUM `auto`,`manuel` DEFAULT `manuel`), `source_terminaison` (ENUM `auto_gps`,`auto_timeout`,`manuel` NULLABLE)
  - Créer `database/migrations/..._add_automation_fields_to_litiges_table.php` : ajouter `source_resolution` (ENUM `auto`,`admin` DEFAULT `admin`), `score_preuve_gps` (DECIMAL(5,2) NULLABLE), `decision_auto` (JSON NULLABLE)
  - Chaque migration doit implémenter `down()` pour rollback complet (Req 8.6)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 2. Créer les modèles Eloquent et le value object AutoDecision
  - [x] 2.1 Créer `app/Models/AutomationRule.php` avec `$fillable`, `$casts` (valeur → array), relation `modifiePar()` vers User, scope `actif()`
    - _Requirements: 1.1, 8.1_

  - [x] 2.2 Créer `app/Models/AutomationLog.php` avec `$fillable`, `$casts`, et Eloquent Observer `AutomationLogObserver` bloquant `updating`, `deleting`, `saving` sur enregistrements existants — journalise la tentative dans `Log::warning`
    - _Requirements: 10.4_

  - [x] 2.3 Écrire le test de propriété pour l'immuabilité de l'audit trail
    - **Property 18 : Immuabilité de l'audit trail**
    - Générer N AutomationLog via factory, tenter `update()`, `delete()`, `save()` sur chacun, vérifier que l'enregistrement en base est inchangé
    - **Validates: Requirements 10.4**

  - [x] 2.4 Créer `app/Models/DevisTemplate.php` avec `$fillable`, `$casts`, scope `actif()`, scope `pourMetier(string $metier)`
    - _Requirements: 3.7, 8.3_

  - [x] 2.5 Mettre à jour `app/Models/Reservation.php` : ajouter les nouveaux champs dans `$fillable` et `$casts` (enums source_*)
    - _Requirements: 8.4_

  - [x] 2.6 Mettre à jour `app/Models/Litige.php` : ajouter `source_resolution`, `score_preuve_gps`, `decision_auto` dans `$fillable` et `$casts`
    - _Requirements: 8.5_

  - [x] 2.7 Créer `app/ValueObjects/AutoDecision.php` — classe PHP `readonly` avec propriétés : `bool $approuvee`, `string $raison`, `float $score_confiance`, `bool $necessite_intervention_humaine`, `array $regles_evaluees`
    - Ajouter méthodes `toArray()` et `static fromArray(array $data): self`
    - _Requirements: 9.6_

- [x] 3. Créer les 5 nouveaux Events Laravel
  - Créer `app/Events/ReservationAutoAcceptee.php` avec propriétés `readonly Reservation $reservation` et `readonly AutoDecision $decision`
  - Créer `app/Events/DevisGenere.php` avec propriétés `readonly Devis $devis`, `readonly Reservation $reservation`, `readonly string $source` (`auto_template` | `auto_ia`)
  - Créer `app/Events/DevisAutoValide.php` avec propriétés `readonly Devis $devis` et `readonly AutoDecision $decision`
  - Créer `app/Events/MissionTermineeAuto.php` avec propriétés `readonly Reservation $reservation` et `readonly string $source` (`gps` | `timeout`)
  - Créer `app/Events/LitigeResoluAuto.php` avec propriétés `readonly Litige $litige` et `readonly AutoDecision $decision`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4. Implémenter AutomationConfigService avec cache Redis
  - [x] 4.1 Créer `app/Services/AutomationConfigService.php` implémentant `getRegle(string $cle, mixed $defaut = null): mixed` (lecture Redis → DB → cache), `setRegle(string $cle, mixed $valeur): void` (validation plage + écriture DB + invalidation cache), `getReglesActives(): Collection`
    - Valider les plages pour les 8 règles configurables de Req 1.3 ; rejeter et lever `ValidationException` si hors plage
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 4.2 Écrire le test de propriété pour le round-trip de persistance
    - **Property 1 : AutomationConfig — Round-trip de persistance**
    - Générer des paires (clé, valeur) valides aléatoires, stocker via `setRegle`, lire via `getRegle`, vérifier égalité stricte
    - **Validates: Requirements 1.1, 1.2, 3.7**

- [ ] 5. Implémenter AutomationEngine (coordinateur central)
  - [x] 5.1 Créer `app/Services/AutomationEngine.php` avec injection de `AutomationConfigService`, `SmsNotificationService`, `NotificationService`
    - Méthodes : `evaluerAcceptationAuto(Reservation)`, `genererDevisAuto(Reservation)`, `evaluerValidationDevisAuto(Devis)`, `detecterFinMission(Reservation)`, `resoudreLitigeAuto(Litige)`
    - Chaque méthode encapsulée dans un bloc `try/catch` : en cas d'exception → log `automation_logs` avec `decision = 'escaladee'` + notification admin
    - Respecter rate limiting Redis : 3 tentatives / artisan / 60 min (Req 2.6, 10.6) ; 4e tentative → `type_action = 'rate_limit_exceeded'`
    - Si `AutomationEngine` désactivé globalement → aucune décision `approuvee` émise (Req 7.4)
    - Si artisan désactivé → `AutoDecision(approuvee: false, necessite_intervention_humaine: true)` systématiquement (Req 1.6, 10.5)
    - Méthode privée `journaliser(string $typeAction, Model $model, AutoDecision $decision, int $dureeMs)` : substituer valeurs par défaut pour champs null (Req 1.5)
    - _Requirements: 1.5, 1.6, 2.6, 7.1, 7.4, 10.5, 10.6_

  - [x] 5.2 Écrire le test de propriété pour la complétude des logs
    - **Property 2 : Complétude des logs d'automatisation**
    - Pour N décisions générées (types aléatoires), vérifier que chaque entrée `automation_logs` a tous les champs requis non nuls
    - **Validates: Requirements 1.5**

  - [ ] 5.3 Écrire le test de propriété pour l'exclusion des artisans désactivés
    - **Property 3 : Exclusion des artisans désactivés**
    - Pour tout artisan avec rule `disabled = true`, score aléatoire ∈ [0,100], vérifier `approuvee = false` ET `necessite_intervention_humaine = true`
    - **Validates: Requirements 1.6, 10.5**

  - [ ] 5.4 Écrire le test de propriété pour le rate limiting
    - **Property 6 : Invariant de rate limiting**
    - Simuler 4 évaluations pour le même artisan dans la même fenêtre d'une heure, vérifier que la 4e est rejetée avec `type_action = 'rate_limit_exceeded'`
    - **Validates: Requirements 2.6, 10.6**

  - [ ] 5.5 Écrire le test de propriété pour la dégradation gracieuse
    - **Property 16 : Dégradation gracieuse — invariant de fallback**
    - Injecter des composants qui lèvent une exception, vérifier que `decision = 'escaladee'` est journalisée ET que la réservation/litige n'est pas bloqué
    - **Validates: Requirements 7.1, 7.4**

  - [ ] 5.6 Écrire le test de propriété pour la sécurité financière
    - **Property 17 : Sécurité des actions financières automatiques**
    - Pour tout montant > `auto_validate_devis_montant_max`, vérifier que toute action financière automatique est rejetée avec `decision = 'rejetee'`
    - **Validates: Requirements 4.2, 10.1**

  - [ ] 5.7 Écrire le test de propriété pour le dispatch des événements
    - **Property 19 : Dispatch d'événements après décision approuvée**
    - Pour chaque type de décision `approuvee`, vérifier que l'event correspondant est dispatché avec propriétés non nulles et source dans l'ensemble autorisé
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 6. Checkpoint — Valider les fondations
  - Exécuter les migrations (`php artisan migrate`)
  - Vérifier que `AutomationConfigService`, `AutomationEngine`, `AutoDecision` et les 5 Events sont fonctionnels
  - Assurer que tous les tests passent, poser des questions si nécessaire.

- [x] 7. Implémenter ReservationAutoAcceptListener
  - [x] 7.1 Créer `app/Listeners/ReservationAutoAcceptListener.php` écoutant `ReservationCreee`
    - Évaluer dans les 30 secondes (Req 2.1) : score ≥ `auto_accept_score_minimum`, disponibilité créneau, distance Haversine ≤ `auto_accept_zone_km_maximum`, absence de conflit (Req 2.4)
    - Si accepté : `source_acceptation = 'auto'`, statut `acceptee`, dispatch `ReservationAutoAcceptee`, notifier client SMS + in-app (Req 2.7)
    - Si rejeté : notifier artisan SMS + in-app, log `decision = 'rejetee'` (Req 2.3)
    - Si exception : log `decision = 'escaladee'`, notification artisan dans 30 min (Req 2.5)
    - Méthodes privées : `verifierDisponibilite()`, `verifierZoneGeographique()` (Haversine), `verifierScoreMinimum()`, `verifierAbsenceConflit()`
    - Enregistrer dans `EventServiceProvider`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_

  - [x] 7.2 Écrire le test de propriété pour la cohérence de la décision d'acceptation
    - **Property 4 : Cohérence de la décision d'acceptation automatique**
    - Pour tout triplet (score, distance, disponibilite) aléatoire, vérifier que la décision est `approuvee` SSI toutes les conditions sont remplies simultanément
    - **Validates: Requirements 2.2, 2.3**

  - [x] 7.3 Écrire le test de propriété pour l'invariant d'absence de conflit
    - **Property 5 : Invariant d'absence de conflit de réservation**
    - Pour un artisan avec réservation active chevauchante, quel que soit le score (0–100) ou la distance, vérifier que la décision est toujours `rejetee`
    - **Validates: Requirements 2.4**

- [ ] 8. Implémenter DevisAutoGeneratorService
  - [ ] 8.1 Créer `app/Services/DevisAutoGeneratorService.php`
    - `genererDepuisTemplate(Reservation)` : récupérer template actif via `DevisTemplate::actif()->pourMetier()`, calculer `tarif_base + (tarif_horaire × duree_estimee_min / 60)`, appliquer `majoration_urgence` si réservation urgente (Req 3.2)
    - Si pas de template actif : notifier artisan in-app, log `decision = 'rejetee'` (Req 3.3)
    - `affinerAvecIA(Devis, string $description)` : appeler `DiagnosticIAController` en 30s max, timeout → conserver montant template, `source_devis = 'auto'` (Req 3.4)
    - Après génération template sans IA : `source_devis = 'auto'`, dispatch `DevisGenere` avec `source = 'auto_template'` (Req 3.5)
    - Après IA réussie : `source_devis = 'ia'`, dispatch `DevisGenere` avec `source = 'auto_ia'` (Req 3.8)
    - Si exception : notifier artisan in-app pour création manuelle dans 5 min, log `decision = 'escaladee'` (Req 3.6)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ] 8.2 Écrire le test de propriété pour l'exactitude du calcul de montant
    - **Property 7 : Exactitude du calcul de montant de devis**
    - Pour tout tuple (tarif_base, tarif_horaire, duree_estimee_min, majoration_urgence) valide, vérifier que `montant = tarif_base + (tarif_horaire × duree_estimee_min / 60) × majoration_urgence`
    - **Validates: Requirements 3.2**

  - [ ] 8.3 Écrire le test de propriété pour la source du devis généré
    - **Property 8 : Invariant de source du devis généré automatiquement**
    - Pour tout devis généré depuis template, vérifier `source_devis ∈ {'auto', 'auto_ia'}` ET event `DevisGenere` dispatché avec source correspondante
    - **Validates: Requirements 3.4, 3.5**

- [ ] 9. Implémenter DevisAutoValidatorListener
  - [ ] 9.1 Créer `app/Listeners/DevisAutoValidatorListener.php` écoutant `DevisGenere`
    - Évaluer en 500ms (Req 4.1) : montant ≤ `auto_validate_devis_montant_max`, score artisan ≥ `auto_validate_devis_score_minimum`, ratio litiges client < 0.10 (Req 4.4), aucun flag fraude
    - Calcul ratio : `litiges_perdus_client / total_reservations_terminees_client` ; si N=0 → ratio = 0 (Req 4.4)
    - Si validé : `statut = 'accepte'`, `source_validation = 'auto'`, dispatch `DevisAutoValide`, déclencher affichage widget KKiapay (Req 4.5)
    - Si rejeté : laisser `statut = 'en_attente'`, notifier client in-app, log `decision = 'rejetee'` (Req 4.3)
    - Si exception : notifier client in-app, log `decision = 'escaladee'` (Req 4.6)
    - Enregistrer dans `EventServiceProvider`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 9.2 Écrire le test de propriété pour la cohérence de la validation de devis
    - **Property 9 : Cohérence de la décision de validation automatique de devis**
    - Pour tout quadruplet (montant, score_artisan, ratio_litiges, flag_fraude) aléatoire, vérifier que la décision est `approuvee` SSI les 4 conditions sont remplies simultanément
    - **Validates: Requirements 4.2, 4.3**

  - [ ] 9.3 Écrire le test de propriété pour le calcul du ratio de litiges client
    - **Property 10 : Exactitude du calcul du ratio de litiges client**
    - Pour tout (N, L) avec L ≤ N, vérifier `ratio = L/N` ; pour N=0 vérifier `ratio = 0`
    - **Validates: Requirements 4.4**

- [ ] 10. Checkpoint — Valider le flux Réservation → Devis → Validation
  - Exécuter `php artisan test --filter AutomationEngineTest`
  - Exécuter `php artisan test --filter DevisAutoGeneratorTest`
  - Assurer que tous les tests passent, poser des questions si nécessaire.

- [x] 11. Implémenter MissionTerminaisonDetector (Job planifié)
  - [x] 11.1 Créer `app/Jobs/MissionTerminaisonDetector.php` implémentant `ShouldQueue`
    - Scheduler : toutes les 2 minutes sur réservations en statut `en_cours_mission` (Req 5.1)
    - `detecterViaGPS(Reservation)` : interroger `HistoriqueGeolocalisation`, filtrer anomalies GPS (vitesse > 200 km/h → ignorer point P2 + log `type_action = 'gps_anomaly'`) (Req 5.6, 10.3), détecter ≥ 5 points consécutifs hors zone 500m sur fenêtre 10 min (Req 5.2)
    - `detecterViaDuree(Reservation)` : vérifier `date_debut + duree_estimee_min×60 + 1800s` dépassé → alerte SMS + in-app (Req 5.3) ; +2h supplémentaires sans confirmation → `source_terminaison = 'auto_timeout'`, dispatch `MissionTermineeAuto` avec `source = 'timeout'` (Req 5.4)
    - Si aucune donnée GPS : ignorer mécanisme GPS, utiliser uniquement durée (Req 5.7)
    - `confirmerFinMission(Reservation, string $source)` : `source_terminaison = 'auto_gps'`, dispatch `MissionTermineeAuto` avec `source = 'gps'`, libérer fonds séquestrés, notifier client SMS + in-app (Req 5.5)
    - Enregistrer le job dans `routes/console.php` avec `->everyTwoMinutes()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 11.2 Écrire le test de propriété pour la détection GPS de départ de zone
    - **Property 11 : Détection GPS de départ de zone**
    - Pour toute séquence GPS où ≥ 5 points consécutifs sont hors zone 500m sur 10 min, vérifier `detecterViaGPS = true` ; si au moins 1 point est dans la zone, vérifier `false`
    - **Validates: Requirements 5.2**

  - [x] 11.3 Écrire le test de propriété pour la détection du dépassement de durée
    - **Property 12 : Détection du dépassement de durée estimée**
    - Pour tout (timestamp_actuel, debut, duree_min) tel que actuel > debut + duree×60 + 1800s, vérifier `detecterViaDuree = true` ; sinon `false`
    - **Validates: Requirements 5.3, 5.4**

  - [x] 11.4 Écrire le test de propriété pour le filtre de plausibilité GPS
    - **Property 13 : Filtre de plausibilité GPS**
    - Pour toute paire (P1, P2, T1, T2) avec vitesse implicite > 200 km/h, vérifier que P2 est rejeté, anomalie journalisée et dernier point valide conservé
    - **Validates: Requirements 5.6, 10.3**

- [ ] 12. Implémenter LitigeAutoResolverService
  - [ ] 12.1 Créer `app/Services/LitigeAutoResolverService.php`
    - Évaluer dans 5 min après `LitigeOuvert` : d'abord seuil micro, puis preuves GPS (Req 6.1)
    - `evaluerPreuvesGPS(Litige)` : calculer `score_preuve_gps` = proportion du temps mission où artisan est dans 500m de l'adresse. Score dans [0.0, 1.0] ; si aucune donnée GPS → `null` → escalader (Req 6.7)
    - `appliquerRegles(Litige)` :
      - `score_preuve_gps = 0` → remboursement client, `decision = 'approuvee'` (Req 6.2)
      - `score_preuve_gps = 1` ET pas de preuve documentaire client → libération artisan, `decision = 'approuvee'` (Req 6.3)
      - Dépassement `auto_litige_timeout_artisan_heures` sans réponse artisan → remboursement client, `decision = 'approuvee'` (Req 6.4)
      - Montant < `auto_litige_seuil_micro` → remboursement client sans escalade, `decision = 'approuvee'` (Req 6.5)
      - Score ∈ ]0,1[ OU preuves contradictoires → escalade admin, `decision = 'escaladee'` (Req 6.6)
    - `executerDecisionFinanciere(Litige, AutoDecision)` : appeler mécanismes wallet existants, notifier client + artisan SMS + in-app (Req 6.8)
    - Créer listener sur `LitigeOuvert` → appeler `LitigeAutoResolverService`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ] 12.2 Écrire le test de propriété pour les règles de résolution de litiges
    - **Property 14 : Règles de résolution automatique des litiges**
    - Pour tout (score_gps, preuves_client, timeout_ecoule, montant) aléatoire, vérifier que chaque combinaison produit la décision attendue selon la table de règles
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6**

  - [ ] 12.3 Écrire le test de propriété pour le calcul du score de preuve GPS
    - **Property 15 : Exactitude du calcul du score de preuve GPS**
    - Pour toute trace GPS avec proportion connue de temps en zone, vérifier `score_preuve_gps ≈ proportion` avec précision ≤ 0.01, score ∈ [0.0, 1.0]
    - **Validates: Requirements 6.7**

- [ ] 13. Checkpoint — Valider le flux Mission + Litige
  - Exécuter `php artisan test --filter LitigeAutoResolverTest`
  - Exécuter `php artisan test --filter AutoLitigeWorkflowTest`
  - Assurer que tous les tests passent, poser des questions si nécessaire.

- [ ] 14. Créer l'interface admin de configuration des règles d'automatisation
  - [ ] 14.1 Créer `app/Http/Controllers/Admin/AutomationController.php` avec `index()` (liste règles actives), `update(Request $request, AutomationRule $rule)` (validation plage + appel `AutomationConfigService::setRegle`)
    - Routes : `GET admin/automation`, `PATCH admin/automation/{rule}`
    - Protéger par middleware `auth` + `role:admin`
    - _Requirements: 1.1, 1.2, 1.3, 1.6_

  - [ ] 14.2 Créer `resources/js/pages/admin/automation/index.tsx` : tableau des 8 règles configurables avec champ de saisie et validation côté client des plages (désactiver bouton si hors plage), indicateur de la dernière modification
    - _Requirements: 1.3, 1.6_

- [ ] 15. Créer l'endpoint de healthcheck
  - [ ] 15.1 Créer `app/Http/Controllers/Admin/AutomationHealthController.php` avec `__invoke()` retournant JSON `{component: string, status: 'ok'|'degraded'}[]`
    - Statut `degraded` si le composant n'a émis aucune décision dans les 5 dernières minutes alors que des réservations actives existent (Req 7.5)
    - Composants à vérifier : `AutomationConfigService`, `ReservationAutoAcceptListener`, `DevisAutoGeneratorService`, `DevisAutoValidatorListener`, `MissionTerminaisonDetector`, `LitigeAutoResolverService`
    - Route : `GET admin/automation/healthcheck`, protégée par middleware `auth`
    - _Requirements: 7.5_

- [ ] 16. Écrire les tests unitaires et feature
  - [ ] 16.1 Créer `tests/Unit/AutomationEngineTest.php` : tester `evaluerAcceptationAuto` (score, zone, montant), fallback sur exception, désactivation globale
    - _Requirements: 2.2, 7.1, 7.4_

  - [ ] 16.2 Créer `tests/Unit/DevisAutoGeneratorTest.php` : calcul montant depuis template, majoration urgence, template absent → notification, timeout IA → fallback template
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ] 16.3 Créer `tests/Unit/LitigeAutoResolverTest.php` : cas type GPS=0, GPS=1 sans preuve, timeout artisan, seuil micro, score ambigu → escalade
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 16.4 Créer `tests/Feature/AutoWorkflowTest.php` : scénario complet `ReservationCreee` → `ReservationAutoAcceptee` → `DevisGenere` → `DevisAutoValide` → `MissionTermineeAuto`, vérifier statuts et logs
    - _Requirements: 2.2, 3.1, 4.2, 5.2_

  - [ ] 16.5 Créer `tests/Feature/AutoLitigeWorkflowTest.php` : scénario litige auto-résolu (GPS=0) vs escaladé (GPS ambigu), vérifier `LitigeResoluAuto` dispatché correctement
    - _Requirements: 6.2, 6.6_

  - [ ] 16.6 Créer `tests/Feature/AutoFallbackTest.php` : vérifier que chaque composant bascule vers action manuelle en cas d'exception, délais de notification respectés
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 17. Checkpoint final — Tous les tests passent
  - Exécuter `php artisan test` pour vérifier l'ensemble de la suite
  - Exécuter les migrations sur environnement de test
  - Assurer que tous les tests passent, poser des questions si nécessaire.

---

## Notes

- Les sous-tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence des exigences spécifiques pour la traçabilité
- Les tests de propriété utilisent PestPHP avec `pest-plugin-faker` — chaque property est sa propre sous-tâche
- L'`AutomationLogObserver` (tâche 2.2) doit être enregistré dans `AutomationLog::boot()` ou via `AppServiceProvider`
- Les listeners doivent être enregistrés dans `app/Providers/EventServiceProvider.php`
- Le rate limiting utilise `Cache::increment` Redis avec TTL 3600s — ne pas utiliser le middleware HTTP Rate Limiter
- Les tests de feature utilisent `RefreshDatabase` et `Event::fake()` pour isoler les dispatches

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.4", "2.5", "2.6"] },
    { "id": 1, "tasks": ["2.2", "2.7", "3"] },
    { "id": 2, "tasks": ["2.3", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "7.1", "8.1", "9.1"] },
    { "id": 5, "tasks": ["7.2", "7.3", "8.2", "8.3", "9.2", "9.3", "11.1", "12.1", "14.1"] },
    { "id": 6, "tasks": ["11.2", "11.3", "11.4", "12.2", "12.3", "14.2", "15.1"] },
    { "id": 7, "tasks": ["16.1", "16.2", "16.3"] },
    { "id": 8, "tasks": ["16.4", "16.5", "16.6"] }
  ]
}
```
