<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service SMS via Africa's Talking (compatible Orange Bénin, MTN Bénin).
 *
 * Variables .env requises :
 *   SMS_PROVIDER=africastalking   (ou 'twilio' ou 'stub')
 *   AFRICASTALKING_API_KEY=...
 *   AFRICASTALKING_USERNAME=...
 *   AFRICASTALKING_SENDER_ID=ArtisanPro
 *
 * En mode 'stub', les SMS sont loggés sans envoi réel.
 */
class SmsNotificationService
{
    private string $provider;

    public function __construct()
    {
        $this->provider = strtolower(env('SMS_PROVIDER', 'stub'));
    }

    // ── API publique ──────────────────────────────────────────────────────────

    /**
     * Méthode générique d'envoi SMS vers un utilisateur.
     * Vérification de défense en profondeur : ne pas envoyer si sms_notifications_enabled n'est pas true.
     */
    public function envoyer(string $phone, string $message, ?int $contextId = null, string $type = 'general'): void
    {
        $tel = $this->getPhone($phone);
        if (! $tel) {
            Log::debug('SMS skipped: no phone number provided.', ['type' => $type]);
            return;
        }

        $this->send($tel, $message, $contextId, $type);
    }

    /**
     * Méthode générique d'envoi SMS avec vérification des préférences utilisateur.
     * Défense en profondeur : bloquer si sms_notifications_enabled !== true (Q15).
     */
    public function envoyerPourUtilisateur(User $user, string $message, string $type = 'general', ?int $contextId = null): void
    {
        // Défense en profondeur : vérifier les préférences SMS de l'utilisateur
        if ($user->sms_notifications_enabled !== true) {
            Log::debug("SMS [{$type}] bloqué par préférence utilisateur.", [
                'user_id' => $user->id,
                'sms_notifications_enabled' => $user->sms_notifications_enabled,
            ]);
            return;
        }

        $phone = $user->telephone ?? '';
        $tel = $this->getPhone($phone);
        if (! $tel) {
            Log::debug("SMS [{$type}] skipped: no phone number for user.", ['user_id' => $user->id]);
            return;
        }

        $this->send($tel, $message, $contextId, $type);
    }

    public function sendConfirmationSms(Reservation $reservation): void
    {
        $phone = $this->getPhone($reservation->client?->user?->telephone);
        if (! $phone) return;

        $artisanNom = $reservation->artisan?->user
            ? trim($reservation->artisan->user->prenom . ' ' . $reservation->artisan->user->nom)
            : 'votre artisan';

        $date = optional($reservation->date)->format('d/m/Y') ?? 'date à confirmer';
        $creneau = $reservation->creneau ?? '';

        $message = "ArtisanPro : Votre réservation #{$reservation->id} est confirmée. "
            . "Artisan : {$artisanNom}. Date : {$date} {$creneau}. "
            . "Bonne prestation !";

        $this->send($phone, $message, $reservation->id, 'confirmation');
    }

    public function sendRejectionSms(Reservation $reservation): void
    {
        $phone = $this->getPhone($reservation->client?->user?->telephone);
        if (! $phone) return;

        $message = "ArtisanPro : Votre réservation #{$reservation->id} a été annulée. "
            . "Contactez-nous pour toute question.";

        $this->send($phone, $message, $reservation->id, 'annulation');
    }

    public function sendPaiementConfirmeSms(string $phone, string $montant, string $reference): void
    {
        $tel = $this->getPhone($phone);
        if (! $tel) return;

        $message = "ArtisanPro : Paiement de {$montant} FCFA confirmé. Réf : {$reference}. Merci !";
        $this->send($tel, $message, null, 'paiement');
    }

    public function sendLitigeOuvertSms(string $phone, int $litigeId): void
    {
        $tel = $this->getPhone($phone);
        if (! $tel) return;

        $message = "ArtisanPro : Un litige #{$litigeId} a été ouvert. "
            . "Connectez-vous pour répondre dans les 72h.";
        $this->send($tel, $message, null, 'litige');
    }

    // ── Envoi interne ─────────────────────────────────────────────────────────

