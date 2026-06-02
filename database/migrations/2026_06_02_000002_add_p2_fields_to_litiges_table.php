<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('litiges', function (Blueprint $table) {
            $table->boolean('fonds_geles')->default(false)->after('resolution_details');
            $table->dateTime('date_escalade')->nullable()->after('fonds_geles');
            $table->boolean('escalade')->default(false)->after('date_escalade');
            $table->text('raison_decision')->nullable()->after('escalade');
            $table->dateTime('date_decision')->nullable()->after('raison_decision');
        });
    }

    public function down(): void
    {
        Schema::table('litiges', function (Blueprint $table) {
            $table->dropColumn([
                'fonds_geles',
                'date_escalade',
                'escalade',
                'raison_decision',
                'date_decision',
            ]);
        });
    }
};
