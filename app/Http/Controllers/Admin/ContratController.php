<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\PaginatesForInertia;
use App\Http\Controllers\Controller;
use App\Models\Contrat;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContratController extends Controller
{
    use PaginatesForInertia;

    public function index(Request $request): Response
    {
        if (! auth()->user()->isAdmin()) {
            abort(403);
        }

        $contrats = Contrat::with([
            'client.user:id,nom,prenom',
            'artisan.user:id,nom,prenom',
            'reservation:id',
        ])
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->when($request->q, fn ($q, $s) =>
                $q->where(fn ($sub) =>
                    $sub->where('numero_contrat', 'like', "%{$s}%")
                        ->orWhere('nom_client', 'like', "%{$s}%")
                        ->orWhere('nom_artisan', 'like', "%{$s}%")
                )
            )
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total'                  => Contrat::count(),
            'genere'                 => Contrat::where('statut', Contrat::STATUT_GENERE)->count(),
            'en_attente_signatures'  => Contrat::where('statut', Contrat::STATUT_EN_ATTENTE_SIGNATURES)->count(),
            'partiellement_signe'    => Contrat::where('statut', Contrat::STATUT_PARTIELLEMENT_SIGNE)->count(),
            'finalise'               => Contrat::where('statut', Contrat::STATUT_FINALISE)->count(),
            'annule'                 => Contrat::where('statut', Contrat::STATUT_ANNULE)->count(),
        ];

        return Inertia::render('admin/contrats/index', [
            'contrats' => $this->paginateForInertia($contrats),
            'stats'    => $stats,
            'filters'  => $request->only(['q', 'statut']),
        ]);
    }

    public function show(Contrat $contrat): Response
    {
        if (! auth()->user()->isAdmin()) {
            abort(403);
        }

        $contrat->load([
            'client.user:id,nom,prenom',
            'artisan.user:id,nom,prenom',
            'reservation:id',
        ]);

        return Inertia::render('admin/contrats/show', [
            'contrat' => array_merge($contrat->toArray(), [
                'chemin_pdf_brouillon' => $contrat->chemin_pdf_brouillon,
                'chemin_pdf_final'     => $contrat->chemin_pdf_final,
                'clauses_litige'       => $contrat->clauses_litige,
                'signatures'           => [
                    'client'  => [
                        'signe_at' => $contrat->signature_client_at,
                        'hash'     => $contrat->signature_client_hash,
                    ],
                    'artisan' => [
                        'signe_at' => $contrat->signature_artisan_at,
                        'hash'     => $contrat->signature_artisan_hash,
                    ],
                ],
            ]),
        ]);
    }
}
