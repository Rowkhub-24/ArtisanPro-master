<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\RespondsWithJson;
use App\Http\Controllers\Controller;
use App\Models\Devis;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DevisController extends Controller
{
    use RespondsWithJson;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Devis::query()->with(['client.user', 'artisan.user']);

        if ($user->isClient() && $user->client) {
            $query->where('id_client', $user->client->id);
        } elseif ($user->isArtisan() && $user->artisan) {
            $query->where('id_artisan', $user->artisan->id);
        } else {
            return $this->jsonError('Profil client ou artisan requis.', 403);
        }

        $devis = $query->orderByDesc('date_demande')->paginate(15);

        return $this->jsonSuccess($devis->items(), null, [
            'current_page' => $devis->currentPage(),
            'last_page' => $devis->lastPage(),
            'total' => $devis->total(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->isClient() || ! $user->client) {
            return $this->jsonError('Seuls les clients peuvent demander un devis.', 403);
        }

        $data = $request->validate([
            'id_artisan' => ['required', 'exists:artisans,id'],
            'description_travaux' => ['required', 'string', 'max:5000'],
            'photos' => ['nullable', 'array', 'max:10'],
            'photos.*' => ['string', 'max:500'],
        ]);

        $devis = Devis::query()->create([
            'id_client' => $user->client->id,
            'id_artisan' => $data['id_artisan'],
            'description_travaux' => $data['description_travaux'],
            'photos' => $data['photos'] ?? null,
            'date_demande' => now(),
            'statut' => 'en_attente',
        ]);

        return $this->jsonSuccess($devis->load(['artisan.user']), 'Demande de devis enregistrée.', [], 201);
    }

    public function update(Request $request, Devis $devis): JsonResponse
    {
        $user = $request->user();
        if (! $user->isArtisan() || ! $user->artisan || $devis->id_artisan !== $user->artisan->id) {
            return $this->jsonError('Non autorisé.', 403);
        }

        $data = $request->validate([
            'montant_propose' => ['required', 'numeric', 'min:0'],
            'statut' => ['sometimes', 'in:en_attente,accepte,refuse,contre_offre'],
        ]);

        $devis->update([
            'montant_propose' => $data['montant_propose'],
            'date_reponse' => now(),
            'statut' => $data['statut'] ?? 'en_attente',
        ]);

        return $this->jsonSuccess($devis->fresh());
    }
}
