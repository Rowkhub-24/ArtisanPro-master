<?php

namespace App\Mail;

use App\Models\Contrat;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContratFinalise extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Contrat $contrat)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "ArtisanPro — Votre contrat {$this->contrat->numero_contrat} a été finalisé",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contrat-finalise',
            with: [
                'numeroContrat'       => $this->contrat->numero_contrat,
                'nomClient'           => $this->contrat->nom_client,
                'nomArtisan'          => $this->contrat->nom_artisan,
                'descriptionPrestation' => $this->contrat->description_prestation,
                'montantTotal'        => $this->contrat->montant_total,
                'dateDebutPrestation' => $this->contrat->date_debut_prestation?->format('d/m/Y'),
            ],
        );
    }
}
