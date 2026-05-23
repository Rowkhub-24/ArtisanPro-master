<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_favoris', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_client')
                ->constrained('clients')
                ->onDelete('cascade');
            $table->foreignId('id_artisan')
                ->constrained('artisans')
                ->onDelete('cascade');
            $table->timestamps();

            $table->unique(['id_client', 'id_artisan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_favoris');
    }
};
