<?php

namespace App\Jobs;

use App\Models\Artisan;
use App\Models\Notification;
use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Notifie les artisans inactifs depuis 60 jours (aucune réservation).
 *
 * Planifié : une fois par semaine (lundi à 9h) via console.php
 */
class NotifierArtisansInactifs implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $seuilInactivite = now()->subDays(60);

        // Artisans sans réservation depuis 60 jours
        $artisansInactifs = Artisan::query()
            ->with('user')
            ->whereHas('user', fn ($q) => $q->where('statut', 'actif'))
            ->where(function ($q) use ($seuilInactivite) {
                $q->whereDoesntHave('reservations')
                  ->orWhereHas('reservations', function ($sub) use ($seuilInactivite) {
                      $sub->where('date_creation', '<', $seuilInactivite);
                  }, '=', Artisan::query()->selectRaw('count(*)')->whereColumn('id_artisan', 'artisans.id'));
            })
            ->get()
            ->filter(function (Artisan $artisan) use ($seuilInactivite) {
                $derniereReservation = Reservation::where('id_artisan', $artisan->id)
                    ->orderByDesc('date_creation')
                    ->value('date_creation');

                return $derniereReservation === null || $derniereReservation < $seuilInactivite;
            });

        $notifies = 0;

        foreach ($artisansInactifs as $artisan) {
            if (! $artisan->user) continue;

            // Éviter les doublons : ne pas notifier si déjà notifié cette semaine
            $dejaNotifie = Notification::where('id_utilisateur', $artisan->user->id)
                ->where('type_notification', 'systeme')
                ->where('message', 'like', '%inactif%')
                ->where('created_at', '>', now()->subDays(7))
                ->exists();

            if ($dejaNotifie) continue;

            Notification::notifier(
                $artisan->user->id,
                "👋 Vous n'avez pas eu de réservation depuis 60 jours. Mettez à jour votre profil et vos disponibilités pour attirer de nouveaux clients !",
                'systeme'
            );

            $notifies++;
        }

        Log::info('NotifierArtisansInactifs : job exécuté.', [
            'artisans_inactifs' => $artisansInactifs->count(),
            'notifications_envoyees' => $notifies,
        ]);
    }
}
