<?php

namespace App\Http\Controllers\Admin;

use App\Events\ArtisanValide;
use App\Http\Controllers\Concerns\PaginatesForInertia;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    use PaginatesForInertia;
    public function index(Request $request): Response
    {
        $query = User::query()
            ->when($request->q, fn ($q, $search) =>
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
            )
            ->when($request->type, fn ($q, $type) =>
                $q->where('type_utilisateur', $type)
            )
            ->when($request->statut, fn ($q, $statut) =>
                $q->where('statut', $statut)
            )
            ->orderByDesc('date_inscription');

        $users = $query->paginate(20)->withQueryString();

        return Inertia::render('admin/users/index', [
            'users'   => $this->paginateForInertia($users),
            'filters' => $request->only(['q', 'type', 'statut']),
        ]);
    }

    public function show(User $user): Response
    {
        $user->load([
            'artisan.categories:id,nom',
            'artisan.certifications:id,id_artisan,nom_certification,organisme_delivrance',
            'artisan.portfolioImages:id,id_artisan,titre,url_media',
            'artisan.avis' => fn ($q) => $q->with('client.user:id,nom,prenom')->latest()->limit(5),
            'artisan.reservations' => fn ($q) => $q->latest()->limit(10),
            'client',
        ]);

        return Inertia::render('admin/users/show', [
            'user' => $user,
        ]);
    }

    public function updateStatut(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'statut' => ['required', 'in:actif,suspendu,banni'],
        ]);

        $ancienStatut = $user->statut;
        $user->update(['statut' => $request->statut]);

        // Si l'admin active un artisan (passage a 'actif'), envoyer SMS de validation
        if ($request->statut === 'actif' && $ancienStatut !== 'actif' && $user->isArtisan()) {
            try {
                $user->load('artisan');
                if ($user->artisan) {
                    ArtisanValide::dispatch($user->artisan);
                }
            } catch (\Throwable) {}
        }

        return back()->with('success', "Statut de {$user->prenom} {$user->nom} mis a jour.");
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'Utilisateur supprime.');
    }
}
