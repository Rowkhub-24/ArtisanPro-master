<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\Client;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'prenom'           => ['required', 'string', 'max:100'],
            'nom'              => ['required', 'string', 'max:100'],
            'email'            => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'telephone'        => ['nullable', 'string', 'max:20'],
            'type_utilisateur' => ['required', 'in:client,artisan'],
            'password'         => ['required', 'confirmed', Rules\Password::defaults()],
            'metier'           => ['required_if:type_utilisateur,artisan', 'nullable', 'string', 'max:150'],
            'avatar'           => ['nullable', 'image', 'mimes:jpeg,png,webp,gif', 'max:2048'],
        ]);

        // Handle avatar upload
        $avatarPath = null;
        if ($request->hasFile('avatar') && $request->file('avatar')->isValid()) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        $user = DB::transaction(function () use ($validated, $avatarPath) {
            $user = User::query()->create([
                'prenom'           => $validated['prenom'],
                'nom'              => $validated['nom'],
                'email'            => $validated['email'],
                'telephone'        => $validated['telephone'] ?? null,
                'mot_de_passe'     => $validated['password'],
                'type_utilisateur' => $validated['type_utilisateur'],
                'statut'           => 'actif',
                'date_inscription' => now(),
                'avatar'           => $avatarPath,
            ]);

            if ($validated['type_utilisateur'] === 'client') {
                Client::query()->create([
                    'id_utilisateur' => $user->id,
                    'telephone'      => $validated['telephone'] ?? null,
                ]);
            } else {
                Artisan::query()->create([
                    'id_utilisateur'   => $user->id,
                    'metier'           => $validated['metier'],
                    'description'      => null,
                    'bio'              => null,
                    'zone_intervention' => 'Porto-Novo',
                    'tarifs_horaire'   => null,
                    'note_moyenne'     => 0,
                    'badge'            => 'aucun',
                ]);
            }

            return $user;
        });

        event(new Registered($user));
        Auth::login($user);

        return to_route('dashboard');
    }
}
