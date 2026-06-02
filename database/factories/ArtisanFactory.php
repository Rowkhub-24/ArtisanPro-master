<?php

namespace Database\Factories;

use App\Models\Artisan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ArtisanFactory extends Factory
{
    protected $model = Artisan::class;

    public function definition(): array
    {
        return [
            'id_utilisateur'    => User::factory()->state(['type_utilisateur' => 'artisan']),
            'metier'            => $this->faker->randomElement(['Plombier', 'Electricien', 'Menuisier', 'Peintre', 'Macon']),
            'description'       => $this->faker->sentence(),
            'bio'               => $this->faker->paragraph(),
            'zone_intervention' => $this->faker->city(),
            'tarifs_horaire'    => $this->faker->randomFloat(2, 5000, 50000),
            'note_moyenne'      => $this->faker->randomFloat(1, 1, 5),
            'badge'             => $this->faker->randomElement(['aucun', 'certifie', 'elite']),
            'score_confiance'   => $this->faker->numberBetween(0, 100),
            'payment_provider'  => 'kkiapay',
            'payment_account_id'=> null,
            'latitude'          => 6.4969,
            'longitude'         => 2.6289,
        ];
    }
}
