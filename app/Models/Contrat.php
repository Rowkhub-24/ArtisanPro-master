<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contrat extends Model
{
    use HasFactory;

    protected $table = 'contrats';

    // ─── Statuts du cycle de vie ───────────────────────────────────────────────

    const STATUT_GENERE                = 'genere';
    const STATUT_EN_ATTENTE_SIGNATURES = 'en_attente_signatures';
    const STATUT_PARTIELLEMENT_SIGNE   = 'partiellement_signe';
    const STATUT_FINALISE              = 'finalise';
    const STATUT_ANNULE                = 'annule';

    // ─── Colonnes mass-assignables ─────────────────────────────────────────────

    protected $fillable = [
        'id_reservation',
        'id_client',
        'id_artisan',
        'numero_contrat',
        'nom_client',
        'nom_artisan',
        'description_prestation',
        'montant_total',
        'date_debut_prestation',
        'date_fin_prestation',
        'adresse_intervention',
        'statut',
        'signature_client_at',
        'signature_client_hash',
        'signature_artisan_at',
        'signature_artisan_hash',
        'chemin_pdf_brouillon',
        'chemin_pdf_final',
        'clauses_litige',
        'genere_at',
        'finalise_at',
    ];

    // ─── Casts ─────────────────────────────────────────────────────────────────

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_debut_prestation' => 'datetime',
            'date_fin_prestation'   => 'datetime',
            'signature_client_at'   => 'datetime',
            'signature_artisan_at'  => 'datetime',
            'genere_at'             => 'datetime',
            'finalise_at'           => 'datetime',
            'montant_total'         => 'decimal:2',
            'clauses_litige'        => 'array',
        ];
    }

    // ─── Relations ─────────────────────────────────────────────────────────────

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class, 'id_reservation');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client');
    }

    public function artisan(): BelongsTo
    {
        return $this->belongsTo(Artisan::class, 'id_artisan');
    }

    // ─── Méthodes helper ───────────────────────────────────────────────────────

    /**
     * Indique si le contrat a été signé par les deux parties.
     */
    public function estSigne(): bool
    {
        return $this->signature_client_at !== null && $this->signature_artisan_at !== null;
    }

    /**
     * Indique si le contrat est finalisé (signé + PDF final généré).
     */
    public function estFinalise(): bool
    {
        return $this->statut === self::STATUT_FINALISE;
    }

    /**
     * Indique si le contrat a été annulé.
     */
    public function estAnnule(): bool
    {
        return $this->statut === self::STATUT_ANNULE;
    }

    /**
     * Indique si le client a déjà signé.
     */
    public function clientASigné(): bool
    {
        return $this->signature_client_at !== null;
    }

    /**
     * Indique si l'artisan a déjà signé.
     */
    public function artisanASigné(): bool
    {
        return $this->signature_artisan_at !== null;
    }

    /**
     * Indique si le contrat est en attente d'au moins une signature.
     */
    public function estPartiellementSigne(): bool
    {
        return $this->statut === self::STATUT_PARTIELLEMENT_SIGNE;
    }

    /**
     * Indique si un utilisateur donné peut encore signer le contrat.
     * L'utilisateur doit être une partie du contrat et ne pas avoir encore signé.
     *
     * @param  User  $user  L'utilisateur authentifié (via sa relation Client ou Artisan)
     * @param  string  $role  'client' ou 'artisan'
     */
    public function peutSigner(User $user, string $role): bool
    {
        if ($this->estAnnule() || $this->estFinalise()) {
            return false;
        }

        if ($role === 'client') {
            return $this->client?->id_utilisateur === $user->id
                && $this->signature_client_at === null;
        }

        if ($role === 'artisan') {
            return $this->artisan?->id_utilisateur === $user->id
                && $this->signature_artisan_at === null;
        }

        return false;
    }
}
