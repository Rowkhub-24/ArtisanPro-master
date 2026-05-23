<?php

namespace App\Services;

use App\Models\Reservation;
use Illuminate\Support\Facades\Log;

/**
 * Stub SMS notification service.
 * Replace with a real SMS provider (Twilio, Orange SMS, etc.) when needed.
 */
class SmsNotificationService
{
    public function sendConfirmationSms(Reservation $reservation): void
    {
        $phone = $reservation->client?->user?->telephone;
        if (! $phone) {
            return;
        }
        Log::info('SMS confirmation (stub)', [
            'reservation_id' => $reservation->id,
            'phone' => $phone,
        ]);
    }

    public function sendRejectionSms(Reservation $reservation): void
    {
        $phone = $reservation->client?->user?->telephone;
        if (! $phone) {
            return;
        }
        Log::info('SMS rejection (stub)', [
            'reservation_id' => $reservation->id,
            'phone' => $phone,
        ]);
    }
}
