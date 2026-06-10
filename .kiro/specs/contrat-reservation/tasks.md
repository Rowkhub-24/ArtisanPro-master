# Implementation Plan: Contrat de Réservation

## Overview

Ce plan décompose le module **Contrat de Réservation** en étapes incrémentales couvrant le modèle Eloquent, les services métier (ContratService, PdfGeneratorService, SignatureService), le job asynchrone, le contrôleur HTTP avec sa policy, le composant React ContratViewer, les listeners d'événements, et les tests. Chaque tâche s'appuie sur les précédentes et se termine par un câblage complet du module dans le workflow Laravel existant.

---

## Tasks

- [x] 1. Migration, modèle Eloquent et interfaces de contrats
  - [x] 1.1 Créer la migration `create_contrats_table` avec toutes les colonnes définies dans le design
    - Créer `database/migrations/{timestamp}_create_contrats_table.php`
    - Colonnes : `id`, `id_reservation` (UNIQUE), `id_client`, `id_artisan`, `numero_contrat` (UNIQUE), `nom_client`, `nom_artisan`, `description_prestation`, `montant_total`, `date_debut_prestation`, `date_fin_prestation`, `adresse_intervention`, `statut` (ENUM), `signature_client_at`, `signature_client_hash`, `signature_artisan_at`, `signature_artisan_hash`, `chemin_pdf_brouillon`, `chemin_pdf_final`, `clauses_litige` (JSON), `genere_at`, `finalise_at`, `created_at`, `updated_at`
    - Clés étrangères vers `reservations`, `clients`, `artisans` avec `ON DELETE RESTRICT`
    - _Requirements : 1.1, 2.1, 4.1, 4.2, 5.1_

  - [x] 1.2 Créer le modèle Eloquent `app/Models/Contrat.php`
    - Définir `$fillable`, `$casts` (dates, decimal, array pour `clauses_litige`)
    - Relations `reservation()`, `client()`, `artisan()` (BelongsTo)
    - Méthode helper `estSigne(): bool`
    - Constantes de statut (`STATUT_GENERE`, `STATUT_EN_ATTENTE_SIGNATURES`, `STATUT_PARTIELLEMENT_SIGNE`, `STATUT_FINALISE`, `STATUT_ANNULE`)
    - _Requirements : 1.1, 1.3, 5.1_

  - [x] 1.3 Définir les interfaces de services dans `app/Contracts/`
    - `ContratServiceInterface` avec méthodes `creerDepuisReservation()` et `getContratPourReservation()`
    - `PdfGeneratorServiceInterface` avec méthodes `genererBrouillon()` et `genererFinal()`
    - `SignatureServiceInterface` avec méthodes `signer()` et `verifier()`
    - _Requirements : 1.1, 3.1, 4.1, 7.1_

- [x] 2. Service ContratService
  - [x] 2.1 Implémenter `app/Services/ContratService.php`
    - Méthode `creerDepuisReservation(Reservation $reservation): Contrat`
      - Vérification d'idempotence : retourner le contrat existant si `id_reservation` déjà présent
      - Copie en snapshot des données de la réservation (nom client/artisan, description, montant, dates, adresse)
      - Génération du `numero_contrat` via `genererNumero()` dans une transaction avec `lockForUpdate`
      - Initialisation de `clauses_litige` avec les quatre clauses prédéfinies de la plateforme
      - Persistance avec `statut = 'genere'` et `genere_at = now()`
      - Appel délégué à `PdfGeneratorService::genererBrouillon()`
      - Création des notifications in-app pour client et artisan
      - Logger toute erreur sans propager d'exception
    - Méthode `getContratPourReservation(int $reservationId): ?Contrat`
    - Méthode privée `genererNumero(): string` (format `CP-AAAA-NNNNN`, remise à zéro annuelle)
    - Lier l'interface dans `AppServiceProvider`
    - _Requirements : 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 8.1, 8.2, 8.3, 11.3, 11.4_

  - [x] 2.2 Écrire les tests unitaires pour `ContratService` dans `tests/Unit/ContratServiceTest.php`
    - Tester la génération idempotente (même réservation → même contrat retourné)
    - Tester que le snapshot copie exactement les champs de la réservation
    - Tester la création des quatre clauses litige
    - Tester `genererNumero()` : format `CP-AAAA-NNNNN`, remise à zéro en nouvelle année
    - Tester que `genere_at` est renseigné
    - _Requirements : 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 8.1, 8.2_

  - [x] 2.3 Écrire le test de propriété `Property 1 : idempotence de génération` dans `tests/Unit/Property/ContratIdempotenceTest.php`
    - **Property 1 : ∀ réservation confirmée → exactement 1 contrat généré (idempotence)**
    - Appeler `creerDepuisReservation()` N fois sur la même réservation et vérifier qu'un seul enregistrement existe
    - _Validates : Requirements 1.2_

  - [x] 2.4 Écrire le test de propriété `Property 3 : unicité et format du numéro de contrat` dans `tests/Unit/Property/ContratNumerotationTest.php`
    - **Property 3 : ∀ numéro de contrat → format CP-AAAA-NNNNN et unicité globale**
    - Générer N contrats et vérifier que chaque `numero_contrat` correspond au pattern `CP-\d{4}-\d{5,}` et est unique
    - _Validates : Requirements 2.1, 2.2, 2.3_

