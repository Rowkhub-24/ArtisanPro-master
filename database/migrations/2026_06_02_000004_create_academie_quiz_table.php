<?php
// database/migrations/2026_06_02_000004_create_academie_quiz_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academie_quiz', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_formation');
            $table->text('question');
            $table->json('reponses');
            $table->integer('bonne_reponse');
            $table->timestamps();
            $table->foreign('id_formation')->references('id')->on('academie_formations')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academie_quiz');
    }
};
