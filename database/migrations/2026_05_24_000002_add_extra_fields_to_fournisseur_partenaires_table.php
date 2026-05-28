<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fournisseur_partenaires', function (Blueprint $table) {
            // Colonnes déjà présentes dans le modèle mais absentes de la migration initiale
            if (! Schema::hasColumn('fournisseur_partenaires', 'logo_url')) {
                $table->string('logo_url')->nullable()->after('contact_telephone');
            }
            if (! Schema::hasColumn('fournisseur_partenaires', 'site_web')) {
                $table->string('site_web')->nullable()->after('logo_url');
            }
            if (! Schema::hasColumn('fournisseur_partenaires', 'type')) {
                $table->string('type', 50)->nullable()->after('site_web');
            }
            if (! Schema::hasColumn('fournisseur_partenaires', 'actif')) {
                $table->boolean('actif')->default(true)->after('type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('fournisseur_partenaires', function (Blueprint $table) {
            $table->dropColumn(['logo_url', 'site_web', 'type', 'actif']);
        });
    }
};
