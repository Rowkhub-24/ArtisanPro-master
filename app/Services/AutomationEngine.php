<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AutomationLog;
use App\Models\Devis;
use App\Models\Litige;
use App\Models\Reservation;
use App\ValueObjects\AutoDecision;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Coordinateur central de toutes les décisions d'automatisation.
 *
 * Chaque méthode publique est encapsulée dans un try/catch :
 * en cas d'exception → log avec decision='escaladee' + notification admin.
 *
 * Rate limiting Redis : 3 tentatives / artisan / 60 min (Req 2.6, 10.6)
 * Désactivation globale : aucune décision approuvee émise (Req 7.4)
 * Artisan désactivé : AutoDecision(approuvee: false, necessite_intervention_humaine: true) (Req 1.6, 10.5)
 *
 * Implements: Requirements 1.5, 1.6, 2.6, 7.1, 7.4, 10.5, 10.6
 */
class AutomationEngine
{
    /** Nombre maximum de tentatives d'évaluation par artisan par fenêtre de 60 min */
    private const RATE_LIMIT_MAX = 3;

    /** Durée de la fenêtre de rate limiting en secondes (60 minutes) */
    private const RATE_LIMIT_TTL = 3600;

    public function __construct(
        private readonly AutomationConfigService $configService,
        private readonly SmsNotificationService  $smsService,
        private readonly NotificationService     $notificationService,
    ) {}

    // ── Méthodes publiques ────────────────────────────────────────────────────

    /**
     * Évalue si une réservation peut être acceptée automatiquement.
     *
     * Vérifie le rate limiting, l'état global du moteur, le statut de l'artisan,
     * puis délègue l'évaluation détaillée au ReservationAutoAcceptListener.
     *
     * @param  Reservation  $reservation  Réservation à évaluer
     * @return AutoDecision               Décision d'automatisation
     */
    public function evaluerAcceptationAuto(Reservation $reservation): AutoDecision
    {
        $debut = microtime(true);

        try {
            // Vérification désactivation globale (Req 7.4)
            if ($this->estDesactiveGlobalement()) {
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        'AutomationEngine désactivé globalement.',
                    score_confiance:               0.0,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               [['cle' => 'automation_engine_enabled', 'valeur_attendue' => true, 'valeur_reelle' => false, 'resultat' => false]],
                );
                $this->journaliser('auto_accept', $reservation, $decision, $this->dureeMs($debut));
                return $decision;
            }

            $artisan = $reservation->artisan;

            // Vérification artisan désactivé (Req 1.6, 10.5)
            if ($artisan && $this->estArtisanDesactive($artisan->id)) {
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        "Automatisation désactivée pour l'artisan #{$artisan->id}.",
                    score_confiance:               0.0,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               [['cle' => "artisan_{$artisan->id}_automation_disabled", 'valeur_attendue' => false, 'valeur_reelle' => true, 'resultat' => false]],
                );
                $this->journaliser('auto_accept', $reservation, $decision, $this->dureeMs($debut));
                return $decision;
            }

