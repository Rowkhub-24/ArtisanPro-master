<?php

namespace App\Services;

use App\Contracts\ContratServiceInterface;
use App\Contracts\PdfGeneratorServiceInterface;
use App\Models\Contrat;
use App\Models\Notification;
use App\Models\Reservation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ContratService
 *
 * Orchestrateur principal du cycle de vie des contrats de prestation.
 * Responsable de la création idempotente, de la numérotation séquentielle,
 * de la génération du brouillon PDF et des notifications in-app.
 */
class ContratService implements ContratServiceInterface
{
    public function __construct(
        private readonly PdfGeneratorServiceInterface $pdfGenerator,
    ) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Interface publique
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Crée un contrat à partir d'une réservation confirmée.
     *
     * Idempotent : retourne le contrat existant si un contrat est déjà
     * associé à cette réservation.
     *
     * @param  Reservation  $reservation  La réservation confirmée source du contrat.
     * @return Contrat                    Le contrat créé ou existant.
     */
    public function creerDepuisReservation(Reservation $reservation): Contrat
    {
        // ── Idempotence ──────────────────────────────────────────────────────
        $contratExistant = Contrat::where('id_reservation', $reservation->id)->first();
        if ($contratExistant !== null) {
            return $contratExistant;
        }

        try {
            // ── Création en transaction avec verrouillage pour unicité ───────
            $contrat = DB::transaction(function () use ($reservation): Contrat {
                // Générer le numéro séquentiel unique sous verrou
                $numeroContrat = $this->genererNumero();

                // Snapshot des données de la réservation
                $nomClient  = $this->resolveNomClient($reservation);
                $nomArtisan = $this->resolveNomArtisan($reservation);

                return Contrat::create([
                    'id_reservation'        => $reservation->id,
                    'id_client'             => $reservation->id_client,
                    'id_artisan'            => $reservation->id_artisan,
                    'numero_contrat'        => $numeroContrat,
                    'nom_client'            => $nomClient,
                    'nom_artisan'           => $nomArtisan,
                    'description_prestation'=> $reservation->description_besoin ?? '',
                    'montant_total'         => $reservation->montant_total ?? 0,
                    'date_debut_prestation' => $reservation->date_debut ?? $reservation->date,
                    'date_fin_prestation'   => $reservation->date_fin,
                    'adresse_intervention'  => $reservation->adresse_intervention,
                    'statut'                => Contrat::STATUT_GENERE,
                    'clauses_litige'        => $this->clausesLitigeParDefaut(),
                    'genere_at'             => now(),
                ]);
            });

            // ── Génération du brouillon PDF ──────────────────────────────────
            try {
                $cheminBrouillon = $this->pdfGenerator->genererBrouillon($contrat);
                $contrat->update(['chemin_pdf_brouillon' => $cheminBrouillon]);
            } catch (\Throwable $e) {
                Log::error('ContratService: échec génération brouillon PDF', [
                    'contrat_id'     => $contrat->id,
                    'reservation_id' => $reservation->id,
                    'error'          => $e->getMessage(),
                ]);
                // On conserve statut = 'genere', pas de propagation
            }

            // ── Notifications in-app ─────────────────────────────────────────
            $this->creerNotifications($contrat, $reservation);

            return $contrat;

        } catch (\Throwable $e) {
            Log::error('ContratService: échec création contrat', [
                'reservation_id' => $reservation->id,
                'error'          => $e->getMessage(),
                'trace'          => $e->getTraceAsString(),
            ]);

            // Retourner le contrat s'il a quand même été créé (ex. exception post-commit)
            $contratCreee = Contrat::where('id_reservation', $reservation->id)->first();
            if ($contratCreee !== null) {
                return $contratCreee;
            }

            throw $e;
        }
    }

