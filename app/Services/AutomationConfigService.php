<?php

namespace App\Services;

use App\Models\AutomationRule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

/**
 * Service gérant les règles d'automatisation configurables par l'admin.
 *
 * Chaque règle est stockée dans la table `automation_rules` et mise en cache
 * Redis (clé : `automation_rule:{cle}`). Toute écriture invalide le cache.
 *
 * Implements: Requirements 1.1, 1.2, 1.3, 1.4
 */
class AutomationConfigService
{
    /** Durée de cache en secondes (1 heure) */
    private const CACHE_TTL = 3600;

    /**
     * Règles configurables avec leurs valeurs par défaut et plages valides.
     *
     * Format : 'cle' => ['defaut' => mixed, 'min' => numeric|null, 'max' => numeric|null, 'type' => string]
     *
     * @var array<string, array<string, mixed>>
     */
    private const REGLES_CONFIG = [
        'auto_accept_score_minimum' => [
            'defaut'    => 70,
            'type'      => 'numeric',
            'min'       => 0,
            'max'       => 100,
            'categorie' => 'reservation',
        ],
        'auto_accept_zone_km_maximum' => [
            'defaut'    => 20,
            'type'      => 'numeric',
            'min'       => 1,
            'max'       => 200,
            'categorie' => 'reservation',
        ],
        'auto_devis_enabled' => [
            'defaut'    => true,
            'type'      => 'boolean',
            'min'       => null,
            'max'       => null,
            'categorie' => 'devis',
        ],
        'auto_validate_devis_montant_max' => [
            'defaut'    => 50000,
            'type'      => 'numeric',
            'min'       => 1000,
            'max'       => 500000,
            'categorie' => 'devis',
        ],
        'auto_validate_devis_score_minimum' => [
            'defaut'    => 60,
            'type'      => 'numeric',
            'min'       => 0,
            'max'       => 100,
            'categorie' => 'devis',
        ],
        'auto_mission_timeout_heures' => [
            'defaut'    => 2,
            'type'      => 'numeric',
            'min'       => 1,
            'max'       => 24,
            'categorie' => 'mission',
        ],
        'auto_litige_seuil_micro' => [
            'defaut'    => 5000,
            'type'      => 'numeric',
            'min'       => 0,
            'max'       => 50000,
            'categorie' => 'litige',
        ],
        'auto_litige_timeout_artisan_heures' => [
            'defaut'    => 72,
            'type'      => 'numeric',
            'min'       => 24,
            'max'       => 168,
            'categorie' => 'litige',
        ],
    ];

    /**
     * Lit la valeur d'une règle d'automatisation.
     *
     * Ordre de résolution : cache Redis → base de données → valeur par défaut fournie.
     * Si la valeur est trouvée en base, elle est mise en cache avant d'être retournée.
     *
     * @param  string  $cle     Clé de la règle (ex. 'auto_accept_score_minimum')
     * @param  mixed   $defaut  Valeur retournée si la règle n'existe pas
     * @return mixed
     */
    public function getRegle(string $cle, mixed $defaut = null): mixed
    {
        $cacheKey = "automation_rule:{$cle}";

        $cached = Cache::get($cacheKey);

        if ($cached !== null) {
            return $cached;
        }

        /** @var AutomationRule|null $regle */
        $regle = AutomationRule::where('cle', $cle)->actif()->first();

        if ($regle === null) {
            // Retourner la valeur par défaut interne si connue, sinon $defaut
            return $this->getDefaut($cle) ?? $defaut;
        }

        // La colonne `valeur` est castée en array ; extraire la valeur scalaire si JSON simple
        $valeur = $this->extraireValeur($regle->valeur);

        Cache::put($cacheKey, $valeur, self::CACHE_TTL);

        return $valeur;
    }

    /**
     * Met à jour la valeur d'une règle d'automatisation.
     *
     * Valide la valeur par rapport aux plages autorisées (Req 1.3).
     * Lève `ValidationException` si hors plage sans modifier la règle existante.
     * Après écriture en base, invalide le cache Redis.
     *
     * @param  string  $cle     Clé de la règle
     * @param  mixed   $valeur  Nouvelle valeur
     * @throws ValidationException si la valeur est hors plage autorisée
     */
    public function setRegle(string $cle, mixed $valeur): void
    {
        $this->validerValeur($cle, $valeur);

        // Persister en base (upsert sur la clé)
        AutomationRule::updateOrCreate(
            ['cle' => $cle],
            [
                'valeur'    => $this->normaliserPourJson($valeur),
                'actif'     => true,
                'categorie' => $this->getCategorie($cle),
            ]
        );

        // Invalider le cache Redis (Req 1.2)
        Cache::forget("automation_rule:{$cle}");
    }

