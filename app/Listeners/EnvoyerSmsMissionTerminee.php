<?php

namespace App\Listeners;

use App\Events\ReservationTerminee;
use App\Jobs\SendSmsJob;
use App\Models\Artisan;
use App\Services\WalletService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Apres fin de mission :
 *   1. Libere les fonds en attente du wallet artisan
 *   2. SMS au client (invitation a laisser un avis)
 *   3. SMS a l'artisan (fonds liberes)
 */
class EnvoyerSmsMissionTerminee implements ShouldQueue
{
    public string $queue = 'sms';

    public function __construct(private readonly WalletService $walletService) {}

    public function handle(ReservationTerminee $event): void
    {
        $reservation = $event->reservation;

        // ── 1. Liberer les fonds en attente du wallet artisan ─────────────────
        if ($reservation->id_artisan && $reservation->acompte_verse > 0) {
            try {
                $artisan = Artisan::find($reservation->id_artisan);
                if ($artisan) {
                    $this->walletService->libererFondsEnAttente(
                        $artisan,
                        (float) $reservation->acompte_verse
                    );
                }
            } catch (\Throwable $e) {
                Log::error('EnvoyerSmsMissionTerminee: echec liberation wallet.', ['error' => $e->getMessage()]);
            }
        }

        // ── 2. SMS au client ──────────────────────────────────────────────────
        $clientUser = $reservation->client?->user;
        if ($clientUser) {
            $phone = $this->normaliserTelephone($clientUser->telephone ?? '');
            if ($phone && $clientUser->sms_notifications_enabled !== false) {
                $artisanNom = $reservation->artisan?->user
                    ? trim($reservation->artisan->user->prenom . ' ' . $reservation->artisan->user->nom)
                    : "l'artisan";
                $msg = "ArtisanPro: Mission #{$reservation->id} terminee avec {$artisanNom}. Laissez un avis pour aider la communaute !";
                SendSmsJob::dispatch($phone, $msg, 'mission_terminee', $reservation->id, 'reservation')
                    ->onQueue('sms');
            }
        }

        // ── 3. SMS a l'artisan ────────────────────────────────────────────────
        $artisanUser = $reservation->artisan?->user;
        if ($artisanUser) {
            $phone = $this->normaliserTelephone($artisanUser->telephone ?? '');
            if ($phone && $artisanUser->sms_notifications_enabled !== false) {
                $montantFormate = number_format((float) $reservation->acompte_verse, 0, '.', ' ');
                $msg = "ArtisanPro: Mission #{$reservation->id} validee ! Vos fonds de {$montantFormate} FCFA sont disponibles dans votre portefeuille.";
                SendSmsJob::dispatch($phone, $msg, 'fonds_liberes', $reservation->id, 'reservation')
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
