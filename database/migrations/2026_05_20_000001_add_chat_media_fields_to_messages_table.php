<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->enum('type', ['text', 'image', 'voice', 'call_audio', 'call_video', 'location'])
                  ->default('text')
                  ->after('contenu');
            $table->string('attachment_path')->nullable()->after('type');
            $table->json('meta')->nullable()->after('attachment_path');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['type', 'attachment_path', 'meta']);
        });
    }
};
