# Implementation Plan: ArtisanPro Features P2

## Overview

Plan d'implémentation des 7 fonctionnalités P2 d'ArtisanPro sur la stack Laravel 11 + Inertia.js + React/TypeScript + MySQL.

**Ordre d'exécution** : Migrations → Modèles → Services/Jobs → Commandes planifiées → Contrôleurs → Frontend

**Contraintes transversales issues des clarifications :**
- Modération avis : valider ou supprimer uniquement, raison 50+ chars obligatoire (Q1, Q6)
- Filtres annuaire : logique AND stricte (Q4)
- Disponibilité immédiate : masquer si aucun créneau dans les 48h (Q10)
- Escalade litige : automatique uniquement après 72h, pas de déclenchement manuel (Q16)
- Alerte litiges : seulement quand count > 10, pas >= 10 (Q17)
- Push notifications : skip si permission refusée (Q5, Q14)
- SMS : bloquer si la moindre indication de désactivation (Q15)
- Points bonus parcours : attribués indépendamment des scores quiz (Q18)
- Désactivation partenaire : masquage immédiat (Q19)
- GPS : traiter toutes les positions, afficher les mises à jour tardives (Q20, Q21)
- Fonds litige : libérables même si gelés (Q11)
- Commission : valeurs > 100% autorisées (Q12)
- Dashboard moyenne : afficher 1.0 par défaut si aucun service (Q13)
- Détection mobile paiement : largeur d'écran < 768px uniquement (Q3)
- No horizontal scroll : écrans ≥ 375px (Q2)


## Tasks

### F1 — Scoring de confiance automatique

- [x] 1. Planification du recalcul automatique du score de confiance
  Enregistrer la commande `artisans:recalculer-scores` dans le scheduler Laravel pour exécution quotidienne à minuit. La commande et le `ScoringService` existent déjà — il faut câbler le scheduler et exposer le score sur les pages artisan.
  - [x] 1.1 Enregistrer `artisans:recalculer-scores` dans `routes/console.php` avec `->daily()`
  - [x] 1.2 Vérifier que `ArtisanFicheController` passe `score_confiance` et `badge` à la vue publique
  - [x] 1.3 Afficher le score et le badge sur `resources/js/pages/artisan/profil.tsx` (section publique)
  - [x] 1.4 Afficher le score de confiance sur `resources/js/pages/artisan/dashboard.tsx`


### F2 — Modération des avis (admin)

- [x] 2. Refactoriser la modération des avis : valider ou supprimer avec raison obligatoire (50+ chars)
  L'admin ne peut que valider (rendre visible) ou supprimer définitivement un avis signalé. Toute action exige une raison d'au moins 50 caractères — le backend bloque si invalide (Q1, Q6). L'action "masquer" seule est retirée du workflow.
  - [x] 2.1 Créer la migration `add_raison_moderation_to_avis_table` (colonne `raison_moderation` text nullable)
  - [x] 2.2 Mettre à jour `Avis::$fillable` avec `raison_moderation`
  - [x] 2.3 Refactoriser `Admin\AvisController` : remplacer `masquer`/`restaurer` par `valider` (PATCH, raison min:50) et adapter `supprimer` (DELETE, raison min:50)
  - [x] 2.4 Mettre à jour les routes admin (`admin.avis.valider`, `admin.avis.supprimer`)
  - [x] 2.5 Mettre à jour `resources/js/pages/admin/avis/index.tsx` : boutons "Valider" et "Supprimer" avec champ raison et compteur de caractères (bouton désactivé < 50 chars)


### F3 — Gestion admin des litiges

- [x] 3. Migration et modèle : colonnes P2 pour les litiges
  Ajouter les colonnes manquantes à la table `litiges` pour le cycle de vie P2 : gel des fonds, escalade automatique, décision avec raison.
  - [x] 3.1 Créer la migration `add_p2_fields_to_litiges_table` (colonnes : `fonds_geles` boolean default false, `date_escalade` datetime nullable, `escalade` boolean default false, `raison_decision` text nullable, `date_decision` datetime nullable)
  - [x] 3.2 Mettre à jour le modèle `Litige` (`$fillable`, `$casts`)

