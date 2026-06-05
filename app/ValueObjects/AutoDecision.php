<?php

declare(strict_types=1);

namespace App\ValueObjects;

/**
 * Value object immutable représentant le résultat d'une évaluation automatique.
 *
 * Chaque propriété est readonly pour garantir l'immutabilité de la décision
 * après sa création (Req 9.6).
 */
readonly class AutoDecision
{
    /**
     * @param bool   $approuvee                    Indique si la décision est approuvée.
     * @param string $raison                        Raison textuelle de la décision.
     * @param float  $score_confiance               Score de confiance entre 0.0 et 100.0.
     * @param bool   $necessite_intervention_humaine Indique si une intervention humaine est requise.
     * @param array  $regles_evaluees               Tableau des règles évaluées, chaque élément contient :
     *                                              'cle', 'valeur_attendue', 'valeur_reelle', 'resultat'.
     */
    public function __construct(
        public bool $approuvee,
        public string $raison,
        public float $score_confiance,
        public bool $necessite_intervention_humaine,
        public array $regles_evaluees,
    ) {
    }

    /**
     * Retourne toutes les propriétés sous forme de tableau associatif.
     *
     * @return array{
     *     approuvee: bool,
     *     raison: string,
     *     score_confiance: float,
     *     necessite_intervention_humaine: bool,
     *     regles_evaluees: array
     * }
     */
    public function toArray(): array
    {
        return [
            'approuvee'                     => $this->approuvee,
            'raison'                        => $this->raison,
            'score_confiance'               => $this->score_confiance,
            'necessite_intervention_humaine' => $this->necessite_intervention_humaine,
            'regles_evaluees'               => $this->regles_evaluees,
        ];
    }

    /**
     * Construit une instance AutoDecision depuis un tableau associatif.
     *
     * @param array{
     *     approuvee: bool,
     *     raison: string,
     *     score_confiance: float|int,
     *     necessite_intervention_humaine: bool,
     *     regles_evaluees: array
     * } $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            approuvee:                     (bool) $data['approuvee'],
            raison:                        (string) $data['raison'],
            score_confiance:               (float) $data['score_confiance'],
            necessite_intervention_humaine: (bool) $data['necessite_intervention_humaine'],
            regles_evaluees:               (array) $data['regles_evaluees'],
        );
    }
}
