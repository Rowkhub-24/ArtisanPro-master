<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FournisseurPartenaire extends Model
{
    protected $table = 'fournisseur_partenaires';

    protected $fillable = [
        'nom_fournisseur',
        'description',
        'contact_email',
        'contact_telephone',
        'logo_url',
        'site_web',
        'type',
        'actif',
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];
}
