<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Client extends Model
{
    protected $table = 'clients';

    protected $fillable = [
        'id_utilisateur',
        'adresse_livraison',
        'telephone',
        'historique_commandes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'historique_commandes' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_utilisateur');
    }

    public function devis(): HasMany
    {
        return $this->hasMany(Devis::class, 'id_client');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'id_client');
    }

    public function favoris(): BelongsToMany
    {
        return $this->belongsToMany(Artisan::class, 'client_favoris', 'id_client', 'id_artisan')
            ->withTimestamps();
    }
}