- [x] 4. Service et job : cycle de vie des litiges P2
  Implémenter `LitigeService` avec gel des fonds, escalade automatique après 72h uniquement (Q16), libération des fonds même si gelés (Q11), alerte quand count > 10 (Q17), décision avec raison 50+ chars.
  - [x] 4.1 Créer `app/Services/LitigeService.php` avec `ouvrirLitige()`, `libererFonds()`, `escaladerLitigesExpires()`, `decider()`
  - [x] 4.2 Créer `app/Jobs/EscaladerLitigesExpires.php` qui appelle `LitigeService::escaladerLitigesExpires()`
  - [x] 4.3 Enregistrer le job dans le scheduler avec `->hourly()`

- [x] 5. Contrôleur admin litiges P2 et page de décision
  Ajouter les actions gel/libération/décision à `Admin\LitigeController`. Mettre à jour `admin/litiges/show.tsx` avec badge fonds gelés et formulaire de décision avec compteur.
  - [x] 5.1 Ajouter `gelerFonds()`, `libererFonds()`, `decider()` à `Admin\LitigeController`
  - [x] 5.2 Enregistrer les routes : `POST admin/litiges/{litige}/geler`, `POST admin/litiges/{litige}/liberer`, `POST admin/litiges/{litige}/decider`
  - [x] 5.3 Mettre à jour `resources/js/pages/admin/litiges/show.tsx` : badge "Fonds gelés", formulaire décision avec compteur (bouton désactivé < 50 chars)

- [x] 6. Page index litiges : bandeau d'alerte et indicateur d'escalade
  Afficher un bandeau d'alerte rouge si litiges ouverts > 10 (Q17). Mettre en évidence les litiges escaladés.
  - [x] 6.1 Mettre à jour `LitigeController::index()` pour passer `stats.ouverts` et supporter le filtre `escalade=true`
  - [x] 6.2 Mettre à jour `resources/js/pages/admin/litiges/index.tsx` : bandeau d'alerte si `stats.ouverts > 10`, badge "Escaladé", filtre "Escaladés"


### F4 — Notifications système

- [x] 7. Migration et modèle : préférences de notification utilisateur
  Ajouter les colonnes de consentement push et SMS à la table `utilisateurs`.
  - [x] 7.1 Créer la migration `add_notification_preferences_to_utilisateurs_table` (colonnes : `push_notifications_enabled` boolean default true, `sms_notifications_enabled` boolean default true, `push_permission_status` enum('granted','denied','default') default 'default')
  - [x] 7.2 Mettre à jour le modèle `User` (`$fillable`, `$casts`)

- [x] 8. NotificationService P2 : push et SMS avec vérification des préférences
  Étendre `NotificationService` pour push (skip si refusé, Q5/Q14) et SMS (bloquer si désactivé, Q15). Les notifications in-app sont toujours créées.
  - [x] 8.1 Ajouter `envoyerPush()`, `envoyerSms()`, `notifierAvecCanaux()` à `app/Services/NotificationService.php`
  - [x] 8.2 Mettre à jour `SmsNotificationService` pour vérifier `sms_notifications_enabled` avant envoi
  - [x] 8.3 Vérifier la configuration Laravel Echo / Pusher ou Reverb dans `.env` et `config/broadcasting.php`

- [ ] 9. Frontend : préférences de notification et permission push
  Ajouter les toggles de préférences dans les paramètres. Demander la permission push via l'API Notification du navigateur. Afficher le compteur de non-lues dans la navbar.
  - [-] 9.1 Créer la route `PATCH /settings/notification-preferences` et le contrôleur `Settings\NotificationPreferencesController`
  - [ ] 9.2 Ajouter les toggles push/SMS dans `resources/js/pages/settings/profile.tsx` (ou nouvelle page `notification-preferences.tsx`)
  - [ ] 9.3 Implémenter la demande de permission push (`Notification.requestPermission()`) et synchroniser avec le backend
  - [ ] 9.4 Afficher le badge de notifications non lues dans le layout principal (appel à `/notifications/compteur`)


