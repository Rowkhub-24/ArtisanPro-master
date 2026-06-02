<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\AcademieQuiz;
use App\Models\AcademieParcours;

class AcademieFormation extends Model
{
    protected $table = 'academie_formations';

    protected $fillable = [
        'titre',
        'description',
        'url_contenu',
    ];

    public function artisans(): BelongsToMany
    {
        return $this->belongsToMany(Artisan::class, 'artisan_formation', 'id_formation', 'id_artisan')
            ->withPivot('date_achevement');
    }

    public function quiz(): HasMany
    {
        return $this->hasMany(AcademieQuiz::class, 'id_formation');
    }

    public function parcours(): BelongsToMany
    {
        return $this->belongsToMany(AcademieParcours::class, 'parcours_formation', 'id_formation', 'id_parcours')
            ->withPivot('ordre');
    }
}
