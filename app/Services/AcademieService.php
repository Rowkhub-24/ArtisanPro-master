<?php

namespace App\Services;

use App\Models\AcademieQuiz;
use App\Models\AcademieParcours;
use App\Models\Artisan;
use Illuminate\Support\Facades\Log;

/**
 * Service de gestion de l'académie de formation pour les artisans.
 *
 * Gère la soumission des quiz et la vérification de la complétion
 * des parcours avec attribution des points bonus.
 */
class AcademieService
{
    /**
     * Soumettre une réponse à un quiz et enregistrer le score dans le pivot artisan_formation.
     *
     * Le score est mis à jour uniquement si la nouvelle valeur est supérieure au score actuel.
     * Le compteur de tentatives est incrémenté à chaque soumission.
     *
     * @param  Artisan      $artisan         L'artisan qui répond au quiz.
     * @param  AcademieQuiz $quiz            Le quiz auquel il répond.
     * @param  int          $reponseChoisie  L'index (0-based) de la réponse choisie.
     * @return array{score: int, correct: bool, bonne_reponse: int}
     */
    public function soumettreQuiz(Artisan $artisan, AcademieQuiz $quiz, int $reponseChoisie): array
    {
        $correct = ($reponseChoisie === $quiz->bonne_reponse);
        $score   = $correct ? 100 : 0;

        // Récupérer le pivot artisan_formation pour cette formation
        $formation = $artisan->formations()
            ->wherePivot('id_formation', $quiz->id_formation)
            ->first();

        if ($formation !== null) {
            $pivot          = $formation->pivot;
            $tentatives     = (int) ($pivot->tentatives ?? 0);
            $scoreActuel    = $pivot->score_quiz;

            $nouvellesValeurs = [
                'tentatives' => $tentatives + 1,
            ];

            // Mettre à jour le score uniquement si supérieur (ou si null)
            if ($scoreActuel === null || $score > (int) $scoreActuel) {
                $nouvellesValeurs['score_quiz'] = $score;
            }

            $artisan->formations()->updateExistingPivot($quiz->id_formation, $nouvellesValeurs);
        }

        return [
            'score'        => $score,
            'correct'      => $correct,
            'bonne_reponse' => $quiz->bonne_reponse,
        ];
    }

    /**
     * Vérifier si un artisan a complété toutes les formations d'un parcours.
     *
     * Si toutes les formations sont complétées et que les points bonus n'ont pas encore
     * été attribués, met à jour le pivot artisan_parcours et incrémente points_formation
     * de l'artisan.
     *
     * Note (Q18) : les points bonus sont attribués indépendamment des scores aux quiz.
     * Seule la date d'achèvement de chaque formation est requise.
     *
     * @param  Artisan          $artisan  L'artisan dont on vérifie la progression.
     * @param  AcademieParcours $parcours Le parcours à vérifier.
     */
    public function verifierCompletionParcours(Artisan $artisan, AcademieParcours $parcours): void
    {
        $formations = $parcours->formations;

        if ($formations->isEmpty()) {
            return;
        }

        // Vérifier que chaque formation du parcours possède une date d'achèvement
        foreach ($formations as $formation) {
            $aComplete = $artisan->formations()
                ->wherePivot('id_formation', $formation->id)
                ->wherePivotNotNull('date_achevement')
                ->exists();

            if (! $aComplete) {
                return;
            }
        }

        // Toutes les formations sont complétées — vérifier si les points ont déjà été attribués
        $dejaAttribue = $artisan->parcours()
            ->wherePivot('id_parcours', $parcours->id)
            ->wherePivotNotNull('date_completion')
            ->exists();

        if ($dejaAttribue) {
            return;
        }

        // Enregistrer la complétion du parcours et attribuer les points bonus
        $artisan->parcours()->syncWithoutDetaching([
            $parcours->id => [
                'date_completion'  => now(),
                'points_attribues' => $parcours->points_bonus,
            ],
        ]);

        $artisan->points_formation = ((int) $artisan->points_formation) + $parcours->points_bonus;
        $artisan->save();

        Log::info('Parcours complété — points bonus attribués', [
            'id_artisan'    => $artisan->id,
            'id_parcours'   => $parcours->id,
            'points_bonus'  => $parcours->points_bonus,
            'total_points'  => $artisan->points_formation,
        ]);
    }
}
