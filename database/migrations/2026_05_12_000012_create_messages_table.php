<?php
// database/migrations/2026_05_12_000012_create_messages_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_expediteur')
                  ->constrained('utilisateurs')
                  ->onDelete('cascade');
            $table->foreignId('id_destinataire')
                  ->constrained('utilisateurs')
                  ->onDelete('cascade');
            $table->foreignId('id_reservation')
                  ->nullable()
                  ->constrained('reservations')
                  ->onDelete('set null');
            $table->text('contenu');
            $table->dateTime('date_envoi');
            $table->boolean('lu')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};