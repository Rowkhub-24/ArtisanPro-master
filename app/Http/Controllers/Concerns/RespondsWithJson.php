<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\JsonResponse;

trait RespondsWithJson
{
    /**
     * @param  array<string, mixed>  $meta
     */
    protected function jsonSuccess(mixed $data = null, ?string $message = null, array $meta = [], int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
            'meta' => $meta === [] ? new \stdClass : $meta,
        ], $status);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    protected function jsonError(string $message, int $status = 400, mixed $data = null, array $meta = []): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data' => $data,
            'message' => $message,
            'meta' => $meta === [] ? new \stdClass : $meta,
        ], $status);
    }
}