- [x] 3. Service PdfGeneratorService et template Blade
  - [x] 3.1 Créer le template Blade `resources/views/pdf/contrat.blade.php`
    - Afficher les données du contrat (parties, description, montant, dates, adresse)
    - Section filigrane "À SIGNER" conditionnelle (brouillon uniquement)
    - Section signatures : horodatages et empreintes HMAC pour le PDF final
    - Section clauses de litige (boucle sur `clauses_litige`)
    - Mentions légales en pied de page pour le PDF final
    - _Requirements : 3.1, 3.2, 6.1, 7.3_

  - [x] 3.2 Implémenter `app/Services/PdfGeneratorService.php`
    - Installer `barryvdh/laravel-dompdf` via Composer si absent
    - Méthode `genererBrouillon(Contrat $contrat): string`
      - Charger le template Blade avec les données du contrat et le flag `brouillon = true`
      - Stocker dans `storage/app/contrats/{id_reservation}/brouillon.pdf`
      - Retourner le chemin relatif
    - Méthode `genererFinal(Contrat $contrat): string`
      - Charger le template avec `brouillon = false`, inclure les hashes et horodatages de signatures
      - Stocker dans `storage/app/contrats/{id_reservation}/final.pdf`
      - Retourner le chemin relatif
    - Créer le répertoire de stockage si inexistant
    - Lier l'interface dans `AppServiceProvider`
    - _Requirements : 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 7.3_

  - [x] 3.3 Écrire les tests unitaires pour `PdfGeneratorService` dans `tests/Unit/PdfGeneratorServiceTest.php`
    - Tester que `genererBrouillon()` crée un fichier dans le bon chemin
    - Tester que `genererFinal()` crée un fichier dans le bon chemin
    - Tester le retour du chemin relatif correct
    - Mocker `barryvdh/laravel-dompdf` pour éviter la génération réelle
    - _Requirements : 3.3, 3.4, 6.1_

- [ ] 4. Checkpoint — Modèle, ContratService et PdfGeneratorService
  - Vérifier que tous les tests unitaires des tâches 2 et 3 passent
  - S'assurer que la migration s'exécute sans erreur (`php artisan migrate`)

- [x] 5. Service SignatureService
  - [x] 5.1 Implémenter `app/Services/SignatureService.php`
    - Méthode `signer(Contrat $contrat, User $user, string $role): Contrat`
      - Valider que `$user` correspond à la partie attendue selon `$role` (`id_client` / `id_artisan`)
      - Idempotence : retourner le contrat inchangé si la signature est déjà présente pour ce rôle
      - Rejeter si `statut = 'annule'` (lever une exception métier `ContratAnnuleException`)
      - Calculer le hash HMAC-SHA256 : `hash_hmac('sha256', "{$contrat->id}|{$role}|{$timestamp}", config('app.key'))`
      - Enregistrer `signature_{role}_at` et `signature_{role}_hash`
      - Mettre à jour le statut à `partiellement_signe` si une seule signature
      - Dispatcher `ContratFinaliseJob` exactement une fois si les deux signatures sont présentes
    - Méthode `verifier(Contrat $contrat, string $role): bool`
      - Recalculer le hash et comparer avec la valeur stockée
    - Lier l'interface dans `AppServiceProvider`
    - _Requirements : 4.1, 4.2, 4.6, 4.7, 4.8, 4.9, 5.3, 7.1, 7.2_

  - [x] 5.2 Écrire les tests unitaires pour `SignatureService` dans `tests/Unit/SignatureServiceTest.php`
    - Tester l'enregistrement correct de `signature_client_at` et `signature_client_hash`
    - Tester l'enregistrement correct de `signature_artisan_at` et `signature_artisan_hash`
    - Tester l'idempotence : double appel `signer()` sur le même rôle ne modifie pas la signature existante
    - Tester que le job `ContratFinaliseJob` est dispatché exactement une fois après la 2e signature
    - Tester que le job n'est PAS dispatché après la 1ère signature
    - Tester le rejet avec exception si `statut = 'annule'`
    - Tester `verifier()` : retourne `true` pour un hash valide, `false` pour un hash altéré
    - _Requirements : 4.1, 4.2, 4.6, 4.7, 4.8, 4.9, 7.1, 7.2_

  - [x] 5.3 Écrire le test de propriété `Property 2 : invariant du contrat finalisé` dans `tests/Unit/Property/ContratFinaliseInvariantTest.php`
    - **Property 2 : ∀ contrat finalisé → signature_client_at ≠ null ∧ signature_artisan_at ≠ null**
    - Générer N scénarios de double signature et vérifier que le statut `finalise` implique toujours les deux horodatages non-null
    - _Validates : Requirements 4.8, 5.4_

