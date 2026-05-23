<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class AdminReportsController extends Controller
{
    public function __invoke()
    {
        return Inertia::render('admin/reports', [
            'stats' => []
        ]);
    }
}
