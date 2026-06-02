<?php

namespace App\Listeners;

use App\Events\ReservationCreee;
use App\Jobs\SendSmsJob;
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

        $phone = $this->normaliserTelephone($artisan->telephone ?? '');
        if (! $phone) return;

        if ($artisan->sms_notifications_enabled === false) return;

        $clientNom = $reservation->client?->user
            ? trim($reservation->client->user->prenom . ' ' . $reservation->client->user->nom)
            : 'un client';

        $date = optional($reservation->date)->format('d/m/Y') ?? 'date a confirmer';

        $message = "ArtisanPro: Nouvelle demande #{$reservation->id} de {$clientNom} pour le {$date}. Connectez-vous pour accepter ou refuser.";

        SendSmsJob::dispatch($phone, $message, 'nouvelle_demande', $reservation->id, 'reservation')
            ->onQueue('sms');
    }

    private function normaliserTelephone(?string $phone): ?string
    {
        if (! $phone) return null;
        $clean = preg_replace('/\D/', '', $phone);
        if (str_starts_with($clean, '229') && in_array(strlen($clean), [11, 13])) return '+' . $clean;
        if (strlen($clean) === 10) return '+229' . $clean;
        if (strlen($clean) === 8)  return '+229' . $clean;
        if (strlen($clean) >= 10)  return '+' . $clean;
        return null;
    }
}
