<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Levée lorsqu'un numéro de téléphone ne peut pas être normalisé
 * au format E.164 requis par Africa's Talking.
 */
class InvalidPhoneNumberException extends RuntimeException
{
    public function __construct(string $phoneRaw, string $context = '')
    {
        $msg = "Numéro de téléphone invalide ou non normalisable en E.164 : « {$phoneRaw} »";
        if ($context !== '') {
            $msg .= " (contexte : {$context})";
        }
        parent::__construct($msg);
    }
}
