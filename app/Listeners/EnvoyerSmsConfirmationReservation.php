<?php

namespace App\Listeners;

use App\Events\ReservationConfirmee;
use App\Jobs\SendSmsJob;
use App\Services\SmsNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Notifie le client par SMS que l'artisan a accepte sa reservation.
 */
class EnvoyerSmsConfirmationReservation implements ShouldQueue
{
    public string $queue = 'sms';

    public function handle(ReservationConfirmee $event): void
    {
        $reservation = $event->reservation;
        $client = $reservation->client?->user;
        if (! $client) return;

        if ($client->sms_notifications_enabled === false) return;

        $phone = SmsNotificationService::normaliserTelephone($client->telephone ?? '');
        if (! $phone) return;

        $artisanNom = $reservation->artisan?->user
            ? trim($reservation->artisan->user->prenom . ' ' . $reservation->artisan->user->nom)
            : 'votre artisan';

        $date    = optional($reservation->date)->format('d/m/Y') ?? 'date a confirmer';
        $creneau = $reservation->creneau ? " {$reservation->creneau}" : '';

        $message = "ArtisanPro: Votre demande #{$reservation->id} a ete acceptee par {$artisanNom}. RDV le {$date}{$creneau}. Bonne prestation !";

        SendSmsJob::dispatch($phone, $message, 'confirmation', $reservation->id, 'reservation')
            ->onQueue('sms');
    }
}
