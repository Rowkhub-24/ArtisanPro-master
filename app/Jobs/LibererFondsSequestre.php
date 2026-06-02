<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\Paiement;
use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Libère automatiquement les fonds séquestre pour les réservations
 * marquées comme terminées depuis plus de 24 heures sans litige actif.
 *
 * Planifié : toutes les heures via console.php
 */
class LibererFondsSequestre implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // Réservations terminées depuis > 24h sans litige ouvert
        $reservations = Reservation::query()
            ->whereIn('statut', ['terminee', 'termine'])
            ->where('updated_at', '<', now()->subHours(24))
            ->whereDoesntHave('litiges', fn ($q) => $q->whereIn('statut', ['ouvert', 'en_cours']))
            ->with(['artisan.user', 'client.user'])
            ->get();

        $liberes = 0;

        foreach ($reservations as $reservation) {
            // Paiements en séquestre pour cette réservation
            $paiements = Paiement::where('id_reservation', $reservation->id)
                ->where('statut', 'reussi')
                ->whereIn('type_transaction', ['acompte', 'solde'])
                ->get();

            foreach ($paiements as $paiement) {
                // Marquer comme versé à l'artisan
                $paiement->update(['statut' => 'complete']);
                $liberes++;
            }

            // Notifier l'artisan
            if ($reservation->artisan?->user) {
                $montant = $paiements->sum('montant');
                $montantFormate = number_format($montant, 0, '.', ' ');
                Notification::notifier(
                    $reservation->artisan->user->id,
                    "💰 Fonds libérés : {$montantFormate} FCFA versés pour la réservation #{$reservation->id}.",
                    'paiement'
                );
            }

            // Notifier le client
            if ($reservation->client?->user) {
                Notification::notifier(
                    $reservation->client->user->id,
                    "✅ Prestation #{$reservation->id} validée. Les fonds ont été versés à l'artisan.",
                    'paiement'
                );
            }
        }

        Log::info('LibererFondsSequestre : job exécuté.', [
            'reservations_traitees' => $reservations->count(),
            'paiements_liberes'     => $liberes,
        ]);
    }
}
