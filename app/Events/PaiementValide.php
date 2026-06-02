<?php

namespace App\Events;

use App\Models\Paiement;
use App\Models\Reservation;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired after a payment is successfully validated (Kkiapay callback or webhook).
 * Triggers:
 *   - WalletTransaction credit for artisan
 *   - SMS to artisan (payment received)
 *   - SMS to client (payment confirmed)
 */
class PaiementValide
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Paiement $paiement,
        public readonly ?Reservation $reservation = null,
        public readonly string $reference = '',
    ) {}
}
