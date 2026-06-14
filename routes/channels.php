<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Canal privé pour les mises à jour de devis en temps réel.
 * Seul l'utilisateur authentifié dont l'id correspond peut s'abonner.
 *
 * Usage : Echo.private(`client.${userId}`)
 */
Broadcast::channel('client.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
