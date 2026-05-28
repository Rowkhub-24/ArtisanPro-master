<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'login'    => ['required', 'string'],   // email OU téléphone
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Tente l'authentification par email ou par numéro de téléphone.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $login    = $this->string('login')->trim()->toString();
        $password = $this->string('password')->toString();
        $remember = $this->boolean('remember');

        // Détecter si c'est un email ou un téléphone
        $isEmail = filter_var($login, FILTER_VALIDATE_EMAIL);

        $authenticated = false;

        if ($isEmail) {
            // Tentative directe par email
            $authenticated = Auth::attempt(
                ['email' => $login, 'password' => $password],
                $remember
            );
        } else {
            // Tentative par numéro de téléphone
            // Normalise le numéro : retire espaces, tirets, parenthèses
            $phone = preg_replace('/[\s\-().]+/', '', $login);

            $user = User::where(function ($q) use ($phone) {
                $q->where('telephone', $phone)
                  ->orWhere('telephone', '+' . ltrim($phone, '+'));
            })->first();

            if ($user) {
                $authenticated = Auth::attempt(
                    ['email' => $user->email, 'password' => $password],
                    $remember
                );
            }
        }

        if (! $authenticated) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'login' => __('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'login' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('login')) . '|' . $this->ip());
    }
}
