<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add type_paiement and statut_sequestre to paiements table.
     * Requirements: 4.1, 4.2
     */
    public function up(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->enum('type_paiement', ['acompte', 'solde', 'remboursement'])
                  ->default('acompte')
                  ->after('date_paiement');

            $table->enum('statut_sequestre', ['en_attente', 'en_sequestre', 'verse', 'rembourse'])
                  ->default('en_attente')
                  ->after('type_paiement');
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropColumn(['type_paiement', 'statut_sequestre']);
        });
    }
};
