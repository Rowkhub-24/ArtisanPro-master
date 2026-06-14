<?php

namespace App\Listeners;

use App\Events\ArtisanValide;
use App\Jobs\SendSmsJob;
use App\Services\SmsNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Notifie l'artisan par SMS que son compte a ete valide par l'admin.
 */
class EnvoyerSmsArtisanValide implements ShouldQueue
{
    public string $queue = 'sms';

    public function handle(ArtisanValide $event): void
    {
        $artisan = $event->artisan;
        $user    = $artisan->user;

        if (! $user) return;

        if ($user->sms_notifications_enabled === false) return;

        $phone = SmsNotificationService::normaliserTelephone($user->telephone ?? '');
        if (! $phone) return;

        $prenom  = $user->prenom ?? 'Artisan';
        $message = "ArtisanPro: Felicitations {$prenom} ! Votre compte artisan est maintenant valide. Vous pouvez recevoir des demandes. Bonne chance ! artisanpro.bj";

        SendSmsJob::dispatch($phone, $message, 'compte_valide', $artisan->id, 'artisan')
            ->onQueue('sms');
    }
}
