<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates the automation_logs table for auditing all automatic decisions.
     * Requirements: 8.2
     */
    public function up(): void
    {
        Schema::create('automation_logs', function (Blueprint $table) {
            $table->id();
            $table->string('type_action', 100)->notNull();
            $table->string('model_type', 100)->notNull();
            $table->unsignedBigInteger('model_id')->notNull();
            $table->enum('decision', ['approuvee', 'rejetee', 'escaladee'])->notNull();
            $table->decimal('score_confiance', 5, 2)->notNull();
            $table->json('regles_evaluees');
            $table->text('raison')->notNull();
            $table->integer('duree_ms')->notNull()->default(0);
            $table->timestamps();

            // Index for quick lookup by model
            $table->index(['model_type', 'model_id']);
            $table->index('type_action');
            $table->index('decision');
        });
    }

    /**
     * Reverse the migrations.
     * Requirements: 8.6
     */
    public function down(): void
    {
        Schema::dropIfExists('automation_logs');
    }
};
