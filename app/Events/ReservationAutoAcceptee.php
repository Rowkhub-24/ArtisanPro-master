<?php

namespace App\Events;

use App\Models\Reservation;
use App\ValueObjects\AutoDecision;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a reservation is automatically accepted by the AutomationEngine.
 * Triggers client notification (reservation accepted automatically).
 * Requirements: 9.1
 */
class ReservationAutoAcceptee
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Reservation $reservation,
        public readonly AutoDecision $decision,
    ) {}
}
