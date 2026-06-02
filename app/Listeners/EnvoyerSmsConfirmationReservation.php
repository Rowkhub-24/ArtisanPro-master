<?php

namespace App\Listeners;

use App\Events\ReservationConfirmee;
use App\Jobs\SendSmsJob;
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

        $phone = $this->normaliserTelephone($client->telephone ?? '');
        if (! $phone) return;

        if ($client->sms_notifications_enabled === false) return;

        $artisanNom = $reservation->artisan?->user
            ? trim($reservation->artisan->user->prenom . ' ' . $reservation->artisan->user->nom)
            : 'votre artisan';

        $date    = optional($reservation->date)->format('d/m/Y') ?? 'date a confirmer';
        $creneau = $reservation->creneau ? " {$reservation->creneau}" : '';

        $message = "ArtisanPro: Votre demande #{$reservation->id} a ete acceptee par {$artisanNom}. RDV le {$date}{$creneau}. Bonne prestation !";

        SendSmsJob::dispatch($phone, $message, 'confirmation', $reservation->id, 'reservation')
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
