# Requirements Document

## Introduction

Ce document décrit les exigences fonctionnelles et non-fonctionnelles du module **Contrat de Réservation** pour l'application ArtisanPro (Laravel). Ce module automatise la génération d'un contrat de prestation lorsqu'une réservation est confirmée entre un client et un artisan. Il prend en charge la signature électronique par les deux parties, la génération du PDF final, la transmission par email et SMS, ainsi que l'intégration de clauses de résolution des litiges. Le module s'intègre au workflow Laravel existant (événements, queues, notifications) sans modifier les modèles `Reservation`, `Litige` ou `Paiement`.

### Glossaire

- **Contrat_Service** : Service PHP `ContratService` orchestrant la création et la gestion des contrats.
- **Pdf_Generator_Service** : Service PHP `PdfGeneratorService` générant les fichiers PDF via `barryvdh/laravel-dompdf`.
- **Signature_Service** : Service PHP `SignatureService` gérant les signatures électroniques HMAC et les transitions d'état.
- **Contrat_Finalise_Job** : Job de queue asynchrone `ContratFinaliseJob` déclenché après la double signature.
- **Contrat_Controller** : Contrôleur HTTP `ContratController` exposant les routes du portail et de l'administration.
- **Contrat_Viewer** : Composant React `ContratViewer` affichant le contrat dans le portail utilisateur.
- **Contrat_Policy** : Policy Laravel `ContratPolicy` contrôlant l'accès aux actions sur les contrats.
- **Contrat** : Entité Eloquent représentant un contrat de prestation en base de données.
- **Reservation** : Modèle Eloquent existant représentant une réservation entre un client et un artisan.
- **Client** : Utilisateur ayant le rôle de client dans la plateforme ArtisanPro.
- **Artisan** : Utilisateur ayant le rôle d'artisan dans la plateforme ArtisanPro.
- **Signature_Electronique** : Empreinte HMAC-SHA256 horodatée liant une signature à un contrat, un rôle et un instant précis.
- **Brouillon_PDF** : Fichier PDF généré avant les signatures, portant le filigrane "A SIGNER".
- **PDF_Final** : Fichier PDF généré après les deux signatures, incluant les mentions légales et les empreintes de signature.
- **Clauses_Litige** : Tableau JSON de clauses contractuelles prédéfinies intégrées au contrat pour encadrer les litiges.
- **Numero_Contrat** : Identifiant unique au format `CP-AAAA-NNNNN` attribué à chaque contrat.
- **Statut_Contrat** : Valeur d'enumération parmi `genere`, `en_attente_signatures`, `partiellement_signe`, `finalise`, `annule`.
- **Sms_Notification_Service** : Service PHP existant `SmsNotificationService` utilisé pour l'envoi de SMS.
- **Email_Service** : Système de messagerie Laravel (`Mail::to()`) utilisé pour l'envoi d'emails avec pièces jointes.
- **Reservation_Confirmee** : Événement Laravel `ReservationConfirmee` déclenché lorsqu'une réservation est confirmée.
- **Reservation_Annulee** : Événement Laravel `ReservationAnnulee` déclenché lorsqu'une réservation est annulée.

## Glossary

See Glossaire section above.

## Requirements

### Requirement 1: Generation automatique du contrat a la confirmation

**User Story:** En tant que plateforme ArtisanPro, je veux generer automatiquement un contrat de prestation des qu'une reservation est confirmee, afin que les deux parties disposent d'un document contractuel sans action manuelle.

#### Acceptance Criteria

1. WHEN l'evenement `Reservation_Confirmee` est declenche, THE `Contrat_Service` SHALL creer un enregistrement `Contrat` en base de donnees avec le statut `genere`.
2. WHEN l'evenement `Reservation_Confirmee` est declenche pour une reservation disposant deja d'un contrat, THE `Contrat_Service` SHALL retourner le contrat existant sans creer de doublon (idempotence).
3. WHEN un `Contrat` est cree, THE `Contrat_Service` SHALL copier en snapshot les champs suivants depuis la `Reservation` : nom du client, nom de l'artisan, description de la prestation, montant total, date de debut, date de fin, adresse d'intervention.
4. WHEN un `Contrat` est cree, THE `Contrat_Service` SHALL initialiser le champ `genere_at` avec l'horodatage courant.
5. WHEN un `Contrat` est cree, THE `Contrat_Service` SHALL creer des notifications in-app pour le `Client` et l'`Artisan` leur indiquant qu'un contrat est disponible pour signature.
6. IF la creation du `Contrat` echoue, THEN THE `Contrat_Service` SHALL journaliser l'erreur sans propager d'exception vers le workflow de reservation.

---

### Requirement 2: Numerotation sequentielle et unique des contrats

