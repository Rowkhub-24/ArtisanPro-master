<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\Avis;
use App\Models\Litige;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminReportsController extends Controller
{
    public function __invoke(): Response
    {
        // ── Revenus par mois (6 derniers mois) ───────────────────────────────
        $revenusParMois = Paiement::whereIn('statut', ['reussi', 'complete'])
            ->where('date_paiement', '>=', now()->subMonths(6))
            ->select(
                DB::raw("DATE_FORMAT(date_paiement, '%Y-%m') as mois"),
                DB::raw('SUM(montant) as total'),
                DB::raw('COUNT(*) as nb')
            )
            ->groupBy('mois')
            ->orderBy('mois')
            ->get()
            ->map(fn ($r) => [
                'mois'  => $r->mois,
                'total' => (float) $r->total,
                'nb'    => (int) $r->nb,
            ]);

        // ── Inscriptions par mois (6 derniers mois) ──────────────────────────
        $inscriptionsParMois = User::where('date_inscription', '>=', now()->subMonths(6))
            ->select(
                DB::raw("DATE_FORMAT(date_inscription, '%Y-%m') as mois"),
                DB::raw('COUNT(*) as nb'),
                DB::raw("SUM(CASE WHEN type_utilisateur = 'client' THEN 1 ELSE 0 END) as clients"),
                DB::raw("SUM(CASE WHEN type_utilisateur = 'artisan' THEN 1 ELSE 0 END) as artisans")
            )
            ->groupBy('mois')
            ->orderBy('mois')
            ->get()
            ->map(fn ($r) => [
                'mois'     => $r->mois,
                'nb'       => (int) $r->nb,
                'clients'  => (int) $r->clients,
                'artisans' => (int) $r->artisans,
            ]);

        // ── Réservations par statut ───────────────────────────────────────────
        $reservationsParStatut = Reservation::select('statut', DB::raw('COUNT(*) as nb'))
            ->groupBy('statut')
            ->get()
            ->map(fn ($r) => ['statut' => $r->statut, 'nb' => (int) $r->nb]);

        // ── Top artisans (par note + nb réservations) ─────────────────────────
        $topArtisans = Artisan::with('user:id,nom,prenom')
            ->withCount('reservations')
            ->orderByDesc('note_moyenne')
            ->limit(10)
            ->get()
            ->map(fn ($a) => [
                'nom'               => $a->user ? "{$a->user->prenom} {$a->user->nom}" : 'N/A',
                'metier'            => $a->metier,
                'note_moyenne'      => (float) $a->note_moyenne,
                'badge'             => $a->badge,
                'reservations_count'=> $a->reservations_count,
            ]);

        // ── KPIs globaux ──────────────────────────────────────────────────────
        $kpis = [
            'total_users'        => User::count(),
            'total_artisans'     => User::where('type_utilisateur', 'artisan')->count(),
            'total_clients'      => User::where('type_utilisateur', 'client')->count(),
            'total_reservations' => Reservation::count(),
            'reservations_terminees' => Reservation::whereIn('statut', ['terminee', 'termine'])->count(),
            'total_paiements'    => Paiement::count(),
            'revenus_total'      => (float) Paiement::whereIn('statut', ['reussi', 'complete'])->sum('montant'),
            'total_avis'         => Avis::count(),
            'note_moyenne_plateforme' => round((float) Avis::where('masque', false)->avg('note'), 2),
            'total_litiges'      => Litige::count(),
            'litiges_ouverts'    => Litige::where('statut', 'ouvert')->count(),
            'litiges_resolus'    => Litige::where('statut', 'resolu')->count(),
        ];

        // ── Méthodes de paiement ──────────────────────────────────────────────
        $methodesParPaiement = Paiement::select('methode_paiement', DB::raw('COUNT(*) as nb'), DB::raw('SUM(montant) as total'))
            ->groupBy('methode_paiement')
            ->get()
            ->map(fn ($r) => [
                'methode' => $r->methode_paiement,
                'nb'      => (int) $r->nb,
                'total'   => (float) $r->total,
            ]);

        return Inertia::render('admin/reports', [
            'kpis'                  => $kpis,
            'revenus_par_mois'      => $revenusParMois,
            'inscriptions_par_mois' => $inscriptionsParMois,
            'reservations_par_statut' => $reservationsParStatut,
            'top_artisans'          => $topArtisans,
            'methodes_paiement'     => $methodesParPaiement,
        ]);
    }
}
