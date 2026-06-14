<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DevisMateriel extends Model
{
    protected $table = 'devis_materiels';

    protected $fillable = [
        'id_devis',
        'nom',
        'quantite',
        'unite',
        'prix_unitaire',
        'ordre',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantite'      => 'decimal:3',
            'prix_unitaire' => 'decimal:2',
            'ordre'         => 'integer',
        ];
    }

    /**
     * Accesseur calculé : sous_total = quantite × prix_unitaire, arrondi à 2 décimales.
     * Non stocké en base de données.
     */
    public function getSousTotalAttribute(): float
    {
        return round((float) $this->quantite * (float) $this->prix_unitaire, 2);
    }

    public function devis(): BelongsTo
    {
        return $this->belongsTo(Devis::class, 'id_devis');
    }
}
