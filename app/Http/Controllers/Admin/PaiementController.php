<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaiementController extends Controller
{
    public function index(Request $request): Response
    {
        $paiements = Paiement::with([
            'user:id,nom,prenom,email',
            'reservation.artisan.user:id,nom,prenom',
        ])
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->orderByDesc('date_paiement')
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total_transactions' => Paiement::count(),
            'revenus_total'      => (float) Paiement::where('statut', 'complete')->sum('montant'),
            'commission_total'   => (float) Paiement::where('statut', 'complete')->sum('commission'),
            'en_attente'         => Paiement::where('statut', 'en_attente')->count(),
        ];

        return Inertia::render('admin/paiements/index', [
            'paiements' => $paiements,
            'stats'     => $stats,
            'filters'   => $request->only(['statut']),
        ]);
    }
}
