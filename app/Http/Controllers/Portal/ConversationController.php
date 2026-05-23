<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ConversationController extends Controller
{
    public function __invoke()
    {
        return Inertia::render('shared/conversation', [
            'conversations' => []
        ]);
    }
}
