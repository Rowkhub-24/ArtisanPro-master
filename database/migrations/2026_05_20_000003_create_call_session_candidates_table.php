<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('call_session_candidates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('call_session_id')->constrained('call_sessions')->onDelete('cascade');
            $table->foreignId('sender_id')->constrained('utilisateurs')->onDelete('cascade');
            $table->enum('direction', ['offer', 'answer']);
            $table->json('candidate');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('call_session_candidates');
    }
};
