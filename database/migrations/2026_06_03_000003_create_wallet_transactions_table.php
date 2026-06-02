<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('wallet_id');
            $table->unsignedBigInteger('id_artisan');
            $table->enum('type', ['credit', 'debit']);
            $table->decimal('montant', 12, 2);
            $table->decimal('solde_avant', 12, 2);  // Balance before operation
            $table->decimal('solde_apres', 12, 2);  // Balance after operation
            $table->string('devise', 5)->default('XOF');
            $table->string('motif', 100);           // 'acompte_kkiapay', 'liberation_fonds', 'remboursement', etc.
            $table->string('reference', 100)->nullable(); // transaction reference (kkiapay tx_id, etc.)
            $table->unsignedBigInteger('id_reservation')->nullable();
            $table->unsignedBigInteger('id_paiement')->nullable();
            $table->text('metadata')->nullable();   // JSON extra data
            $table->timestamps();

            $table->foreign('wallet_id')->references('id')->on('wallets')->onDelete('cascade');
            $table->foreign('id_artisan')->references('id')->on('artisans')->onDelete('cascade');
            $table->index('wallet_id');
            $table->index('id_artisan');
            $table->index('type');
            $table->index('reference');
            $table->index('id_reservation');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
