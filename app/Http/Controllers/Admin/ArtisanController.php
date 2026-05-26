<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArtisanController extends Controller
{
    public function index(Request $request): Response
    {
        $artisans = Artisan::with(['user:id,nom,prenom,email,statut,date_inscription,avatar', 'categories:id,nom'])
            ->when($request->q, fn ($q, $s) =>
                $q->where('metier', 'like', "%{$s}%")
                  ->orWhereHas('user', fn ($u) => $u->where('nom', 'like', "%{$s}%")->orWhere('prenom', 'like', "%{$s}%"))
            )
            ->when($request->badge, fn ($q, $b) => $q->where('badge', $b))
            ->orderByDesc('note_moyenne')
            ->paginate(20)
            ->withQueryString();

        $categories = Category::orderBy('nom')->get(['id', 'nom']);

        return Inertia::render('admin/artisans/index', [
            'artisans'   => $artisans,
            'categories' => $categories,
            'filters'    => $request->only(['q', 'badge']),
        ]);
    }

    public function show(Artisan $artisan): Response
    {
        $artisan->load([
            'user',
            'categories',
            'certifications',
            'portfolioImages',
            'avis.client.user:id,nom,prenom',
            'reservations' => fn ($q) => $q->latest()->limit(10),
        ]);

        return Inertia::render('admin/artisans/show', [
            'artisan' => $artisan,
        ]);
    }

    public function updateBadge(Request $request, Artisan $artisan): RedirectResponse
    {
        $request->validate(['badge' => ['required', 'in:aucun,certifie,elite']]);
        $artisan->update(['badge' => $request->badge]);

        return back()->with('success', 'Badge mis à jour.');
    }
}
