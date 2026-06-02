<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    protected $table = 'wallets';

    protected $fillable = [
        'id_artisan',
        'solde',
        'solde_en_attente',
        'total_credit',
        'total_debit',
        'devise',
        'actif',
    ];

    protected $casts = [
        'solde'            => 'decimal:2',
        'solde_en_attente' => 'decimal:2',
        'total_credit'     => 'decimal:2',
        'total_debit'      => 'decimal:2',
        'actif'            => 'boolean',
    ];

    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class, 'id_artisan');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class, 'wallet_id');
    }

    /**
     * Total available balance (solde - pending).
     */
    public function getSoldeDisponibleAttribute(): float
    {
        return (float) $this->solde - (float) $this->solde_en_attente;
    }
}
