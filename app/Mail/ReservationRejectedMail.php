<?php

namespace App\Mail;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReservationRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Reservation $reservation)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre réservation a été refusée - ArtisanPro',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reservation-rejected',
            with: [
                'client_name' => $this->reservation->client->user->prenom . ' ' . $this->reservation->client->user->nom,
                'artisan_name' => $this->reservation->artisan->user->prenom . ' ' . $this->reservation->artisan->user->nom,
                'reservation_date' => $this->reservation->date_debut?->format('d/m/Y'),
                'reservation_time' => $this->reservation->date_debut?->format('H:i'),
                'reservation_id' => $this->reservation->id,
            ],
        );
    }
}
