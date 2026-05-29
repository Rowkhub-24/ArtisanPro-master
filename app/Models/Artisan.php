<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class Artisan extends Model
{
    protected $table = 'artisans';

    protected $fillable = [
        'id_utilisateur',
        'metier',
        'description',
        'bio',
        'zone_intervention',
        'tarifs_horaire',
        'payment_provider',
        'payment_account_id',
        'payment_account_key',
        'payment_method',
        'note_moyenne',
        'badge',
        'score_confiance',
        'latitude',
        'longitude',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tarifs_horaire' => 'decimal:2',
            'note_moyenne' => 'decimal:2',
            'score_confiance' => 'integer',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'payment_provider' => 'string',
            'payment_method' => 'string',
        ];
    }

    public function setPaymentAccountKeyAttribute(?string $value): void
    {
        $this->attributes['payment_account_key'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getPaymentAccountKeyAttribute(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Throwable $exception) {
            return $value;
        }
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_utilisateur');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'artisan_specialites', 'id_artisan', 'id_categorie');
    }

    public function prestations(): HasMany
    {
        return $this->hasMany(Prestation::class, 'id_artisan');
    }

    public function portfolioImages(): HasMany
    {
        return $this->hasMany(PortfolioImage::class, 'id_artisan');
    }

    public function certifications(): HasMany
    {
        return $this->hasMany(Certification::class, 'id_artisan');
    }

    public function formations(): BelongsToMany
    {
        return $this->belongsToMany(AcademieFormation::class, 'artisan_formation', 'id_artisan', 'id_formation')
            ->withPivot('date_achevement');
    }

    public function favoritedByClients(): BelongsToMany
    {
        return $this->belongsToMany(Client::class, 'client_favoris', 'id_artisan', 'id_client')
            ->withTimestamps();
    }

    public function avis(): HasMany
    {
        return $this->hasMany(Avis::class, 'id_artisan');
    }

    public function devis(): HasMany
    {
        return $this->hasMany(Devis::class, 'id_artisan');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'id_artisan');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'id_artisan');
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class, 'id_artisan');
    }
}
