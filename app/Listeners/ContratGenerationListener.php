<?php

namespace App\Listeners;

use App\Contracts\ContratServiceInterface;
use App\Events\ReservationConfirmee;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Génère automatiquement un contrat de prestation lorsqu'une réservation
 * est confirmée. Implémente ShouldQueue pour ne pas bloquer la réponse HTTP.
 */
class ContratGenerationListener implements ShouldQueue
{
    public string $queue = 'default';

    public function handle(ReservationConfirmee $event): void
    {
        try {
            $service = app(ContratServiceInterface::class);
            $service->creerDepuisReservation($event->reservation);
        } catch (\Throwable $e) {
            Log::error('ContratGenerationListener: échec de la génération du contrat', [
                'reservation_id' => $event->reservation->id ?? null,
                'error'          => $e->getMessage(),
                'trace'          => $e->getTraceAsString(),
            ]);
        }
    }
}
