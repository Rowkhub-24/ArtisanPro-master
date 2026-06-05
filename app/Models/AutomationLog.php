<?php

namespace App\Models;

use App\Observers\AutomationLogObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(AutomationLogObserver::class)]
class AutomationLog extends Model
{
    use HasFactory;

    protected $table = 'automation_logs';

    protected $fillable = [
        'type_action',
        'model_type',
        'model_id',
        'decision',
        'score_confiance',
        'regles_evaluees',
        'raison',
        'duree_ms',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'regles_evaluees' => 'array',
            'score_confiance' => 'float',
            'duree_ms'        => 'integer',
        ];
    }
}
