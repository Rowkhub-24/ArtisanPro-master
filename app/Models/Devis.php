<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Devis extends Model
{
    protected $table = 'devis';

    protected $fillable = [
        'id_client',
        'id_artisan',
        'description_travaux',
        'photos',
        'date_demande',
        'date_reponse',
        'montant_propose',
        'statut',
        'date_acceptation',
        'notes_artisan',
        'sous_total_materiels',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'photos' => 'array',
            'date_demande' => 'datetime',
            'date_reponse' => 'datetime',
            'date_acceptation' => 'datetime',
            'montant_propose' => 'decimal:2',
            'sous_total_materiels' => 'decimal:2',
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

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'id_devis');
    }

    public function materiels(): HasMany
    {
        return $this->hasMany(DevisMateriel::class, 'id_devis')->orderBy('ordre');
    }
}
