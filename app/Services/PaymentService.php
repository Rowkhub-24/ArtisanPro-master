<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\Artisan;
use App\Models\Notification as AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    /**
     * Vérifie la signature HMAC SHA256 si le secret est configuré.
     */
    public function verifySignature(string $provider, Request $request): bool
    {
        $payload = $request->getContent();

        $candidates = [
            'X-Signature',
            'X-' . ucfirst($provider) . '-Signature',
            'Signature',
            'X-Hub-Signature-256',
            'X-' . strtolower($provider) . '-signature',
        ];

        $header = null;
        foreach ($candidates as $h) {
            $val = $request->header($h);
            if ($val) {
                $header = $val;
                break;
            }
        }

        $envKeyName = strtoupper($provider) . '_SECRET';
        $secret = env($envKeyName);

        if (! $secret) {
            Log::warning("No webhook secret configured for provider={$provider} (env {$envKeyName})");
            return false;
        }

        if (! $header) {
            Log::warning("No webhook signature header present for provider={$provider}");
            return false;
        }

        // Some providers prefix the signature with `sha256=` or send hex or base64.
        $sig = preg_replace('/^sha256=/i', '', $header);

        $expectedHex = hash_hmac('sha256', $payload, $secret);
        $expectedBase64 = base64_encode(hex2bin($expectedHex));

        $ok = hash_equals($expectedHex, $sig) || hash_equals($expectedBase64, $sig);

        if (! $ok) {
            Log::warning("Invalid webhook signature for {$provider}", ['header' => $header]);
        }

        return $ok;
    }

    /**
     * Normalise le payload et retourne un tableau standard.
     */
    public function normalize(string $provider, array $data): array
    {
        // Tentatives de lecture génériques
        $id = $data['id'] ?? $data['transaction_id'] ?? $data['data']['id'] ?? null;
        $status = $data['status'] ?? $data['event'] ?? $data['data']['status'] ?? null;
        $amount = $data['amount'] ?? $data['data']['amount'] ?? null;
        $currency = $data['currency'] ?? $data['data']['currency'] ?? 'XOF';
        $metadata = $data['metadata'] ?? $data['data']['metadata'] ?? [];

        return [
            'provider_tx_id' => $id,
            'status' => $status,
            'amount' => $amount,
            'currency' => $currency,
            'metadata' => $metadata,
        ];
    }

    /**
     * Traite l'événement normalisé et met à jour/crée la transaction.
     */
    public function handleProviderEvent(string $provider, array $normalized): Transaction
    {
        $providerTxId = $normalized['provider_tx_id'] ?? null;

        $transaction = Transaction::firstOrNew([
            'provider' => $provider,
            'provider_transaction_id' => $providerTxId,
        ]);

        $transaction->amount = is_numeric($normalized['amount']) ? $normalized['amount'] : ($transaction->amount ?? 0);
        $transaction->currency = $normalized['currency'] ?? ($transaction->currency ?? 'XOF');
        $transaction->metadata = $normalized['metadata'] ?? [];
        $statusNorm = strtolower((string) ($normalized['status'] ?? ''));
        $transaction->status = in_array($statusNorm, ['success', 'succeeded', 'completed', 'paid']) ? 'succeeded' : (in_array($statusNorm, ['failed', 'error', 'cancelled']) ? 'failed' : 'pending');
        $transaction->provider = $provider;
        $transaction->provider_transaction_id = $providerTxId;

        // try to attach artisan id from metadata
        $meta = $normalized['metadata'] ?? [];
        $artisanId = $meta['id_artisan'] ?? $meta['artisan_id'] ?? $meta['idArtisan'] ?? null;
        if ($artisanId) {
            $transaction->id_artisan = $artisanId;
        }

        $userId = $meta['id_utilisateur'] ?? $meta['user_id'] ?? null;
        if ($userId) {
            $transaction->id_utilisateur = $userId;
        }

        $transaction->save();

        // Si succeeded => notifier l'artisan (si présent)
        if ($transaction->status === 'succeeded' && $transaction->id_artisan) {
            try {
                $artisan = Artisan::find($transaction->id_artisan);
                if ($artisan && $artisan->user) {
                    $message = sprintf('Paiement reçu: %s %s via %s', number_format($transaction->amount, 2, '.', ' '), $transaction->currency, ucfirst($provider));
                    AppNotification::notifier($artisan->user->id, $message, 'paiement');
                }
            } catch (\Throwable $e) {
                Log::error('Failed to notify artisan after transaction', ['error' => $e->getMessage()]);
            }
        }

        return $transaction;
    }
}
