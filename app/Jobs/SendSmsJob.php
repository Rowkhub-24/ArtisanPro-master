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
 * Job d'envoi SMS en arriere-plan via Africa's Talking.
 *
 * Chaque SMS est enregistre dans sms_logs avant l'envoi.
 * En cas d'echec, le job est retente automatiquement (max 3 fois).
 * Le statut du SmsLog est mis a jour apres chaque tentative.
 */
class SendSmsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Nombre maximum de tentatives avant abandon.
     */
    public int $tries = 3;

    /**
     * Delai entre les tentatives en secondes.
     */
    public int $backoff = 5;

    /**
     * Timeout maximum par tentative (secondes).
     */
    public int $timeout = 30;

    public function __construct(
        public readonly string $phone,
        public readonly string $message,
        public readonly string $type = 'general',
        public readonly ?int $contextId = null,
        public readonly ?string $contextType = null,
    ) {}

    public function handle(): void
    {
        $provider = config('africastalking.provider', 'stub');

        // Creer ou retrouver le log SMS (pour eviter doublons sur retry)
        $smsLog = SmsLog::create([
            'recipient'    => $this->phone,
            'message'      => $this->message,
            'status'       => 'pending',
            'provider'     => $provider,
            'type'         => $this->type,
            'context_id'   => $this->contextId,
            'context_type' => $this->contextType,
            'attempt'      => $this->attempts(),
        ]);

        if ($provider === 'stub') {
            Log::info("SMS [{$this->type}] (stub/queue)", [
                'phone'   => $this->maskPhone($this->phone),
                'message' => $this->message,
            ]);
            $smsLog->update([
                'status'  => 'sent',
                'sent_at' => now(),
                'response' => json_encode(['stub' => true]),
            ]);
            return;
        }

        if ($provider === 'africastalking') {
            $this->sendViaAfricasTalking($smsLog);
            return;
        }

        Log::warning("SMS provider inconnu: {$provider}. SMS non envoye.");
        $smsLog->update(['status' => 'failed', 'error_message' => "Provider inconnu: {$provider}"]);
    }

    private function sendViaAfricasTalking(SmsLog $smsLog): void
    {
        $apiKey   = config('africastalking.api_key');
        $username = config('africastalking.username');
        $senderId = config('africastalking.sender_id', 'ArtisanPro');

        if (! $apiKey || ! $username) {
            $smsLog->update([
                'status'        => 'failed',
                'error_message' => 'AFRICASTALKING_API_KEY ou USERNAME manquant.',
            ]);
            Log::error("SMS [{$this->type}] echec: credentials AT manquants.");
            $this->fail(new \RuntimeException('Africa\'s Talking credentials manquants.'));
            return;
        }

        $isSandbox = ($username === 'sandbox');
        $endpoint  = $isSandbox
            ? config('africastalking.endpoints.sandbox')
            : config('africastalking.endpoints.production');

        $payload = [
            'username' => $username,
            'to'       => $this->phone,
            'message'  => $this->message,
        ];

        if (! $isSandbox && $senderId) {
            $payload['from'] = $senderId;
        }

        // Mettre a jour le statut a "retrying" si c'est une nouvelle tentative
        if ($this->attempts() > 1) {
            $smsLog->update(['status' => 'retrying', 'attempt' => $this->attempts()]);
        }

        try {
            $response = Http::withHeaders([
                'apiKey' => $apiKey,
                'Accept' => 'application/json',
            ])->timeout(25)->asForm()->post($endpoint, $payload);

            $responseBody = $response->json();

            if ($response->successful()) {
                // Verifier le statut dans la reponse AT
                $atStatus = $responseBody['SMSMessageData']['Recipients'][0]['status'] ?? null;
                $atCode   = $responseBody['SMSMessageData']['Recipients'][0]['statusCode'] ?? null;

                // AT retourne 101 pour succes
                if ($atCode === 101 || $atStatus === 'Success') {
                    $smsLog->update([
                        'status'   => 'sent',
                        'sent_at'  => now(),
                        'response' => json_encode($responseBody),
                        'attempt'  => $this->attempts(),
                    ]);
                    Log::info("SMS [{$this->type}] envoye via AT" . ($isSandbox ? ' (sandbox)' : '') . '.', [
                        'phone' => $this->maskPhone($this->phone),
                        'code'  => $atCode,
                    ]);
                } else {
                    // AT a repondu 200 mais le message a echoue
                    $errorMsg = $responseBody['SMSMessageData']['Recipients'][0]['status'] ?? 'Statut AT inconnu';
                    $smsLog->update([
                        'status'        => 'failed',
                        'response'      => json_encode($responseBody),
                        'error_message' => $errorMsg,
                        'attempt'       => $this->attempts(),
                    ]);
                    Log::warning("SMS [{$this->type}] AT repondu mais echec.", [
                        'phone'  => $this->maskPhone($this->phone),
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
                Log::error("SMS [{$this->type}] echec HTTP AT.", [
                    'phone'  => $this->maskPhone($this->phone),
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
                'phone' => $this->maskPhone($this->phone),
                'error' => $e->getMessage(),
            ]);
            $this->release($this->backoff);
        }
    }

    /**
     * Masque le numero pour les logs (RGPD).
     */
    private function maskPhone(string $phone): string
    {
        if (strlen($phone) <= 4) return '****';
        return substr($phone, 0, 4) . str_repeat('*', max(0, strlen($phone) - 8)) . substr($phone, -4);
    }

    /**
     * Appele quand toutes les tentatives ont echoue.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("SendSmsJob echoue definitvement apres {$this->tries} tentatives.", [
            'phone' => $this->maskPhone($this->phone),
            'type'  => $this->type,
            'error' => $exception->getMessage(),
        ]);
    }
}
