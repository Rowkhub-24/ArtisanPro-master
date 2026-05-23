<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $table = 'categories';

    protected $fillable = [
        'nom',
        'icone',
        'description',
        'nombre_artisans',
    ];

    public function artisans(): BelongsToMany
    {
        return $this->belongsToMany(Artisan::class, 'artisan_specialites', 'id_categorie', 'id_artisan');
    }

    public function prestations(): HasMany
    {
        return $this->hasMany(Prestation::class, 'id_categorie');
    }
}