### F5 — Académie / Formation (pages artisan)

- [x] 10. Migrations et modèles : parcours, quiz, points de formation
  Créer les tables pour les parcours (groupes de formations), les quiz, et les points bonus. Les points bonus sont attribués à la complétion du parcours indépendamment des scores quiz (Q18).
  - [x] 10.1 Créer la migration `create_academie_parcours_table` (id, titre string 200, description text nullable, points_bonus int default 0, timestamps)
  - [x] 10.2 Créer la migration `create_parcours_formation_table` (pivot : id_parcours FK, id_formation FK, ordre int default 0, PK composite)
  - [x] 10.3 Créer la migration `create_artisan_parcours_table` (pivot : id_artisan FK, id_parcours FK, date_completion datetime nullable, points_attribues int default 0, PK composite)
  - [x] 10.4 Créer la migration `create_academie_quiz_table` (id, id_formation FK, question text, reponses json, bonne_reponse int, timestamps)
  - [x] 10.5 Créer la migration `add_quiz_fields_to_artisan_formation_table` (score_quiz tinyint nullable, tentatives int default 0)
  - [x] 10.6 Créer la migration `add_points_formation_to_artisans_table` (points_formation int default 0)
  - [x] 10.7 Créer les modèles `app/Models/AcademieParcours.php` et `app/Models/AcademieQuiz.php` avec les relations
  - [x] 10.8 Mettre à jour `AcademieFormation` (relations `quiz()`, `parcours()`) et `Artisan` (`points_formation` dans `$fillable`)

- [ ] 11. Service académie : quiz (seuil 70%) et points bonus de parcours
  Implémenter `AcademieService` avec validation des quiz (seuil 70%) et attribution des points bonus à la complétion d'un parcours (Q18 : indépendamment des scores individuels).
  - [x] 11.1 Créer `app/Services/AcademieService.php` avec `soumettreQuiz()` (calcul score, enregistrement, incrémentation tentatives) et `verifierCompletionParcours()` (attribution points bonus si toutes formations complétées)
  - [-] 11.2 Écrire les tests unitaires pour `soumettreQuiz` (seuil 70%) et `verifierCompletionParcours` (points bonus indépendants du score quiz)

- [ ] 12. Contrôleur et routes académie P2
  Étendre `ArtisanAcademyController` pour les parcours et les quiz.
  - [-] 12.1 Mettre à jour `ArtisanAcademyController::__invoke()` pour retourner formations, parcours, et `points_formation` de l'artisan
  - [ ] 12.2 Ajouter la méthode `soumettreQuiz(Request $request, AcademieQuiz $quiz)` au contrôleur
  - [ ] 12.3 Mettre à jour `completer()` pour appeler `AcademieService::verifierCompletionParcours()` après marquage
  - [ ] 12.4 Enregistrer les routes : `POST artisan/academy/quiz/{quiz}/soumettre`, `POST artisan/academy/formations/{formation}/completer`

- [ ] 13. Frontend académie P2 : parcours, quiz et points
  Mettre à jour `artisan/academy.tsx` pour afficher les parcours, les quiz intégrés, et le total de points.
  - [ ] 13.1 Mettre à jour les types TypeScript (Formation, Parcours, Quiz, résultat quiz)
  - [ ] 13.2 Ajouter la section "Parcours" avec barre de progression par parcours
  - [ ] 13.3 Implémenter le composant quiz (modal ou inline) avec affichage du score après soumission
  - [ ] 13.4 Afficher le total de points de l'artisan dans le header de la page
  - [ ] 13.5 Afficher un message de félicitations avec les points bonus lors de la complétion d'un parcours


### F6 — Géolocalisation temps réel (historique)

