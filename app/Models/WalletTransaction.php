<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    protected $table = 'wallet_transactions';

    protected $fillable = [
        'wallet_id',
        'id_artisan',
        'type',
        'montant',
        'solde_avant',
        'solde_apres',
        'devise',
        'motif',
        'reference',
        'id_reservation',
        'id_paiement',
        'metadata',
    ];

    protected $casts = [
        'montant'      => 'decimal:2',
        'solde_avant'  => 'decimal:2',
        'solde_apres'  => 'decimal:2',
        'metadata'     => 'array',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class, 'wallet_id');
    }

    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class, 'id_artisan');
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class, 'id_reservation');
    }

    public function paiement(): BelongsTo
    {
        return $this->belongsTo(Paiement::class, 'id_paiement');
    }
}
