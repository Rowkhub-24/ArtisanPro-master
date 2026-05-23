<?php

namespace App\Http\Controllers;

use App\Models\CallSession;
use App\Models\CallSessionCandidate;
use Illuminate\Http\Request;

class CallController extends Controller
{
    public function start(Request $request)
    {
        $request->validate([
            'callee_id' => ['required', 'integer', 'exists:utilisateurs,id'],
            'type' => ['nullable', 'in:audio,video'],
        ]);

        $caller = $request->user();
        if (! $caller) abort(403);

        $call = CallSession::create([
            'caller_id' => $caller->id,
            'callee_id' => $request->callee_id,
            'type' => $request->type ?? 'audio',
            'statut' => 'pending',
        ]);

        return response()->json(['call_session_id' => $call->id]);
    }

    public function offer(Request $request, CallSession $call)
    {
        $request->validate(['offer' => ['required', 'string']]);
        $call->update(['offer' => $request->offer, 'statut' => 'pending']);
        return response()->json(['ok' => true]);
    }

    public function answer(Request $request, CallSession $call)
    {
        $request->validate(['answer' => ['required', 'string']]);
        $call->update(['answer' => $request->answer, 'statut' => 'accepted']);
        return response()->json(['ok' => true]);
    }

    public function candidate(Request $request, CallSession $call)
    {
        $request->validate(['candidate' => ['required']]);
        $sender = $request->user();
        CallSessionCandidate::create([
            'call_session_id' => $call->id,
            'sender_id' => $sender->id,
            'direction' => $request->input('direction', 'offer'),
            'candidate' => $request->candidate,
        ]);
        return response()->json(['ok' => true]);
    }

    public function state(CallSession $call)
    {
        return response()->json([
            'id' => $call->id,
            'offer' => $call->offer,
            'answer' => $call->answer,
            'statut' => $call->statut,
        ]);
    }

    public function candidates(CallSession $call)
    {
        $list = $call->candidates()->orderBy('created_at')->get()->map(fn($c) => $c->candidate);
        return response()->json(['candidates' => $list]);
    }
}
