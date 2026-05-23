<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\RespondsWithJson;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use RespondsWithJson;

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password']])) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        /** @var User $user */
        $user = User::query()->where('email', $credentials['email'])->firstOrFail();

        if ($user->statut !== 'actif') {
            Auth::logout();

            return $this->jsonError('Compte inactif ou suspendu.', 403);
        }

        $user->forceFill(['derniere_connexion' => now()])->save();

        $token = $user->createToken('api')->plainTextToken;

        return $this->jsonSuccess([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->publicUser($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return $this->jsonSuccess(null, 'Déconnexion effectuée.');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->jsonSuccess($this->publicUser($request->user()));
    }

    /**
     * @return array<string, mixed>
     */
    private function publicUser(User $user): array
    {
        return [
            'id' => $user->id,
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'name' => $user->name,
            'email' => $user->email,
            'telephone' => $user->telephone,
            'type_utilisateur' => $user->type_utilisateur,
            'adresse' => $user->adresse,
        ];
    }
}
