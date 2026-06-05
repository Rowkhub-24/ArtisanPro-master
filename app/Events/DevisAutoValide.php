<?php

namespace App\Events;

use App\Models\Devis;
use App\ValueObjects\AutoDecision;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a devis is automatically validated by the DevisAutoValidatorListener.
 * Triggers KKiapay widget display for the client to initiate payment.
 * Requirements: 9.3
 */
class DevisAutoValide
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Devis $devis,
        public readonly AutoDecision $decision,
    ) {}
}
