<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
}
