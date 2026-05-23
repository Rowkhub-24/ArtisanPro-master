<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ArtisanAcademyController extends Controller
{
    public function __invoke()
    {
        return Inertia::render('artisan/academy', [
            'courses' => [],
        ]);
    }
}
