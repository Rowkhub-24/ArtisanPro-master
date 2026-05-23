<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prestation extends Model
{
    protected $table = 'prestations';

    protected $fillable = [
        'id_artisan',
        'titre',
        'description',
        'tarif_min',
        'tarif_max',
        'duree_estimee',
        'id_categorie',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tarif_min' => 'decimal:2',
            'tarif_max' => 'decimal:2',
        ];
    }

    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class, 'id_artisan');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'id_categorie');
    }
}
