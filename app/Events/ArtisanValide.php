<?php

namespace App\Events;

use App\Models\Artisan;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when an admin validates/activates an artisan account.
 * Triggers SMS to artisan (account validated, you can start).
 */
class ArtisanValide
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Artisan $artisan) {}
}
