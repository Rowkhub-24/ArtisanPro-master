<?php

namespace App\Listeners;

use App\Events\UserRegistered;
use App\Jobs\SendSmsJob;
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

        $phone = $this->normaliserTelephone($user->telephone ?? '');
        if (! $phone) return;

        // Ne pas envoyer si l'utilisateur a desactive les SMS
        if ($user->sms_notifications_enabled === false) return;

        if ($user->type_utilisateur === 'artisan') {
            $message = "Bienvenue sur ArtisanPro, {$user->prenom} ! Votre compte artisan est cree. Completez votre profil pour recevoir des demandes. artisanpro.bj";
        } else {
            $message = "Bienvenue sur ArtisanPro, {$user->prenom} ! Trouvez les meilleurs artisans pres de vous. artisanpro.bj";
        }

        SendSmsJob::dispatch($phone, $message, 'bienvenue', $user->id, 'user')
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
