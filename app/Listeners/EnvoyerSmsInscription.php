<?php

namespace App\Listeners;

use App\Events\UserRegistered;
use App\Jobs\SendSmsJob;
use App\Services\SmsNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Envoie un SMS de bienvenue apres inscription.
 * Queued: oui — ne bloque pas la reponse HTTP.
 */
class EnvoyerSmsInscription implements ShouldQueue
{
    public string $queue = 'sms';

    public function handle(UserRegistered $event): void
    {
        $user = $event->user;

        // Ne pas envoyer si l'utilisateur a desactive les SMS
        if ($user->sms_notifications_enabled === false) return;

        $phone = SmsNotificationService::normaliserTelephone($user->telephone ?? '');
        if (! $phone) return;

        if ($user->type_utilisateur === 'artisan') {
            $message = "Bienvenue sur ArtisanPro, {$user->prenom} ! Votre compte artisan est cree. Completez votre profil pour recevoir des demandes. artisanpro.bj";
        } else {
            $message = "Bienvenue sur ArtisanPro, {$user->prenom} ! Trouvez les meilleurs artisans pres de vous. artisanpro.bj";
        }

        SendSmsJob::dispatch($phone, $message, 'bienvenue', $user->id, 'user')
            ->onQueue('sms');
    }
}
