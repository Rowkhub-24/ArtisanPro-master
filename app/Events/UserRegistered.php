<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired after a new user successfully registers.
 * Triggers welcome SMS to client or artisan.
 */
class UserRegistered
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly User $user) {}
}
