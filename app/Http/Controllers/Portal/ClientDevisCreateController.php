<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ClientDevisCreateController extends Controller
{
    public function __invoke()
    {
        return Inertia::render('client/devis-new', [
            'clients' => [],
            'artisans' => [],
        ]);
    }
}
