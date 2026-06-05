<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DevisTemplate extends Model
{
    protected $table = 'devis_templates';

    protected $fillable = [
        'metier',
        'categorie_id',
        'description_type',
        'tarif_base',
        'tarif_horaire',
        'duree_estimee_min',
        'materiaux_inclus',
        'majoration_urgence',
        'actif',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tarif_base'         => 'decimal:2',
            'tarif_horaire'      => 'decimal:2',
            'majoration_urgence' => 'decimal:2',
            'duree_estimee_min'  => 'integer',
            'materiaux_inclus'   => 'boolean',
            'actif'              => 'boolean',
        ];
    }

    // ─── Relations ───────────────────────────────────────────────────────────

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'categorie_id');
    }

    // ─── Local Scopes ────────────────────────────────────────────────────────

    /**
     * Scope a query to only include active templates.
     */
    public function scopeActif(Builder $query): Builder
    {
        return $query->where('actif', true);
    }

    /**
     * Scope a query to only include templates for a given métier.
     */
    public function scopePourMetier(Builder $query, string $metier): Builder
    {
        return $query->where('metier', $metier);
    }
}
