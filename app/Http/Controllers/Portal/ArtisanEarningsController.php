<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ArtisanEarningsController extends Controller
{
    public function __invoke()
    {
        $user = Auth::user();
        if (! $user || ! $user->artisan) {
            abort(403);
        }

        $artisan = $user->artisan;

        $transactionQuery = $artisan->transactions()->where('status', 'succeeded');
        $totalRevenue = (float) $transactionQuery->sum('amount');
        $totalTransactions = $transactionQuery->count();

        $outstandingPayouts = (float) $artisan->payouts()
            ->whereIn('status', ['requested', 'processing', 'completed'])
            ->sum('amount');

        $completedPayouts = (float) $artisan->payouts()
            ->where('status', 'completed')
            ->sum('amount');

        $availableBalance = $totalRevenue - $outstandingPayouts;

        $recentTransactions = $transactionQuery
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($transaction) => [
                'id' => $transaction->id,
                'amount' => (float) $transaction->amount,
                'currency' => $transaction->currency,
                'provider' => $transaction->provider,
                'status' => $transaction->status,
                'created_at' => optional($transaction->created_at)->toDateTimeString(),
                'metadata' => $transaction->metadata,
            ])
            ->toArray();

        $recentPayouts = $artisan->payouts()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($payout) => [
                'id' => $payout->id,
                'amount' => (float) $payout->amount,
                'currency' => $payout->currency,
                'provider' => $payout->provider,
                'status' => $payout->status,
                'created_at' => optional($payout->created_at)->toDateTimeString(),
                'metadata' => $payout->metadata,
            ])
            ->toArray();

        return Inertia::render('artisan/earnings', [
            'summary' => [
                'totalRevenue' => $totalRevenue,
                'totalTransactions' => $totalTransactions,
                'outstandingPayouts' => $outstandingPayouts,
                'completedPayouts' => $completedPayouts,
                'availableBalance' => $availableBalance,
            ],
            'recentTransactions' => $recentTransactions,
            'recentPayouts' => $recentPayouts,
        ]);
    }
}
