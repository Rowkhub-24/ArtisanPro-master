<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
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
            'users'   => $users,
            'filters' => $request->only(['q', 'type', 'statut']),
        ]);
    }

    public function show(User $user): Response
    {
        $user->load(['artisan.categories', 'client']);

        return Inertia::render('admin/users/show', [
            'user' => $user,
        ]);
    }

    public function updateStatut(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'statut' => ['required', 'in:actif,suspendu,banni'],
        ]);

        $user->update(['statut' => $request->statut]);

        return back()->with('success', "Statut de {$user->prenom} {$user->nom} mis à jour.");
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'Utilisateur supprimé.');
    }
}