- [ ] 6. Job ContratFinaliseJob
  - [x] 6.1 Créer `app/Jobs/ContratFinaliseJob.php`
    - Implémenter `ShouldQueue` avec `$tries = 3` et backoff exponentiel
    - Méthode `handle()` :
      - Appeler `PdfGeneratorService::genererFinal()` et persister `chemin_pdf_final`
      - Envoyer l'email au client avec le PDF en pièce jointe via `Mail::to()`
      - Envoyer l'email à l'artisan avec le PDF en pièce jointe via `Mail::to()`
      - Appeler `SmsNotificationService::envoyerContratFinalise()` pour le client
      - Appeler `SmsNotificationService::envoyerContratFinalise()` pour l'artisan
      - Mettre à jour `contrat.statut = 'finalise'` et `finalise_at = now()`
      - Chaque opération encapsulée dans un try/catch qui logue l'erreur sans lancer d'exception
    - _Requirements : 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 6.2 Créer la Mailable `app/Mail/ContratFinalise.php`
    - Sujet : "ArtisanPro — Votre contrat {numero_contrat} a été finalisé"
    - Attacher le PDF final (`chemin_pdf_final`) en pièce jointe
    - Vue Blade `resources/views/emails/contrat-finalise.blade.php` avec les informations du contrat
    - _Requirements : 6.2_

  - [x] 6.3 Ajouter la méthode `envoyerContratFinalise()` à `SmsNotificationService`
    - Signature : `public function envoyerContratFinalise(string $telephone, string $numeroContrat, ?User $user = null): void`
    - Message : `"ArtisanPro : Votre contrat {$numeroContrat} a été signé par les deux parties. Consultez votre espace."`
    - Respecter le guard `sms_notifications_enabled` existant
    - Ajouter le type `contrat_finalise` dans la méthode `typeContexte()`
    - _Requirements : 6.3, 6.4_

  - [x] 6.4 Écrire les tests d'intégration du job dans `tests/Feature/Contrat/ContratFinaliseJobTest.php`
    - Tester que le PDF final est généré et que `chemin_pdf_final` est persisté
    - Tester que l'email est envoyé au client ET à l'artisan (`Mail::fake()`)
    - Tester que le SMS est envoyé au client ET à l'artisan (mock `SmsNotificationService`)
    - Tester que le statut passe à `finalise` et que `finalise_at` est renseigné
    - Tester que l'échec d'un email ne bloque pas l'envoi du SMS
    - _Requirements : 5.4, 6.1, 6.2, 6.3, 6.5, 6.6_

