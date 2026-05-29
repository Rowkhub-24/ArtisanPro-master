<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function kkiapay(Request $request, PaymentService $service)
    {
        if (! $service->verifySignature('kkiapay', $request)) {
            return response()->json(['error' => 'invalid signature'], 403);
        }

        $data = $request->json()->all();
        $normalized = $service->normalize('kkiapay', $data);
        $tx = $service->handleProviderEvent('kkiapay', $normalized);

        Log::info('Kkiapay webhook processed', ['tx' => $tx->id]);
        return response()->json(['ok' => true]);
    }

    public function fedapay(Request $request, PaymentService $service)
    {
        if (! $service->verifySignature('fedapay', $request)) {
            return response()->json(['error' => 'invalid signature'], 403);
        }

        $data = $request->json()->all();
        $normalized = $service->normalize('fedapay', $data);
        $tx = $service->handleProviderEvent('fedapay', $normalized);

        Log::info('Fedapay webhook processed', ['tx' => $tx->id]);
        return response()->json(['ok' => true]);
    }
}
