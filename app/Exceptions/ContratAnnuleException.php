<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Levée lorsqu'une action (ex. signature) est tentée sur un contrat
 * dont le statut est 'annule'.
 */
class ContratAnnuleException extends RuntimeException
{
    public function __construct(int $contratId)
    {
        parent::__construct(
            "Le contrat #{$contratId} a été annulé et ne peut plus être modifié.",
            422,
        );
    }
}
