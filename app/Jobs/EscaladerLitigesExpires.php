<?php

namespace App\Jobs;

use App\Services\LitigeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class EscaladerLitigesExpires implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(LitigeService $litigeService): void
    {
        $escalades = $litigeService->escaladerLitigesExpires();

        Log::info('EscaladerLitigesExpires : job exécuté.', [
            'litiges_escalades' => $escalades,
        ]);
    }
}
