<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $table = 'messages';

    protected $fillable = [
        'id_expediteur',
        'id_destinataire',
        'id_reservation',
        'contenu',
        'type',
        'attachment_path',
        'meta',
        'call_session_id',
        'date_envoi',
        'lu',
    ];

    protected $casts = [
        'date_envoi' => 'datetime',
        'lu' => 'boolean',
        'meta' => 'array',
    ];

    public function expediteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_expediteur');
    }

    public function destinataire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_destinataire');
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class, 'id_reservation');
    }
}