    /**
     * Récupère le contrat associé à une réservation donnée.
     *
     * @param  int       $reservationId  L'identifiant de la réservation.
     * @return Contrat|null              Le contrat trouvé, ou null si inexistant.
     */
    public function getContratPourReservation(int $reservationId): ?Contrat
    {
        return Contrat::where('id_reservation', $reservationId)->first();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Méthodes privées
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Génère un numéro de contrat unique au format CP-AAAA-NNNNN.
     *
     * Doit être appelé à l'intérieur d'une DB::transaction avec lockForUpdate
     * pour garantir l'unicité sous charge concurrente.
     * Le compteur est remis à 1 à chaque nouvelle année calendaire.
     *
     * @return string  Ex. "CP-2025-00001"
     */
    private function genererNumero(): string
    {
        $annee = now()->year;

        // Verrouiller la ligne pour éviter les races conditions
        $dernierContrat = Contrat::whereYear('genere_at', $annee)
            ->lockForUpdate()
            ->orderByDesc('id')
            ->first();

        if ($dernierContrat === null) {
            $prochain = 1;
        } else {
            // Extraire le numéro séquentiel depuis le numero_contrat existant
            $parties = explode('-', $dernierContrat->numero_contrat);
            $prochain = ((int) end($parties)) + 1;
        }

        return sprintf('CP-%d-%05d', $annee, $prochain);
    }

    /**
     * Retourne les quatre clauses de litige prédéfinies de la plateforme.
     *
     * @return array<int, array{id: string, titre: string, contenu: string}>
     */
    private function clausesLitigeParDefaut(): array
    {
        return [
            [
                'id'      => 'delai_reclamation',
                'titre'   => 'Délai de réclamation',
                'contenu' => 'Toute réclamation doit être soumise dans un délai de 7 jours suivant la fin de la prestation.',
            ],
            [
                'id'      => 'motifs_litige',
                'titre'   => 'Motifs de litige acceptés',
                'contenu' => 'Les motifs acceptés sont : travaux non réalisés, qualité insuffisante, désaccord tarifaire.',
            ],
            [
                'id'      => 'mediation',
                'titre'   => 'Médiation ArtisanPro',
                'contenu' => 'En cas de désaccord, les parties acceptent la médiation par l\'équipe ArtisanPro comme première étape obligatoire.',
            ],
            [
                'id'      => 'arbitrage_fonds',
                'titre'   => 'Gestion des fonds en litige',
                'contenu' => 'Les fonds placés en séquestre restent gelés jusqu\'à décision de l\'administrateur ArtisanPro.',
            ],
        ];
    }

    /**
     * Crée les notifications in-app pour le client et l'artisan.
     */
    private function creerNotifications(Contrat $contrat, Reservation $reservation): void
    {
        $message = "Votre contrat {$contrat->numero_contrat} est disponible pour signature.";

        // Notification au client
        try {
            $idUtilisateurClient = $reservation->client?->user?->id
                ?? $reservation->client?->id_utilisateur;

            if ($idUtilisateurClient !== null) {
                Notification::notifier($idUtilisateurClient, $message, 'contrat');
            }
        } catch (\Throwable $e) {
            Log::warning('ContratService: impossible d\'envoyer la notification client', [
                'contrat_id' => $contrat->id,
                'error'      => $e->getMessage(),
            ]);
        }

        // Notification à l'artisan
        try {
            $idUtilisateurArtisan = $reservation->artisan?->user?->id
                ?? $reservation->artisan?->id_utilisateur;

            if ($idUtilisateurArtisan !== null) {
                Notification::notifier($idUtilisateurArtisan, $message, 'contrat');
            }
        } catch (\Throwable $e) {
            Log::warning('ContratService: impossible d\'envoyer la notification artisan', [
                'contrat_id' => $contrat->id,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    /**
     * Résout le nom complet du client depuis la réservation.
     */
    private function resolveNomClient(Reservation $reservation): string
    {
        $user = $reservation->client?->user;
        if ($user !== null) {
            return trim(($user->prenom ?? '') . ' ' . ($user->nom ?? '')) ?: ($user->name ?? 'Client');
        }

        return 'Client';
    }

    /**
     * Résout le nom complet de l'artisan depuis la réservation.
     */
    private function resolveNomArtisan(Reservation $reservation): string
    {
        $user = $reservation->artisan?->user;
        if ($user !== null) {
            return trim(($user->prenom ?? '') . ' ' . ($user->nom ?? '')) ?: ($user->name ?? 'Artisan');
        }

        return 'Artisan';
    }
}
