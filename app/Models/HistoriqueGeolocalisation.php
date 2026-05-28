<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueGeolocalisation extends Model
{
    protected $table = 'historique_geolocalisations';

    protected $fillable = [
        'id_artisan',
        'latitude',
        'longitude',
        'date_position',
    ];

    protected $casts = [
        'date_position' => 'datetime',
        'latitude'      => 'decimal:8',
        'longitude'     => 'decimal:8',
    ];

    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class, 'id_artisan');
    }
}
