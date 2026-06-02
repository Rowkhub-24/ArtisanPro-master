<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_artisan')->unique();
            $table->decimal('solde', 12, 2)->default(0.00);
            $table->decimal('solde_en_attente', 12, 2)->default(0.00); // fonds sequestre non liberes
            $table->decimal('total_credit', 12, 2)->default(0.00);     // cumul credits
            $table->decimal('total_debit', 12, 2)->default(0.00);      // cumul debits
            $table->string('devise', 5)->default('XOF');
            $table->boolean('actif')->default(true);
            $table->timestamps();

            $table->foreign('id_artisan')->references('id')->on('artisans')->onDelete('cascade');
            $table->index('id_artisan');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};
