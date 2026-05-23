<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReservationController extends Controller
{
    public function index(Request $request): Response
    {
        $reservations = Reservation::with([
            'client.user:id,nom,prenom,email',
            'artisan.user:id,nom,prenom',
        ])
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->when($request->q, fn ($q, $s) =>
                $q->whereHas('client.user', fn ($u) =>
                    $u->where('nom', 'like', "%{$s}%")->orWhere('prenom', 'like', "%{$s}%")
                )
            )
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total'      => Reservation::count(),
            'en_attente' => Reservation::where('statut', 'en_attente')->count(),
            'en_cours'   => Reservation::where('statut', 'en_cours')->count(),
            'termine'    => Reservation::where('statut', 'termine')->count(),
            'annule'     => Reservation::where('statut', 'annule')->count(),
        ];

        return Inertia::render('admin/reservations/index', [
            'reservations' => $reservations,
            'stats'        => $stats,
            'filters'      => $request->only(['q', 'statut']),
        ]);
    }
}