- [x] 7. ContratPolicy et ContratController
  - [x] 7.1 Créer `app/Policies/ContratPolicy.php`
    - Méthode `view(User $user, Contrat $contrat): bool` — l'utilisateur est `id_client` ou `id_artisan`
    - Méthode `signer(User $user, Contrat $contrat): bool` — l'utilisateur est la partie concernée ET n'a pas encore signé
    - Méthode `telecharger(User $user, Contrat $contrat): bool` — idem `view`
    - Enregistrer la policy dans `AuthServiceProvider`
    - _Requirements : 4.3, 4.4, 4.5, 9.5_

  - [x] 7.2 Créer `app/Http/Controllers/Portal/ContratController.php`
    - Méthode `show(Contrat $contrat): Response` — renvoie une page Inertia `portal/contrat-viewer` avec les données du contrat et la propriété calculée `peut_signer`
    - Méthode `signer(Request $request, Contrat $contrat): RedirectResponse`
      - Autoriser via `ContratPolicy::signer()`
      - Appeler `SignatureService::signer()` avec le rôle déduit de l'utilisateur authentifié
      - Rediriger avec un message flash de succès ou d'erreur
    - Méthode `telecharger(Contrat $contrat): StreamedResponse`
      - Autoriser via `ContratPolicy::telecharger()`
      - Streamer le fichier PDF depuis `storage/app/` sans exposer le chemin physique
    - Calculer `peut_signer` : `true` ssi l'utilisateur est une partie ET n'a pas encore de signature
    - _Requirements : 9.1, 9.2, 9.3, 9.6, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 7.3 Créer `app/Http/Controllers/Admin/ContratController.php`
    - Méthode `index(): Response` — liste paginée des contrats (Inertia)
    - Méthode `show(Contrat $contrat): Response` — détail d'un contrat avec clauses litige
    - Appliquer le middleware `admin`
    - _Requirements : 9.7, 8.4_

  - [x] 7.4 Enregistrer les routes dans `routes/web.php`
    - Routes portail (groupe `auth`) : `GET /portal/contrats/{contrat}`, `POST /portal/contrats/{contrat}/signer`, `GET /portal/contrats/{contrat}/telecharger`
    - Routes admin (groupe `auth` + `admin`) : `GET /admin/contrats`, `GET /admin/contrats/{contrat}`
    - _Requirements : 9.1, 9.2, 9.3, 9.4, 9.7_

  - [x] 7.5 Écrire les tests HTTP pour `ContratController` dans `tests/Feature/Contrat/ContratControllerTest.php`
    - Tester que `GET /portal/contrats/{contrat}` retourne 200 pour le client propriétaire
    - Tester que `GET /portal/contrats/{contrat}` retourne 403 pour un utilisateur tiers
    - Tester que `POST /portal/contrats/{contrat}/signer` enregistre la signature correctement
    - Tester que `POST /portal/contrats/{contrat}/signer` retourne 403 si la policy échoue
    - Tester que `GET /portal/contrats/{contrat}/telecharger` stream le PDF sans exposer le chemin
    - Tester que les routes non authentifiées redirigent vers la page de connexion
    - Tester que `GET /admin/contrats` est accessible à l'admin et retourne 403 pour un utilisateur normal
    - _Requirements : 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 8. Checkpoint — Services, Job et Contrôleur
  - Vérifier que tous les tests des tâches 5, 6 et 7 passent
  - Confirmer que le backoff exponentiel et les retries du job sont correctement configurés

- [x] 9. Listeners d'événements
  - [x] 9.1 Créer `app/Listeners/ContratGenerationListener.php`
    - Écouter l'événement `ReservationConfirmee`
    - Méthode `handle(ReservationConfirmee $event): void`
      - Appeler `ContratService::creerDepuisReservation($event->reservation)` à la fin de la méthode
      - Implémenter `ShouldQueue` pour ne pas bloquer la réponse HTTP
    - _Requirements : 1.1, 11.4_

  - [x] 9.2 Créer `app/Listeners/ContratAnnulationListener.php`
    - Écouter l'événement `ReservationAnnulee`
    - Méthode `handle(ReservationAnnulee $event): void`
      - Récupérer le contrat associé via `Contrat::where('id_reservation', ...)->first()`
      - Mettre à jour `statut = 'annule'` si le contrat existe et n'est pas déjà `finalise`
    - _Requirements : 5.5_

  - [x] 9.3 Enregistrer les deux listeners dans `app/Providers/EventServiceProvider.php`
    - Ajouter `ContratGenerationListener::class` dans `ReservationConfirmee::class => [...]`
    - Ajouter `ContratAnnulationListener::class` dans `ReservationAnnulee::class => [...]`
    - _Requirements : 1.1, 5.5, 11.4_

  - [x] 9.4 Écrire les tests d'intégration des listeners dans `tests/Feature/Contrat/ContratListenersTest.php`
    - Tester que `ReservationConfirmee` déclenche la création d'un contrat
    - Tester que `ReservationAnnulee` passe le contrat en `statut = 'annule'`
    - Tester que `ReservationAnnulee` sur une réservation sans contrat ne lève pas d'exception
    - Tester que `ReservationAnnulee` ne modifie pas un contrat déjà `finalise`
    - _Requirements : 1.1, 5.5, 11.4_

