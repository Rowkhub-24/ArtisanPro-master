<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_artisan')->nullable()->index();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 8)->default('XOF');
            $table->string('provider')->nullable();
            $table->string('provider_payout_id')->nullable()->index();
            $table->string('status')->default('requested'); // requested, processing, completed, failed
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('id_artisan')->references('id')->on('artisans')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
