<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->boolean('push_notifications_enabled')->default(true)->after('derniere_connexion');
            $table->boolean('sms_notifications_enabled')->default(true)->after('push_notifications_enabled');
            $table->enum('push_permission_status', ['granted', 'denied', 'default'])->default('default')->after('sms_notifications_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->dropColumn([
                'push_notifications_enabled',
                'sms_notifications_enabled',
                'push_permission_status',
            ]);
        });
    }
};
