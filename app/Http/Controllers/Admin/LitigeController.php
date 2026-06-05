<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\PaginatesForInertia;
use App\Http\Controllers\Controller;
use App\Models\Litige;
use App\Models\Notification;
use App\Services\LitigeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LitigeController extends Controller
{
    use PaginatesForInertia;

    public function __construct(private LitigeService $litigeService) {}

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
            ->when($request->boolean('escalade'), fn ($q) => $q->where('escalade', true))
            ->orderByDesc('date_ouverture')
            ->paginate(20)
            ->withQueryString();

        $ouvertsCount = Litige::where('statut', 'ouvert')->count();

        $stats = [
            'total'    => Litige::count(),
            'ouvert'   => $ouvertsCount,
            'ouverts'  => $ouvertsCount,
            'en_cours' => Litige::where('statut', 'en_cours')->count(),
            'resolu'   => Litige::where('statut', 'resolu')->count(),
            'clos'     => Litige::where('statut', 'clos')->count(),
        ];

        return Inertia::render('admin/litiges/index', [
            'litiges' => $this->paginateForInertia($litiges),
            'stats'   => $stats,
            'filters' => $request->only(['q', 'statut', 'escalade']),
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

    /**
     * Geler les fonds associés au litige.
     */
    public function gelerFonds(Litige $litige): RedirectResponse
    {
        $litige->fonds_geles = true;
        $litige->save();

        return back()->with('success', 'Les fonds du litige ont été gelés.');
    }

    /**
     * Libérer les fonds associés au litige (toujours autorisé, même si gelés — Q11).
     */
    public function libererFonds(Litige $litige): RedirectResponse
    {
        $this->litigeService->libererFonds($litige);

        return back()->with('success', 'Les fonds du litige ont été libérés.');
    }

    /**
     * Enregistrer la décision administrative sur un litige.
     * Raison obligatoire d'au moins 50 caractères.
     */
    public function decider(Request $request, Litige $litige): RedirectResponse
    {
        $request->validate([
            'raison_decision' => ['required', 'string', 'min:50'],
        ], [
            'raison_decision.required' => 'La raison de la décision est obligatoire.',
            'raison_decision.min'      => 'La raison de la décision doit comporter au moins 50 caractères.',
        ]);

        $this->litigeService->decider($litige, $request->raison_decision, 'admin');

        return back()->with('success', 'La décision a été enregistrée et le litige est marqué comme résolu.');
    }
}
