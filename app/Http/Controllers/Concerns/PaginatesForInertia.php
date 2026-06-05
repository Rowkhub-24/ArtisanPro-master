<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Helper pour normaliser la réponse d'un LengthAwarePaginator vers
 * la structure { data, links, meta } attendue par les composants React/Inertia.
 *
 * Laravel paginate() retourne un objet plat (current_page, last_page, total au
 * premier niveau). Inertia ne le transforme pas automatiquement en { meta }.
 * Ce trait expose paginateForInertia() qui produit la structure correcte.
 */
trait PaginatesForInertia
{
    /**
     * Convertit un LengthAwarePaginator en tableau { data, links, meta }.
     *
     * @return array{ data: array<mixed>, links: array<mixed>, meta: array{ current_page: int, last_page: int, total: int } }
     */
    protected function paginateForInertia(LengthAwarePaginator $paginator): array
    {
        return [
            'data'  => $paginator->items(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta'  => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
            ],
        ];
    }
}
