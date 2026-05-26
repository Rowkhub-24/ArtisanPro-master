<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\AcademieFormation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArtisanAcademyController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $artisan = auth()->user()->artisan;

        $formations = AcademieFormation::orderBy('titre')
            ->get()
            ->map(function (AcademieFormation $f) use ($artisan) {
                $pivot = $artisan
                    ? $artisan->formations()->where('academie_formations.id', $f->id)->first()?->pivot
                    : null;

                return [
                    'id'              => $f->id,
                    'titre'           => $f->titre,
                    'description'     => $f->description,
                    'url_contenu'     => $f->url_contenu,
                    'complete'        => $pivot !== null,
                    'date_achevement' => $pivot?->date_achevement,
                ];
            });

        $completees = $formations->where('complete', true)->count();

        return Inertia::render('artisan/academy', [
            'formations'  => $formations,
            'completees'  => $completees,
            'total'       => $formations->count(),
        ]);
    }

    /** Marquer une formation comme complétée */
    public function completer(int $id): RedirectResponse
    {
        $artisan = auth()->user()->artisan;

        if (! $artisan) {
            abort(403);
        }

        $artisan->formations()->syncWithoutDetaching([
            $id => ['date_achevement' => now()],
        ]);

        return back()->with('success', 'Formation marquée comme complétée !');
    }
}
