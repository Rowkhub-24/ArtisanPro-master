<?php

namespace App\Models;

use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use CanResetPassword, HasApiTokens, HasFactory, Notifiable;

    protected $table = 'utilisateurs';

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'telephone',
        'avatar',
        'mot_de_passe',
        'type_utilisateur',
        'adresse',
        'statut',
        'date_inscription',
        'derniere_connexion',
        'email_verified_at',
        'smtp_username',
        'smtp_password',
        'push_notifications_enabled',
        'sms_notifications_enabled',
        'push_permission_status',
    ];

    protected $hidden = [
        'mot_de_passe',
        'remember_token',
        'smtp_password',
    ];

    protected $appends = [
        'name',
        'avatar_url',
    ];

    public function getAuthPasswordName(): string
    {
        return 'mot_de_passe';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'date_inscription' => 'datetime',
            'derniere_connexion' => 'datetime',
            'mot_de_passe' => 'hashed',
            'smtp_password' => 'encrypted',
            'push_notifications_enabled' => 'boolean',
            'sms_notifications_enabled' => 'boolean',
            'push_permission_status' => 'string',
        ];
    }

    public function getNameAttribute(): string
    {
        return trim($this->prenom.' '.$this->nom);
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar) {
            return null;
        }
        if (str_starts_with($this->avatar, 'http')) {
            return $this->avatar;
        }
        return \Illuminate\Support\Facades\Storage::url($this->avatar);
    }

    public function client(): HasOne
    {
        return $this->hasOne(Client::class, 'id_utilisateur');
    }

    public function artisan(): HasOne
    {
        return $this->hasOne(Artisan::class, 'id_utilisateur');
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'id_expediteur');
    }

    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'id_destinataire');
    }

    public function isClient(): bool
    {
        return $this->type_utilisateur === 'client';
    }

    public function isArtisan(): bool
    {
        return $this->type_utilisateur === 'artisan';
    }

    public function isAdmin(): bool
    {
        return $this->type_utilisateur === 'admin';
    }
}