**User Story:** En tant qu'administrateur ArtisanPro, je veux que chaque contrat recoive un numero unique et lisible, afin de pouvoir identifier et referencer facilement les contrats.

#### Acceptance Criteria

1. WHEN un `Contrat` est cree, THE `Contrat_Service` SHALL generer un `Numero_Contrat` au format `CP-AAAA-NNNNN` ou `AAAA` est l'annee courante et `NNNNN` est un entier sequentiel sur cinq chiffres minimum avec zeros de remplissage, avec extension a six chiffres ou plus si le compteur depasse 99 999.
2. THE `Contrat_Service` SHALL garantir l'unicite du `Numero_Contrat` au sein de la table `contrats`, y compris sous charge concurrente, en utilisant une transaction avec verrouillage (`lockForUpdate`).
3. WHEN une nouvelle annee calendaire commence, THE `Contrat_Service` SHALL remettre le compteur sequentiel a `00001` pour les contrats de cette nouvelle annee.

---

### Requirement 3: Generation du brouillon PDF

**User Story:** En tant que client ou artisan, je veux pouvoir consulter le contenu du contrat avant de le signer, afin de verifier les termes de la prestation.

#### Acceptance Criteria

1. WHEN un `Contrat` est cree avec le statut `genere`, THE `Pdf_Generator_Service` SHALL generer un `Brouillon_PDF` a partir du template Blade `resources/views/pdf/contrat.blade.php` en injectant les donnees du contrat.
2. WHEN le `Brouillon_PDF` est genere, THE `Pdf_Generator_Service` SHALL apposer le filigrane "A SIGNER" sur toutes les pages du document.
3. WHEN le `Brouillon_PDF` est genere, THE `Pdf_Generator_Service` SHALL stocker le fichier dans le repertoire `storage/app/contrats/{id_reservation}/brouillon.pdf`.
4. WHEN le `Brouillon_PDF` est stocke, THE `Pdf_Generator_Service` SHALL retourner le chemin relatif, que le `Contrat_Service` SHALL persister dans la colonne `chemin_pdf_brouillon` du `Contrat`.
5. IF la generation du `Brouillon_PDF` echoue, THEN THE `Pdf_Generator_Service` SHALL journaliser l'erreur et THE `Contrat_Service` SHALL conserver le statut `genere` et programmer une nouvelle tentative via la queue avec un backoff exponentiel sur trois tentatives.

---

### Requirement 4: Signature electronique par les deux parties

**User Story:** En tant que client ou artisan, je veux signer electroniquement le contrat depuis mon espace portail, afin de valider mon accord sur les termes de la prestation.

#### Acceptance Criteria

1. WHEN un `Client` soumet une demande de signature sur son `Contrat`, THE `Signature_Service` SHALL enregistrer `signature_client_at` avec l'horodatage courant et `signature_client_hash` avec un hash HMAC-SHA256 calcule sur la charge utile `"{id_contrat}|client|{timestamp}"`.
2. WHEN un `Artisan` soumet une demande de signature sur son `Contrat`, THE `Signature_Service` SHALL enregistrer `signature_artisan_at` avec l'horodatage courant et `signature_artisan_hash` avec un hash HMAC-SHA256 calcule sur la charge utile `"{id_contrat}|artisan|{timestamp}"`.
3. WHEN une signature est soumise par un utilisateur dont le role ne correspond pas a la partie attendue du `Contrat`, THE `Contrat_Policy` SHALL rejeter la demande avec un code HTTP 403.
4. WHEN un `Client` tente de signer un `Contrat` dont il n'est pas le client reference (`id_client`), THE `Contrat_Policy` SHALL rejeter la demande avec un code HTTP 403.
5. WHEN un `Artisan` tente de signer un `Contrat` dont il n'est pas l'artisan reference (`id_artisan`), THE `Contrat_Policy` SHALL rejeter la demande avec un code HTTP 403.
6. WHEN une partie tente de signer un `Contrat` qu'elle a deja signe, THE `Signature_Service` SHALL retourner le `Contrat` inchange sans modifier les colonnes de signature (idempotence).
7. WHEN la signature d'une partie est enregistree et que l'autre partie n'a pas encore signe, THE `Signature_Service` SHALL mettre a jour le statut du `Contrat` a `partiellement_signe`.
8. WHEN les signatures des deux parties sont enregistrees et que les deux validations de propriete (`id_client` et `id_artisan`) ont reussi, THE `Signature_Service` SHALL dispatcher le `Contrat_Finalise_Job` exactement une fois.
9. WHILE le `Contrat` a le statut `annule`, THE `Signature_Service` SHALL rejeter toute tentative de signature avec un code HTTP 422.

---

### Requirement 5: Transitions de statut du contrat

