<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_artisan')->nullable()->index();
            $table->unsignedBigInteger('id_utilisateur')->nullable()->index();
            $table->string('type')->default('payment'); // payment, refund
            $table->decimal('amount', 12, 2);
            $table->string('currency', 8)->default('XOF');
            $table->string('provider')->nullable();
            $table->string('provider_transaction_id')->nullable()->index();
            $table->string('status')->default('pending'); // pending, succeeded, failed
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('id_artisan')->references('id')->on('artisans')->onDelete('cascade');
            $table->foreign('id_utilisateur')->references('id')->on('utilisateurs')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
