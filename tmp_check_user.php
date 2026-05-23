<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
use App\Models\User;
$user = User::where('email', 'roquiyathtade@gmail.com')->first();
if (! $user) {
    echo "null";
    return;
}
echo json_encode([
    'id' => $user->id,
    'prenom' => $user->prenom,
    'nom' => $user->nom,
    'email' => $user->email,
    'telephone' => $user->telephone,
    'adresse' => $user->adresse,
    'avatar' => $user->avatar,
    'updated_at' => $user->updated_at?->toDateTimeString(),
]);
