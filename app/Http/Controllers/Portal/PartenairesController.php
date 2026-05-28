<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\FournisseurPartenaire;
use Inertia\Inertia;
use Inertia\Response;

class PartenairesController extends Controller
{
    public function __invoke(): Response
    {
        $partenaires = FournisseurPartenaire::where('actif', true)
            ->orderBy('nom_fournisseur')
            ->get()
            ->map(fn ($p) => [
                'id'                => $p->id,
                'nom_fournisseur'   => $p->nom_fournisseur,
                'description'       => $p->description,
                'contact_email'     => $p->contact_email,
                'contact_telephone' => $p->contact_telephone,
                'logo_url'          => $p->logo_url,
                'site_web'          => $p->site_web,
                'type'              => $p->type,
            ]);

        return Inertia::render('portal/partenaires', [
            'partenaires' => $partenaires,
        ]);
    }
}
