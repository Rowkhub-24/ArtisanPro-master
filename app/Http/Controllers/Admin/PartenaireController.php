<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FournisseurPartenaire;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartenaireController extends Controller
{
    public function index(): Response
    {
        $partenaires = FournisseurPartenaire::orderBy('nom_fournisseur')->paginate(20);

        return Inertia::render('admin/partenaires/index', [
            'partenaires' => $partenaires,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nom_fournisseur'   => ['required', 'string', 'max:200'],
            'description'       => ['nullable', 'string'],
            'contact_email'     => ['required', 'email', 'max:255'],
            'contact_telephone' => ['required', 'string', 'max:20'],
            'logo_url'          => ['nullable', 'url', 'max:500'],
            'site_web'          => ['nullable', 'url', 'max:500'],
            'type'              => ['nullable', 'string', 'max:50'],
            'actif'             => ['boolean'],
        ]);

        FournisseurPartenaire::create($validated);

        return back()->with('success', 'Partenaire ajouté.');
    }

    public function update(Request $request, FournisseurPartenaire $partenaire): RedirectResponse
    {
        $validated = $request->validate([
            'nom_fournisseur'   => ['required', 'string', 'max:200'],
            'description'       => ['nullable', 'string'],
            'contact_email'     => ['required', 'email', 'max:255'],
            'contact_telephone' => ['required', 'string', 'max:20'],
            'logo_url'          => ['nullable', 'url', 'max:500'],
            'site_web'          => ['nullable', 'url', 'max:500'],
            'type'              => ['nullable', 'string', 'max:50'],
            'actif'             => ['boolean'],
        ]);

        $partenaire->update($validated);

        return back()->with('success', 'Partenaire mis à jour.');
    }

    public function destroy(FournisseurPartenaire $partenaire): RedirectResponse
    {
        $partenaire->delete();

        return back()->with('success', 'Partenaire supprimé.');
    }

    public function toggleActif(FournisseurPartenaire $partenaire): RedirectResponse
    {
        $partenaire->update(['actif' => ! $partenaire->actif]);

        return back()->with('success', $partenaire->actif ? 'Partenaire activé.' : 'Partenaire désactivé.');
    }
}
