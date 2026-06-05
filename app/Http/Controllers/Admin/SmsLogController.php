<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\PaginatesForInertia;
use App\Http\Controllers\Controller;
use App\Jobs\SendSmsJob;
use App\Models\SmsLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SmsLogController extends Controller
{
    use PaginatesForInertia;
    /**
     * Liste tous les SMS avec filtres et stats globales.
     */
    public function index(Request $request): Response
    {
        $query = SmsLog::query()
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->q, fn ($q, $search) =>
                $q->where('recipient', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%")
            )
            ->when($request->date_from, fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->date_to, fn ($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->orderByDesc('created_at');

        $smsLogs = $query->paginate(25)->withQueryString();

        $costPerSms = (int) config('africastalking.cost_per_sms_xof', 25);

        $stats = [
            'total'           => SmsLog::count(),
            'envoyes'         => SmsLog::where('status', 'sent')->count(),
            'echoues'         => SmsLog::where('status', 'failed')->count(),
            'aujourd_hui'     => SmsLog::where('status', 'sent')->whereDate('sent_at', today())->count(),
            'ce_mois'         => SmsLog::where('status', 'sent')
                                    ->whereMonth('sent_at', now()->month)
                                    ->whereYear('sent_at', now()->year)
                                    ->count(),
            'cout_estime_xof' => SmsLog::where('status', 'sent')
                                    ->whereMonth('sent_at', now()->month)
                                    ->count() * $costPerSms,
        ];

        // Graphique: SMS par jour (30 derniers jours)
        $smsByDay = SmsLog::where('status', 'sent')
            ->where('sent_at', '>=', now()->subDays(30))
            ->selectRaw('DATE(sent_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date')
            ->map(fn ($row) => $row->count);

        // Graphique: SMS par mois (12 derniers mois)
        $smsByMonth = SmsLog::where('status', 'sent')
            ->where('sent_at', '>=', now()->subMonths(12))
            ->selectRaw('DATE_FORMAT(sent_at, "%Y-%m") as month, COUNT(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month')
            ->map(fn ($row) => $row->count);

        return Inertia::render('admin/sms/index', [
            'smsLogs'    => $this->paginateForInertia($smsLogs),
            'stats'      => $stats,
            'smsByDay'   => $smsByDay,
            'smsByMonth' => $smsByMonth,
            'filters'    => $request->only(['q', 'status', 'type', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Renvoyer un SMS ayant echoue.
     */
    public function resend(SmsLog $smsLog): RedirectResponse
    {
        if (! in_array($smsLog->status, ['failed', 'pending'])) {
            return back()->with('error', 'Seuls les SMS echoues ou en attente peuvent etre renvoyes.');
        }

        SendSmsJob::dispatch(
            $smsLog->recipient,
            $smsLog->message,
            $smsLog->type,
            $smsLog->context_id,
            $smsLog->context_type
        )->onQueue('sms');

        return back()->with('success', 'SMS remis en queue pour renvoi.');
    }

    /**
     * Affiche le detail d'un SMS log.
     */
    public function show(SmsLog $smsLog): Response
    {
        return Inertia::render('admin/sms/show', [
            'smsLog' => $smsLog,
        ]);
    }
}
