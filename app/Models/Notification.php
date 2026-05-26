<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $table = 'notifications';

    protected $fillable = [
        'id_utilisateur',
        'type_notification',
        'message',
        'date_envoi',
        'lue',
    ];

    protected $casts = [
        'date_envoi' => 'datetime',
        'lue'        => 'boolean',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_utilisateur');
    }

    /**
     * Crée une notification système pour un utilisateur.
     */
    public static function notifier(int $userId, string $message, string $type = 'systeme'): self
    {
        return self::create([
            'id_utilisateur'    => $userId,
            'type_notification' => $type,
            'message'           => $message,
            'date_envoi'        => now(),
            'lue'               => false,
        ]);
    }
}
