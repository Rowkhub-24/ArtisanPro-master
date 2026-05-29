<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $table = 'transactions';

    protected $fillable = [
        'id_artisan',
        'id_utilisateur',
        'type',
        'amount',
        'currency',
        'provider',
        'provider_transaction_id',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_utilisateur');
    }
}
