<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\RespondsWithJson;
use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    use RespondsWithJson;

    public function index(): JsonResponse
    {
        $items = Category::query()
            ->orderBy('nom')
            ->get(['id', 'nom', 'icone', 'description', 'nombre_artisans']);

        return $this->jsonSuccess($items);
    }
}
