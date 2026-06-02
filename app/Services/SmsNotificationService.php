<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\SmsLog;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Service SMS centralisé utilisant Africa's Talking comme fournisseur.
 *
 * Toutes les méthodes d'envoi vérifient d'abord les préférences SMS de
 * l'utilisateur (sms_notifications_enabled) avant d'appeler l'API externe.
 * Si la préférence est false ou null, l'envoi est bloqué par défaut (Q15).
 */
class SmsNotificationService
{
    private string $provider;
    private string $apiKey;
    private string $username;
    private string $senderId;

    public function __construct()
    {
        $this->provider  = config('services.africastalking.provider', env('SMS_PROVIDER', 'africastalking'));
        $this->apiKey    = config('services.africastalking.api_key', env('AFRICASTALKING_API_KEY', ''));
        $this->username  = config('services.africastalking.username', env('AFRICASTALKING_USERNAME', 'sandbox'));
        $this->senderId  = config('services.africastalking.sender_id', env('AFRICASTALKING_SENDER_ID', 'ArtisanPro'));
    }

    // ── Méthode générique ─────────────────────────────────────────────────────

    /**
     * Envoi générique d'un SMS à un numéro de téléphone.
     * Si un User est fourni, vérifie sms_notifications_enabled avant envoi.
     *
     * @param  string    $telephone Numéro de téléphone du destinataire
     * @param  string    $message   Contenu du SMS
     * @param  User|null $user      Utilisateur destinataire (optionnel) pour vérifier les préférences
     * @param  string    $type      Type de SMS pour le log (default 'general')
     * @param  int|null  $contextId Identifiant du contexte (réservation, litige, etc.)
     */
    public function envoyer(string $telephone, string $message, ?User $user = null, string $type = 'general', ?int $contextId = null): void
    {
        // Vérifier les préférences SMS de l'utilisateur si fourni (Q15)
        if ($user !== null && $user->sms_notifications_enabled !== true) {
            Log::debug('SMS bloqué : préférences désactivées ou indéterminées', [
                'user_id'                    => $user->id,
                'sms_notifications_enabled'  => $user->sms_notifications_enabled,
                'type'                       => $type,
            ]);
            return;
        }

        if (empty($telephone)) {
            Log::warning('SMS ignoré : numéro de téléphone vide', ['type' => $type, 'context_id' => $contextId]);
            return;
        }

        $this->envoyerViaApi($telephone, $message, $type, $contextId);
    }

    // ── Méthodes événementielles ──────────────────────────────────────────────

    /**
     * SMS de confirmation de réservation envoyé au client.
     * Vérifie les préférences SMS du client avant envoi.
     */
    public function sendConfirmationSms(Reservation $reservation): void
    {
        $clientUser = $reservation->client?->user;

        if (! $clientUser) {
            return;
        }

        // Guard : bloquer si sms_notifications_enabled !== true (Q15)
        if ($clientUser->sms_notifications_enabled !== true) {
            Log::debug('SMS confirmation bloqué : préférences SMS désactivées', [
                'user_id'                   => $clientUser->id,
                'sms_notifications_enabled' => $clientUser->sms_notifications_enabled,
                'reservation_id'            => $reservation->id,
            ]);
            return;
        }

        $artisanNom = $reservation->artisan?->user
            ? trim($reservation->artisan->user->prenom . ' ' . $reservation->artisan->user->nom)
            : 'votre artisan';

        $date = $reservation->date_debut
            ? $reservation->date_debut->format('d/m/Y à H:i')
            : ($reservation->date?->format('d/m/Y') ?? 'date à confirmer');

        $message = "ArtisanPro : Votre réservation #{$reservation->id} avec {$artisanNom} est confirmée pour le {$date}. Merci !";

        $this->envoyerViaApi(
            $clientUser->telephone ?? '',
            $message,
            'confirmation_reservation',
            $reservation->id
        );
    }

    /**
     * SMS de rejet/annulation de réservation envoyé au client.
     * Vérifie les préférences SMS du client avant envoi.
     */
    public function sendRejectionSms(Reservation $reservation): void
    {
        $clientUser = $reservation->client?->user;

        if (! $clientUser) {
            return;
        }

        // Guard : bloquer si sms_notifications_enabled !== true (Q15)
        if ($clientUser->sms_notifications_enabled !== true) {
            Log::debug('SMS rejet bloqué : préférences SMS désactivées', [
                'user_id'                   => $clientUser->id,
                'sms_notifications_enabled' => $clientUser->sms_notifications_enabled,
                'reservation_id'            => $reservation->id,
            ]);
            return;
        }

        $artisanNom = $reservation->artisan?->user
            ? trim($reservation->artisan->user->prenom . ' ' . $reservation->artisan->user->nom)
            : 'votre artisan';

        $message = "ArtisanPro : Votre réservation #{$reservation->id} avec {$artisanNom} a été annulée. Contactez-nous pour plus d'informations.";

        $this->envoyerViaApi(
            $clientUser->telephone ?? '',
            $message,
            'annulation_reservation',
            $reservation->id
        );
    }

