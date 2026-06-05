<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\ReservationAutoAcceptee;
use App\Events\ReservationCreee;
use App\Models\AutomationLog;
use App\Models\Reservation;
use App\Services\AutomationConfigService;
use App\Services\NotificationService;
use App\Services\SmsNotificationService;
use App\ValueObjects\AutoDecision;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Écoute l'événement ReservationCreee et tente d'accepter la réservation
 * automatiquement selon 4 critères cumulatifs (Req 2.1–2.7) :
 *
 *  1. Score artisan ≥ auto_accept_score_minimum
 *  2. Artisan disponible sur le créneau demandé
 *  3. Distance Haversine client ↔ artisan ≤ auto_accept_zone_km_maximum
 *  4. Aucune réservation conflictuelle en statut en_cours / en_cours_mission
 *
 * Si tous les critères sont réunis  → acceptation auto + notification client
 * Sinon                             → notification artisan + log rejetee
 * En cas d'exception               → log escaladee + notification artisan (30 min)
 *
 * Implements: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.7
 */
class ReservationAutoAcceptListener implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Timeout de 30 secondes imposé par Req 2.1.
     * Laravel abandonnera le job si le handler dépasse cette durée.
     */
    public int $timeout = 30;

    /** Queue dédiée pour les évaluations d'automatisation */
    public string $queue = 'automation';

    public function __construct(
        private readonly AutomationConfigService $configService,
        private readonly SmsNotificationService  $smsService,
        private readonly NotificationService     $notificationService,
    ) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Handler principal
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Traite l'événement ReservationCreee.
     *
     * @param  ReservationCreee  $event
     */
    public function handle(ReservationCreee $event): void
    {
        $debut       = microtime(true);
        $reservation = $event->reservation;

        try {
            $artisan        = $reservation->artisan;
            $scoreMinimum   = (float) $this->configService->getRegle('auto_accept_score_minimum', 70);
            $zoneKmMaximum  = (float) $this->configService->getRegle('auto_accept_zone_km_maximum', 20);

            // Évaluation des 4 critères
            $scoreOk       = $this->verifierScoreMinimum($reservation, $scoreMinimum);
            $disponibleOk  = $this->verifierDisponibilite($reservation);
            $zoneOk        = $this->verifierZoneGeographique($reservation, $zoneKmMaximum);
            $sansCconflit  = $this->verifierAbsenceConflit($reservation);

            $scoreArtisan  = (float) ($artisan?->score_confiance ?? 0);
            $distance      = $this->calculerDistance($reservation);

            // Construction du journal des règles évaluées
            $reglesEvaluees = [
                [
                    'cle'             => 'auto_accept_score_minimum',
                    'valeur_attendue' => ">={$scoreMinimum}",
                    'valeur_reelle'   => $scoreArtisan,
                    'resultat'        => $scoreOk,
                ],
                [
                    'cle'             => 'disponibilite_creneau',
                    'valeur_attendue' => 'true',
                    'valeur_reelle'   => $disponibleOk ? 'true' : 'false',
                    'resultat'        => $disponibleOk,
                ],
                [
                    'cle'             => 'auto_accept_zone_km_maximum',
                    'valeur_attendue' => "<={$zoneKmMaximum}km",
                    'valeur_reelle'   => $distance !== null ? round($distance, 2) . 'km' : 'N/A',
                    'resultat'        => $zoneOk,
                ],
                [
                    'cle'             => 'absence_conflit_reservation',
                    'valeur_attendue' => 'true',
                    'valeur_reelle'   => $sansCconflit ? 'true' : 'false',
                    'resultat'        => $sansCconflit,
                ],
            ];

            $tousLesCriteresOk = $scoreOk && $disponibleOk && $zoneOk && $sansCconflit;

            if ($tousLesCriteresOk) {
                // ── Acceptation automatique ───────────────────────────────────
                $decision = new AutoDecision(
                    approuvee:                     true,
                    raison:                        "Tous les critères d'acceptation automatique sont remplis (score: {$scoreArtisan} ≥ {$scoreMinimum}, disponible, zone OK, pas de conflit).",
                    score_confiance:               $scoreArtisan,
                    necessite_intervention_humaine: false,
                    regles_evaluees:               $reglesEvaluees,
                );

                // Mise à jour de la réservation
                $reservation->update([
                    'source_acceptation' => 'auto',
                    'statut'             => 'acceptee',
                ]);

                // Dispatch de l'événement ReservationAutoAcceptee (Req 9.1)
                ReservationAutoAcceptee::dispatch($reservation, $decision);

                // Notifier le client SMS + in-app (Req 2.7)
                $this->notifierClientAcceptation($reservation);

                // Journaliser la décision
                $this->journaliserDecision($reservation, $decision, $this->dureeMs($debut));

            } else {
                // ── Rejet automatique ─────────────────────────────────────────
                $raisonRejet = $this->construireRaisonRejet($scoreOk, $disponibleOk, $zoneOk, $sansCconflit, $scoreArtisan, $scoreMinimum, $distance, $zoneKmMaximum);

                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        $raisonRejet,
                    score_confiance:               $scoreArtisan,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               $reglesEvaluees,
                );

                // Notifier l'artisan SMS + in-app pour traitement manuel (Req 2.3)
                $this->notifierArtisanRejet($reservation);

                // Journaliser la décision avec decision='rejetee'
                $this->journaliserDecision($reservation, $decision, $this->dureeMs($debut));
            }

        } catch (\Throwable $e) {
            // ── Gestion des exceptions (Req 2.5) ─────────────────────────────
            Log::error('ReservationAutoAcceptListener: exception technique', [
                'reservation_id' => $reservation->id ?? null,
                'error'          => $e->getMessage(),
                'trace'          => $e->getTraceAsString(),
            ]);

            // Journaliser decision='escaladee'
            $decisionEscaladee = new AutoDecision(
                approuvee:                     false,
                raison:                        "Exception technique : {$e->getMessage()}",
                score_confiance:               0.0,
                necessite_intervention_humaine: true,
                regles_evaluees:               [],
            );
            $this->journaliserDecision($reservation, $decisionEscaladee, $this->dureeMs($debut));

            // Notification artisan dans 30 min (Req 2.5) — job différé
            $this->planifierNotificationArtisanEscalade($reservation);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Méthodes de vérification privées
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Vérifie que le score de confiance de l'artisan est ≥ au seuil minimum.
     *
     * @param  Reservation  $reservation   Réservation à évaluer
     * @param  float        $scoreMinimum  Seuil minimum (depuis AutomationConfigService)
     * @return bool
     */
    private function verifierScoreMinimum(Reservation $reservation, float $scoreMinimum): bool
    {
        $artisan = $reservation->artisan;

        if ($artisan === null) {
            return false;
        }

        $scoreArtisan = (float) ($artisan->score_confiance ?? 0);

        return $scoreArtisan >= $scoreMinimum;
    }

    /**
     * Vérifie la disponibilité de l'artisan sur le créneau de la réservation.
     *
     * Contrôle les réservations existantes en statuts actifs pour détecter
     * tout chevauchement de créneau. Si la réservation n'a pas de date_debut,
     * on retourne true par défaut (bénéfice du doute).
     *
     * @param  Reservation  $reservation
     * @return bool
     */
    private function verifierDisponibilite(Reservation $reservation): bool
    {
        $artisan = $reservation->artisan;

        if ($artisan === null) {
            return false;
        }

        $dateDebut = $reservation->date_debut;
        $dateFin   = $reservation->date_fin;

        // Sans dates précises, on ne peut pas vérifier la disponibilité
        // → considérer disponible (autres critères prendront le relais)
        if ($dateDebut === null) {
            return true;
        }

        // Vérifier les réservations actives chevauchantes (excluant la réservation courante)
        $statutsActifs = ['en_cours', 'en_cours_mission', 'acceptee'];

        $query = $artisan->reservations()
            ->whereIn('statut', $statutsActifs)
            ->where('id', '!=', $reservation->id);

        if ($dateFin !== null) {
            // Chevauchement : une réservation existante chevauche si
            // son début est avant la fin de la nouvelle ET sa fin est après le début de la nouvelle
            $query->where(function ($q) use ($dateDebut, $dateFin) {
                $q->where(function ($inner) use ($dateDebut, $dateFin) {
                    $inner->where('date_debut', '<', $dateFin)
                          ->where(function ($sub) use ($dateDebut) {
                              $sub->whereNull('date_fin')
                                  ->orWhere('date_fin', '>', $dateDebut);
                          });
                });
            });
        } else {
            // Pas de date_fin : vérifier les chevauchements sur la même date_debut
            $query->whereDate('date_debut', '=', $dateDebut->toDateString());
        }

        return $query->doesntExist();
    }

    /**
     * Vérifie que la distance Haversine entre le client et l'artisan
     * est ≤ auto_accept_zone_km_maximum.
     *
     * Si les coordonnées GPS du client ou de l'artisan sont manquantes,
     * on retourne true pour ne pas bloquer sur ce critère seul (Req 2.2 note GPS).
     *
     * @param  Reservation  $reservation   Réservation portant latitude_client / longitude_client
     * @param  float        $zoneKmMax     Distance maximum en km
     * @return bool
     */
    private function verifierZoneGeographique(Reservation $reservation, float $zoneKmMax): bool
    {
        $latClient = $reservation->latitude_client;
        $lonClient = $reservation->longitude_client;

        $artisan = $reservation->artisan;
        $latArtisan = $artisan ? (float) $artisan->latitude : null;
        $lonArtisan = $artisan ? (float) $artisan->longitude : null;

        // Si l'un ou l'autre n'a pas de coordonnées GPS, ne pas bloquer sur ce critère
        if ($latClient === null || $lonClient === null || ! $latArtisan || ! $lonArtisan) {
            return true;
        }

        $distance = $this->haversine(
            (float) $latClient,
            (float) $lonClient,
            $latArtisan,
            $lonArtisan
        );

        return $distance <= $zoneKmMax;
    }

    /**
     * Vérifie l'absence de réservation conflictuelle pour l'artisan
     * (statut en_cours ou en_cours_mission chevauchant le nouveau créneau).
     *
     * Req 2.4 : vérification strictement sur les statuts en_cours et en_cours_mission.
     *
     * @param  Reservation  $reservation
     * @return bool  true = aucun conflit, false = conflit détecté
     */
    private function verifierAbsenceConflit(Reservation $reservation): bool
    {
        $artisan = $reservation->artisan;

        if ($artisan === null) {
            return true; // Pas d'artisan = pas de conflit possible
        }

        $dateDebut = $reservation->date_debut;
        $dateFin   = $reservation->date_fin;

        // Sans date_debut, impossible de vérifier un conflit → pas de conflit
        if ($dateDebut === null) {
            return true;
        }

        // Statuts qui indiquent une mission active bloquante (Req 2.4)
        $statutsBloquants = ['en_cours', 'en_cours_mission'];

        $query = $artisan->reservations()
            ->whereIn('statut', $statutsBloquants)
            ->where('id', '!=', $reservation->id);

        if ($dateFin !== null) {
            $query->where(function ($q) use ($dateDebut, $dateFin) {
                $q->where('date_debut', '<', $dateFin)
                  ->where(function ($sub) use ($dateDebut) {
                      $sub->whereNull('date_fin')
                          ->orWhere('date_fin', '>', $dateDebut);
                  });
            });
        } else {
            $query->whereDate('date_debut', '=', $dateDebut->toDateString());
        }

        return $query->doesntExist();
    }

    /**
     * Formule de Haversine — calcule la distance en km entre deux coordonnées GPS.
     *
     * @param  float  $lat1  Latitude du point 1 (degrés décimaux)
     * @param  float  $lon1  Longitude du point 1 (degrés décimaux)
     * @param  float  $lat2  Latitude du point 2 (degrés décimaux)
     * @param  float  $lon2  Longitude du point 2 (degrés décimaux)
     * @return float         Distance en kilomètres
     */
    private function haversine(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $rayonTerreMkm = 6371.0;

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        $c = 2 * asin(sqrt($a));

        return $rayonTerreMkm * $c;
    }

    /**
     * Journalise une décision dans automation_logs (Req 1.5).
     *
     * Détermine automatiquement la valeur enum decision :
     * - approuvee  : approuvee = true ET necessite_intervention_humaine = false
     * - rejetee    : approuvee = false ET necessite_intervention_humaine = false (critères non remplis)
     * - escaladee  : approuvee = false ET necessite_intervention_humaine = true (exception)
     *
     * @param  Reservation  $reservation
     * @param  AutoDecision $decision
     * @param  int          $dureeMs
     */
    private function journaliserDecision(Reservation $reservation, AutoDecision $decision, int $dureeMs): void
    {
        try {
            $decisionEnum = match (true) {
                $decision->approuvee && ! $decision->necessite_intervention_humaine  => 'approuvee',
                ! $decision->approuvee && $decision->necessite_intervention_humaine  => 'escaladee',
                default                                                              => 'rejetee',
            };

            AutomationLog::create([
                'type_action'     => 'auto_accept',
                'model_type'      => Reservation::class,
                'model_id'        => $reservation->id ?? 0,
                'decision'        => $decisionEnum,
                'score_confiance' => max(0.0, min(100.0, $decision->score_confiance ?? 0.0)),
                'regles_evaluees' => $decision->regles_evaluees ?? [],
                'raison'          => $decision->raison ?: '',
                'duree_ms'        => max(0, $dureeMs),
            ]);
        } catch (\Throwable $e) {
            Log::error('ReservationAutoAcceptListener: échec journalisation', [
                'reservation_id' => $reservation->id ?? null,
                'error'          => $e->getMessage(),
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Méthodes de notification
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Notifie le client par SMS + in-app que sa réservation est acceptée automatiquement.
     * Req 2.7
     *
     * @param  Reservation  $reservation
     */
    private function notifierClientAcceptation(Reservation $reservation): void
    {
        try {
            $clientUser = $reservation->client?->user;

            if (! $clientUser) {
                return;
            }

            $artisanNom = $reservation->artisan?->user
                ? trim(($reservation->artisan->user->prenom ?? '') . ' ' . ($reservation->artisan->user->nom ?? ''))
                : 'votre artisan';

            $message = "ArtisanPro : Votre réservation #{$reservation->id} avec {$artisanNom} a été acceptée automatiquement. Vous recevrez bientôt un devis.";

            // Notification in-app + SMS via NotificationService (Req 2.7)
            $this->notificationService->notifierAvecCanaux(
                $clientUser,
                'Réservation acceptée',
                $message,
                [
                    'type'        => 'reservation',
                    'sms_message' => $message,
                ]
            );
        } catch (\Throwable $e) {
            Log::warning('ReservationAutoAcceptListener: échec notification client', [
                'reservation_id' => $reservation->id ?? null,
                'error'          => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notifie l'artisan par SMS + in-app qu'une nouvelle demande nécessite son attention.
     * Req 2.3
     *
     * @param  Reservation  $reservation
     */
    private function notifierArtisanRejet(Reservation $reservation): void
    {
        try {
            $artisanUser = $reservation->artisan?->user;

            if (! $artisanUser) {
                return;
            }

            $clientNom = $reservation->client?->user
                ? trim(($reservation->client->user->prenom ?? '') . ' ' . ($reservation->client->user->nom ?? ''))
                : 'un client';

            $date = $reservation->date_debut
                ? $reservation->date_debut->format('d/m/Y à H:i')
                : ($reservation->date?->format('d/m/Y') ?? 'date à confirmer');

            $message = "ArtisanPro : Nouvelle demande #{$reservation->id} de {$clientNom} pour le {$date}. Connectez-vous pour accepter ou refuser.";

            // Notification in-app + SMS via NotificationService (Req 2.3)
            $this->notificationService->notifierAvecCanaux(
                $artisanUser,
                'Nouvelle demande de réservation',
                $message,
                [
                    'type'        => 'reservation',
                    'sms_message' => $message,
                ]
            );
        } catch (\Throwable $e) {
            Log::warning('ReservationAutoAcceptListener: échec notification artisan rejet', [
                'reservation_id' => $reservation->id ?? null,
                'error'          => $e->getMessage(),
            ]);
        }
    }

    /**
     * Planifie une notification à l'artisan dans 30 minutes en cas d'exception (Req 2.5).
     * Utilise un job différé si disponible, sinon tente une notification immédiate.
     *
     * @param  Reservation  $reservation
     */
    private function planifierNotificationArtisanEscalade(Reservation $reservation): void
    {
        try {
            $artisanUser = $reservation->artisan?->user;

            if (! $artisanUser) {
                return;
            }

            $message = "ArtisanPro : La réservation #{$reservation->id} n'a pas pu être traitée automatiquement. Connectez-vous pour l'accepter ou la refuser.";

            // Dispatch différé de 30 minutes via un job anonyme (Req 2.5)
            dispatch(function () use ($artisanUser, $message, $reservation): void {
                try {
                    app(NotificationService::class)->notifierAvecCanaux(
                        $artisanUser,
                        'Action requise sur réservation',
                        $message,
                        [
                            'type'        => 'reservation',
                            'sms_message' => $message,
                        ]
                    );
                } catch (\Throwable $e) {
                    Log::warning('ReservationAutoAcceptListener: échec notification escalade différée', [
                        'reservation_id' => $reservation->id ?? null,
                        'error'          => $e->getMessage(),
                    ]);
                }
            })->delay(now()->addMinutes(30));

        } catch (\Throwable $e) {
            Log::warning('ReservationAutoAcceptListener: échec planification notification escalade', [
                'reservation_id' => $reservation->id ?? null,
                'error'          => $e->getMessage(),
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Calcule la durée en millisecondes depuis un timestamp microtime.
     *
     * @param  float  $debut  Résultat de microtime(true) au départ
     * @return int            Durée en millisecondes (≥ 0)
     */
    private function dureeMs(float $debut): int
    {
        return max(0, (int) round((microtime(true) - $debut) * 1000));
    }

    /**
     * Calcule la distance (km) entre client et artisan pour la journalisation.
     * Retourne null si les coordonnées sont manquantes.
     *
     * @param  Reservation  $reservation
     * @return float|null
     */
    private function calculerDistance(Reservation $reservation): ?float
    {
        $latClient  = $reservation->latitude_client;
        $lonClient  = $reservation->longitude_client;
        $artisan    = $reservation->artisan;
        $latArtisan = $artisan ? (float) $artisan->latitude : null;
        $lonArtisan = $artisan ? (float) $artisan->longitude : null;

        if ($latClient === null || $lonClient === null || ! $latArtisan || ! $lonArtisan) {
            return null;
        }

        return $this->haversine(
            (float) $latClient,
            (float) $lonClient,
            $latArtisan,
            $lonArtisan
        );
    }

    /**
     * Construit un message de raison de rejet lisible.
     *
     * @param  bool       $scoreOk
     * @param  bool       $disponibleOk
     * @param  bool       $zoneOk
     * @param  bool       $sansCconflit
     * @param  float      $scoreArtisan
     * @param  float      $scoreMinimum
     * @param  float|null $distance
     * @param  float      $zoneKmMax
     * @return string
     */
    private function construireRaisonRejet(
        bool $scoreOk,
        bool $disponibleOk,
        bool $zoneOk,
        bool $sansCconflit,
        float $scoreArtisan,
        float $scoreMinimum,
        ?float $distance,
        float $zoneKmMax
    ): string {
        $raisons = [];

        if (! $scoreOk) {
            $raisons[] = "score artisan ({$scoreArtisan}) inférieur au seuil requis ({$scoreMinimum})";
        }

        if (! $disponibleOk) {
            $raisons[] = 'artisan non disponible sur le créneau demandé';
        }

        if (! $zoneOk) {
            $distanceFormatee = $distance !== null ? round($distance, 1) . 'km' : 'inconnue';
            $raisons[] = "distance ({$distanceFormatee}) supérieure à la zone maximale ({$zoneKmMax}km)";
        }

        if (! $sansCconflit) {
            $raisons[] = 'réservation conflictuelle existante sur le créneau';
        }

        return 'Rejet automatique : ' . implode(', ', $raisons) . '.';
    }
}
