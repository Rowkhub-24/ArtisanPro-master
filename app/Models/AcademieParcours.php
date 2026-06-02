<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class AcademieParcours extends Model
{
    protected $table = 'academie_parcours';

    protected $fillable = [
        'titre',
        'description',
        'points_bonus',
    ];

    protected $casts = [
        'points_bonus' => 'integer',
    ];

    public function formations(): BelongsToMany
    {
        return $this->belongsToMany(AcademieFormation::class, 'parcours_formation', 'id_parcours', 'id_formation')
            ->withPivot('ordre')
            ->orderByPivot('ordre');
    }

    public function artisans(): BelongsToMany
    {
        return $this->belongsToMany(Artisan::class, 'artisan_parcours', 'id_parcours', 'id_artisan')
            ->withPivot(['date_completion', 'points_attribues']);
    }
}