    /**
     * SMS d'alerte ouverture de litige envoyé à l'artisan.
     * Vérifie les préférences SMS de l'artisan avant envoi.
     *
     * @param  string   $telephone  Numéro de l'artisan
     * @param  int      $litigeId   Identifiant du litige
     * @param  User|null $artisanUser  Utilisateur artisan pour vérifier les préférences
     */
    public function sendLitigeOuvertSms(string $telephone, int $litigeId, ?User $artisanUser = null): void
    {
        // Guard : bloquer si sms_notifications_enabled !== true (Q15)
        if ($artisanUser !== null && $artisanUser->sms_notifications_enabled !== true) {
            Log::debug('SMS litige bloqué : préférences SMS désactivées', [
                'user_id'                   => $artisanUser->id,
                'sms_notifications_enabled' => $artisanUser->sms_notifications_enabled,
                'litige_id'                 => $litigeId,
            ]);
            return;
        }

        if (empty($telephone)) {
            Log::warning('SMS litige ignoré : numéro de téléphone vide', ['litige_id' => $litigeId]);
            return;
        }

        $message = "ArtisanPro : Un litige #{$litigeId} a été ouvert. Connectez-vous pour soumettre votre réponse dans les 72h.";

        $this->envoyerViaApi($telephone, $message, 'litige_ouvert', $litigeId);
    }

    // ── Couche d'envoi API ────────────────────────────────────────────────────

    /**
     * Appel à l'API Africa's Talking pour envoyer le SMS.
     * Enregistre le résultat dans sms_logs.
     */
    private function envoyerViaApi(string $telephone, string $message, string $type, ?int $contextId = null): void
    {
        // Masquer partiellement le numéro pour les logs (RGPD)
        $telephoneMasque = $this->masquerTelephone($telephone);

        $logData = [
            'recipient'    => $telephoneMasque,
            'message'      => $message,
            'status'       => 'pending',
            'provider'     => $this->provider,
            'type'         => $type,
            'context_id'   => $contextId,
            'context_type' => $this->typeContexte($type),
            'attempt'      => 1,
        ];

        try {
            if (empty($this->apiKey) || $this->username === 'sandbox') {
                // Mode sandbox / clé manquante : simuler l'envoi
                Log::info("SMS [{$type}] (sandbox) → {$telephoneMasque} : {$message}");

                SmsLog::create(array_merge($logData, [
                    'status'   => 'sent',
                    'response' => json_encode(['status' => 'sandbox_simulated']),
                    'sent_at'  => now(),
                ]));

                return;
            }

            // Appel HTTP à l'API Africa's Talking
            $response = $this->appelAfricasTalking($telephone, $message);

            SmsLog::create(array_merge($logData, [
                'status'   => 'sent',
                'response' => json_encode($response),
                'sent_at'  => now(),
            ]));

            Log::info("SMS [{$type}] envoyé → {$telephoneMasque}");

        } catch (\Throwable $e) {
            Log::error("SMS [{$type}] échec → {$telephoneMasque}", [
                'error'      => $e->getMessage(),
                'type'       => $type,
                'context_id' => $contextId,
            ]);

            SmsLog::create(array_merge($logData, [
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
                'sent_at'       => now(),
            ]));
        }
    }

    /**
     * Effectue la requête HTTP vers l'API Africa's Talking.
     *
     * @return array<string, mixed>
     */
    private function appelAfricasTalking(string $telephone, string $message): array
    {
        $url = 'https://api.africastalking.com/version1/messaging';

        $payload = [
            'username' => $this->username,
            'to'       => $telephone,
            'message'  => $message,
        ];

        if (! empty($this->senderId)) {
            $payload['from'] = $this->senderId;
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'apiKey: ' . $this->apiKey,
                'Accept: application/json',
                'Content-Type: application/x-www-form-urlencoded',
            ],
            CURLOPT_TIMEOUT        => 10,
        ]);

        $rawResponse = curl_exec($ch);
        $httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError   = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new \RuntimeException("cURL error: {$curlError}");
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            throw new \RuntimeException("Africa's Talking API returned HTTP {$httpCode}: {$rawResponse}");
        }

        /** @var array<string, mixed> $decoded */
        $decoded = json_decode($rawResponse, true) ?? [];

        return $decoded;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Masque partiellement un numéro de téléphone pour les logs.
     * Ex. : +22961234567 → +229****4567
     */
    private function masquerTelephone(string $telephone): string
    {
        if (strlen($telephone) <= 4) {
            return str_repeat('*', strlen($telephone));
        }

        return substr($telephone, 0, -6) . '****' . substr($telephone, -2);
    }

    /**
     * Détermine le type de contexte Eloquent morphique depuis le type SMS.
     */
    private function typeContexte(string $type): ?string
    {
        return match (true) {
            str_contains($type, 'reservation') => \App\Models\Reservation::class,
            str_contains($type, 'litige')      => \App\Models\Litige::class,
            default                            => null,
        };
    }
}
