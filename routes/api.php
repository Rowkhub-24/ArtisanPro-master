<?php

use App\Http\Controllers\Api\V1\ArtisanController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\DevisController;
use App\Http\Controllers\Api\V1\ReservationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:120,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/artisans', [ArtisanController::class, 'index']);
    Route::get('/artisans/{artisan}', [ArtisanController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::get('/devis', [DevisController::class, 'index']);
        Route::post('/devis', [DevisController::class, 'store']);
        Route::patch('/devis/{devis}', [DevisController::class, 'update']);

        Route::get('/reservations', [ReservationController::class, 'index']);
        Route::post('/reservations', [ReservationController::class, 'store']);

        // Mock endpoints for new frontend pages
        Route::get('/client/reservations/{id}', function ($id) {
            return response()->json([
                'id' => $id,
                'artisan' => ['id' => 1, 'nom' => 'Dupont', 'metier' => 'Plombier'],
                'date' => now()->toDateTimeString(),
                'statut' => 'en_attente',
            ]);
        });

        Route::get('/artisan/reservations/{id}', function ($id) {
            return response()->json([
                'id' => $id,
                'client' => ['id' => 2, 'nom' => 'Martin'],
                'date' => now()->toDateTimeString(),
                'statut' => 'confirme',
            ]);
        });

        Route::get('/notifications', function () {
            return response()->json([['id' => 1, 'message' => 'Nouvelle réservation'],]);
        });

        Route::get('/conversations', function () {
            return response()->json([['id' => 1, 'with' => 'Artisan Dupont', 'last_message' => 'Bonjour']]);
        });

        Route::get('/admin/reports', function () {
            return response()->json(['revenu_total' => 0, 'reservations' => 0]);
        });
        Route::post('/paiements/webhook/{provider}', function (Request $request, string $provider) {
            if (! in_array($provider, ['kkiapay', 'fedapay'], true)) {
                abort(404);
            }

            $payload = $request->all();
            $reference = $payload['external_reference'] ?? $payload['reference'] ?? data_get($payload, 'metadata.reference_transaction') ?? data_get($payload, 'metadata.reservation_id');

            if (! $reference) {
                return response()->json(['message' => 'Référence de paiement manquante'], 400);
            }

            $paiement = \App\Models\Paiement::where('reference_transaction', $reference)->first();
            if (! $paiement) {
                return response()->json(['message' => 'Paiement introuvable'], 404);
            }

            if ($paiement->payment_provider && $paiement->payment_provider !== $provider) {
                return response()->json(['message' => 'Provider invalide pour ce paiement'], 400);
            }

            $status = strtolower($payload['status'] ?? $payload['payment_status'] ?? $payload['checkout_status'] ?? '');
            $mapping = [
                'completed' => 'reussi',
                'success' => 'reussi',
                'paid' => 'reussi',
                'succeeded' => 'reussi',
                'failed' => 'echoue',
                'refused' => 'echoue',
                'cancelled' => 'echoue',
                'pending' => 'en_attente',
                'waiting' => 'en_attente',
            ];

            $newStatus = $mapping[$status] ?? null;
            if (! $newStatus) {
                return response()->json(['message' => 'Statut de paiement inconnu', 'status' => $status], 400);
            }

            if ($paiement->statut !== $newStatus) {
                $paiement->update(['statut' => $newStatus]);
                if ($newStatus === 'reussi' && $paiement->reservation) {
                    $paiement->reservation->update(['statut' => 'terminee']);
                }
            }

            return response()->json(['ok' => true, 'statut' => $newStatus]);
        });
    });
});