    /**
     * Retourne toutes les règles d'automatisation actives depuis la base de données.
     *
     * Pas de cache sur les collections car elles sont utilisées pour l'affichage admin.
     *
     * @return Collection<int, AutomationRule>
     */
    public function getReglesActives(): Collection
    {
        return AutomationRule::actif()->get();
    }

    /**
     * Expose la liste des définitions de règles configurables (métadonnées).
     *
     * @return array<string, array<string, mixed>>
     */
    public function getDefinitionsRegles(): array
    {
        return self::REGLES_CONFIG;
    }

    // ── Méthodes privées ──────────────────────────────────────────────────────

    /**
     * Valide la valeur soumise par rapport à la configuration de la règle.
     *
     * @throws ValidationException
     */
    private function validerValeur(string $cle, mixed $valeur): void
    {
        if (! isset(self::REGLES_CONFIG[$cle])) {
            // Clé inconnue : laisser passer (règles personnalisées admin)
            return;
        }

        $config = self::REGLES_CONFIG[$cle];

        if ($config['type'] === 'boolean') {
            if (! is_bool($valeur) && ! in_array($valeur, [0, 1, '0', '1', 'true', 'false'], true)) {
                throw ValidationException::withMessages([
                    $cle => ["La règle «{$cle}» doit être un booléen (true/false)."],
                ]);
            }
            return;
        }

        // Validation numérique
        if (! is_numeric($valeur)) {
            throw ValidationException::withMessages([
                $cle => ["La règle «{$cle}» doit être une valeur numérique."],
            ]);
        }

        $nombre = (float) $valeur;

        if ($config['min'] !== null && $nombre < $config['min']) {
            throw ValidationException::withMessages([
                $cle => [
                    "La règle «{$cle}» doit être supérieure ou égale à {$config['min']} (valeur soumise : {$nombre}).",
                ],
            ]);
        }

        if ($config['max'] !== null && $nombre > $config['max']) {
            throw ValidationException::withMessages([
                $cle => [
                    "La règle «{$cle}» doit être inférieure ou égale à {$config['max']} (valeur soumise : {$nombre}).",
                ],
            ]);
        }
    }

    /**
     * Extrait la valeur scalaire d'un tableau JSON issu du cast Eloquent.
     *
     * La colonne `valeur` est castée en `array` par le modèle. La convention
     * de stockage est `["value" => scalar]` pour les valeurs simples.
     */
    private function extraireValeur(mixed $valeur): mixed
    {
        if (is_array($valeur)) {
            // Convention : stockage sous forme {"value": ...}
            if (array_key_exists('value', $valeur)) {
                return $valeur['value'];
            }

            // Tableau indexé à un seul élément
            if (count($valeur) === 1 && array_is_list($valeur)) {
                return $valeur[0];
            }

            return $valeur;
        }

        return $valeur;
    }

    /**
     * Normalise la valeur pour le stockage JSON.
     * Les valeurs scalaires sont encapsulées sous la clé "value".
     *
     * @return array<string, mixed>
     */
    private function normaliserPourJson(mixed $valeur): array
    {
        if (is_bool($valeur)) {
            return ['value' => $valeur];
        }

        if (is_numeric($valeur)) {
            return ['value' => $valeur + 0]; // forcer type numérique
        }

        if (is_array($valeur)) {
            return $valeur;
        }

        return ['value' => $valeur];
    }

    /**
     * Retourne la valeur par défaut interne d'une règle connue.
     */
    private function getDefaut(string $cle): mixed
    {
        return self::REGLES_CONFIG[$cle]['defaut'] ?? null;
    }

    /**
     * Retourne la catégorie d'une règle connue.
     */
    private function getCategorie(string $cle): ?string
    {
        return self::REGLES_CONFIG[$cle]['categorie'] ?? null;
    }
}
