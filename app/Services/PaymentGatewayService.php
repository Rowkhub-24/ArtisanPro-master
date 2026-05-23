<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class PaymentGatewayService
{
    public function createCheckoutUrl(string $provider, array $data): string
    {
        return match ($provider) {
            'kkiapay' => $this->createKkiapayCheckout($data),
            'fedapay' => $this->createFedapayCheckout($data),
            default => throw new \InvalidArgumentException("Provider de paiement inconnu: $provider"),
        };
    }

    protected function createKkiapayCheckout(array $data): string
    {
        $apiKey = $data['account_key'] ?? env('KKIAPAY_API_KEY');
        if (! $apiKey) {
            throw new \RuntimeException('KKIAPAY_API_KEY non défini.');
        }

        $endpoint = 'https://api.kkiapay.me/v1/checkout';
        $payload = [
            'amount' => (int) $data['amount'],
            'currency' => $data['currency'] ?? 'XOF',
            'external_reference' => $data['reference'] ?? null,
            'customer' => [
                'name' => $data['customer_name'] ?? null,
                'email' => $data['customer_email'] ?? null,
                'phone' => $data['customer_phone'] ?? null,
            ],
            'merchant_id' => $data['account_id'] ?? null,
            'payment_method' => $data['method'] ?? 'mobile_money',
            'redirect_url' => $data['return_url'] ?? url('/client/paiements'),
            'metadata' => [
                'reservation_id' => $data['reservation_id'] ?? null,
            ],
        ];

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Accept' => 'application/json',
        ])->post($endpoint, $payload);

        if (! $response->successful()) {
            throw new \RuntimeException('Erreur Kkiapay: ' . $response->body());
        }

        $body = $response->json();
        return $body['data']['checkout_url'] ?? $body['checkout_url'] ?? throw new \RuntimeException('URL de checkout Kkiapay introuvable.');
    }

    protected function createFedapayCheckout(array $data): string
    {
        $apiKey = $data['account_key'] ?? env('FEDAPAY_API_KEY');
        if (! $apiKey) {
            throw new \RuntimeException('FEDAPAY_API_KEY non défini.');
        }

        $endpoint = 'https://api.fedapay.com/v1/checkout';
        $payload = [
            'amount' => (int) $data['amount'],
            'currency' => $data['currency'] ?? 'XOF',
            'reference' => $data['reference'] ?? null,
            'customer' => [
                'name' => $data['customer_name'] ?? null,
                'email' => $data['customer_email'] ?? null,
                'phone' => $data['customer_phone'] ?? null,
            ],
            'merchant_id' => $data['account_id'] ?? null,
            'return_url' => $data['return_url'] ?? url('/client/paiements'),
            'metadata' => [
                'reservation_id' => $data['reservation_id'] ?? null,
            ],
        ];

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Accept' => 'application/json',
        ])->post($endpoint, $payload);

        if (! $response->successful()) {
            throw new \RuntimeException('Erreur Fedapay: ' . $response->body());
        }

        $body = $response->json();
        return $body['data']['checkout_url'] ?? $body['checkout_url'] ?? throw new \RuntimeException('URL de checkout Fedapay introuvable.');
    }
}