            // Vérification rate limiting (Req 2.6, 10.6)
            if ($artisan && $this->rateLimitAtteint($artisan->id)) {
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        "Rate limit atteint pour l'artisan #{$artisan->id} (max " . self::RATE_LIMIT_MAX . " tentatives/heure).",
                    score_confiance:               0.0,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               [['cle' => 'rate_limit', 'valeur_attendue' => '<=' . self::RATE_LIMIT_MAX, 'valeur_reelle' => '>' . self::RATE_LIMIT_MAX, 'resultat' => false]],
                );
                $this->journaliser('rate_limit_exceeded', $reservation, $decision, $this->dureeMs($debut));
                return $decision;
            }

            // Incrémenter le compteur de tentatives
            if ($artisan) {
                $this->incrementerCompteurRateLimit($artisan->id);
            }

            // Évaluation des critères d'acceptation
            $scoreMinimum = (float) $this->configService->getRegle('auto_accept_score_minimum', 70);
            $scoreArtisan = (float) ($artisan?->score_confiance ?? 0);

            $reglesEvaluees = [
                ['cle' => 'auto_accept_score_minimum', 'valeur_attendue' => ">={$scoreMinimum}", 'valeur_reelle' => $scoreArtisan, 'resultat' => $scoreArtisan >= $scoreMinimum],
            ];

            $approuvee = $scoreArtisan >= $scoreMinimum;

            $decision = new AutoDecision(
                approuvee:                     $approuvee,
                raison:                        $approuvee
                    ? "Score artisan ({$scoreArtisan}) supérieur ou égal au seuil ({$scoreMinimum})."
                    : "Score artisan ({$scoreArtisan}) inférieur au seuil requis ({$scoreMinimum}).",
                score_confiance:               $scoreArtisan,
                necessite_intervention_humaine: ! $approuvee,
                regles_evaluees:               $reglesEvaluees,
            );

            $this->journaliser('auto_accept', $reservation, $decision, $this->dureeMs($debut));
            return $decision;

        } catch (\Throwable $e) {
            return $this->gererException($e, 'auto_accept', $reservation, $debut);
        }
    }

    /**
     * Génère un devis automatiquement pour une réservation.
     *
     * @param  Reservation  $reservation  Réservation pour laquelle générer le devis
     * @return Devis|null                  Devis généré ou null si la génération a échoué
     */
    public function genererDevisAuto(Reservation $reservation): ?Devis
    {
        $debut = microtime(true);

        try {
            // Vérification désactivation globale (Req 7.4)
            if ($this->estDesactiveGlobalement()) {
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        'AutomationEngine désactivé globalement.',
                    score_confiance:               0.0,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               [['cle' => 'automation_engine_enabled', 'valeur_attendue' => true, 'valeur_reelle' => false, 'resultat' => false]],
                );
                $this->journaliser('auto_devis', $reservation, $decision, $this->dureeMs($debut));
                return null;
            }

            $artisan = $reservation->artisan;

            // Vérification artisan désactivé (Req 1.6, 10.5)
            if ($artisan && $this->estArtisanDesactive($artisan->id)) {
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        "Automatisation désactivée pour l'artisan #{$artisan->id}.",
                    score_confiance:               0.0,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               [['cle' => "artisan_{$artisan->id}_automation_disabled", 'valeur_attendue' => false, 'valeur_reelle' => true, 'resultat' => false]],
                );
                $this->journaliser('auto_devis', $reservation, $decision, $this->dureeMs($debut));
                return null;
            }

            // Vérification activation devis auto
            $devisEnabled = (bool) $this->configService->getRegle('auto_devis_enabled', true);
            if (! $devisEnabled) {
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        'Génération automatique de devis désactivée.',
                    score_confiance:               0.0,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               [['cle' => 'auto_devis_enabled', 'valeur_attendue' => true, 'valeur_reelle' => false, 'resultat' => false]],
                );
                $this->journaliser('auto_devis', $reservation, $decision, $this->dureeMs($debut));
                return null;
            }

            // La génération réelle du devis est déléguée à DevisAutoGeneratorService
            // AutomationEngine agit ici comme coordinateur uniquement
            $decision = new AutoDecision(
                approuvee:                     true,
                raison:                        'Critères de génération de devis automatique satisfaits.',
                score_confiance:               100.0,
                necessite_intervention_humaine: false,
                regles_evaluees:               [['cle' => 'auto_devis_enabled', 'valeur_attendue' => true, 'valeur_reelle' => true, 'resultat' => true]],
            );
            $this->journaliser('auto_devis', $reservation, $decision, $this->dureeMs($debut));
            return null; // La création effective du Devis est faite par DevisAutoGeneratorService

        } catch (\Throwable $e) {
            $this->gererException($e, 'auto_devis', $reservation, $debut);
            return null;
        }
    }

    /**
     * Évalue si un devis peut être validé automatiquement.
     *
     * @param  Devis  $devis  Devis à valider
     * @return AutoDecision   Décision d'automatisation
     */
    public function evaluerValidationDevisAuto(Devis $devis): AutoDecision
    {
        $debut = microtime(true);

        try {
            // Vérification désactivation globale (Req 7.4)
            if ($this->estDesactiveGlobalement()) {
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        'AutomationEngine désactivé globalement.',
                    score_confiance:               0.0,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               [['cle' => 'automation_engine_enabled', 'valeur_attendue' => true, 'valeur_reelle' => false, 'resultat' => false]],
                );
                $this->journaliser('auto_validate_devis', $devis, $decision, $this->dureeMs($debut));
                return $decision;
            }

            $artisan = $devis->artisan;

            // Vérification artisan désactivé (Req 1.6, 10.5)
            if ($artisan && $this->estArtisanDesactive($artisan->id)) {
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        "Automatisation désactivée pour l'artisan #{$artisan->id}.",
                    score_confiance:               0.0,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               [['cle' => "artisan_{$artisan->id}_automation_disabled", 'valeur_attendue' => false, 'valeur_reelle' => true, 'resultat' => false]],
                );
                $this->journaliser('auto_validate_devis', $devis, $decision, $this->dureeMs($debut));
                return $decision;
            }

            $montantMax   = (float) $this->configService->getRegle('auto_validate_devis_montant_max', 50000);
            $scoreMinimum = (float) $this->configService->getRegle('auto_validate_devis_score_minimum', 60);
            $montant      = (float) ($devis->montant_propose ?? 0);
            $scoreArtisan = (float) ($artisan?->score_confiance ?? 0);

            $montantOk = $montant <= $montantMax;
            $scoreOk   = $scoreArtisan >= $scoreMinimum;

            $reglesEvaluees = [
                ['cle' => 'auto_validate_devis_montant_max',     'valeur_attendue' => "<={$montantMax}",   'valeur_reelle' => $montant,      'resultat' => $montantOk],
                ['cle' => 'auto_validate_devis_score_minimum',   'valeur_attendue' => ">={$scoreMinimum}", 'valeur_reelle' => $scoreArtisan, 'resultat' => $scoreOk],
            ];

            $approuvee = $montantOk && $scoreOk;

            $raison = $approuvee
                ? "Devis validé automatiquement (montant: {$montant} ≤ {$montantMax}, score: {$scoreArtisan} ≥ {$scoreMinimum})."
                : "Devis rejeté : " . (! $montantOk ? "montant ({$montant}) dépasse le seuil ({$montantMax}). " : '') . (! $scoreOk ? "score artisan ({$scoreArtisan}) insuffisant (min {$scoreMinimum})." : '');

            $decision = new AutoDecision(
                approuvee:                     $approuvee,
                raison:                        $raison,
                score_confiance:               $scoreArtisan,
                necessite_intervention_humaine: ! $approuvee,
                regles_evaluees:               $reglesEvaluees,
            );

            $this->journaliser('auto_validate_devis', $devis, $decision, $this->dureeMs($debut));
            return $decision;

        } catch (\Throwable $e) {
            return $this->gererException($e, 'auto_validate_devis', $devis, $debut);
        }
    }

    /**
     * Détecte la fin de mission via GPS ou durée.
     *
     * @param  Reservation  $reservation  Réservation en cours de mission
     * @return bool                        true si fin de mission détectée
     */
    public function detecterFinMission(Reservation $reservation): bool
    {
        $debut = microtime(true);

        try {
            // Vérification désactivation globale (Req 7.4)
            if ($this->estDesactiveGlobalement()) {
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        'AutomationEngine désactivé globalement.',
                    score_confiance:               0.0,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               [['cle' => 'automation_engine_enabled', 'valeur_attendue' => true, 'valeur_reelle' => false, 'resultat' => false]],
                );
                $this->journaliser('auto_mission', $reservation, $decision, $this->dureeMs($debut));
                return false;
            }

            $artisan = $reservation->artisan;

            // Vérification artisan désactivé (Req 1.6, 10.5)
            if ($artisan && $this->estArtisanDesactive($artisan->id)) {
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        "Automatisation désactivée pour l'artisan #{$artisan->id}.",
                    score_confiance:               0.0,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               [['cle' => "artisan_{$artisan->id}_automation_disabled", 'valeur_attendue' => false, 'valeur_reelle' => true, 'resultat' => false]],
                );
                $this->journaliser('auto_mission', $reservation, $decision, $this->dureeMs($debut));
                return false;
            }

            // Vérification dépassement de durée estimée
            $timeoutHeures    = (int) $this->configService->getRegle('auto_mission_timeout_heures', 2);
            $dateDebut        = $reservation->date_debut;
            $dureeEstimeeMin  = $reservation->duree_estimee_min ?? 60;

            if ($dateDebut !== null) {
                $finEstimee = $dateDebut->copy()
                    ->addMinutes($dureeEstimeeMin)
                    ->addMinutes(30)    // buffer 30 min
                    ->addHours($timeoutHeures);

                if (now()->greaterThan($finEstimee)) {
                    $decision = new AutoDecision(
                        approuvee:                     true,
                        raison:                        "Fin de mission détectée par dépassement de durée (timeout {$timeoutHeures}h).",
                        score_confiance:               100.0,
                        necessite_intervention_humaine: false,
                        regles_evaluees:               [
                            ['cle' => 'auto_mission_timeout_heures', 'valeur_attendue' => $timeoutHeures, 'valeur_reelle' => $timeoutHeures, 'resultat' => true],
                        ],
                    );
                    $this->journaliser('auto_mission', $reservation, $decision, $this->dureeMs($debut));
                    return true;
                }
            }

            $decision = new AutoDecision(
                approuvee:                     false,
                raison:                        'Durée estimée non dépassée, fin de mission non détectée.',
                score_confiance:               0.0,
                necessite_intervention_humaine: false,
                regles_evaluees:               [],
            );
            $this->journaliser('auto_mission', $reservation, $decision, $this->dureeMs($debut));
            return false;

        } catch (\Throwable $e) {
            $this->gererException($e, 'auto_mission', $reservation, $debut);
            return false;
        }
    }

    /**
     * Résout un litige automatiquement si les règles le permettent.
     *
     * @param  Litige  $litige  Litige à résoudre
     * @return AutoDecision     Décision d'automatisation
     */
    public function resoudreLitigeAuto(Litige $litige): AutoDecision
    {
        $debut = microtime(true);

        try {
            // Vérification désactivation globale (Req 7.4)
            if ($this->estDesactiveGlobalement()) {
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        'AutomationEngine désactivé globalement.',
                    score_confiance:               0.0,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               [['cle' => 'automation_engine_enabled', 'valeur_attendue' => true, 'valeur_reelle' => false, 'resultat' => false]],
                );
                $this->journaliser('auto_litige', $litige, $decision, $this->dureeMs($debut));
                return $decision;
            }

            $artisan = $litige->artisan;

            // Vérification artisan désactivé (Req 1.6, 10.5)
            if ($artisan && $this->estArtisanDesactive($artisan->id)) {
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        "Automatisation désactivée pour l'artisan #{$artisan->id}.",
                    score_confiance:               0.0,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               [['cle' => "artisan_{$artisan->id}_automation_disabled", 'valeur_attendue' => false, 'valeur_reelle' => true, 'resultat' => false]],
                );
                $this->journaliser('auto_litige', $litige, $decision, $this->dureeMs($debut));
                return $decision;
            }

            // Évaluation des règles de résolution
            $seuilMicro = (float) $this->configService->getRegle('auto_litige_seuil_micro', 5000);
            $reservation = $litige->reservation;
            $montant = (float) ($reservation?->montant_total ?? 0);

            $reglesEvaluees = [
                ['cle' => 'auto_litige_seuil_micro', 'valeur_attendue' => "<{$seuilMicro}", 'valeur_reelle' => $montant, 'resultat' => $montant < $seuilMicro],
            ];

            // Règle micro-litige (Req 6.5)
            if ($montant < $seuilMicro) {
                $decision = new AutoDecision(
                    approuvee:                     true,
                    raison:                        "Montant ({$montant} FCFA) inférieur au seuil micro ({$seuilMicro} FCFA). Remboursement automatique.",
                    score_confiance:               100.0,
                    necessite_intervention_humaine: false,
                    regles_evaluees:               $reglesEvaluees,
                );
                $this->journaliser('auto_litige', $litige, $decision, $this->dureeMs($debut));
                return $decision;
            }

            // Score GPS disponible
            $scoreGps = $litige->score_preuve_gps;

            if ($scoreGps === null) {
                // Pas de données GPS → escalade (Req 6.7)
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        'Aucune donnée GPS disponible pour évaluer la présence de l\'artisan. Escalade admin.',
                    score_confiance:               0.0,
                    necessite_intervention_humaine: true,
                    regles_evaluees:               array_merge($reglesEvaluees, [['cle' => 'score_preuve_gps', 'valeur_attendue' => 'non null', 'valeur_reelle' => null, 'resultat' => false]]),
                );
                $this->journaliser('auto_litige', $litige, $decision, $this->dureeMs($debut));
                return $decision;
            }

            $reglesEvaluees[] = ['cle' => 'score_preuve_gps', 'valeur_attendue' => '0 ou 1', 'valeur_reelle' => $scoreGps, 'resultat' => $scoreGps == 0.0 || $scoreGps == 1.0];

            if ($scoreGps == 0.0) {
                // Artisan absent → remboursement client (Req 6.2)
                $decision = new AutoDecision(
                    approuvee:                     true,
                    raison:                        'Score GPS = 0 : artisan absent de la zone. Remboursement client.',
                    score_confiance:               100.0,
                    necessite_intervention_humaine: false,
                    regles_evaluees:               $reglesEvaluees,
                );
            } elseif ($scoreGps == 1.0) {
                // Artisan présent toute la mission → libération fonds (Req 6.3)
                $decision = new AutoDecision(
                    approuvee:                     true,
                    raison:                        'Score GPS = 1 : artisan présent toute la mission. Libération fonds artisan.',
                    score_confiance:               100.0,
                    necessite_intervention_humaine: false,
                    regles_evaluees:               $reglesEvaluees,
                );
            } else {
                // Score ambigu → escalade (Req 6.6)
                $decision = new AutoDecision(
                    approuvee:                     false,
                    raison:                        "Score GPS ambigu ({$scoreGps}). Escalade admin requise.",
                    score_confiance:               (float) ($scoreGps * 100),
                    necessite_intervention_humaine: true,
                    regles_evaluees:               $reglesEvaluees,
                );
            }

            $this->journaliser('auto_litige', $litige, $decision, $this->dureeMs($debut));
            return $decision;

        } catch (\Throwable $e) {
            return $this->gererException($e, 'auto_litige', $litige, $debut);
        }
    }

    // ── Méthodes privées ─────────────────────────────────────────────────────

    /**
     * Journalise une décision dans automation_logs avec substitution des valeurs null (Req 1.5).
     *
     * Champs requis non nulls :
     * - type_action : string non vide (défaut : 'unknown')
     * - model_type  : FQCN du modèle (défaut : '')
     * - model_id    : identifiant du modèle (défaut : 0)
     * - decision    : 'approuvee'|'rejetee'|'escaladee' (défaut : 'escaladee')
     * - score_confiance : float [0, 100] (défaut : 0.0)
     * - regles_evaluees : array (défaut : [])
     * - raison      : string (défaut : '')
     * - duree_ms    : integer ≥ 0 (défaut : 0)
     *
     * @param  string       $typeAction  Type d'action ('auto_accept', 'auto_devis', etc.)
     * @param  Model        $model       Modèle cible (Reservation, Devis, Litige)
     * @param  AutoDecision $decision    Décision émise
     * @param  int          $dureeMs     Durée d'évaluation en millisecondes
     */
    private function journaliser(
        string $typeAction,
        Model $model,
        AutoDecision $decision,
        int $dureeMs
    ): void {
        try {
            // Déterminer la valeur enum 'decision'
            $decisionEnum = match (true) {
                $decision->approuvee && ! $decision->necessite_intervention_humaine => 'approuvee',
                ! $decision->approuvee && ! $decision->necessite_intervention_humaine => 'rejetee',
                default => 'escaladee',
            };

            AutomationLog::create([
                // Substituer valeurs par défaut pour champs potentiellement null (Req 1.5)
                'type_action'     => $typeAction ?: 'unknown',
                'model_type'      => get_class($model) ?: '',
                'model_id'        => $model->getKey() ?? 0,
                'decision'        => $decisionEnum,
                'score_confiance' => $decision->score_confiance ?? 0.0,
                'regles_evaluees' => $decision->regles_evaluees ?? [],
                'raison'          => $decision->raison ?: '',
                'duree_ms'        => $dureeMs >= 0 ? $dureeMs : 0,
            ]);
        } catch (\Throwable $e) {
            // Log d'urgence si la persistance échoue — ne pas bloquer le flux
            Log::error('AutomationEngine: échec de journalisation', [
                'type_action' => $typeAction,
                'model'       => get_class($model),
                'model_id'    => $model->getKey(),
                'error'       => $e->getMessage(),
            ]);
        }
    }

    /**
     * Gère une exception en journalisant et notifiant l'admin.
     * Retourne toujours une AutoDecision avec decision='escaladee'.
     *
     * @template T of AutoDecision|bool
     * @param  \Throwable  $e          Exception capturée
     * @param  string      $typeAction Type d'action en cours
     * @param  Model       $model      Modèle cible
     * @param  float       $debut      Timestamp de début (microtime)
     * @return AutoDecision            Décision escaladée
     */
    private function gererException(\Throwable $e, string $typeAction, Model $model, float $debut): AutoDecision
    {
        Log::error("AutomationEngine: exception dans {$typeAction}", [
            'model'    => get_class($model),
            'model_id' => $model->getKey(),
            'error'    => $e->getMessage(),
            'trace'    => $e->getTraceAsString(),
        ]);

        $decision = new AutoDecision(
            approuvee:                     false,
            raison:                        "Exception technique : {$e->getMessage()}",
            score_confiance:               0.0,
            necessite_intervention_humaine: true,
            regles_evaluees:               [],
        );

        $this->journaliser($typeAction, $model, $decision, $this->dureeMs($debut));
        $this->notifierAdminException($typeAction, $model, $e);

        return $decision;
    }

    /**
     * Envoie une notification in-app à l'admin en cas d'exception.
     *
     * @param  string      $typeAction  Type d'action ayant échoué
     * @param  Model       $model       Modèle cible
     * @param  \Throwable  $e           Exception
     */
    private function notifierAdminException(string $typeAction, Model $model, \Throwable $e): void
    {
        try {
            // Notifier tous les admins via les notifications in-app
            $admins = \App\Models\User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                $this->notificationService->notifierAvecCanaux(
                    $admin,
                    'Erreur AutomationEngine',
                    "Erreur dans {$typeAction} pour " . class_basename($model) . " #{$model->getKey()} : {$e->getMessage()}",
                    ['type' => 'automation_error']
                );
            }
        } catch (\Throwable $notifError) {
            Log::error('AutomationEngine: échec notification admin', ['error' => $notifError->getMessage()]);
        }
    }

    /**
     * Vérifie si le moteur d'automatisation est désactivé globalement (Req 7.4).
     *
     * Lit la règle 'automation_engine_enabled' depuis AutomationConfigService.
     * Par défaut, le moteur est actif (retourne false si la clé n'existe pas).
     */
    private function estDesactiveGlobalement(): bool
    {
        $enabled = $this->configService->getRegle('automation_engine_enabled', true);

        // Normaliser la valeur vers un booléen strict
        if (is_string($enabled)) {
            return in_array(strtolower($enabled), ['false', '0', 'off', 'no'], true);
        }

        return ! (bool) $enabled;
    }

    /**
     * Vérifie si l'automatisation est désactivée pour un artisan spécifique (Req 1.6, 10.5).
     *
     * Lit la règle "artisan_{$artisanId}_automation_disabled" dans automation_rules.
     *
     * @param  int   $artisanId  Identifiant de l'artisan
     * @return bool              true si l'artisan est désactivé
     */
    private function estArtisanDesactive(int $artisanId): bool
    {
        $disabled = $this->configService->getRegle("artisan_{$artisanId}_automation_disabled", false);
        return (bool) $disabled;
    }

    /**
     * Vérifie si le rate limit d'un artisan est atteint (Req 2.6, 10.6).
     *
     * Utilise Redis via le cache Laravel avec un compteur à TTL fixe.
     *
     * @param  int   $artisanId  Identifiant de l'artisan
     * @return bool              true si la limite est dépassée
     */
    private function rateLimitAtteint(int $artisanId): bool
    {
        $cle     = $this->cleCacheRateLimit($artisanId);
        $compteur = (int) Cache::get($cle, 0);
        return $compteur >= self::RATE_LIMIT_MAX;
    }

    /**
     * Incrémente le compteur de rate limiting pour un artisan.
     *
     * Si la clé n'existe pas encore, elle est créée avec TTL = RATE_LIMIT_TTL.
     *
     * @param  int  $artisanId  Identifiant de l'artisan
     */
    private function incrementerCompteurRateLimit(int $artisanId): void
    {
        $cle = $this->cleCacheRateLimit($artisanId);

        if (! Cache::has($cle)) {
            Cache::put($cle, 1, self::RATE_LIMIT_TTL);
        } else {
            Cache::increment($cle);
        }
    }

    /**
     * Génère la clé de cache Redis pour le rate limiting d'un artisan.
     *
     * @param  int     $artisanId  Identifiant de l'artisan
     * @return string              Clé de cache
     */
    private function cleCacheRateLimit(int $artisanId): string
    {
        return "automation_rate_limit:artisan:{$artisanId}";
    }

    /**
     * Calcule la durée en millisecondes depuis un timestamp de début.
     *
     * @param  float  $debut  Timestamp retourné par microtime(true)
     * @return int            Durée en millisecondes (≥ 0)
     */
    private function dureeMs(float $debut): int
    {
        return (int) max(0, (microtime(true) - $debut) * 1000);
    }
}
