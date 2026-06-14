<?php

namespace App\Events;

use App\Models\Devis;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when an artisan submits their response to a quote request.
 * Triggers SMS notification to the client.
 * Broadcasting via Reverb is disabled — the client page reloads via Inertia.
 */
class DevisRepondu
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Devis $devis) {}
}
