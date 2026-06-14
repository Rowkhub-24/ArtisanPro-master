<?php

namespace App\Jobs;

use App\Models\SmsLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Job d'envoi SMS en arrière-plan via Africa's Talking.
 *
 * - Normalise le numéro au format E.164 avant tout envoi.
 * - Choisit automatiquement l'endpoint sandbox ou production selon le username.
 * - Enregistre chaque tentative dans sms_logs.
 * - Retente automatiquement jusqu'à $tries fois en cas d'échec réseau ou HTTP 5xx.
 */
class SendSmsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Nombre maximum de tentatives avant abandon. */
    public int $tries = 3;

    /** Délai entre les tentatives (secondes). */
    public int $backoff = 5;

    /** Timeout HTTP maximum par tentative (secondes). */
    public int $timeout = 30;

    public function __construct(
        public readonly string  $phone,
        public readonly string  $message,
        public readonly string  $type        = 'general',
        public readonly ?int    $contextId   = null,
        public readonly ?string $contextType = null,
    ) {}

    // ─────────────────────────────────────────────────────────────────────────

    public function handle(): void
    {
        // Normaliser le numéro en E.164 avant toute chose
        $phone = $this->normaliserTelephone($this->phone);

        if ($phone === null) {
            Log::warning("SendSmsJob [{$this->type}] : numéro invalide, SMS abandonné.", [
                'phone_raw' => $this->phone,
            ]);
            SmsLog::create([
                'recipient'     => $this->phone,
                'message'       => $this->message,
                'status'        => 'failed',
                'provider'      => config('africastalking.provider', 'stub'),
                'type'          => $this->type,
                'context_id'    => $this->contextId,
                'context_type'  => $this->contextType,
                'attempt'       => $this->attempts(),
                'error_message' => 'Numéro de téléphone invalide ou non normalisable.',
            ]);
            return;
        }

        $provider = config('africastalking.provider', 'stub');

        $smsLog = SmsLog::create([
            'recipient'    => $phone,
            'message'      => $this->message,
            'status'       => 'pending',
            'provider'     => $provider,
            'type'         => $this->type,
            'context_id'   => $this->contextId,
            'context_type' => $this->contextType,
            'attempt'      => $this->attempts(),
        ]);

        match ($provider) {
            'stub'           => $this->handleStub($smsLog),
            'africastalking' => $this->sendViaAfricasTalking($phone, $smsLog),
            default          => $this->handleUnknownProvider($provider, $smsLog),
        };
    }

    // ─── Providers ───────────────────────────────────────────────────────────

    private function handleStub(SmsLog $smsLog): void
    {
        Log::info("SMS [{$this->type}] (stub)", [
            'phone'   => $this->maskPhone($smsLog->recipient),
            'message' => $this->message,
        ]);

        $smsLog->update([
            'status'   => 'sent',
            'sent_at'  => now(),
            'response' => json_encode(['stub' => true]),
        ]);
    }

    private function handleUnknownProvider(string $provider, SmsLog $smsLog): void
    {
        Log::warning("SMS [{$this->type}] : provider inconnu «{$provider}», SMS non envoyé.");
        $smsLog->update([
            'status'        => 'failed',
            'error_message' => "Provider inconnu: {$provider}",
        ]);
    }

    private function sendViaAfricasTalking(string $phone, SmsLog $smsLog): void
    {
        $apiKey   = config('africastalking.api_key');
        $username = config('africastalking.username');
        $senderId = config('africastalking.sender_id', 'ArtisanPro');

        // Credentials manquants → échec immédiat, pas de retry
        if (empty($apiKey) || empty($username)) {
            $smsLog->update([
                'status'        => 'failed',
                'error_message' => 'AFRICASTALKING_API_KEY ou USERNAME manquant.',
            ]);
            Log::error("SMS [{$this->type}] échec : credentials AT manquants.");
            $this->fail(new \RuntimeException("Africa's Talking credentials manquants."));
            return;
        }

        $isSandbox = ($username === 'sandbox');
        $endpoint  = $isSandbox
            ? config('africastalking.endpoints.sandbox')
            : config('africastalking.endpoints.production');

        $payload = [
            'username' => $username,
            'to'       => $phone,
            'message'  => $this->message,
        ];

        // Le sender_id n'est accepté que hors sandbox
        if (! $isSandbox && ! empty($senderId)) {
            $payload['from'] = $senderId;
        }

        if ($this->attempts() > 1) {
            $smsLog->update(['status' => 'retrying', 'attempt' => $this->attempts()]);
        }

        try {
            $response     = Http::withHeaders([
                'apiKey' => $apiKey,
                'Accept' => 'application/json',
            ])->timeout(25)->asForm()->post($endpoint, $payload);

            $responseBody = $response->json() ?? [];

            if ($response->successful()) {
                $recipient = $responseBody['SMSMessageData']['Recipients'][0] ?? [];
                $atCode    = $recipient['statusCode'] ?? null;
                $atStatus  = $recipient['status']     ?? null;

                if ($atCode === 101 || $atStatus === 'Success') {
                    $smsLog->update([
                        'status'   => 'sent',
                        'sent_at'  => now(),
                        'response' => json_encode($responseBody),
                        'attempt'  => $this->attempts(),
                    ]);
                    Log::info("SMS [{$this->type}] envoyé via AT" . ($isSandbox ? ' (sandbox)' : '') . '.', [
                        'phone' => $this->maskPhone($phone),
                        'code'  => $atCode,
                    ]);
                } else {
                    // HTTP 200 mais AT indique un échec (ex. InvalidPhoneNumber)
                    $errorMsg = $atStatus ?? 'Statut AT inconnu';
                    $smsLog->update([
                        'status'        => 'failed',
                        'response'      => json_encode($responseBody),
                        'error_message' => $errorMsg,
                        'attempt'       => $this->attempts(),
                    ]);
                    Log::warning("SMS [{$this->type}] AT repondu mais échec.", [
                        'phone'  => $this->maskPhone($phone),
                        'status' => $errorMsg,
                    ]);
                    $this->release($this->backoff);
                }
            } else {
                $errorMsg = "HTTP {$response->status()}: " . $response->body();
                $smsLog->update([
                    'status'        => 'failed',
                    'response'      => $response->body(),
                    'error_message' => $errorMsg,
                    'attempt'       => $this->attempts(),
                ]);
                Log::error("SMS [{$this->type}] échec HTTP AT.", [
                    'phone'  => $this->maskPhone($phone),
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                $this->release($this->backoff);
            }
        } catch (\Throwable $e) {
            $smsLog->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
                'attempt'       => $this->attempts(),
            ]);
            Log::error("SMS [{$this->type}] exception AT.", [
                'phone' => $this->maskPhone($phone),
                'error' => $e->getMessage(),
            ]);
            $this->release($this->backoff);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Normalise un numéro de téléphone au format E.164 (+229XXXXXXXX).
     * Retourne null si le numéro est invalide ou non reconnu.
     *
     * Exemples acceptés :
     *   "+229 90 00 00 00" → "+22990000000"
     *   "90000000"         → "+22990000000"  (8 chiffres → Bénin)
     *   "22990000000"      → "+22990000000"
     */
    private function normaliserTelephone(?string $telephone): ?string
    {
        if (empty($telephone)) {
            return null;
        }

        $clean = preg_replace('/\D/', '', $telephone);

        if (empty($clean)) {
            return null;
        }

        // Déjà préfixé 229 (Bénin, 11 chiffres)
        if (str_starts_with($clean, '229') && strlen($clean) === 11) {
            return '+' . $clean;
        }

        // 8 chiffres locaux → ajouter indicatif Bénin
        if (strlen($clean) === 8) {
            return '+229' . $clean;
        }

        // 10 chiffres avec 0 initial (certains formats régionaux)
        if (strlen($clean) === 10 && str_starts_with($clean, '0')) {
            return '+229' . substr($clean, 1);
        }

        // Numéro international (≥ 10 chiffres)
        if (strlen($clean) >= 10) {
            return '+' . $clean;
        }

        return null;
    }

    /**
     * Masque partiellement un numéro pour les logs (RGPD).
     * Ex. : +22961234567 → +229****4567
     */
    private function maskPhone(string $phone): string
    {
        if (strlen($phone) <= 4) {
            return '****';
        }

        return substr($phone, 0, 4) . str_repeat('*', max(0, strlen($phone) - 8)) . substr($phone, -4);
    }

    /**
     * Appelé quand toutes les tentatives ont échoué.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("SendSmsJob échoué définitivement après {$this->tries} tentatives.", [
            'phone' => $this->maskPhone($this->phone),
            'type'  => $this->type,
            'error' => $exception->getMessage(),
        ]);
    }
}
