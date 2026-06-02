<?php

namespace App\Events;

use App\Models\Reservation;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a reservation is marked as completed.
 * Triggers SMS to client (mission done, please review).
 * Triggers wallet fund release for artisan.
 */
class ReservationTerminee
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Reservation $reservation) {}
}
