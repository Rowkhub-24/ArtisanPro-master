<?php

namespace App\Listeners;

use App\Events\PaiementValide;
use App\Jobs\SendSmsJob;
use App\Models\Artisan;
use App\Services\SmsNotificationService;
use App\Services\WalletService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Apres validation d'un paiement Kkiapay :
 *   1. Credite le wallet artisan
 *   2. Envoie SMS artisan (paiement recu)
 *   3. Envoie SMS client (paiement confirme)
 */
class EnvoyerSmsPaiement implements ShouldQueue
{
    public string $queue = 'sms';

    public function __construct(private readonly WalletService $walletService) {}

    public function handle(PaiementValide $event): void
    {
        $paiement    = $event->paiement;
        $reservation = $event->reservation ?? $paiement->reservation;
        $reference   = $event->reference ?: ($paiement->reference_transaction ?? '');

        $montantFormate = number_format((float) $paiement->montant, 0, '.', ' ');

        // ── 1. Crediter le wallet artisan ─────────────────────────────────────
        if ($reservation?->id_artisan) {
            try {
                $artisan = Artisan::find($reservation->id_artisan);
                if ($artisan) {
                    $this->walletService->credit(
                        artisan: $artisan,
                        montant: (float) $paiement->montant,
                        motif: 'acompte_kkiapay',
                        reference: $reference,
                        context: [
                            'id_reservation' => $reservation->id,
                            'id_paiement'    => $paiement->id,
                            'metadata'       => ['source' => 'PaiementValide_event'],
                        ]
                    );
                }
            } catch (\Throwable $e) {
                Log::error('EnvoyerSmsPaiement: echec credit wallet.', ['error' => $e->getMessage()]);
            }
        }

        // ── 2. SMS a l'artisan ────────────────────────────────────────────────
        $artisanUser = $reservation?->artisan?->user;
        if ($artisanUser) {
            $phoneArtisan = SmsNotificationService::normaliserTelephone($artisanUser->telephone ?? '');
            if ($phoneArtisan && $artisanUser->sms_notifications_enabled !== false) {
                $messageArtisan = "ArtisanPro: Paiement de {$montantFormate} FCFA recu pour la demande #{$reservation->id}. Ref: {$reference}. Solde mis a jour.";
                SendSmsJob::dispatch($phoneArtisan, $messageArtisan, 'paiement', $paiement->id, 'paiement')
                    ->onQueue('sms');
            }
        }

        // ── 3. SMS au client ──────────────────────────────────────────────────
        $clientUser = $reservation?->client?->user ?? $paiement->user;
        if ($clientUser) {
            $phoneClient = SmsNotificationService::normaliserTelephone($clientUser->telephone ?? '');
            if ($phoneClient && $clientUser->sms_notifications_enabled !== false) {
                $messageClient = "ArtisanPro: Votre paiement de {$montantFormate} FCFA est confirme. Ref: {$reference}. Merci !";
                SendSmsJob::dispatch($phoneClient, $messageClient, 'paiement', $paiement->id, 'paiement')
                    ->onQueue('sms');
            }
        }
    }
}
