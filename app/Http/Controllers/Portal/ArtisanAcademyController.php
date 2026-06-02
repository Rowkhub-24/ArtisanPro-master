<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\AcademieFormation;
use App\Models\AcademieParcours;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArtisanAcademyController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $artisan = auth()->user()->artisan;

        // Eager-load quiz on each formation so the frontend can display quiz availability
        $formations = AcademieFormation::with('quiz')
            ->orderBy('titre')
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
                    'quiz'            => $f->quiz,
                ];
            });

        $completees = $formations->where('complete', true)->count();

        // Collect IDs of formations the artisan has completed
        $completedFormationIds = $artisan
            ? $artisan->formations()->wherePivotNotNull('date_achevement')->pluck('academie_formations.id')->all()
            : [];

        // Build parcours list with completion info
        $allParcours = AcademieParcours::with(['formations'])->get();

        $parcoursList = $allParcours->map(function (AcademieParcours $parcours) use ($artisan, $completedFormationIds) {
            // Pivot row from artisan_parcours for this artisan, if any
            $pivotParcours = $artisan
                ? $artisan->parcours()->where('academie_parcours.id', $parcours->id)->first()
                : null;

            $parcoursFormationIds = $parcours->formations->pluck('id')->all();
            $completeedInParcours = count(array_intersect($parcoursFormationIds, $completedFormationIds));
            $totalFormations = $parcours->formations->count();

            return [
                'id'               => $parcours->id,
                'titre'            => $parcours->titre,
                'description'      => $parcours->description,
                'points_bonus'     => $parcours->points_bonus,
                'total_formations' => $totalFormations,
                'completees'       => $completeedInParcours,
                'complete'         => $totalFormations > 0 && $completeedInParcours === $totalFormations,
                'date_completion'  => $pivotParcours?->pivot->date_completion,
                'points_attribues' => $pivotParcours?->pivot->points_attribues ?? 0,
            ];
        });

        return Inertia::render('artisan/academy', [
            'formations'      => $formations,
            'completees'      => $completees,
            'total'           => $formations->count(),
            'parcours'        => $parcoursList,
            'points_formation' => $artisan?->points_formation ?? 0,
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
