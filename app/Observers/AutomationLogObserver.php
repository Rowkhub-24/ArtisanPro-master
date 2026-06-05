<?php

namespace App\Observers;

use App\Models\AutomationLog;
use Illuminate\Support\Facades\Log;

class AutomationLogObserver
{
    /**
     * Handle the AutomationLog "saving" event.
     * Block saves on existing records (updates); allow inserts for new records.
     */
    public function saving(AutomationLog $log): bool
    {
        if ($log->exists) {
            Log::warning('AutomationLogObserver: tentative de modification d\'un log d\'audit existant bloquée.', [
                'log_id'     => $log->getKey(),
                'type_action' => $log->type_action,
                'model_type'  => $log->model_type,
                'model_id'    => $log->model_id,
            ]);

            return false;
        }

        return true;
    }

    /**
     * Handle the AutomationLog "updating" event.
     * Always block updates on existing records.
     */
    public function updating(AutomationLog $log): bool
    {
        Log::warning('AutomationLogObserver: tentative de mise à jour d\'un log d\'audit bloquée.', [
            'log_id'      => $log->getKey(),
            'type_action' => $log->type_action,
            'model_type'  => $log->model_type,
            'model_id'    => $log->model_id,
            'dirty'       => $log->getDirty(),
        ]);

        return false;
    }

    /**
     * Handle the AutomationLog "deleting" event.
     * Always block deletions on existing records.
     */
    public function deleting(AutomationLog $log): bool
    {
        Log::warning('AutomationLogObserver: tentative de suppression d\'un log d\'audit bloquée.', [
            'log_id'      => $log->getKey(),
            'type_action' => $log->type_action,
            'model_type'  => $log->model_type,
            'model_id'    => $log->model_id,
        ]);

        return false;
    }
}
