<?php

namespace App\Events;

use App\Models\Reservation;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a mission is automatically detected as finished by the MissionTerminaisonDetector.
 * Triggers escrow fund release and client review notification.
 * Requirements: 9.4
 *
 * @param  string  $source  'gps' | 'timeout'
 */
class MissionTermineeAuto
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Reservation $reservation,
        public readonly string $source,
    ) {}
}
