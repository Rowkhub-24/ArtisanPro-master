<?php

namespace App\Listeners;

use App\Events\ReservationAnnulee;
use App\Jobs\SendSmsJob;
use App\Services\SmsNotificationService;
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
            $phone = SmsNotificationService::normaliserTelephone($clientUser->telephone ?? '');
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
            $phone = SmsNotificationService::normaliserTelephone($artisanUser->telephone ?? '');
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
}