- [ ] 10. Composant React ContratViewer
  - [x] 10.1 Créer `resources/js/pages/portal/contrat-viewer.tsx`
    - Définir les interfaces TypeScript : `ContratViewerProps`, `ClauseLitige`
    - Afficher les informations du contrat (numéro, parties, prestation, montant, dates, adresse)
    - Afficher les clauses de litige dans une section dédiée
    - Rendu conditionnel selon `statut` :
      - `genere` / `en_attente_signatures` : afficher le lien vers le brouillon PDF + bouton "Signer" si `peut_signer = true`
      - `partiellement_signe` + utilisateur déjà signé : afficher indicateur "En attente de l'autre partie" sans bouton
      - `partiellement_signe` + utilisateur pas encore signé : afficher bouton "Signer"
      - `finalise` : badge vert "Signé" + bouton "Télécharger le PDF final"
      - `annule` : badge rouge "Annulé" + message explicatif
    - Masquer le bouton "Signer" si `peut_signer = false`
    - Formulaire de signature via `router.post()` Inertia avec confirmation utilisateur
    - _Requirements : 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ] 10.2 Écrire les tests du composant ContratViewer dans `tests/Feature/Contrat/ContratViewerTest.php`
    - Tester le rendu Inertia de la page pour chaque statut de contrat (via `get()` HTTP)
    - Tester que `peut_signer` est calculé correctement par le contrôleur pour chaque combinaison (client signé, artisan signé, aucun signé, les deux signés)
    - _Requirements : 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 11. Tests d'intégration — scénario complet bout-en-bout
  - [ ] 11.1 Écrire le test de scénario complet dans `tests/Feature/Contrat/ContratWorkflowTest.php`
    - Scénario 1 : création réservation → confirmation → génération contrat (`statut = 'genere'`) → signature client (`statut = 'partiellement_signe'`) → signature artisan → dispatch `ContratFinaliseJob` → `statut = 'finalise'` avec `finalise_at` renseigné
    - Scénario 2 : signature d'un seul côté → vérifier `statut = 'partiellement_signe'` et absence de dispatch du job
    - Scénario 3 : annulation après génération → vérifier `statut = 'annule'`
    - Scénario 4 : tentative de double-signature → contrat inchangé, statut inchangé
    - Utiliser `Queue::fake()` et `Mail::fake()` pour isoler les effets de bord
    - _Requirements : 1.1, 1.2, 4.6, 4.7, 4.8, 5.3, 5.4, 5.5, 6.2, 6.3_

  - [ ] 11.2 Vérifier la non-régression des modèles existants dans `tests/Feature/Contrat/NonRegressionTest.php`
    - Tester que les tables `reservations`, `litiges`, `paiements` n'ont pas de colonnes ajoutées ou supprimées
    - Tester que les classes `Reservation`, `Litige`, `Paiement` n'ont pas de méthodes modifiées
    - Tester que le workflow `ReservationConfirmee` existant (SMS) fonctionne toujours après l'ajout du nouveau listener
    - _Requirements : 11.1, 11.2, 11.3, 11.4_

- [ ] 12. Checkpoint final — Tous les tests passent
  - Vérifier que la suite complète de tests passe (`php artisan test` ou `./vendor/bin/pest`)
  - Vérifier que la migration est propre et réversible (`php artisan migrate:rollback`)

---

## Notes

- Les tâches postfixées avec `*` sont optionnelles et peuvent être passées pour un MVP plus rapide.
- Chaque tâche référence les exigences spécifiques pour la traçabilité.
- Les checkpoints assurent la validation incrémentale du module.
- Les tests de propriété (Property 1, 2, 3) valident les invariants universels définis dans le design.
- Les tests unitaires valident les comportements spécifiques et les cas limites.
- Les tests d'intégration valident les scénarios complets bout-en-bout.
- La contrainte de non-régression (Requirement 11) est couverte explicitement par la tâche 11.2.
- `barryvdh/laravel-dompdf` doit être présent dans `composer.json` avant d'exécuter la tâche 3.2.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "3.2"] },
    { "id": 4, "tasks": ["3.3", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "6.1", "6.3"] },
    { "id": 6, "tasks": ["6.2", "6.4", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3"] },
    { "id": 8, "tasks": ["7.4", "7.5"] },
    { "id": 9, "tasks": ["9.1", "9.2"] },
    { "id": 10, "tasks": ["9.3"] },
    { "id": 11, "tasks": ["9.4", "10.1"] },
    { "id": 12, "tasks": ["10.2", "11.1"] },
    { "id": 13, "tasks": ["11.2"] }
  ]
}
```
