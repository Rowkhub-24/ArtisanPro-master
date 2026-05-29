<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payout extends Model
{
    protected $table = 'payouts';

    protected $fillable = [
        'id_artisan',
        'amount',
        'currency',
        'provider',
        'provider_payout_id',
        'status',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class, 'id_artisan');
    }
}
