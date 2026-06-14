# Design : Centralisation de la validation E.164 et correction ErreurInvalidPhoneNumber

## Contexte

Africa's Talking rejette tout numéro de téléphone qui n'est pas au format E.164 (`+<code_pays><numero>`). L'erreur `InvalidPhoneNumber` se produit car `SmsNotificationService` passe les numéros bruts depuis la base de données directement à l'API, sans normalisation.

La logique de normalisation (`normaliserTelephone`) existe déjà mais est dupliquée en copier-coller dans chacun des 7 Listeners SMS. Elle est absente du service central (`SmsNotificationService`) utilisé par les flux `ContratFinalise`, `LitigeOuvert`, `sendConfirmationSms` et `sendRejectionSms`.

---

## Objectif

1. Centraliser la normalisation E.164 dans `SmsNotificationService`
2. Supprimer la duplication dans les 7 Listeners
3. Ajouter une exception explicite `InvalidPhoneNumberException` pour faciliter le débogage
4. Faire en sorte que `SendSmsJob` utilise aussi la normalisation

---

## Architecture cible

### 1. `SmsNotificationService::normaliserTelephone()`

Méthode `public` (ou `public static`) extraite dans le service pour être réutilisable partout.

Règles de normalisation pour les numéros béninois (prioritaires) et internationaux :

| Entrée (chiffres extraits) | Règle | Sortie |
|---|---|---|
| commence par `229`, longueur 11 ou 13 | déjà préfixé pays | `+229XXXXXXXX` ou `+22901XXXXXXXX` |
| longueur 8 | numéro local Bénin (format ancien) | `+22901XXXXXXXX` → voir note |
| longueur 10 | numéro local avec indicatif opérateur | `+229XXXXXXXXXX` |
| longueur ≥ 10, autre préfixe | international | `+<chiffres>` |
| autre | invalide | `null` |

> **Note sur les 8 chiffres :** Le Bénin est passé aux numéros à 10 chiffres en 2023 (ajout du `01` pour MTN, `51` pour Moov, etc.). Un numéro à 8 chiffres stocké en base est potentiellement obsolète. La normalisation tentera `+22901XXXXXXXX` pour MTN comme fallback — si le numéro réel est différent, l'envoi échouera côté API plutôt que de silencieusement sauter le SMS.

### 2. `InvalidPhoneNumberException`

```
app/Exceptions/InvalidPhoneNumberException.php
```

Exception déclenchée quand un numéro ne peut pas être normalisé en E.164. Permet un log structuré clair à la place d'un simple `return null` silencieux.

### 3. Refactoring `SmsNotificationService`

- `envoyerViaApi()` appelle `normaliserTelephone()` en amont
- Si le résultat est `null`, log `warning` avec `InvalidPhoneNumberException` et retourne (pas de throw pour ne pas casser les jobs async)
- Les méthodes `sendConfirmationSms`, `sendRejectionSms`, `envoyerContratFinalise`, `sendLitigeOuvertSms` ne passent plus le `telephone` brut — la normalisation se fait dans `envoyerViaApi`

### 4. Refactoring des Listeners

Chacun des 7 Listeners supprime sa méthode `normaliserTelephone()` privée et appelle directement `SmsNotificationService::normaliserTelephone()` (ou ne fait plus de pré-normalisation, laissant `SendSmsJob` → `SmsNotificationService` s'en charger).

Listeners concernés :
- `EnvoyerSmsNouvelleReservation`
- `EnvoyerSmsConfirmationReservation`
- `EnvoyerSmsAnnulation`
- `EnvoyerSmsPaiement`
- `EnvoyerSmsMissionTerminee`
- `EnvoyerSmsInscription`
- `EnvoyerSmsArtisanValide`

### 5. `SendSmsJob`

Si le job reçoit un numéro non normalisé (edge case), il appelle `SmsNotificationService::normaliserTelephone()` avant de déléguer. Ceci évite des `InvalidPhoneNumber` si un numéro brut arrive directement dans la queue.

---

## Flux d'appel après refactoring

```
Listener → SendSmsJob::dispatch(telephone_brut, ...) → onQueue('sms')
         → SendSmsJob::handle() → SmsNotificationService::envoyer()
         → envoyerViaApi()
         → normaliserTelephone()  ← point unique de normalisation
         → appelAfricasTalking(telephone_e164, ...)
```

Ou pour les appels directs (ContratFinalise, Litige) :

```
Controller/Service → SmsNotificationService::envoyerContratFinalise(telephone_brut)
                   → envoyerViaApi()
                   → normaliserTelephone()  ← même point unique
                   → appelAfricasTalking(telephone_e164, ...)
```

---

## Fichiers modifiés

| Fichier | Action |
|---|---|
| `app/Exceptions/InvalidPhoneNumberException.php` | **Créer** |
| `app/Services/SmsNotificationService.php` | **Modifier** — ajouter `normaliserTelephone()`, l'appeler dans `envoyerViaApi()` |
| `app/Jobs/SendSmsJob.php` | **Modifier** — appel `normaliserTelephone()` avant dispatch effectif |
| `app/Listeners/EnvoyerSmsNouvelleReservation.php` | **Modifier** — supprimer méthode privée |
| `app/Listeners/EnvoyerSmsConfirmationReservation.php` | **Modifier** — supprimer méthode privée |
| `app/Listeners/EnvoyerSmsAnnulation.php` | **Modifier** — supprimer méthode privée |
| `app/Listeners/EnvoyerSmsPaiement.php` | **Modifier** — supprimer méthode privée |
| `app/Listeners/EnvoyerSmsMissionTerminee.php` | **Modifier** — supprimer méthode privée |
| `app/Listeners/EnvoyerSmsInscription.php` | **Modifier** — supprimer méthode privée |
| `app/Listeners/EnvoyerSmsArtisanValide.php` | **Modifier** — supprimer méthode privée |

---

## Tests

- `tests/Unit/SmsNotificationServiceTest.php` — tester `normaliserTelephone()` sur toutes les variantes de format (8, 10, 11 chiffres, préfixe `229`, préfixe `+229`, international)
- `tests/Feature/Sms/SendSmsJobTest.php` — vérifier que `InvalidPhoneNumberException` est loggée sans casser le job quand le numéro est invalide
- Tests existants dans `tests/Feature/Sms/` ne doivent pas régresser
