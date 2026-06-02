<?php

namespace App\Events;

use App\Models\Reservation;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a reservation is cancelled (by client or artisan).
 * Triggers SMS to both parties.
 */
class ReservationAnnulee
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Reservation $reservation,
        public readonly string $annulePar = 'client', // 'client' | 'artisan'
    ) {}
}
