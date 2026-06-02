<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Reservation extends Model
{
    use HasFactory;

    protected $table = 'reservations';

    protected $fillable = [
        'id_client',
        'id_artisan',
        'id_devis',
        'date_debut',
        'date_fin',
        'date',
        'creneau',
        'statut',
        'description_besoin',
        'montant_total',
        'acompte_verse',
        'solde_paye',
        'date_creation',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'date_debut' => 'datetime',
            'date_fin' => 'datetime',
            'date_creation' => 'datetime',
            'montant_total' => 'decimal:2',
            'acompte_verse' => 'decimal:2',
            'solde_paye' => 'decimal:2',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client');
    }

    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class, 'id_artisan');
    }

    public function devis(): BelongsTo
    {
        return $this->belongsTo(Devis::class, 'id_devis');
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class, 'id_reservation');
    }

    public function avis(): HasOne
    {
        return $this->hasOne(Avis::class, 'id_reservation');
    }
}
