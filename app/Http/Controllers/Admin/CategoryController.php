<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = Category::withCount('artisans')
            ->orderBy('nom')
            ->get();

        return Inertia::render('admin/categories/index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nom'         => ['required', 'string', 'max:100', 'unique:categories,nom'],
            'icone'       => ['nullable', 'string', 'max:10'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        Category::create($data);

        return back()->with('success', 'Catégorie créée.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $data = $request->validate([
            'nom'         => ['required', 'string', 'max:100', 'unique:categories,nom,' . $category->id],
            'icone'       => ['nullable', 'string', 'max:10'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $category->update($data);

        return back()->with('success', 'Catégorie mise à jour.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $category->delete();

        return back()->with('success', 'Catégorie supprimée.');
    }
}
