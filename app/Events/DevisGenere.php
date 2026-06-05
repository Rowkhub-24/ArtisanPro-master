<?php

namespace App\Events;

use App\Models\Devis;
use App\Models\Reservation;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a devis is generated automatically by the DevisAutoGeneratorService.
 * Triggers the DevisAutoValidatorListener for automatic validation.
 * Requirements: 9.2
 *
 * @param  string  $source  'auto_template' | 'auto_ia'
 */
class DevisGenere
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Devis $devis,
        public readonly Reservation $reservation,
        public readonly string $source,
    ) {}
}
