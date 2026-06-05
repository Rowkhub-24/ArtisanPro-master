<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AutomationRule extends Model
{
    use HasFactory;

    protected $table = 'automation_rules';

    protected $fillable = [
        'cle',
        'valeur',
        'description',
        'categorie',
        'actif',
        'modifie_par',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'valeur' => 'array',
            'actif'  => 'boolean',
        ];
    }

    /**
     * Relation vers l'utilisateur qui a effectué la dernière modification.
     */
    public function modifiePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'modifie_par');
    }

    /**
     * Scope limitant la requête aux règles actives.
     *
     * @param  Builder<AutomationRule>  $query
     * @return Builder<AutomationRule>
     */
    public function scopeActif(Builder $query): Builder
    {
        return $query->where('actif', true);
    }
}
