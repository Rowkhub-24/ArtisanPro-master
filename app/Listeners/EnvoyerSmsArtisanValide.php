<?php

namespace App\Listeners;

use App\Events\ArtisanValide;
use App\Jobs\SendSmsJob;
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

        $phone = $this->normaliserTelephone($user->telephone ?? '');
        if (! $phone) return;

        if ($user->sms_notifications_enabled === false) return;

        $prenom  = $user->prenom ?? 'Artisan';
        $message = "ArtisanPro: Felicitations {$prenom} ! Votre compte artisan est maintenant valide. Vous pouvez recevoir des demandes. Bonne chance ! artisanpro.bj";

        SendSmsJob::dispatch($phone, $message, 'compte_valide', $artisan->id, 'artisan')
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
