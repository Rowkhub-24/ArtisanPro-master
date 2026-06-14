<?php

namespace App\Listeners;

use App\Events\DevisRepondu;
use App\Jobs\SendSmsJob;
use App\Services\SmsNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Notifie le client par SMS que l'artisan a répondu à sa demande de devis.
 */
class EnvoyerSmsDevisRepondu implements ShouldQueue
{
    public string $queue = 'sms';

    public function handle(DevisRepondu $event): void
    {
        $devis = $event->devis;
        $clientUser = $devis->client?->user;

        if (! $clientUser) {
            return;
        }

        if ($clientUser->sms_notifications_enabled === false) {
            return;
        }

        $phone = SmsNotificationService::normaliserTelephone($clientUser->telephone ?? '');

        if (! $phone) {
            return;
        }

        $artisanNom = $devis->artisan?->user
            ? trim($devis->artisan->user->prenom . ' ' . $devis->artisan->user->nom)
            : 'votre artisan';

        $montant = number_format((float) $devis->montant_propose, 0, ',', ' ');

        $message = "ArtisanPro: {$artisanNom} a repondu a votre demande de devis #{$devis->id}. Montant propose: {$montant} FCFA. Consultez votre espace pour accepter ou refuser.";

        SendSmsJob::dispatch($phone, $message, 'devis_repondu', $devis->id, 'devis')
            ->onQueue('sms');
    }
}
