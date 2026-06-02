<?php

namespace App\Listeners;

use App\Events\ReservationAnnulee;
use App\Jobs\SendSmsJob;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Notifie les deux parties par SMS en cas d'annulation.
 */
class EnvoyerSmsAnnulation implements ShouldQueue
{
    public string $queue = 'sms';

    public function handle(ReservationAnnulee $event): void
    {
        $reservation = $event->reservation;
        $annulePar   = $event->annulePar;

        // SMS au client
        $clientUser = $reservation->client?->user;
        if ($clientUser) {
            $phone = $this->normaliserTelephone($clientUser->telephone ?? '');
            if ($phone && $clientUser->sms_notifications_enabled !== false) {
                if ($annulePar === 'artisan') {
                    $msg = "ArtisanPro: Votre demande #{$reservation->id} a ete annulee par l'artisan. Vous pouvez faire une nouvelle demande.";
                } else {
                    $msg = "ArtisanPro: Votre demande #{$reservation->id} a bien ete annulee. Contactez-nous pour toute question.";
                }
                SendSmsJob::dispatch($phone, $msg, 'annulation', $reservation->id, 'reservation')
                    ->onQueue('sms');
            }
        }

        // SMS a l'artisan
        $artisanUser = $reservation->artisan?->user;
        if ($artisanUser && $annulePar === 'client') {
            $phone = $this->normaliserTelephone($artisanUser->telephone ?? '');
            if ($phone && $artisanUser->sms_notifications_enabled !== false) {
                $clientNom = $clientUser
                    ? trim($clientUser->prenom . ' ' . $clientUser->nom)
                    : 'le client';
                $msg = "ArtisanPro: La demande #{$reservation->id} de {$clientNom} a ete annulee. Votre planning a ete mis a jour.";
                SendSmsJob::dispatch($phone, $msg, 'annulation', $reservation->id, 'reservation')
                    ->onQueue('sms');
            }
        }
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
