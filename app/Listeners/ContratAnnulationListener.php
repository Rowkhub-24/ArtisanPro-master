<?php

namespace App\Listeners;

use App\Events\ReservationAnnulee;
use App\Models\Contrat;
use Illuminate\Support\Facades\Log;

/**
 * Met à jour le statut du contrat associé à une réservation annulée.
 * Synchrone (pas de ShouldQueue) car c'est une simple mise à jour DB.
 */
class ContratAnnulationListener
{
    public function handle(ReservationAnnulee $event): void
    {
        try {
            $contrat = Contrat::where('id_reservation', $event->reservation->id)->first();

            if (! $contrat) {
                // Aucun contrat associé à cette réservation — rien à faire
                return;
            }

            // Ne pas écraser un contrat déjà finalisé
            if ($contrat->statut === Contrat::STATUT_FINALISE) {
                return;
            }

            $contrat->statut = Contrat::STATUT_ANNULE;
            $contrat->save();
        } catch (\Throwable $e) {
            Log::error('ContratAnnulationListener: erreur lors de l\'annulation du contrat', [
                'reservation_id' => $event->reservation->id,
                'error'          => $e->getMessage(),
                'trace'          => $e->getTraceAsString(),
            ]);
        }
    }
}
