<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Events\MissionTermineeAuto;
use App\Models\AutomationLog;
use App\Models\HistoriqueGeolocalisation;
use App\Models\Notification;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Services\NotificationService;
use App\Services\SmsNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * MissionTerminaisonDetector — Job planifié toutes les 2 minutes.
 *
 * Détecte automatiquement la fin des missions en cours via deux mécanismes :
 *   1. GPS : ≥5 points consécutifs hors zone 500m sur 10 min (Req 5.2)
 *   2. Durée : date_debut + duree_estimee_min × 60 + 1800s dépassé (Req 5.3)
 *
 * Planifié dans routes/console.php : ->everyTwoMinutes()
 *
 * Implements: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
class MissionTerminaisonDetector implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Timeout du job en secondes.
     * Suffisant pour traiter plusieurs dizaines de réservations avec GPS.
     */
    public int $timeout = 120;

    /** Rayon de la zone d'intervention en mètres */
    private const RAYON_ZONE_METRES = 500;

    /** Nombre minimum de points GPS consécutifs hors zone pour déclencher (Req 5.2) */
    private const MIN_POINTS_HORS_ZONE = 5;

    /** Fenêtre de surveillance GPS en secondes (10 minutes) (Req 5.2) */
    private const FENETRE_GPS_SECONDES = 600;

    /** Buffer de durée en secondes avant alerte (30 minutes) (Req 5.3) */
    private const BUFFER_DUREE_SECONDES = 1800;

    /** Délai supplémentaire avant terminaison forcée (2 heures) (Req 5.4) */
    private const TIMEOUT_FORCE_SECONDES = 7200;

    /** Vitesse GPS maximale plausible en km/h (Req 5.6, 10.3) */
    private const VITESSE_MAX_KMH = 200;

    private NotificationService $notificationService;
    private SmsNotificationService $smsService;

    public function __construct()
    {
        $this->notificationService = app(NotificationService::class);
        $this->smsService          = app(SmsNotificationService::class);
    }

    // ── Handle ────────────────────────────────────────────────────────────────

    /**
     * Traite toutes les réservations en statut `en_cours_mission`.
     * Tente d'abord la détection GPS, puis la détection par durée si nécessaire.
     * Req 5.1
     */
    public function handle(): void
    {
        $reservations = Reservation::query()
            ->where('statut', 'en_cours_mission')
            ->with(['artisan.user', 'client.user'])
            ->get();

        foreach ($reservations as $reservation) {
            try {
                $gpsDetected = $this->detecterViaGPS($reservation);

                // Si GPS a détecté la fin, ne pas tester la durée (Req 5.7 logique inversée)
                if (! $gpsDetected) {
                    $this->detecterViaDuree($reservation);
                }
            } catch (\Throwable $e) {
                Log::error('MissionTerminaisonDetector: échec traitement réservation', [
                    'reservation_id' => $reservation->id,
                    'error'          => $e->getMessage(),
                    'trace'          => $e->getTraceAsString(),
                ]);
            }
        }

        Log::info('MissionTerminaisonDetector: job exécuté.', [
            'reservations_traitees' => $reservations->count(),
        ]);
    }

    // ── Méthode GPS ──────────────────────────────────────────────────────────

    /**
     * Détecte la fin de mission via la géolocalisation GPS.
     *
     * - Récupère les points GPS depuis `date_debut` de la mission
     * - Filtre les anomalies de vitesse > 200 km/h (Req 5.6, 10.3)
     * - Détecte ≥ 5 points consécutifs hors zone 500m sur 10 minutes (Req 5.2)
     * - Si aucune donnée GPS → return false (Req 5.7)
     *
     * @param  Reservation  $reservation
     * @return bool  true si la fin de mission est détectée via GPS
     */
    public function detecterViaGPS(Reservation $reservation): bool
    {
        $artisan = $reservation->artisan;
        if (! $artisan) {
            return false;
        }

        $dateDebut = $reservation->date_debut;
        if (! $dateDebut) {
            return false;
        }

        // Récupérer les points GPS depuis le début de mission
        $pointsGPS = HistoriqueGeolocalisation::query()
            ->where('id_artisan', $artisan->id)
            ->where('date_position', '>=', $dateDebut)
            ->orderBy('date_position', 'asc')
            ->get();

        // Aucune donnée GPS → ignorer mécanisme GPS (Req 5.7)
        if ($pointsGPS->isEmpty()) {
            return false;
        }

        // Filtrer les anomalies et obtenir les points valides
        $pointsValides = $this->filtrerAnomaliesGPS($pointsGPS->toArray(), $reservation);

        // Vérifier si ≥ 5 points consécutifs hors zone sur 10 min
        $detected = $this->detecterDepartZone($pointsValides, $reservation);

        if ($detected) {
            $this->confirmerFinMission($reservation, 'gps');
            return true;
        }

        return false;
    }

    /**
     * Filtre les anomalies GPS (vitesse > 200 km/h entre deux points consécutifs).
     * Les points anormaux sont ignorés et journalisés dans automation_logs.
     * Req 5.6, 10.3
     *
     * @param  array<int, mixed>  $points  Points GPS bruts
     * @param  Reservation        $reservation
     * @return array<int, mixed>  Points GPS valides
     */
    public function filtrerAnomaliesGPS(array $points, Reservation $reservation): array
    {
        if (empty($points)) {
            return [];
        }

        $pointsValides = [];
        $dernierPoint  = null;

        foreach ($points as $point) {
            if ($dernierPoint === null) {
                $pointsValides[] = $point;
                $dernierPoint    = $point;
                continue;
            }

            // Calculer la vitesse implicite entre le dernier point valide et le point actuel
            $lat1 = (float) ($dernierPoint['latitude'] ?? ($dernierPoint->latitude ?? 0));
            $lon1 = (float) ($dernierPoint['longitude'] ?? ($dernierPoint->longitude ?? 0));
            $lat2 = (float) ($point['latitude'] ?? ($point->latitude ?? 0));
            $lon2 = (float) ($point['longitude'] ?? ($point->longitude ?? 0));

            $t1 = $this->timestampFromPoint($dernierPoint);
            $t2 = $this->timestampFromPoint($point);

            $intervalleSecondes = $t2 - $t1;

            if ($intervalleSecondes <= 0) {
                // Points simultanés ou inversés : conserver mais ne pas calculer vitesse
                $pointsValides[] = $point;
                $dernierPoint    = $point;
                continue;
            }

            $distanceMetres  = $this->haversineDistance($lat1, $lon1, $lat2, $lon2);
            $vitesseKmh      = ($distanceMetres / $intervalleSecondes) * 3.6;

            if ($vitesseKmh > self::VITESSE_MAX_KMH) {
                // Anomalie GPS : rejeter P2, journaliser (Req 5.6, 10.3)
                $this->journaliserAnomalieGPS($reservation, $lat1, $lon1, $lat2, $lon2, $vitesseKmh);
                // Conserver le dernier point valide (P1), ne pas mettre à jour $dernierPoint
                continue;
            }

            $pointsValides[] = $point;
            $dernierPoint    = $point;
        }

        return $pointsValides;
    }

    /**
     * Détecte si ≥ 5 points GPS consécutifs sont hors de la zone 500m sur 10 min.
     * Req 5.2
     *
     * @param  array<int, mixed>  $points  Points GPS valides (filtrés)
     * @param  Reservation        $reservation
     * @return bool
     */
    public function detecterDepartZone(array $points, Reservation $reservation): bool
    {
        $latClient = (float) ($reservation->latitude_client ?? 0);
        $lonClient = (float) ($reservation->longitude_client ?? 0);

        if ($latClient === 0.0 && $lonClient === 0.0) {
            return false; // Pas de coordonnées d'intervention
        }

        $consecutifsHorsZone = 0;
        $premierPointHorsZone = null;

        foreach ($points as $point) {
            $lat = (float) ($point['latitude'] ?? ($point->latitude ?? 0));
            $lon = (float) ($point['longitude'] ?? ($point->longitude ?? 0));

            $distance = $this->haversineDistance($lat, $lon, $latClient, $lonClient);

            if ($distance > self::RAYON_ZONE_METRES) {
                $consecutifsHorsZone++;

                if ($premierPointHorsZone === null) {
                    $premierPointHorsZone = $point;
                }

                // Vérifier si la fenêtre de 10 minutes est couverte
                if ($consecutifsHorsZone >= self::MIN_POINTS_HORS_ZONE && $premierPointHorsZone !== null) {
                    $t1     = $this->timestampFromPoint($premierPointHorsZone);
                    $tCurr  = $this->timestampFromPoint($point);
                    $duree  = $tCurr - $t1;

                    if ($duree >= self::FENETRE_GPS_SECONDES) {
                        return true;
                    }
                }
            } else {
                // Point dans la zone → réinitialiser la séquence consécutive
                $consecutifsHorsZone  = 0;
                $premierPointHorsZone = null;
            }
        }

        return false;
    }

    // ── Méthode durée ────────────────────────────────────────────────────────

    /**
     * Détecte le dépassement de durée estimée.
     *
     * - Si `date_debut + duree_estimee_min * 60 + 1800s` dépassé → alerte (Req 5.3)
     *   → retourne true (seuil dépassé)
     * - Si 2h de plus sans confirmation → `source_terminaison = 'auto_timeout'`,
     *   dispatch `MissionTermineeAuto` avec `source = 'timeout'` (Req 5.4)
     *
     * @param  Reservation  $reservation
     * @return bool  true si le seuil de durée est dépassé (alert ou timeout)
     */
    public function detecterViaDuree(Reservation $reservation): bool
    {
        $dateDebut       = $reservation->date_debut;
        $dureeEstimeeMin = $reservation->duree_estimee_min ?? 60;

        if (! $dateDebut) {
            return false;
        }

        $timestampDebut             = $dateDebut->timestamp;
        $timestampAlerte            = $timestampDebut + ($dureeEstimeeMin * 60) + self::BUFFER_DUREE_SECONDES;
        $timestampTerminaisonForcee = $timestampAlerte + self::TIMEOUT_FORCE_SECONDES;
        $timestampActuel            = now()->timestamp;

        if ($timestampActuel <= $timestampAlerte) {
            // Pas encore de dépassement du buffer
            return false;
        }

        // Dépassement détecté → alerte si pas encore envoyée (Req 5.3)
        $cacheKeyAlerte = "mission_alerte_envoyee:{$reservation->id}";
        if (! Cache::has($cacheKeyAlerte)) {
            $this->envoyerAlerteDepassement($reservation);
            // Stocker l'alerte avec TTL de 3h (plus long que le timeout de 2h)
            Cache::put($cacheKeyAlerte, true, 3 * 3600);
        }

        // Vérifier si les 2h supplémentaires se sont écoulées sans confirmation (Req 5.4)
        if ($timestampActuel >= $timestampTerminaisonForcee) {
            $reservation->update(['source_terminaison' => 'auto_timeout']);
            MissionTermineeAuto::dispatch($reservation, 'timeout');

            Log::info('MissionTerminaisonDetector: fin par timeout forcé.', [
                'reservation_id' => $reservation->id,
            ]);

            Cache::forget($cacheKeyAlerte);
        }

        // Retourner true dès que le seuil de durée+buffer est dépassé (alerte ou timeout)
        return true;
    }

    // ── Confirmer fin de mission ──────────────────────────────────────────────

    /**
     * Confirme la fin de mission via GPS.
     * - Set `source_terminaison = 'auto_gps'`
     * - Dispatch `MissionTermineeAuto` avec `source = 'gps'`
     * - Libère les fonds séquestrés
     * - Notifie le client (SMS + in-app)
     * Req 5.5
     *
     * @param  Reservation  $reservation
     * @param  string        $source  'gps' | 'timeout'
     */
    public function confirmerFinMission(Reservation $reservation, string $source): void
    {
        $reservation->update(['source_terminaison' => 'auto_gps']);

        // Dispatcher l'événement MissionTermineeAuto (Req 5.5)
        MissionTermineeAuto::dispatch($reservation, $source);

        // Libérer les fonds séquestrés (Req 5.5)
        $this->libererFondsSequestres($reservation);

        // Notifier le client — SMS + in-app (Req 5.5)
        $clientUser = $reservation->client?->user;
        if ($clientUser) {
            Notification::notifier(
                $clientUser->id,
                "✅ Mission #{$reservation->id} terminée automatiquement. Merci de laisser un avis.",
                'systeme'
            );

            $this->smsService->envoyer(
                $clientUser->telephone ?? '',
                "ArtisanPro : La mission #{$reservation->id} est terminée. Laissez votre avis sur la plateforme.",
                $clientUser,
                'mission_terminee_auto',
                $reservation->id
            );
        }

        Log::info('MissionTerminaisonDetector: fin de mission confirmée.', [
            'reservation_id' => $reservation->id,
            'source'         => $source,
        ]);
    }

    // ── Méthodes privées ─────────────────────────────────────────────────────

    /**
     * Envoie une alerte de dépassement de durée à l'artisan ET au client. (Req 5.3)
     */
    private function envoyerAlerteDepassement(Reservation $reservation): void
    {
        // Notifier l'artisan
        $artisanUser = $reservation->artisan?->user;
        if ($artisanUser) {
            Notification::notifier(
                $artisanUser->id,
                "⚠️ Mission #{$reservation->id} : durée estimée dépassée. Confirmez la fin ou prolongez la mission.",
                'systeme'
            );

            $this->smsService->envoyer(
                $artisanUser->telephone ?? '',
                "ArtisanPro : La durée estimée de la mission #{$reservation->id} est dépassée. Confirmez la fin de mission dans les 2 prochaines heures.",
                $artisanUser,
                'mission_alerte_duree',
                $reservation->id
            );
        }

        // Notifier le client
        $clientUser = $reservation->client?->user;
        if ($clientUser) {
            Notification::notifier(
                $clientUser->id,
                "⚠️ Mission #{$reservation->id} : durée estimée dépassée. L'artisan doit confirmer la fin de mission.",
                'systeme'
            );

            $this->smsService->envoyer(
                $clientUser->telephone ?? '',
                "ArtisanPro : La durée estimée de la mission #{$reservation->id} est dépassée.",
                $clientUser,
                'mission_alerte_duree_client',
                $reservation->id
            );
        }

        Log::info('MissionTerminaisonDetector: alerte dépassement durée envoyée.', [
            'reservation_id' => $reservation->id,
        ]);
    }

    /**
     * Libère les fonds séquestrés pour la réservation. (Req 5.5)
     */
    private function libererFondsSequestres(Reservation $reservation): void
    {
        try {
            $paiements = Paiement::where('id_reservation', $reservation->id)
                ->where('statut', 'reussi')
                ->whereIn('type_transaction', ['acompte', 'solde'])
                ->get();

            foreach ($paiements as $paiement) {
                $paiement->update(['statut' => 'complete']);
            }

            Log::info('MissionTerminaisonDetector: fonds séquestrés libérés.', [
                'reservation_id'   => $reservation->id,
                'paiements_liberes' => $paiements->count(),
            ]);
        } catch (\Throwable $e) {
            Log::error('MissionTerminaisonDetector: échec libération fonds.', [
                'reservation_id' => $reservation->id,
                'error'          => $e->getMessage(),
            ]);
        }
    }

    /**
     * Journalise une anomalie GPS dans automation_logs. (Req 5.6, 10.3)
     */
    private function journaliserAnomalieGPS(
        Reservation $reservation,
        float $lat1, float $lon1,
        float $lat2, float $lon2,
        float $vitesseKmh
    ): void {
        try {
            AutomationLog::create([
                'type_action'     => 'gps_anomaly',
                'model_type'      => Reservation::class,
                'model_id'        => $reservation->id,
                'decision'        => 'rejetee',
                'score_confiance' => 0.0,
                'regles_evaluees' => [
                    [
                        'cle'             => 'vitesse_max_kmh',
                        'valeur_attendue' => '<=' . self::VITESSE_MAX_KMH,
                        'valeur_reelle'   => round($vitesseKmh, 2),
                        'resultat'        => false,
                    ],
                    [
                        'cle'           => 'p1',
                        'valeur_reelle' => ['lat' => $lat1, 'lon' => $lon1],
                        'resultat'      => true,
                    ],
                    [
                        'cle'           => 'p2_rejete',
                        'valeur_reelle' => ['lat' => $lat2, 'lon' => $lon2],
                        'resultat'      => false,
                    ],
                ],
                'raison'          => "Anomalie GPS : vitesse implicite {$vitesseKmh} km/h > " . self::VITESSE_MAX_KMH . " km/h. Point P2 rejeté.",
                'duree_ms'        => 0,
            ]);
        } catch (\Throwable $e) {
            Log::error('MissionTerminaisonDetector: échec journalisation anomalie GPS.', [
                'reservation_id' => $reservation->id,
                'error'          => $e->getMessage(),
            ]);
        }
    }

    /**
     * Extrait un timestamp Unix d'un point GPS (array ou Eloquent model).
     *
     * @param  array<string, mixed>|object  $point
     * @return int
     */
    private function timestampFromPoint(mixed $point): int
    {
        $datePosition = is_array($point)
            ? ($point['date_position'] ?? null)
            : ($point->date_position ?? null);

        if ($datePosition === null) {
            return 0;
        }

        if ($datePosition instanceof \DateTimeInterface) {
            return $datePosition->getTimestamp();
        }

        if (is_string($datePosition)) {
            return (int) strtotime($datePosition);
        }

        return (int) $datePosition;
    }

    /**
     * Calcule la distance Haversine entre deux coordonnées GPS en mètres.
     *
     * @param  float  $lat1  Latitude du point 1
     * @param  float  $lon1  Longitude du point 1
     * @param  float  $lat2  Latitude du point 2
     * @param  float  $lon2  Longitude du point 2
     * @return float  Distance en mètres
     */
    public function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $R    = 6371000; // Rayon de la Terre en mètres
        $phi1 = deg2rad($lat1);
        $phi2 = deg2rad($lat2);
        $dphi = deg2rad($lat2 - $lat1);
        $dlambda = deg2rad($lon2 - $lon1);

        $a = sin($dphi / 2) ** 2
           + cos($phi1) * cos($phi2) * sin($dlambda / 2) ** 2;

        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