**User Story:** En tant que plateforme ArtisanPro, je veux que le cycle de vie du contrat soit trace par des statuts explicites, afin de permettre un suivi precis de l'avancement des signatures.

#### Acceptance Criteria

1. THE `Contrat` SHALL avoir exactement cinq statuts possibles : `genere`, `en_attente_signatures`, `partiellement_signe`, `finalise`, `annule`.
2. WHEN un `Contrat` est cree depuis un evenement `Reservation_Confirmee`, THE `Contrat_Service` SHALL initialiser le statut a `genere`.
3. WHEN la premiere signature (client ou artisan) est enregistree sur un `Contrat` au statut `genere` ou `en_attente_signatures`, THE `Signature_Service` SHALL mettre a jour le statut a `partiellement_signe`.
4. WHEN les deux signatures sont enregistrees sur un `Contrat`, THE `Contrat_Finalise_Job` SHALL mettre a jour le statut a `finalise` et renseigner `finalise_at` avec l'horodatage courant.
5. WHEN l'evenement `Reservation_Annulee` est declenche pour une reservation associee a un `Contrat`, THE systeme SHALL mettre a jour le statut du `Contrat` a `annule`.
6. IF un `Contrat` a le statut `finalise` ou `annule`, THEN THE `Contrat_Service` SHALL rejeter toute tentative de modification du statut vers un statut anterieur.

---

### Requirement 6: Finalisation asynchrone et envoi des notifications

**User Story:** En tant que client ou artisan, je veux recevoir le contrat finalise par email et SMS des que les deux parties ont signe, afin de disposer d'une copie officielle du document.

#### Acceptance Criteria

1. WHEN le `Contrat_Finalise_Job` est execute, THE `Pdf_Generator_Service` SHALL generer un `PDF_Final` incluant les mentions legales, les horodatages et les empreintes des deux signatures, et le stocker dans `storage/app/contrats/{id_reservation}/final.pdf`.
2. WHEN le `PDF_Final` est genere, THE `Contrat_Finalise_Job` SHALL envoyer un email au `Client` et un email a l'`Artisan`, chacun avec le `PDF_Final` en piece jointe, independamment du statut d'envoi du SMS.
3. WHEN le `PDF_Final` est genere, THE `Contrat_Finalise_Job` SHALL envoyer un SMS au `Client` et un SMS a l'`Artisan` via le `Sms_Notification_Service`, independamment du statut d'envoi des emails.
4. THE SMS envoye par le `Sms_Notification_Service` SHALL contenir le `Numero_Contrat` et un message indiquant que le contrat a ete signe par les deux parties avec une invitation a consulter l'espace portail.
5. IF l'envoi d'un email echoue, THEN THE `Contrat_Finalise_Job` SHALL journaliser l'erreur et conserver le statut `finalise` du `Contrat` sans bloquer l'envoi du SMS ni declencher d'exception.
6. IF l'envoi d'un SMS echoue, THEN THE `Contrat_Finalise_Job` SHALL journaliser l'erreur et conserver le statut `finalise` du `Contrat` sans declencher d'exception.
7. WHEN le `Contrat_Finalise_Job` echoue globalement, THE systeme SHALL effectuer jusqu'a trois nouvelles tentatives avec un backoff exponentiel avant de marquer le job comme echoue.

---

### Requirement 7: Integrite et verifiabilite des signatures

**User Story:** En tant qu'administrateur ArtisanPro, je veux pouvoir verifier l'authenticite des signatures electroniques, afin de garantir l'integrite juridique des contrats.

#### Acceptance Criteria

1. WHEN une signature est enregistree, THE `Signature_Service` SHALL calculer le hash HMAC-SHA256 en utilisant la cle d'application (`config('app.key')`) et la charge utile `"{id_contrat}|{role}|{timestamp}"`.
2. WHEN la verification d'une signature est demandee via `SignatureService::verifier()`, THE `Signature_Service` SHALL recalculer le hash et retourner `true` si et seulement si le hash recalcule correspond au hash stocke.
3. THE `PDF_Final` SHALL inclure les champs `signature_client_hash`, `signature_artisan_hash` et les horodatages correspondants, avec des valeurs nulles si les signatures ne sont pas encore disponibles au moment de la generation.

---

### Requirement 8: Clauses de resolution des litiges

**User Story:** En tant que client ou artisan, je veux que le contrat inclue des clauses contractuelles de resolution des litiges, afin de connaitre les recours disponibles en cas de desaccord.

#### Acceptance Criteria