    private function send(string $phone, string $message, ?int $reservationId, string $type): void
    {
        if ($this->provider === 'stub') {
            Log::info("SMS [{$type}] (stub)", [
                'phone'          => $this->maskPhone($phone),
                'message'        => $message,
                'reservation_id' => $reservationId,
            ]);
            return;
        }

        if ($this->provider === 'africastalking') {
            $this->sendViaAfricasTalking($phone, $message, $type);
            return;
        }

        Log::warning("SMS provider inconnu : {$this->provider}. SMS non envoyé.", [
            'phone' => $this->maskPhone($phone),
            'type'  => $type,
        ]);
    }

    private function sendViaAfricasTalking(string $phone, string $message, string $type): void
    {
        $apiKey   = env('AFRICASTALKING_API_KEY');
        $username = env('AFRICASTALKING_USERNAME');
        $senderId = env('AFRICASTALKING_SENDER_ID', 'ArtisanPro');

        if (! $apiKey || ! $username) {
            Log::warning('Africa\'s Talking non configuré (AFRICASTALKING_API_KEY ou USERNAME manquant).', [
                'type' => $type,
            ]);
            return;
        }

        // En sandbox, l'username est toujours "sandbox" et l'endpoint est différent
        $isSandbox = ($username === 'sandbox');
        $endpoint  = $isSandbox
            ? 'https://api.sandbox.africastalking.com/version1/messaging'
            : 'https://api.africastalking.com/version1/messaging';

        // Le sender_id n'est pas supporté en sandbox
        $payload = [
            'username' => $username,
            'to'       => $phone,
            'message'  => $message,
        ];
        if (! $isSandbox && $senderId) {
            $payload['from'] = $senderId;
        }

        try {
            $response = Http::withHeaders([
                'apiKey' => $apiKey,
                'Accept' => 'application/json',
            ])->asForm()->post($endpoint, $payload);

            if ($response->successful()) {
                Log::info("SMS [{$type}] envoyé via Africa's Talking" . ($isSandbox ? ' (sandbox)' : '') . '.', [
                    'phone'    => $this->maskPhone($phone),
                    'response' => $response->json(),
                ]);
            } else {
                Log::error("SMS [{$type}] échec Africa's Talking.", [
                    'phone'    => $this->maskPhone($phone),
                    'status'   => $response->status(),
                    'body'     => $response->body(),
                    'sandbox'  => $isSandbox,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error("SMS [{$type}] exception.", [
                'phone' => $this->maskPhone($phone),
                'error' => $e->getMessage(),
            ]);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Normalise un numéro béninois au format international E.164.
     *
     * Bénin (indicatif +229) :
     *  - Nouveau format (depuis 2021) : 10 chiffres locaux → +22901XXXXXXXX, +22961XXXXXXXX, etc.
     *  - Ancien format                : 8 chiffres locaux  → +229XXXXXXXX
     *  - Déjà en E.164               : commence par +229 ou 229 suivi de 8 ou 10 chiffres
     */
    private function getPhone(?string $phone): ?string
    {
        if (! $phone) return null;

        $clean = preg_replace('/\D/', '', $phone);

        // Déjà au format international avec indicatif 229
        // Accepte 229 + 8 chiffres (ancien) ou 229 + 10 chiffres (nouveau)
        if (str_starts_with($clean, '229') && in_array(strlen($clean), [11, 13])) {
            return '+' . $clean;
        }

        // Numéro local béninois — nouveau format 10 chiffres
        if (strlen($clean) === 10) {
            return '+229' . $clean;
        }

        // Numéro local béninois — ancien format 8 chiffres
        if (strlen($clean) === 8) {
            return '+229' . $clean;
        }

        // Autre format international sans le + (ex: 33XXXXXXXXX pour France)
        if (strlen($clean) >= 10) {
            return '+' . $clean;
        }

        Log::debug('SMS: numéro de téléphone non reconnu.', ['raw' => substr($clean, 0, 4) . '****']);
        return null;
    }

    private function maskPhone(string $phone): string
    {
        if (strlen($phone) <= 4) return '****';
        return substr($phone, 0, 4) . str_repeat('*', strlen($phone) - 8) . substr($phone, -4);
    }
}
