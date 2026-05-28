<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
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
            'revenus_total'      => (float) Paiement::whereIn('statut', ['reussi', 'complete'])->sum('montant'),
            'commission_total'   => (float) Paiement::whereIn('statut', ['reussi', 'complete'])->sum('commission'),
            'en_attente'         => Paiement::where('statut', 'en_attente')->count(),
        ];

        return Inertia::render('admin/paiements/index', [
            'paiements' => $paiements,
            'stats'     => $stats,
            'filters'   => $request->only(['statut']),
        ]);
    }

    public function export(Request $request): HttpResponse
    {
        $paiements = Paiement::with([
            'user:id,nom,prenom,email',
            'reservation.artisan.user:id,nom,prenom',
        ])
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->orderByDesc('date_paiement')
            ->get();

        $csv = "Référence,Client,Email,Artisan,Montant (FCFA),Commission (FCFA),Méthode,Statut,Date\n";

        foreach ($paiements as $p) {
            $client  = $p->user ? "{$p->user->prenom} {$p->user->nom}" : 'N/A';
            $email   = $p->user?->email ?? '';
            $artisan = $p->reservation?->artisan?->user
                ? "{$p->reservation->artisan->user->prenom} {$p->reservation->artisan->user->nom}"
                : 'N/A';

            $csv .= implode(',', [
                $p->reference_transaction,
                "\"{$client}\"",
                $email,
                "\"{$artisan}\"",
                number_format((float) $p->montant, 2, '.', ''),
                number_format((float) $p->commission, 2, '.', ''),
                $p->methode_paiement,
                $p->statut,
                $p->date_paiement?->format('d/m/Y H:i') ?? '',
            ]) . "\n";
        }

        $filename = 'paiements_' . now()->format('Y-m-d') . '.csv';

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
