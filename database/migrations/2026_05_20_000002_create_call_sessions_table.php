<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('call_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('caller_id')->constrained('utilisateurs')->onDelete('cascade');
            $table->foreignId('callee_id')->constrained('utilisateurs')->onDelete('cascade');
            $table->enum('type', ['audio', 'video'])->default('audio');
            $table->enum('statut', ['pending', 'accepted', 'rejected', 'ended'])->default('pending');
            $table->longText('offer')->nullable();
            $table->longText('answer')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('call_sessions');
    }
};
