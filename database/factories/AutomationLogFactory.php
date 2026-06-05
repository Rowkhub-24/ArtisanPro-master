<?php

namespace Database\Factories;

use App\Models\AutomationLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AutomationLog>
 */
class AutomationLogFactory extends Factory
{
    protected $model = AutomationLog::class;

    public function definition(): array
    {
        return [
            'type_action'     => $this->faker->randomElement([
                'auto_accept',
                'auto_devis',
                'auto_validate',
                'auto_mission',
                'auto_litige',
                'rate_limit_exceeded',
            ]),
            'model_type'      => $this->faker->randomElement(['Reservation', 'Devis', 'Litige']),
            'model_id'        => $this->faker->numberBetween(1, 10000),
            'decision'        => $this->faker->randomElement(['approuvee', 'rejetee', 'escaladee']),
            'score_confiance' => $this->faker->randomFloat(2, 0, 100),
            'regles_evaluees' => [
                [
                    'cle'             => $this->faker->word(),
                    'valeur_attendue' => $this->faker->randomNumber(),
                    'valeur_reelle'   => $this->faker->randomNumber(),
                    'resultat'        => $this->faker->boolean(),
                ],
            ],
            'raison'          => $this->faker->sentence(),
            'duree_ms'        => $this->faker->numberBetween(0, 5000),
        ];
    }
}
