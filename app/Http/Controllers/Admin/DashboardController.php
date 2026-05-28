<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\Category;
use App\Models\Devis;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $stats = [
            'total_users'        => User::count(),
            'total_clients'      => User::where('type_utilisateur', 'client')->count(),
            'total_artisans'     => User::where('type_utilisateur', 'artisan')->count(),
            'total_categories'   => Category::count(),
            'total_devis'        => Devis::count(),
            'total_reservations' => Reservation::count(),
            'total_paiements'    => Paiement::count(),
            'revenus_total'      => (float) Paiement::whereIn('statut', ['reussi', 'complete'])->sum('montant'),
            'commission_total'   => (float) Paiement::whereIn('statut', ['reussi', 'complete'])->sum('commission'),
            'users_actifs'       => User::where('statut', 'actif')->count(),
            'users_suspendus'    => User::where('statut', 'suspendu')->count(),
        ];

        $recent_users = User::orderByDesc('date_inscription')
            ->limit(5)
            ->get(['id', 'nom', 'prenom', 'email', 'type_utilisateur', 'statut', 'date_inscription']);

        $recent_reservations = Reservation::with([
            'client.user:id,nom,prenom',
            'artisan.user:id,nom,prenom',
        ])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        return Inertia::render('admin/dashboard', [
            'stats'               => $stats,
            'recent_users'        => $recent_users,
            'recent_reservations' => $recent_reservations,
        ]);
    }
}
