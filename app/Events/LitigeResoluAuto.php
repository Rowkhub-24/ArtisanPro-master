<?php

namespace App\Events;

use App\Models\Litige;
use App\ValueObjects\AutoDecision;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a litige is automatically resolved by the LitigeAutoResolverService.
 * Triggers notifications to client and artisan with the decision details.
 * Requirements: 9.5
 */
class LitigeResoluAuto
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Litige $litige,
        public readonly AutoDecision $decision,
    ) {}
}
