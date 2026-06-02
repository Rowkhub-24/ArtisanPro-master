<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        return [
            'id_utilisateur'      => User::factory()->state(['type_utilisateur' => 'client']),
            'adresse_livraison'   => $this->faker->address(),
            'telephone'           => '+229' . $this->faker->numerify('##########'),
            'historique_commandes'=> null,
        ];
    }
}
