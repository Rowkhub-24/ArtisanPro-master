<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademieQuiz extends Model
{
    protected $table = 'academie_quiz';

    protected $fillable = [
        'id_formation',
        'question',
        'reponses',
        'bonne_reponse',
    ];

    protected $casts = [
        'reponses'      => 'array',
        'bonne_reponse' => 'integer',
    ];

    public function formation(): BelongsTo
    {
        return $this->belongsTo(AcademieFormation::class, 'id_formation');
    }
}
