<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Litige extends Model
{
    use HasFactory;

    protected $table = 'litiges';

    protected $fillable = [
        'id_client',
        'id_artisan',
        'id_reservation',
        'description_litige',
        'date_ouverture',
        'statut',
        'resolution_details',
        'fonds_geles',
        'date_escalade',
        'escalade',
        'raison_decision',
        'date_decision',
        'source_resolution',
        'score_preuve_gps',
        'decision_auto',
    ];

    protected $casts = [
        'date_ouverture'   => 'datetime',
        'fonds_geles'      => 'boolean',
        'escalade'         => 'boolean',
        'date_escalade'    => 'datetime',
        'date_decision'    => 'datetime',
        'score_preuve_gps' => 'float',
        'decision_auto'    => 'array',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client');
    }

    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class, 'id_artisan');
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class, 'id_reservation');
    }
}
