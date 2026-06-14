<?php

namespace App\Listeners;

use App\Events\ReservationCreee;
use App\Jobs\SendSmsJob;
use App\Services\SmsNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Notifie l'artisan par SMS qu'une nouvelle demande est arrivee.
 */
class EnvoyerSmsNouvelleReservation implements ShouldQueue
{
    public string $queue = 'sms';

    public function handle(ReservationCreee $event): void
    {
        $reservation = $event->reservation;
        $artisan = $reservation->artisan?->user;
        if (! $artisan) return;

        if ($artisan->sms_notifications_enabled === false) return;

        $phone = SmsNotificationService::normaliserTelephone($artisan->telephone ?? '');
        if (! $phone) return;

        $clientNom = $reservation->client?->user
            ? trim($reservation->client->user->prenom . ' ' . $reservation->client->user->nom)
            : 'un client';

        $date = optional($reservation->date)->format('d/m/Y') ?? 'date a confirmer';

        $message = "ArtisanPro: Nouvelle demande #{$reservation->id} de {$clientNom} pour le {$date}. Connectez-vous pour accepter ou refuser.";

        SendSmsJob::dispatch($phone, $message, 'nouvelle_demande', $reservation->id, 'reservation')
            ->onQueue('sms');
    }
}
