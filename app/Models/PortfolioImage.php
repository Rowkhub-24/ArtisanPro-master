<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortfolioImage extends Model
{
    protected $table = 'portfolio_images';

    protected $fillable = [
        'id_artisan',
        'titre',
        'description',
        'url_media',
        'type_media',
    ];

    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class, 'id_artisan');
    }
}