1. WHEN un `Contrat` est cree, THE `Contrat_Service` SHALL initialiser la colonne `clauses_litige` avec les clauses predefinies de la plateforme au format JSON.
2. THE `clauses_litige` SHALL contenir au minimum les clauses suivantes : delai de reclamation (7 jours), motifs de litige acceptes, mediation ArtisanPro obligatoire, gestion des fonds en sequestre.
3. THE `Contrat` SHALL stocker les `clauses_litige` sous forme d'un tableau JSON ou chaque clause possede les champs `id` (identifiant unique), `titre` (libelle court) et `contenu` (texte complet).
4. WHEN un litige est consulte dans l'interface d'administration, THE systeme SHALL afficher les `clauses_litige` du contrat associe pour rappeler les conditions contractuelles acceptees.
5. THE module `contrat-reservation` SHALL acceder aux donnees du modele `Litige` en lecture seule, sans modifier sa structure ni ses methodes, sauf pour les mises a jour de statut necessaires au traitement contractuel.

---

### Requirement 9: Exposition HTTP et controle d'acces

**User Story:** En tant que client ou artisan, je veux pouvoir consulter, signer et telecharger mon contrat depuis le portail, afin d'interagir avec le document contractuel en toute securite.

#### Acceptance Criteria

1. THE `Contrat_Controller` SHALL exposer la route `GET /portal/contrats/{contrat}` pour afficher le contrat, accessible uniquement aux utilisateurs authentifies.
2. THE `Contrat_Controller` SHALL exposer la route `POST /portal/contrats/{contrat}/signer` pour soumettre une signature, accessible uniquement aux utilisateurs authentifies.
3. THE `Contrat_Controller` SHALL exposer la route `GET /portal/contrats/{contrat}/telecharger` pour telecharger le PDF, accessible uniquement aux utilisateurs authentifies.
4. WHEN un utilisateur non authentifie accede a une route du portail, THE systeme SHALL rediriger vers la page de connexion.
5. WHEN un utilisateur authentifie tente d'acceder au contrat d'une autre paire client/artisan, THE `Contrat_Policy` SHALL rejeter la demande avec un code HTTP 403.
6. WHEN le telechargement du PDF est demande, THE `Contrat_Controller` SHALL servir le fichier via une reponse HTTP streamee sans exposer le chemin physique de stockage.
7. THE systeme SHALL exposer les routes d'administration `GET /admin/contrats` et `GET /admin/contrats/{contrat}` avec controle d'acces par role administrateur, ces routes etant toujours exposees mais l'acces etant refuse aux non-administrateurs avec un code HTTP 403.

---

### Requirement 10: Interface utilisateur ContratViewer

**User Story:** En tant que client ou artisan, je veux voir le contrat dans une interface claire depuis mon espace portail, afin de comprendre son statut et d'agir en consequence.

#### Acceptance Criteria

1. WHEN le `Contrat_Viewer` recoit un contrat avec le statut `genere`, THE `Contrat_Viewer` SHALL afficher le `Brouillon_PDF` et un bouton "Signer".
2. WHEN le `Contrat_Viewer` recoit un contrat avec le statut `partiellement_signe` et que l'utilisateur courant a deja signe, THE `Contrat_Viewer` SHALL afficher un indicateur "En attente de l'autre partie" sans bouton de signature.
3. WHEN le `Contrat_Viewer` recoit un contrat avec le statut `finalise`, THE `Contrat_Viewer` SHALL afficher un badge vert "Signe" et un bouton "Telecharger le PDF final".
4. WHEN le `Contrat_Viewer` recoit un contrat avec le statut `annule`, THE `Contrat_Viewer` SHALL afficher un badge rouge "Annule" et un message explicatif.
5. WHEN la propriete `peut_signer` est `false` pour l'utilisateur courant, THE `Contrat_Viewer` SHALL masquer le bouton de signature.
6. THE `Contrat_Controller` SHALL calculer la propriete `peut_signer` a `true` si et seulement si l'utilisateur courant est une partie du contrat et n'a pas encore de signature enregistree.

---

### Requirement 11: Non-regression des modeles existants

**User Story:** En tant que developpeur ArtisanPro, je veux que le module contrat s'integre sans modifier les modeles `Reservation`, `Litige` et `Paiement`, afin de preserver la stabilite de l'application existante.

#### Acceptance Criteria

1. THE module `contrat-reservation` SHALL ne pas ajouter, supprimer ni modifier de colonne dans les tables `reservations`, `litiges` et `paiements`.
2. THE module `contrat-reservation` SHALL ne pas modifier les classes `Reservation`, `Litige` et `Paiement` existantes.
3. WHEN le `Contrat_Service` doit acceder aux donnees d'une reservation, THE `Contrat_Service` SHALL lire les donnees depuis le modele `Reservation` en lecture seule.
4. THE `Contrat_Service` SHALL s'integrer au workflow existant en ajoutant un appel a `ContratService::creerDepuisReservation()` a la fin de la methode `handle()` du listener `ReservationConfirmeeListener`, sans modifier la logique existante du listener.
