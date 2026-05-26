<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DiagnosticIAController extends Controller
{
    /**
     * Analyse une description + photos et recommande des artisans qualifiés.
     * Prend en compte la position GPS du client pour trouver les artisans les plus proches.
     */
    public function analyser(Request $request): JsonResponse
    {
        $request->validate([
            'description' => ['required', 'string', 'min:10', 'max:2000'],
            'photos'      => ['nullable', 'array', 'max:5'],
            'photos.*'    => ['image', 'mimes:jpeg,png,webp,gif', 'max:5120'],
            'latitude'    => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'   => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $description    = $request->input('description');
        $clientLat      = $request->input('latitude') ? (float) $request->input('latitude') : null;
        $clientLng      = $request->input('longitude') ? (float) $request->input('longitude') : null;
        $apiKey         = config('services.openai.key');

        // ── Construire le prompt ──────────────────────────────────────────────
        $categories = Category::pluck('nom')->implode(', ');

        $systemPrompt = 'Tu es un expert en artisanat et travaux à Porto-Novo, Bénin.' . "\n"
            . "Ton rôle est d'analyser la description d'un problème (et éventuellement des photos)" . "\n"
            . 'pour identifier le type de travaux nécessaires et recommander le bon type d\'artisan.' . "\n\n"
            . 'Catégories disponibles sur la plateforme ArtisanPro : ' . $categories . "\n\n"
            . 'Réponds UNIQUEMENT en JSON valide avec cette structure exacte :' . "\n"
            . '{"probleme_identifie":"Description courte du problème détecté",'
            . '"urgence":"faible|moyenne|haute|critique",'
            . '"categories_recommandees":["Catégorie1","Catégorie2"],'
            . '"explication":"Explication claire du diagnostic en 2-3 phrases",'
            . '"precautions":["Précaution 1","Précaution 2","Précaution 3"],'
            . '"conseils_immediats":"Ce que le client peut faire immédiatement en attendant l\'artisan",'
            . '"delai_intervention":"Délai recommandé (ex: Dans les 24h, Urgent - maintenant, Sous 1 semaine)"}';


        // ── Préparer les messages pour GPT-4o ────────────────────────────────
        $userContent = [];
        $userContent[] = [
            'type' => 'text',
            'text' => "Voici le problème décrit par le client :\n\n{$description}",
        ];

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $base64 = base64_encode(file_get_contents($photo->getRealPath()));
                $mime   = $photo->getMimeType();
                $userContent[] = [
                    'type'      => 'image_url',
                    'image_url' => ['url' => "data:{$mime};base64,{$base64}", 'detail' => 'high'],
                ];
            }
        }

        // ── Appel OpenAI GPT-4o ───────────────────────────────────────────────
        $diagnostic = null;

        if ($apiKey) {
            try {
                $response = Http::withToken($apiKey)
                    ->timeout(30)
                    ->post('https://api.openai.com/v1/chat/completions', [
                        'model'           => 'gpt-4o',
                        'max_tokens'      => 800,
                        'temperature'     => 0.3,
                        'messages'        => [
                            ['role' => 'system', 'content' => $systemPrompt],
                            ['role' => 'user',   'content' => $userContent],
                        ],
                        'response_format' => ['type' => 'json_object'],
                    ]);

                if ($response->successful()) {
                    $content    = $response->json('choices.0.message.content');
                    $diagnostic = json_decode($content, true);
                } else {
                    Log::warning('OpenAI API error', ['status' => $response->status(), 'body' => $response->body()]);
                }
            } catch (\Throwable $e) {
                Log::error('OpenAI request failed', ['error' => $e->getMessage()]);
            }
        }

        if (! $diagnostic) {
            $diagnostic = $this->analyseLocale($description);
        }

        // ── Trouver les artisans les plus proches et les mieux notés ──────────
        $artisansRecommandes = $this->trouverArtisans(
            $diagnostic['categories_recommandees'] ?? [],
            $clientLat,
            $clientLng
        );

        return response()->json([
            'diagnostic' => $diagnostic,
            'artisans'   => $artisansRecommandes,
            'source'     => $apiKey ? 'openai' : 'local',
        ]);
    }

    /**
     * Analyse locale par mots-clés (fallback sans API).
     */
    private function analyseLocale(string $description): array
    {
        $desc = mb_strtolower($description);

        $mapping = [
            'Plomberie'     => ['fuite', 'eau', 'robinet', 'tuyau', 'canalisation', 'wc', 'toilette', 'évier', 'douche', 'chauffe-eau', 'fosse', 'débouchage', 'plomberie'],
            'Électricité'   => ['électrique', 'courant', 'prise', 'disjoncteur', 'tableau', 'lumière', 'ampoule', 'câble', 'court-circuit', 'panne', 'électricité', 'solaire', 'panneau'],
            'Maçonnerie'    => ['mur', 'fissure', 'béton', 'parpaing', 'construction', 'fondation', 'dalle', 'cloison', 'maçonnerie', 'rénovation', 'façade'],
            'Menuiserie'    => ['porte', 'fenêtre', 'bois', 'meuble', 'placard', 'parquet', 'menuiserie', 'charpente', 'escalier'],
            'Peinture'      => ['peinture', 'peindre', 'mur', 'façade', 'enduit', 'ravalement', 'couleur', 'décoration'],
            'Climatisation' => ['climatiseur', 'clim', 'froid', 'chaleur', 'ventilation', 'température', 'climatisation'],
            'Carrelage'     => ['carrelage', 'carreau', 'faïence', 'sol', 'mosaïque', 'dalle'],
            'Soudure'       => ['portail', 'grille', 'métal', 'fer', 'soudure', 'ferronnerie', 'garde-corps'],
            'Jardinage'     => ['jardin', 'herbe', 'arbre', 'plante', 'gazon', 'taille', 'élagage', 'jardinage'],
            'Informatique'  => ['ordinateur', 'pc', 'réseau', 'wifi', 'internet', 'informatique', 'virus', 'données'],
        ];

        $detected = [];
        foreach ($mapping as $cat => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($desc, $kw)) {
                    $detected[] = $cat;
                    break;
                }
            }
        }

        if (empty($detected)) {
            $detected = ['Maçonnerie', 'Plomberie'];
        }

        $urgence = 'moyenne';
        if (preg_match('/urgent|urgence|maintenant|immédiat|danger|risque|fuite importante|court-circuit/i', $description)) {
            $urgence = 'haute';
        } elseif (preg_match('/critique|inondation|incendie|explosion|effondrement/i', $description)) {
            $urgence = 'critique';
        } elseif (preg_match('/petit|mineur|léger|peu important/i', $description)) {
            $urgence = 'faible';
        }

        return [
            'probleme_identifie'      => 'Problème identifié : ' . implode(', ', $detected),
            'urgence'                 => $urgence,
            'categories_recommandees' => array_slice($detected, 0, 2),
            'explication'             => "D'après votre description, il s'agit d'un problème nécessitant l'intervention d'un(e) " . implode(' ou ', $detected) . '. Un artisan qualifié pourra diagnostiquer et résoudre ce problème rapidement.',
            'precautions'             => [
                'Ne tentez pas de réparer vous-même si vous n\'êtes pas qualifié.',
                'Coupez l\'alimentation (eau ou électricité) si nécessaire.',
                'Documentez le problème avec des photos supplémentaires.',
            ],
            'conseils_immediats'      => 'Contactez un artisan qualifié dès que possible. En attendant, limitez l\'accès à la zone concernée.',
            'delai_intervention'      => $urgence === 'critique' ? 'Immédiatement' : ($urgence === 'haute' ? 'Dans les 24h' : 'Sous 2-3 jours'),
        ];
    }

    /**
     * Trouve les artisans les mieux notés ET les plus proches du client.
     * Tri : d'abord par distance (si GPS disponible), puis par note.
     */
    private function trouverArtisans(array $categories, ?float $clientLat, ?float $clientLng): array
    {
        if (empty($categories)) {
            return [];
        }

        $artisans = Artisan::query()
            ->with(['user:id,nom,prenom,avatar,telephone', 'categories:id,nom'])
            ->whereHas('user', fn ($q) => $q->where('statut', 'actif'))
            ->whereHas('categories', fn ($q) => $q->whereIn('nom', $categories))
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->orderByDesc('note_moyenne')
            ->limit(20) // On récupère plus pour trier par distance ensuite
            ->get();

        // Si pas de GPS client, retourner les 4 mieux notés directement
        if ($clientLat === null || $clientLng === null) {
            return $artisans->take(4)->map(fn (Artisan $a) => $this->formatArtisan($a, null))->toArray();
        }

        // Calculer la distance pour chaque artisan (formule Haversine)
        $withDistance = $artisans->map(function (Artisan $a) use ($clientLat, $clientLng) {
            $distance = $this->haversineDistance(
                $clientLat, $clientLng,
                (float) $a->latitude, (float) $a->longitude
            );
            return ['artisan' => $a, 'distance_km' => $distance];
        });

        // Trier : artisans dans un rayon de 5km d'abord (par note), puis les autres (par distance)
        $nearby = $withDistance->filter(fn ($item) => $item['distance_km'] <= 5.0)
            ->sortByDesc(fn ($item) => $item['artisan']->note_moyenne);

        $farther = $withDistance->filter(fn ($item) => $item['distance_km'] > 5.0)
            ->sortBy(fn ($item) => $item['distance_km']);

        $sorted = $nearby->concat($farther)->take(4);

        return $sorted->map(fn ($item) => $this->formatArtisan($item['artisan'], $item['distance_km']))->toArray();
    }

    /**
     * Formatte un artisan pour la réponse JSON.
     */
    private function formatArtisan(Artisan $a, ?float $distanceKm): array
    {
        return [
            'id'               => $a->id,
            'metier'           => $a->metier,
            'prenom'           => $a->user?->prenom,
            'nom'              => $a->user?->nom,
            'avatar_url'       => $a->user?->avatar_url,
            'telephone'        => $a->user?->telephone,
            'note_moyenne'     => $a->note_moyenne,
            'badge'            => $a->badge,
            'tarifs_horaire'   => $a->tarifs_horaire,
            'zone_intervention'=> $a->zone_intervention,
            'categories'       => $a->categories->pluck('nom')->all(),
            'distance_km'      => $distanceKm !== null ? round($distanceKm, 1) : null,
            'latitude'         => $a->latitude,
            'longitude'        => $a->longitude,
        ];
    }

    /**
     * Calcule la distance en km entre deux points GPS (formule Haversine).
     */
    private function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // km
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earthRadius * 2 * asin(sqrt($a));
    }
}
