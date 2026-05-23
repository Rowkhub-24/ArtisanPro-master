<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\RespondsWithJson;
use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    use RespondsWithJson;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Reservation::query()->with(['client.user', 'artisan.user', 'devis']);

        if ($user->isClient() && $user->client) {
            $query->where('id_client', $user->client->id);
        } elseif ($user->isArtisan() && $user->artisan) {
            $query->where('id_artisan', $user->artisan->id);
        } else {
            return $this->jsonError('Profil client ou artisan requis.', 403);
        }

        $res = $query->orderByDesc('date_creation')->paginate(15);

        return $this->jsonSuccess($res->items(), null, [
            'current_page' => $res->currentPage(),
            'last_page' => $res->lastPage(),
            'total' => $res->total(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->isClient() || ! $user->client) {
            return $this->jsonError('Seuls les clients peuvent créer une réservation.', 403);
        }

        $data = $request->validate([
            'id_artisan' => ['required', 'exists:artisans,id'],
            'id_devis' => ['nullable', 'exists:devis,id'],
            'date' => ['required', 'date'],
            'date_debut' => ['required', 'date'],
            'creneau' => ['nullable', 'string', 'max:50'],
            'description_besoin' => ['nullable', 'string', 'max:5000'],
            'montant_total' => ['nullable', 'numeric', 'min:0'],
        ]);

        $reservation = Reservation::query()->create([
            'id_client' => $user->client->id,
            'id_artisan' => $data['id_artisan'],
            'id_devis' => $data['id_devis'] ?? null,
            'date' => $data['date'],
            'date_debut' => $data['date_debut'],
            'date_fin' => null,
            'creneau' => $data['creneau'] ?? null,
            'statut' => 'en_cours',
            'description_besoin' => $data['description_besoin'] ?? null,
            'montant_total' => $data['montant_total'] ?? null,
            'date_creation' => now(),
        ]);

        return $this->jsonSuccess($reservation->load(['artisan.user']), 'Réservation créée.', [], 201);
    }
}