- [x] 14. Backend géolocalisation P2 : traitement universel et mises à jour tardives
  Traiter toutes les positions sans filtrage géographique (Q20). Afficher les mises à jour tardives telles quelles (Q21). Augmenter la limite d'historique à 200 entrées.
  - [x] 14.1 Mettre à jour `ArtisanGeolocalisationController::enregistrer()` : retourner `date_position` formatée dans la réponse JSON, augmenter la limite à 200
  - [x] 14.2 Vérifier que `index()` ne filtre pas par date (toutes les entrées sont affichées, Q21)

- [ ] 15. Frontend géolocalisation P2 : temps réel et mises à jour tardives
  Afficher les nouvelles positions en tête de liste sans rechargement. Indicateur de délai depuis la dernière mise à jour. Pas de défilement horizontal ≥ 375px (Q2).
  - [-] 15.1 Mettre à jour `resources/js/pages/artisan/geolocalisation.tsx` : état local pour les nouvelles positions, ajout en tête de liste après enregistrement
  - [ ] 15.2 Ajouter un indicateur visuel du délai depuis la dernière mise à jour (ex: "Il y a 45s")
  - [ ] 15.3 Appliquer `overflow-x-hidden` sur le conteneur principal pour éviter le défilement horizontal

### F7 — Partenaires (pages basiques)

- [x] 16. Backend partenaires P2 : désactivation immédiate et masquage instantané
  Vérifier et documenter que la désactivation masque immédiatement le partenaire (Q19). Améliorer l'interface admin avec toggle et confirmation.
  - [x] 16.1 Vérifier que `PartenairesController` ne met pas en cache les résultats (pas de `Cache::remember`)
  - [x] 16.2 Mettre à jour `resources/js/pages/admin/partenaires/index.tsx` : toggle actif/inactif avec message de confirmation "Ce partenaire sera immédiatement masqué pour tous les utilisateurs"
  - [x] 16.3 Ajouter un badge de statut clair (Actif/Inactif) sur chaque ligne de partenaire

- [ ] 17. Page publique partenaires : affichage et filtrage par type
  Créer ou améliorer `portal/partenaires.tsx` avec filtrage par type et mise en page responsive.
  - [-] 17.1 Créer ou mettre à jour `resources/js/pages/portal/partenaires.tsx` avec cartes partenaires (nom, description, logo, site web, contact)
  - [x] 17.2 Mettre à jour `PartenairesController` pour passer les types disponibles pour le filtre
  - [-] 17.3 Appliquer `overflow-x-hidden` pour éviter le défilement horizontal ≥ 375px


## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence des exigences spécifiques pour la traçabilité
- Les points de contrôle (checkpoints) assurent une validation incrémentale
- L'ordre d'exécution recommandé : migrations → modèles → services/jobs → scheduler → contrôleurs → frontend
- Les contraintes transversales (raison 50+ chars, escalade auto 72h, skip push si refusé, etc.) sont documentées dans l'Overview et doivent être respectées dans chaque tâche concernée
- Les tâches 1.1, 1.2 et 1.3 sont déjà complétées (cochées) — ne pas les réimplémenter
- F3 (litiges) et F4 (notifications) partagent des dépendances sur les migrations utilisateurs/litiges — exécuter les migrations avant les services

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["2.1", "3.1", "7.1", "10.1", "10.2", "10.3", "10.4", "10.5", "10.6"]
    },
    {
      "id": 1,
      "tasks": ["1.4", "2.2", "3.2", "7.2", "10.7", "10.8", "14.1", "16.1"]
    },
    {
      "id": 2,
      "tasks": ["2.3", "4.1", "8.1", "8.2", "8.3", "11.1", "14.2", "16.2", "16.3", "17.2"]
    },
    {
      "id": 3,
      "tasks": ["2.4", "4.2", "9.1", "11.2", "12.1", "15.1", "17.1", "17.3"]
    },
    {
      "id": 4,
      "tasks": ["2.5", "4.3", "5.1", "6.1", "9.2", "9.3", "9.4", "12.2", "12.3", "13.1", "15.2", "15.3"]
    },
    {
      "id": 5,
      "tasks": ["5.2", "5.3", "6.2", "12.4", "13.2", "13.3", "13.4", "13.5"]
    }
  ]
}
```
