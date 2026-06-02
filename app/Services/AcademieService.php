<?php

namespace App\Services;

use App\Models\Artisan;
use App\Models\AcademieQuiz;
use App\Models\AcademieParcours;
use Illuminate\Support\Facades\Log;

/**
 * Service académie : gestion des quiz et des points bonus de parcours.
 *
 * - soumettreQuiz()              : calcul du score, enregistrement, incrémentation des tentatives
 * - verifierCompletionParcours() : attribution des points bonus à la complétion (Q18 — indépendamment des scores quiz)
 */
class AcademieService
{
    /**
     * Soumettre une réponse à un quiz.
     *
     * Un quiz = une question. Le score est 100 si la réponse est correcte, 0 sinon.
     * - Incrémente les tentatives dans le pivot artisan_formation
     * - Met à jour score_quiz si le nouveau score est supérieur au score existant
     *
     * @param  Artisan       $artisan
     * @param  AcademieQuiz  $quiz
     * @param  int           $reponseChoisie  Index de la réponse choisie
     * @return array{score: int, correct: bool, bonne_reponse: int}
     */
    public function soumettreQuiz(Artisan $artisan, AcademieQuiz $quiz, int $reponseChoisie): array
    {
        $correct = ($reponseChoisie === $quiz->bonne_reponse);
        $score   = $correct ? 100 : 0;

        // Récupérer le pivot artisan_formation pour cette formation
        $pivot = $artisan->formations()
            ->wherePivot('id_formation', $quiz->id_formation)
            ->first();

        if ($pivot) {
            $tentativesActuelles = $pivot->pivot->tentatives ?? 0;
            $scoreActuel         = $pivot->pivot->score_quiz;

            $artisan->formations()->updateExistingPivot($quiz->id_formation, [
                'tentatives' => $tentativesActuelles + 1,
                'score_quiz' => ($scoreActuel === null || $score > $scoreActuel) ? $score : $scoreActuel,
            ]);
        } else {
            Log::warning('AcademieService::soumettreQuiz — formation non trouvée dans le pivot artisan_formation', [
                'artisan_id'   => $artisan->id,
                'id_formation' => $quiz->id_formation,
            ]);
        }

        return [
            'score'        => $score,
            'correct'      => $correct,
            'bonne_reponse' => $quiz->bonne_reponse,
        ];
    }

    /**
     * Vérifier si l'artisan a complété toutes les formations d'un parcours.
     *
     * Si toutes les formations sont complétées ET que les points bonus n'ont pas encore
     * été attribués, met à jour le pivot artisan_parcours et incrémente points_formation
     * de l'artisan. Les points bonus sont attribués indépendamment des scores quiz (Q18).
     */
    public function verifierCompletionParcours(Artisan $artisan, AcademieParcours $parcours): void
    {
        // Charger toutes les formations du parcours
        $formations = $parcours->formations()->get();

        if ($formations->isEmpty()) {
            return;
        }

        // Vérifier que l'artisan a complété toutes les formations (date_achevement non null)
        $formationsIds = $formations->pluck('id');

        $formationsCompletees = $artisan->formations()
            ->whereIn('artisan_formation.id_formation', $formationsIds)
            ->wherePivotNotNull('date_achevement')
            ->count();

        if ($formationsCompletees < $formations->count()) {
            // Parcours pas encore complété
            return;
        }

        // Vérifier que les points bonus n'ont pas déjà été attribués
        $pivotParcours = $artisan->parcours()
            ->wherePivot('id_parcours', $parcours->id)
            ->first();

        $dejaAttribue = $pivotParcours && $pivotParcours->pivot->date_completion !== null;

        if ($dejaAttribue) {
            return;
        }

        // Attribuer les points bonus et marquer la complétion
        if ($pivotParcours) {
            $artisan->parcours()->updateExistingPivot($parcours->id, [
                'date_completion'  => now(),
                'points_attribues' => $parcours->points_bonus,
            ]);
        } else {
            $artisan->parcours()->attach($parcours->id, [
                'date_completion'  => now(),
                'points_attribues' => $parcours->points_bonus,
            ]);
        }

        // Incrémenter les points_formation de l'artisan
        $artisan->increment('points_formation', $parcours->points_bonus);

        Log::info('AcademieService::verifierCompletionParcours — points bonus attribués', [
            'artisan_id'   => $artisan->id,
            'parcours_id'  => $parcours->id,
            'points_bonus' => $parcours->points_bonus,
        ]);
    }
}
