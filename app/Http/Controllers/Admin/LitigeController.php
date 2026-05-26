<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Litige;
use App\Models\Notification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LitigeController extends Controller
{
    public function index(Request $request): Response
    {
        $litiges = Litige::with([
            'client.user:id,nom,prenom,email',
            'artisan.user:id,nom,prenom',
            'reservation:id,statut,montant_total',
        ])
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->when($request->q, fn ($q, $s) =>
                $q->whereHas('client.user', fn ($u) =>
                    $u->where('nom', 'like', "%{$s}%")->orWhere('prenom', 'like', "%{$s}%")
                )
            )
            ->orderByDesc('date_ouverture')
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total'    => Litige::count(),
            'ouvert'   => Litige::where('statut', 'ouvert')->count(),
            'en_cours' => Litige::where('statut', 'en_cours')->count(),
            'resolu'   => Litige::where('statut', 'resolu')->count(),
            'clos'     => Litige::where('statut', 'clos')->count(),
        ];

        return Inertia::render('admin/litiges/index', [
            'litiges' => $litiges,
            'stats'   => $stats,
            'filters' => $request->only(['q', 'statut']),
        ]);
    }

    public function show(Litige $litige): Response
    {
        $litige->load([
            'client.user',
            'artisan.user',
            'reservation',
        ]);

        return Inertia::render('admin/litiges/show', [
            'litige' => $litige,
        ]);
    }

    public function updateStatut(Request $request, Litige $litige): RedirectResponse
    {
        $request->validate([
            'statut'             => ['required', 'in:ouvert,en_cours,resolu,clos'],
            'resolution_details' => ['nullable', 'string', 'max:2000'],
        ]);

        $litige->update([
            'statut'             => $request->statut,
            'resolution_details' => $request->resolution_details,
        ]);

        // Notifier le client et l'artisan
        $statusLabels = [
            'en_cours' => 'pris en charge',
            'resolu'   => 'résolu',
            'clos'     => 'clôturé',
        ];

        $label = $statusLabels[$request->statut] ?? $request->statut;

        if ($litige->client?->user) {
            Notification::notifier(
                $litige->client->user->id,
                "Votre litige #{$litige->id} a été {$label} par l'administration.",
                'systeme'
            );
        }

        if ($litige->artisan?->user) {
            Notification::notifier(
                $litige->artisan->user->id,
                "Le litige #{$litige->id} vous concernant a été {$label} par l'administration.",
                'systeme'
            );
        }

        return back()->with('success', "Litige mis à jour : {$label}.");
    }
}
