<?php

namespace Tests\Feature\Auth;

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('new users can register as client', function () {
    $response = $this->post('/register', [
        'prenom' => 'Test',
        'nom' => 'Client',
        'email' => 'client-register@example.com',
        'telephone' => '+22900000000',
        'type_utilisateur' => 'client',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('new users can register as artisan', function () {
    $response = $this->post('/register', [
        'prenom' => 'Art',
        'nom' => 'Isan',
        'email' => 'artisan-register@example.com',
        'type_utilisateur' => 'artisan',
        'metier' => 'Électricien',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});
