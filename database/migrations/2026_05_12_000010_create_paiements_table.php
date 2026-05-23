<?php
// database/migrations/2026_05_12_000010_create_paiements_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_reservation')
                  ->nullable()
                  ->constrained('reservations')
                  ->onDelete('set null');
            $table->foreignId('id_utilisateur')
                  ->constrained('utilisateurs')
                  ->onDelete('cascade');
            $table->decimal('montant', 10, 2);
            $table->decimal('commission', 10, 2)->default(0);
            $table->enum('type_transaction', ['acompte', 'solde', 'retrait', 'commission', 'remboursement']);
            $table->string('methode_paiement', 50);
            $table->enum('statut', ['reussi', 'echoue', 'en_attente'])->default('en_attente');
            $table->string('reference_transaction', 100)->unique();
            $table->dateTime('date_paiement');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};