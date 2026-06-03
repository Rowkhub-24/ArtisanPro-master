# Rapport d'Évaluation de Sécurité - Plateforme ArtisanPro

Ce rapport présente une analyse approfondie de la sécurité de la plateforme **ArtisanPro** (basée sur Laravel, React, Inertia, et intégrée à des services tiers comme KkiaPay, FedaPay, Africa's Talking, et OpenAI).

Plusieurs vulnérabilités critiques ont été identifiées, principalement liées à la gestion des paiements, la configuration des webhooks, et la fuite de secrets de production.

---

## Synthèse des Vulnérabilités Identifiées

Le tableau ci-dessous résume les failles détectées par niveau de sévérité :

| # | Description de la Vulnérabilité | Sévérité | Impact | Statut |
|---|---|---|---|---|
| 1 | Contournement du paiement via l'API webhook non signée | **Critique** | financier (gratuité totale des services) | À corriger |
| 2 | Validation de paiement côté client aveugle (`kkiapay-confirm`) | **Critique** | financier (fausses confirmations de paiement) | À corriger |
| 3 | Callback de redirection GET KkiaPay non vérifié | **Élevé** | financier (manipulation de redirection) | À corriger |
| 4 | Exposition de clés d'API sensibles dans le fichier `.env` | **Élevé** | vol de ressources / usurpation d'identité | À corriger |
| 5 | Blocage CSRF sur les webhooks de production | **Moyen** | opérationnel (webhooks réels inopérants) | À corriger |
| 6 | Dysfonctionnement de la fonctionnalité "Renvoyer SMS" | **Moyen / Bas** | opérationnel (les renvois échouent toujours) | À corriger |
| 7 | Code redondant dans les routes d'administration | **Bas** | maintenance du code | À corriger |

---

## Analyses Détaillées des Failles

### 1. Contournement du Paiement via l'API Webhook Non Signée
> [!CAUTION]
> **Sévérité : CRITIQUE**
> 
> Tout utilisateur connecté peut marquer n'importe quelle réservation comme payée et terminée gratuitement.

* **Fichier concerné** : [api.php](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/routes/api.php#L59-L106) (Lignes 59-106)
* **Description** :
  La route POST `/api/v1/paiements/webhook/{provider}` est définie à l'intérieur du groupe de middleware `auth:sanctum`.
  1. **Absence de signature** : Contrairement aux webhooks sécurisés gérés par le [WebhookController](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/app/Http/Controllers/Payment/WebhookController.php), cet endpoint ne procède à **aucune validation de signature HMAC** (pas de clé secrète partagée vérifiée). Il se contente de lire le JSON brut fourni dans le corps de la requête.
  2. **Vérification d'authentification inversée** : Comme le endpoint exige une authentification Sanctum (`auth:sanctum`), les serveurs des passerelles de paiement (KkiaPay/FedaPay) ne pourront pas l'appeler (erreur `401 Unauthorized`).
  3. **Vecteur d'attaque** : N'importe quel client malveillant authentifié peut envoyer une requête POST manuelle avec un identifiant de transaction arbitraire et le statut `success`. L'application passera alors le statut du paiement à `reussi` et marquera la réservation correspondante comme `terminee` dans la base de données sans qu'aucun argent ne soit réellement prélevé.

---

### 2. Validation Côté Client Aveugle (Widget KkiaPay)
> [!CAUTION]
> **Sévérité : CRITIQUE**
> 
> Le serveur fait confiance au navigateur du client pour valider le statut des transactions financières sans double vérification API.

* **Fichier concerné** : [web.php](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/routes/web.php#L730-L800) (Lignes 730-800)
* **Description** :
  L'endpoint `client/paiements/kkiapay-confirm` est appelé en POST par le frontend suite au succès d'un widget de paiement côté navigateur.
  1. **Bypass simple** : L'implémentation serveur prend la variable `transaction_id` envoyée par le client et l'enregistre immédiatement comme un paiement réussi (`statut => 'reussi'`) et met à jour la réservation.
  2. **Absence de vérification de l'état** : L'application ne contacte jamais l'API backend de KkiaPay pour s'assurer que :
     - La transaction existe réellement.
     - Elle a bien le statut `SUCCESS`.
     - Son montant correspond au montant attendu de l'acompte (30%).
  3. **Vecteur d'attaque** : Un attaquant peut envoyer un faux ID de transaction (ex: `"fake_tx_12345"`) en POST direct, et l'application validera sa prestation gratuitement.

---

### 3. Callback de Redirection GET KkiaPay Non Vérifié
> [!WARNING]
> **Sévérité : ÉLEVÉE**
> 
> La redirection de retour de paiement fait confiance aux paramètres d'URL non signés.

* **Fichier concerné** : [KkiapayCallbackController.php](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/app/Http/Controllers/Payment/KkiapayCallbackController.php#L33-L161)
* **Description** :
  Lorsqu'un utilisateur est redirigé vers l'URL de retour `payment/kkiapay/callback`, le contrôleur lit les paramètres GET `transaction_id`, `status` et `reservation_id`.
  - Si `status === 'success'`, le paiement est automatiquement enregistré comme réussi.
  - Aucune API KkiaPay n'est appelée pour valider la transaction, et aucune signature d'URL n'est présente.
  - N'importe qui peut forger l'URL : `http://localhost:8000/payment/kkiapay/callback?transaction_id=mon_id_bidon&status=success&reservation_id=X` pour marquer la réservation `X` comme payée.

---

### 4. Exposition de Clés d'API Actives dans le Fichier `.env`
> [!WARNING]
> **Sévérité : ÉLEVÉE**
> 
> Plusieurs secrets de production réels sont codés en dur dans le fichier de configuration.

* **Fichier concerné** : [.env](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/.env#L66) (Lignes 66, 89, 104)
* **Description** :
  Le fichier `.env` du projet contient des jetons d'accès actifs pour des services externes payants :
  - **OpenAI API Key** (`OPENAI_API_KEY` ligne 66) : Clé de production active (`sk-proj-...`).
  - **Africa's Talking API Key** (`AFRICASTALKING_API_KEY` ligne 104) : Clé active (`atsk_...`).
  - **KkiaPay Secret** (`KKIAPAY_SECRET` ligne 89).
  Ces clés permettent à quiconque accède au dépôt de consommer des ressources à vos frais, d'usurper l'identité de l'application pour envoyer des SMS, ou de voler des crédits IA.

---

### 5. Blocage CSRF sur les Webhooks de Production
> [!IMPORTANT]
> **Sévérité : MOYENNE (Risque Opérationnel)**
> 
> Les webhooks réels envoyés par KkiaPay/FedaPay échoueront tous en production.

* **Fichiers concernés** : [web.php](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/routes/web.php#L2306-L2308) et [app.php](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/bootstrap/app.php)
* **Description** :
  Les webhooks officiels sécurisés `webhook/kkiapay` et `webhook/fedapay` sont enregistrés dans `web.php`. 
  - La route est donc soumise par défaut au groupe de middleware `web`, qui applique la validation de jeton CSRF.
  - Comme les serveurs de paiement externes ne fournissent pas de jeton CSRF Laravel, toutes leurs requêtes POST se solderont par une erreur `419 Token Mismatch`.
* **Action requise** : Exclure ces routes de la protection CSRF dans [bootstrap/app.php](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/bootstrap/app.php) en utilisant `$middleware->validateCsrfTokens(except: [...])`.

---

### 6. Dysfonctionnement Logique de la Fonctionnalité "Renvoyer SMS"
> [!NOTE]
> **Sévérité : BASSE / MOYENNE**
> 
> La fonctionnalité d'administration pour renvoyer un SMS en échec est inopérante.

* **Fichiers concernés** : [SmsNotificationService.php](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/app/Services/SmsNotificationService.php#L180-L200) et [SmsLogController.php](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/app/Http/Controllers/Admin/SmsLogController.php#L81-L96)
* **Description** :
  Pour des raisons RGPD, le numéro de téléphone des destinataires est masqué avant d'être persisté dans la base de données :
  ```php
  $telephoneMasque = $this->masquerTelephone($telephone); // Ex: +229****4567
  ```
  Le problème est que seule cette version masquée est enregistrée dans le champ `recipient` de la table `sms_logs`.
  Lorsque l'administrateur clique sur "Renvoyer" dans le panneau d'administration, le contrôleur récupère le destinataire stocké (`+229****4567`) et l'envoie au [SendSmsJob](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/app/Jobs/SendSmsJob.php). L'envoi échouera systématiquement au niveau d'Africa's Talking en raison du format invalide.

---

### 7. Code Redondant dans les Routes Administrateur
> [!NOTE]
> **Sévérité : BASSE**
> 
> Duplication de code dans les fichiers de configuration de routes.

* **Fichier concerné** : [admin.php](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/routes/admin.php)
* **Description** :
  Le bloc complet de définition des routes d'administration (`Route::middleware(['auth', 'admin'])->...`) est dupliqué à l'identique deux fois de suite :
  - Bloc 1 : Lignes 15 à 71
  - Bloc 2 : Lignes 73 à 124
  Cela n'a pas d'impact direct sur la sécurité mais nuit à la lisibilité et à la maintenance.

---

## Recommandations de Remédiation

1. **Sécurisation des Webhooks (KkiaPay & FedaPay)** :
   - Supprimer l'endpoint webhook de `routes/api.php` qui contourne la sécurité.
   - Utiliser uniquement le [WebhookController](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/app/Http/Controllers/Payment/WebhookController.php) qui vérifie les signatures HMAC.
   - Exclure les webhooks de la vérification CSRF dans [bootstrap/app.php](file:///c:/Users/MHD/Desktop/ArtisanPro-master-2/bootstrap/app.php) :
     ```php
     $middleware->validateCsrfTokens(except: [
         'webhook/kkiapay',
         'webhook/fedapay',
     ]);
     ```

2. **Vérification des Transactions Côté Serveur** :
   - Modifier l'endpoint `paiements/kkiapay-confirm` et le `KkiapayCallbackController` pour qu'ils effectuent un appel curl direct vers l'API de KkiaPay afin de vérifier le statut de la transaction et son montant réel avant d'enregistrer le paiement en base de données.

3. **Protection des Secrets (Secrets Management)** :
   - Révoquer immédiatement les clés exposées (`OPENAI_API_KEY` et `AFRICASTALKING_API_KEY`) sur les dashboards correspondants.
   - Régénérer de nouvelles clés et s'assurer que le fichier `.env` est ajouté au fichier `.gitignore` et qu'il n'est jamais poussé sur les dépôts de code partagés.

4. **Correction du Système de Logs SMS** :
   - Soit stocker le numéro de téléphone complet chiffré dans la base de données (si le renvoi direct est requis), soit retrouver le numéro d'envoi de manière dynamique à partir du modèle lié (`context_id` et `context_type`) au moment du renvoi plutôt que de lire le champ `recipient` masqué.
