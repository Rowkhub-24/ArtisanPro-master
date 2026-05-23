<?php

use App\Http\Controllers\Portal\ArtisanAnnuaireController;
use App\Http\Controllers\Portal\ArtisanFicheController;
use App\Http\Controllers\Portal\DevisStoreController;
use App\Http\Controllers\Portal\HomeController;
use App\Models\Artisan;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ── Public ───────────────────────────────────────────────────────────────────
Route::get('/', HomeController::class)->name('home');
Route::get('a-propos', function () {
    return Inertia::render('portal/a-propos');
})->name('about');

Route::get('faq', function () {
    return Inertia::render('portal/faq');
})->name('faq');

Route::get('politique-confidentialite', function () {
    return Inertia::render('portal/politique-confidentialite');
})->name('privacy');

Route::get('contact', function () {
    return Inertia::render('portal/contact');
})->name('contact');

Route::get('cgv', fn () => Inertia::render('portal/cgv'))->name('terms');
Route::get('artisans', ArtisanAnnuaireController::class)->name('artisans.index');
Route::get('artisans/{artisan}', ArtisanFicheController::class)->name('artisans.show');

// ── Authenticated ─────────────────────────────────────────────────────────────
Route::middleware(['auth'])->group(function () {

    // Dashboard générique (redirige selon le rôle)
    Route::get('dashboard', function () {
        $role = auth()->user()->type_utilisateur;
        if ($role === 'client')  return redirect()->route('client.dashboard');
        if ($role === 'artisan') return redirect()->route('artisan.dashboard');
        if ($role === 'admin')   return redirect()->route('admin.dashboard');
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::post('devis', [DevisStoreController::class, 'store'])->name('portal.devis.store');

    // ── Client ────────────────────────────────────────────────────────────────
    Route::prefix('client')->name('client.')->group(function () {
        Route::get('dashboard', function () {
            $client = auth()->user()->client;
            if (! $client) {
                abort(403);
            }

            $stats = [
                'reservations_total' => $client->reservations()->count(),
                'reservations_en_cours' => $client->reservations()->where('statut', 'en_cours')->count(),
                'devis_en_attente' => $client->devis()->where('statut', 'en_attente')->count(),
                'avis_donnes' => \App\Models\Avis::query()->where('id_client', $client->id)->count(),
                'depenses_total' => (float) $client->reservations()->where('statut', 'termine')->sum('montant_total'),
            ];

            $recent_reservations = $client->reservations()
                ->with('artisan.user')
                ->orderByDesc('date_creation')
                ->limit(3)
                ->get()
                ->map(fn ($reservation) => [
                    'id' => $reservation->id,
                    'statut' => $reservation->statut,
                    'date' => optional($reservation->date)->format('d/m/Y'),
                    'artisan_metier' => $reservation->artisan?->metier ?? 'Artisan inconnu',
                    'artisan_nom' => $reservation->artisan?->user ? trim($reservation->artisan->user->prenom.' '.$reservation->artisan->user->nom) : 'Artisan inconnu',
                    'montant_total' => $reservation->montant_total,
                ])
                ->toArray();

            return Inertia::render('client/dashboard', [
                'stats' => $stats,
                'recent_reservations' => $recent_reservations,
            ]);
        })->name('dashboard');

        Route::get('reservations', function () {
            $client = auth()->user()->client;
            if (! $client) {
                abort(403);
            }

            $reservations = $client->reservations()
                ->with(['artisan.user', 'avis'])
                ->orderByDesc('date_creation')
                ->get()
                ->map(fn ($reservation) => [
                    'id' => $reservation->id,
                    'statut' => $reservation->statut,
                    'date_reservation' => optional($reservation->date)->format('Y-m-d'),
                    'artisan' => $reservation->artisan ? [
                        'metier' => $reservation->artisan->metier,
                        'user' => [
                            'prenom' => $reservation->artisan->user?->prenom,
                            'nom' => $reservation->artisan->user?->nom,
                            'telephone' => $reservation->artisan->user?->telephone,
                        ],
                    ] : null,
                    'montant' => $reservation->montant_total,
                    'has_avis' => $reservation->avis ? true : false,
                    'can_leave_review' => in_array($reservation->statut, ['confirmee', 'terminee'], true) && ! $reservation->avis,
                ])
                ->toArray();

            return Inertia::render('client/reservations', ['reservations' => $reservations]);
        })->name('reservations');

        // Liste d'artisans pour le formulaire de réservation (JSON)
        Route::get('artisans/list', function () {
            $artisanModels = \App\Models\Artisan::query()
                ->with('user')
                ->orderBy('metier')
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'metier' => $a->metier,
                    'nom' => $a->user ? trim($a->user->prenom.' '.$a->user->nom) : null,
                ]);

            return response()->json($artisanModels);
        })->name('artisans.list');

        // Création de réservation par le client
        Route::post('reservations', \App\Http\Controllers\Portal\ClientReservationStoreController::class . '@store')->name('reservations.store');

            Route::get('reservations/{reservation}', \App\Http\Controllers\Portal\ClientReservationDetailController::class)->name('reservations.show');

            Route::get('devis/nouveau', \App\Http\Controllers\Portal\ClientDevisCreateController::class)->name('devis.create');

        Route::delete('reservations/{reservation}', function (\App\Models\Reservation $reservation) {
            if ($reservation->id_client !== auth()->user()->client?->id) abort(403);
            // Accept canonical enums for cancellable states
            if (!in_array($reservation->statut, ['en_cours', 'confirmee', 'en_attente', 'confirme'])) {
                return back()->with('error', 'Cette réservation ne peut plus être annulée.');
            }
            // store canonical cancelled value
            $reservation->update(['statut' => 'annulee']);
            return back()->with('success', 'Réservation annulée.');
        })->name('reservations.cancel');

        Route::get('devis', function () {
            $client = auth()->user()->client;
            if (! $client) {
                abort(403);
            }

            $devis = $client->devis()
                ->with('artisan.user')
                ->orderByDesc('date_demande')
                ->get()
                ->map(fn ($devisModel) => [
                    'id' => $devisModel->id,
                    'description_travaux' => $devisModel->description_travaux,
                    'statut' => $devisModel->statut,
                    'date_demande' => optional($devisModel->date_demande)->toDateTimeString(),
                    'montant_propose' => $devisModel->montant_propose,
                    'artisan' => $devisModel->artisan ? [
                        'id' => $devisModel->artisan->id,
                        'metier' => $devisModel->artisan->metier,
                        'user' => [
                            'prenom' => $devisModel->artisan->user?->prenom,
                            'nom' => $devisModel->artisan->user?->nom,
                            'telephone' => $devisModel->artisan->user?->telephone,
                        ],
                    ] : null,
                ])
                ->toArray();

            return Inertia::render('client/devis', ['devis' => $devis]);
        })->name('devis');

        Route::get('messages/{withUser?}', function (\Illuminate\Http\Request $request, ?\App\Models\User $withUser = null) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($withUser && $withUser->type_utilisateur !== 'artisan') {
                abort(403);
            }

            $userId = $authUser->id;
            $messageList = \App\Models\Message::query()
                ->where(function ($query) use ($userId) {
                    $query->where('id_expediteur', $userId)
                          ->orWhere('id_destinataire', $userId);
                })
                ->with(['expediteur.artisan', 'destinataire.artisan'])
                ->orderByDesc('date_envoi')
                ->get();

            $threads = [];
            foreach ($messageList as $message) {
                $otherUser = $message->id_expediteur === $userId
                    ? $message->destinataire
                    : $message->expediteur;

                if (! $otherUser || $otherUser->type_utilisateur !== 'artisan') {
                    continue;
                }

                $key = $otherUser->id;
                if (! isset($threads[$key])) {
                    $threads[$key] = [
                        'id' => $otherUser->id,
                        'artisan_nom' => trim($otherUser->prenom . ' ' . $otherUser->nom),
                        'artisan_metier' => optional($otherUser->artisan)->metier ?? '',
                        'dernier_message' => $message->contenu,
                        'date' => optional($message->date_envoi)->format('d/m à H:i'),
                        'non_lus' => 0,
                        'en_ligne' => false,
                    ];
                }

                if ($message->id_destinataire === $userId && ! $message->lu) {
                    $threads[$key]['non_lus']++;
                }
            }

            $conversations = array_values($threads);
            $selectedConversation = null;
            $chatMessages = [];

            if ($withUser) {
                $selectedConversation = [
                    'id' => $withUser->id,
                    'nom' => trim($withUser->prenom . ' ' . $withUser->nom),
                    'metier' => optional($withUser->artisan)->metier,
                ];

                $chatMessages = \App\Models\Message::query()
                    ->where(function ($query) use ($userId, $withUser) {
                        $query->where('id_expediteur', $userId)
                              ->where('id_destinataire', $withUser->id);
                    })
                    ->orWhere(function ($query) use ($userId, $withUser) {
                        $query->where('id_expediteur', $withUser->id)
                              ->where('id_destinataire', $userId);
                    })
                    ->with(['expediteur', 'destinataire'])
                    ->orderBy('date_envoi')
                    ->get()
                    ->map(fn ($message) => [
                        'id' => $message->id,
                        'contenu' => $message->contenu,
                        'type' => $message->type,
                        'attachment_url' => $message->attachment_path ? asset('storage/' . $message->attachment_path) : null,
                        'location' => $message->meta ? [
                            'latitude' => $message->meta['latitude'] ?? null,
                            'longitude' => $message->meta['longitude'] ?? null,
                        ] : null,
                        'call_type' => in_array($message->type, ['call_audio', 'call_video']) ? $message->type : null,
                        'call_session_id' => $message->call_session_id,
                        'sender_name' => trim($message->expediteur->prenom . ' ' . $message->expediteur->nom),
                        'isMine' => $message->id_expediteur === $userId,
                        'date' => optional($message->date_envoi)->format('d/m H:i'),
                    ])
                    ->toArray();

                \App\Models\Message::query()
                    ->where('id_expediteur', $withUser->id)
                    ->where('id_destinataire', $userId)
                    ->where('lu', false)
                    ->update(['lu' => true]);
            }

            return Inertia::render('client/messages', [
                'conversations' => $conversations,
                'selectedConversation' => $selectedConversation,
                'messages' => $chatMessages,
            ]);
        })->name('messages');

        Route::get('messages/{withUser}/updates', function (\Illuminate\Http\Request $request, \App\Models\User $withUser) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($withUser->type_utilisateur !== 'artisan') {
                abort(403);
            }

            $userId = $authUser->id;
            $chatMessages = \App\Models\Message::query()
                ->where(function ($query) use ($userId, $withUser) {
                    $query->where('id_expediteur', $userId)
                          ->where('id_destinataire', $withUser->id);
                })
                ->orWhere(function ($query) use ($userId, $withUser) {
                    $query->where('id_expediteur', $withUser->id)
                          ->where('id_destinataire', $userId);
                })
                ->with(['expediteur', 'destinataire'])
                ->orderBy('date_envoi')
                ->get()
                ->map(fn ($message) => [
                    'id' => $message->id,
                    'contenu' => $message->contenu,
                    'type' => $message->type,
                    'attachment_url' => $message->attachment_path ? asset('storage/' . $message->attachment_path) : null,
                    'location' => $message->meta ? [
                        'latitude' => $message->meta['latitude'] ?? null,
                        'longitude' => $message->meta['longitude'] ?? null,
                    ] : null,
                    'call_type' => in_array($message->type, ['call_audio', 'call_video']) ? $message->type : null,
                    'call_session_id' => $message->call_session_id,
                    'sender_name' => trim($message->expediteur->prenom . ' ' . $message->expediteur->nom),
                    'isMine' => $message->id_expediteur === $userId,
                    'date' => optional($message->date_envoi)->format('d/m H:i'),
                ])
                ->toArray();

            return response()->json(['messages' => $chatMessages]);
        })->name('messages.updates');

        // Page d'appel (client)
        Route::get('call/{withUser}', function (\Illuminate\Http\Request $request, \App\Models\User $withUser) {
            $authUser = $request->user();
            if (! $authUser) abort(403);
            if ($withUser->type_utilisateur !== 'artisan') abort(403);

            $peer = [
                'id' => $withUser->id,
                'nom' => trim($withUser->prenom . ' ' . $withUser->nom),
            ];

            return Inertia::render('client/call', [
                'role' => 'client',
                'peer' => $peer,
            ]);
        })->name('call');

        // Signaling API for calls
        Route::post('call/start', [\App\Http\Controllers\CallController::class, 'start'])->name('call.start');
        Route::post('call/{call}/offer', [\App\Http\Controllers\CallController::class, 'offer'])->name('call.offer');
        Route::post('call/{call}/answer', [\App\Http\Controllers\CallController::class, 'answer'])->name('call.answer');
        Route::post('call/{call}/candidate', [\App\Http\Controllers\CallController::class, 'candidate'])->name('call.candidate');
        Route::get('call/{call}/state', [\App\Http\Controllers\CallController::class, 'state'])->name('call.state');
        Route::get('call/{call}/candidates', [\App\Http\Controllers\CallController::class, 'candidates'])->name('call.candidates');

        Route::post('messages/{withUser}', function (\Illuminate\Http\Request $request, \App\Models\User $withUser) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($withUser->type_utilisateur !== 'artisan') {
                abort(403);
            }

            $validated = $request->validate([
                'type' => ['nullable', \Illuminate\Validation\Rule::in(['text', 'image', 'voice', 'call_audio', 'call_video', 'location'])],
                'contenu' => ['nullable', 'string', 'max:2000'],
                'attachment' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,audio/mpeg,audio/ogg,audio/wav', 'max:20480'],
                'latitude' => ['nullable', 'numeric'],
                'longitude' => ['nullable', 'numeric'],
            ]);

            $type = $validated['type'] ?? 'text';
            $attachmentPath = null;
            $meta = null;
            $messageContent = trim($validated['contenu'] ?? '');

            if ($request->hasFile('attachment')) {
                $attachmentPath = $request->file('attachment')->store('messages', 'public');
                $mime = $request->file('attachment')->getMimeType() ?? '';
                if ($type === 'text') {
                    $type = str_contains($mime, 'audio/') ? 'voice' : 'image';
                }
            }

            if ($type === 'location' && isset($validated['latitude'], $validated['longitude'])) {
                $messageContent = 'Localisation partagée';
                $meta = [
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                ];
            }

            if ($type === 'call_audio') {
                $messageContent = 'Demande d\'appel audio';
            } elseif ($type === 'call_video') {
                $messageContent = 'Demande d\'appel vidéo';
            } elseif (! in_array($type, ['text', 'image', 'voice', 'location'], true)) {
                $type = 'text';
            }

            if ($type === 'text' && $messageContent === '') {
                abort(400, 'Le message ne peut pas être vide.');
            }

            $message = \App\Models\Message::create([
                'id_expediteur' => $authUser->id,
                'id_destinataire' => $withUser->id,
                'contenu' => $messageContent,
                'type' => $type,
                'attachment_path' => $attachmentPath,
                'meta' => $meta,
                'date_envoi' => now(),
                'lu' => false,
            ]);

            return response()->json([
                'ok' => true,
                'message_id' => $message->id,
                'redirect' => route('client.messages', ['withUser' => $withUser->id]),
            ]);
        })->name('messages.send');

        Route::post('messages/{withUser}/call', function (\Illuminate\Http\Request $request, \App\Models\User $withUser) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($withUser->type_utilisateur !== 'artisan') {
                abort(403);
            }

            $validated = $request->validate([
                'type' => ['required', \Illuminate\Validation\Rule::in(['call_audio', 'call_video'])],
            ]);

            $callType = $validated['type'];
            $sessionType = $callType === 'call_video' ? 'video' : 'audio';
            $callSession = \App\Models\CallSession::create([
                'caller_id' => $authUser->id,
                'callee_id' => $withUser->id,
                'type' => $sessionType,
                'statut' => 'pending',
            ]);

            \App\Models\Message::create([
                'id_expediteur' => $authUser->id,
                'id_destinataire' => $withUser->id,
                'contenu' => $callType === 'call_video' ? 'Demande d\'appel vidéo' : 'Demande d\'appel audio',
                'type' => $callType,
                'call_session_id' => $callSession->id,
                'date_envoi' => now(),
                'lu' => false,
            ]);

            return redirect()->route('client.calls.show', ['callSession' => $callSession->id]);
        })->name('messages.call');

        Route::get('calls/{callSession}', function (\Illuminate\Http\Request $request, \App\Models\CallSession $callSession) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($callSession->caller_id !== $authUser->id && $callSession->callee_id !== $authUser->id) {
                abort(403);
            }

            $callSession->load(['caller', 'callee']);
            $isCaller = $callSession->caller_id === $authUser->id;

            return Inertia::render('shared/call', [
                'callSession' => [
                    'id' => $callSession->id,
                    'type' => $callSession->type,
                    'statut' => $callSession->statut,
                    'caller' => [
                        'id' => $callSession->caller->id,
                        'name' => trim($callSession->caller->prenom . ' ' . $callSession->caller->nom),
                    ],
                    'callee' => [
                        'id' => $callSession->callee->id,
                        'name' => trim($callSession->callee->prenom . ' ' . $callSession->callee->nom),
                    ],
                    'isCaller' => $isCaller,
                ],
                'routePrefix' => 'client',
            ]);
        })->name('calls.show');

        Route::get('calls/{callSession}/state', function (\Illuminate\Http\Request $request, \App\Models\CallSession $callSession) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($callSession->caller_id !== $authUser->id && $callSession->callee_id !== $authUser->id) {
                abort(403);
            }

            $direction = $callSession->caller_id === $authUser->id ? 'answer' : 'offer';
            $remoteDirection = $direction === 'offer' ? 'answer' : 'offer';

            $remoteCandidates = \App\Models\CallSessionCandidate::query()
                ->where('call_session_id', $callSession->id)
                ->where('direction', $remoteDirection)
                ->get()
                ->map(fn ($candidate) => $candidate->candidate)
                ->toArray();

            return response()->json([
                'statut' => $callSession->statut,
                'type' => $callSession->type,
                'offer' => $callSession->offer,
                'answer' => $callSession->answer,
                'remoteCandidates' => $remoteCandidates,
            ]);
        })->name('calls.state');

        Route::post('calls/{callSession}/offer', function (\Illuminate\Http\Request $request, \App\Models\CallSession $callSession) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($callSession->caller_id !== $authUser->id) {
                abort(403);
            }

            $validated = $request->validate([
                'offer' => ['required', 'string'],
            ]);

            $callSession->update(['offer' => $validated['offer']]);
            return response()->json(['ok' => true]);
        })->name('calls.offer');

        Route::post('calls/{callSession}/answer', function (\Illuminate\Http\Request $request, \App\Models\CallSession $callSession) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($callSession->callee_id !== $authUser->id || $callSession->offer === null) {
                abort(403);
            }

            $validated = $request->validate([
                'answer' => ['required', 'string'],
            ]);

            $callSession->update(['answer' => $validated['answer'], 'statut' => 'accepted']);
            return response()->json(['ok' => true]);
        })->name('calls.answer');

        Route::post('calls/{callSession}/candidate', function (\Illuminate\Http\Request $request, \App\Models\CallSession $callSession) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($callSession->caller_id !== $authUser->id && $callSession->callee_id !== $authUser->id) {
                abort(403);
            }

            $direction = $callSession->caller_id === $authUser->id ? 'offer' : 'answer';

            $validated = $request->validate([
                'candidate' => ['required', 'array'],
            ]);

            \App\Models\CallSessionCandidate::create([
                'call_session_id' => $callSession->id,
                'sender_id' => $authUser->id,
                'direction' => $direction,
                'candidate' => $validated['candidate'],
            ]);

            return response()->json(['ok' => true]);
        })->name('calls.candidate');

        Route::post('calls/{callSession}/end', function (\Illuminate\Http\Request $request, \App\Models\CallSession $callSession) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($callSession->caller_id !== $authUser->id && $callSession->callee_id !== $authUser->id) {
                abort(403);
            }

            $callSession->update(['statut' => 'ended']);
            return response()->json(['ok' => true]);
        })->name('calls.end');

        Route::get('paiements', function () {
            return Inertia::render('client/paiements', ['paiements' => [], 'total_depense' => 0]);
        })->name('paiements');

        Route::get('paiements/create/{reservation_id}', function (string $reservation_id) {
            $reservation = \App\Models\Reservation::find($reservation_id);
            if (!$reservation) {
                abort(404);
            }

            return Inertia::render('client/paiements-create', [
                'reservation' => [
                    'id' => $reservation->id,
                    'statut' => $reservation->statut,
                    'date' => optional($reservation->date)->format('Y-m-d'),
                    'date_reservation' => optional($reservation->date)->format('Y-m-d'),
                    'montant_total' => $reservation->montant_total,
                    'artisan' => $reservation->artisan ? [
                        'metier' => $reservation->artisan->metier,
                        'user' => [
                            'prenom' => $reservation->artisan->user->prenom,
                            'nom' => $reservation->artisan->user->nom,
                            'telephone' => $reservation->artisan->user->telephone,
                        ],
                        'payment_provider' => $reservation->artisan->payment_provider,
                        'payment_provider_name' => $reservation->artisan->payment_provider ? ($reservation->artisan->payment_provider === 'kkiapay' ? 'Kkiapay' : 'Fedapay') : null,
                        'payment_account_id' => $reservation->artisan->payment_account_id,
                        'payment_method' => $reservation->artisan->payment_method,
                    ] : null,
                ],
            ]);
        })->name('paiements.create');

        Route::post('paiements', function (\Illuminate\Http\Request $request) {
            $reservation = \App\Models\Reservation::find($request->reservation_id);
            if (!$reservation || $reservation->client_id !== auth()->id()) {
                abort(403);
            }

            $validated = $request->validate([
                'method' => 'required|in:card,mobile_money,virement',
                'card_number' => 'nullable|string',
                'card_expiry' => 'nullable|string',
                'card_cvc' => 'nullable|string',
                'cardholder_name' => 'nullable|string',
            ]);

            $artisan = $reservation->artisan;
            $artisanProvider = $artisan?->payment_provider;
            $artisanAccountId = $artisan?->payment_account_id;
            $artisanAccountKey = $artisan?->payment_account_key;
            $artisanMethod = $artisan?->payment_method;

            if (! $artisanProvider || ! in_array($artisanProvider, ['kkiapay', 'fedapay'], true)) {
                return back()->with('error', 'Le prestataire de paiement de l’artisan n’est pas configuré.');
            }

            if (! $artisanAccountId || ! $artisanAccountKey) {
                return back()->with('error', 'Le compte de paiement de l’artisan n’est pas configuré.');
            }

            $method = $artisanMethod ?: $validated['method'];
            if ($artisanMethod && $artisanMethod !== $validated['method']) {
                $request->merge(['method' => $artisanMethod]);
            }

            $useExternalGateway = in_array($method, ['card', 'mobile_money'], true);

            $paiement = \App\Models\Paiement::create([
                'id_reservation' => $reservation->id,
                'id_utilisateur' => auth()->id(),
                'montant' => $reservation->montant_total,
                'commission' => 0,
                'type_transaction' => 'acompte',
                'methode_paiement' => $method,
                'payment_provider' => $artisanProvider,
                'statut' => $useExternalGateway ? 'en_attente' : 'reussi',
                'reference_transaction' => \Illuminate\Support\Str::uuid()->toString(),
                'date_paiement' => now(),
            ]);

            if ($useExternalGateway) {
                $gateway = new \App\Services\PaymentGatewayService();
                $checkoutUrl = $gateway->createCheckoutUrl($artisanProvider, [
                    'amount' => $reservation->montant_total,
                    'currency' => 'XOF',
                    'reference' => $paiement->reference_transaction,
                    'reservation_id' => $reservation->id,
                    'customer_name' => trim(auth()->user()->prenom . ' ' . auth()->user()->nom),
                    'customer_email' => auth()->user()->email,
                    'customer_phone' => auth()->user()->telephone ?? null,
                    'method' => $method,
                    'account_id' => $artisanAccountId,
                    'account_key' => $artisanAccountKey,
                    'return_url' => route('client.reservations'),
                ]);

                return response()->json(['redirect_url' => $checkoutUrl]);
            }

            $reservation->update(['statut' => 'payee']);

            return redirect()->route('client.reservations')->with('success', 'Paiement initialisé avec succès!');
        })->name('paiements.store');

        Route::get('avis', function () {
            $client = auth()->user()->client;
            if (! $client) {
                abort(403);
            }

            $avis = \App\Models\Avis::query()
                ->where('id_client', $client->id)
                ->with('artisan.user')
                ->latest('date_avis')
                ->get()
                ->map(fn ($avis) => [
                    'id' => $avis->id,
                    'note' => $avis->note,
                    'commentaire' => $avis->commentaire,
                    'date_avis' => optional($avis->date_avis)->format('Y-m-d'),
                    'artisan_metier' => $avis->artisan?->metier ?? 'Artisan inconnu',
                    'artisan_nom' => $avis->artisan?->user ? trim($avis->artisan->user->prenom . ' ' . $avis->artisan->user->nom) : 'Artisan inconnu',
                ])
                ->toArray();

            $noteMoyenne = round((float) \App\Models\Avis::query()->where('id_client', $client->id)->avg('note'), 1);

            return Inertia::render('client/avis', ['avis' => $avis, 'note_moyenne' => $noteMoyenne]);
        })->name('avis');

        Route::get('avis/create/{reservation_id}', function (string $reservation_id) {
            $client = auth()->user()->client;
            if (! $client) {
                abort(403);
            }

            $reservation = \App\Models\Reservation::query()
                ->with('artisan.user', 'avis')
                ->find($reservation_id);

            if (! $reservation || $reservation->id_client !== $client->id) {
                abort(404);
            }

            if ($reservation->avis) {
                return redirect()->route('client.avis')->with('error', 'Vous avez déjà laissé un avis pour cette réservation.');
            }

            if (! in_array($reservation->statut, ['confirme', 'confirmee', 'terminee', 'termine'], true)) {
                return redirect()->route('client.reservations')->with('error', 'Vous pouvez laisser un avis uniquement après la confirmation ou la fin de la prestation.');
            }

            return Inertia::render('client/avis-create', [
                'reservation' => [
                    'id' => $reservation->id,
                    'date_reservation' => optional($reservation->date)->format('Y-m-d'),
                    'artisan' => $reservation->artisan ? [
                        'metier' => $reservation->artisan->metier,
                        'user' => [
                            'prenom' => $reservation->artisan->user?->prenom,
                            'nom' => $reservation->artisan->user?->nom,
                        ],
                    ] : null,
                ],
            ]);
        })->name('avis.create');

        Route::post('avis', function (\Illuminate\Http\Request $request) {
            $client = auth()->user()->client;
            if (! $client) {
                abort(403);
            }

            $validated = $request->validate([
                'reservation_id' => ['required', 'integer', 'exists:reservations,id'],
                'note' => ['required', 'integer', 'min:1', 'max:5'],
                'commentaire' => ['nullable', 'string', 'max:2000'],
            ]);

            $reservation = \App\Models\Reservation::query()
                ->with('avis')
                ->find($validated['reservation_id']);

            if (! $reservation || $reservation->id_client !== $client->id) {
                abort(404);
            }

            if ($reservation->avis) {
                return back()->with('error', 'Avis déjà enregistré pour cette réservation.');
            }

            if (! in_array($reservation->statut, ['confirme', 'confirmee', 'terminee', 'termine'], true)) {
                return back()->with('error', 'Vous pouvez laisser un avis pour les prestations confirmées ou terminées.');
            }

            \App\Models\Avis::create([
                'id_client' => $client->id,
                'id_artisan' => $reservation->id_artisan,
                'id_reservation' => $reservation->id,
                'note' => $validated['note'],
                'commentaire' => $validated['commentaire'] ?? null,
                'date_avis' => now(),
            ]);

            return redirect()->route('client.avis')->with('success', 'Votre avis a bien été enregistré.');
        })->name('avis.store');

        Route::get('favoris', function () {
            $client = auth()->user()->client;
            if (! $client) {
                abort(403);
            }

            $favoris = $client->favoris()
                ->with(['user:id,prenom,nom', 'categories:id,nom'])
                ->get()
                ->map(fn ($artisan) => [
                    'id' => $artisan->pivot->id,
                    'artisan_id' => $artisan->id,
                    'metier' => $artisan->metier,
                    'note_moyenne' => $artisan->note_moyenne,
                    'badge' => $artisan->badge,
                    'zone_intervention' => $artisan->zone_intervention,
                    'tarifs_horaire' => $artisan->tarifs_horaire,
                    'prenom' => $artisan->user?->prenom,
                    'nom' => $artisan->user?->nom,
                    'categories' => $artisan->categories->pluck('nom')->toArray(),
                ])
                ->toArray();

            return Inertia::render('client/favoris', ['favoris' => $favoris]);
        })->name('favoris');

        Route::post('favoris/{artisan}', function (Artisan $artisan) {
            $client = auth()->user()->client;
            if (! $client) {
                abort(403);
            }

            $client->favoris()->syncWithoutDetaching($artisan->id);

            return back()->with('success', 'Artisan ajouté aux favoris.');
        })->name('favoris.store');

        Route::delete('favoris/{artisan}', function (Artisan $artisan) {
            $client = auth()->user()->client;
            if (! $client) {
                abort(403);
            }

            $client->favoris()->detach($artisan->id);

            return back()->with('success', 'Artisan retiré des favoris.');
        })->name('favoris.destroy');

        Route::get('litiges/create', function () {
            $client = auth()->user()->client;
            if (! $client) {
                abort(403);
            }

            $reservations = $client->reservations()
                ->with(['artisan.user'])
                ->orderByDesc('date_creation')
                ->get()
                ->map(fn ($reservation) => [
                    'id' => $reservation->id,
                    'reference' => "Réservation #{$reservation->id}",
                    'date_reservation' => optional($reservation->date)->format('d/m/Y'),
                    'artisan_metier' => $reservation->artisan?->metier ?? 'Artisan inconnu',
                    'artisan_nom' => $reservation->artisan?->user ? trim($reservation->artisan->user->prenom.' '.$reservation->artisan->user->nom) : 'Nom indisponible',
                ])
                ->toArray();

            return Inertia::render('client/litiges-create', ['reservations' => $reservations]);
        })->name('litiges.create');

        Route::post('litiges', function (\Illuminate\Http\Request $request) {
            $client = auth()->user()->client;
            if (! $client) {
                abort(403);
            }

            $validated = $request->validate([
                'reservation_id' => ['required', 'integer', 'exists:reservations,id'],
                'description_litige' => ['required', 'string', 'min:20', 'max:2000'],
            ]);

            $reservation = $client->reservations()
                ->with(['artisan.user'])
                ->findOrFail($validated['reservation_id']);

            if (\App\Models\Litige::where('id_reservation', $reservation->id)->exists()) {
                return back()->with('error', 'Un litige existe déjà pour cette réservation.');
            }

            $litige = \App\Models\Litige::create([
                'id_client' => $client->id,
                'id_artisan' => $reservation->id_artisan,
                'id_reservation' => $reservation->id,
                'description_litige' => $validated['description_litige'],
                'date_ouverture' => now(),
                'statut' => 'ouvert',
            ]);

            $clientEmail = $client->user?->email;
            $adminEmails = \App\Models\User::where('type_utilisateur', 'admin')
                ->pluck('email')
                ->filter()
                ->toArray();

            $sendMail = function (array|string $recipient, string $subject, string $body): void {
                try {
                    \Illuminate\Support\Facades\Mail::mailer('failover')->raw($body, function ($message) use ($recipient, $subject) {
                        $message->to($recipient)
                            ->subject($subject);
                    });
                } catch (\Throwable $exception) {
                    \Illuminate\Support\Facades\Log::error('Litige notification mail failed', [
                        'recipient' => $recipient,
                        'subject' => $subject,
                        'error' => $exception->getMessage(),
                    ]);
                }
            };

            if ($clientEmail) {
                $sendMail(
                    $clientEmail,
                    'Litige enregistré - ArtisanPro',
                    "Votre litige a bien été enregistré.\n\nRéservation: #{$reservation->id}\nArtisan: {$reservation->artisan?->user?->prenom} {$reservation->artisan?->user?->nom}\n\nDescription:\n{$validated['description_litige']}"
                );
            }

            if (! empty($adminEmails)) {
                $sendMail(
                    $adminEmails,
                    'Nouveau litige client - ArtisanPro',
                    "Un nouveau litige a été ouvert par le client {$client->user?->prenom} {$client->user?->nom}.\n\nRéservation: #{$reservation->id}\nArtisan: {$reservation->artisan?->user?->prenom} {$reservation->artisan?->user?->nom}\n\nDescription:\n{$validated['description_litige']}"
                );
            }

            return redirect()->route('client.litiges')->with('success', 'Litige ouvert et notifications envoyées au client et à l’administrateur.');
        })->name('litiges.store');

        Route::get('litiges', function () {
            return Inertia::render('client/litiges', ['litiges' => []]);
        })->name('litiges');

        Route::get('profil', function () {
            return Inertia::render('client/profil');
        })->name('profil');

        Route::patch('profil', function (\Illuminate\Http\Request $request) {
            $validated = $request->validate([
                'prenom'    => ['nullable', 'string', 'max:100'],
                'nom'       => ['nullable', 'string', 'max:100'],
                'email'     => ['nullable', 'email', 'max:255', 'unique:utilisateurs,email,' . auth()->id()],
                'telephone' => ['nullable', 'string', 'max:20'],
                'adresse'   => ['nullable', 'string', 'max:255'],
                'avatar'    => ['nullable', 'image', 'max:2048'],
            ]);

            /** @var \App\Models\User|null $user */
            $user = auth()->user();
            if (! $user) {
                abort(403);
            }

            $userUpdates = array_filter([
                'prenom'    => $validated['prenom'] ?? null,
                'nom'       => $validated['nom'] ?? null,
                'email'     => $validated['email'] ?? null,
                'telephone' => $validated['telephone'] ?? null,
                'adresse'   => $validated['adresse'] ?? null,
            ], fn ($value) => $value !== null && $value !== '');

            if ($request->hasFile('avatar')) {
                $path = $request->file('avatar')->store('avatars', 'public');
                $userUpdates['avatar'] = \Illuminate\Support\Facades\Storage::url($path);
            }

            $user->update($userUpdates);
            return redirect()->route('client.profil')->with('success', 'Profil mis à jour.');
        })->name('profil.update');
    });

    Route::get('notifications', \App\Http\Controllers\Portal\NotificationsController::class)->name('notifications');
    Route::get('conversations', \App\Http\Controllers\Portal\ConversationController::class)->name('conversations');

    // ── Artisan ───────────────────────────────────────────────────────────────
    Route::prefix('artisan')->name('artisan.')->group(function () {
        Route::get('dashboard', function () {
            $artisan = auth()->user()->artisan;
            if (! $artisan) {
                abort(403);
            }

            $stats = [
                'reservations_total' => $artisan->reservations()->count(),
                'reservations_en_cours' => $artisan->reservations()->where('statut', 'en_cours')->count(),
                'devis_en_attente' => $artisan->devis()->where('statut', 'en_attente')->count(),
                'note_moyenne' => round((float) $artisan->avis()->avg('note'), 1),
                'revenus_total' => (float) $artisan->reservations()->where('statut', 'termine')->sum('montant_total'),
                'avis_total' => $artisan->avis()->count(),
            ];

            $recent_reservations = $artisan->reservations()
                ->with('client.user')
                ->orderByDesc('date_creation')
                ->limit(3)
                ->get()
                ->map(fn ($reservation) => [
                    'id' => $reservation->id,
                    'statut' => $reservation->statut,
                    'date_reservation' => optional($reservation->date)->format('d/m/Y'),
                    'client_nom' => $reservation->client?->user ? trim($reservation->client->user->prenom.' '.$reservation->client->user->nom) : 'Client inconnu',
                    'montant_total' => $reservation->montant_total,
                ])
                ->toArray();

            return Inertia::render('artisan/dashboard', [
                'stats' => $stats,
                'recent_reservations' => $recent_reservations,
            ]);
        })->name('dashboard');

        Route::get('call/{withUser}', function (\Illuminate\Http\Request $request, \App\Models\User $withUser) {
            $authUser = $request->user();
            if (! $authUser) abort(403);
            if ($withUser->type_utilisateur !== 'client') abort(403);

            $peer = [
                'id' => $withUser->id,
                'nom' => trim($withUser->prenom . ' ' . $withUser->nom),
            ];

            return Inertia::render('artisan/call', [
                'role' => 'artisan',
                'peer' => $peer,
            ]);
        })->name('call');

        Route::get('reservations', function () {
            $artisan = auth()->user()->artisan;
            if (! $artisan) {
                abort(403);
            }

            $reservations = $artisan->reservations()
                ->with('client.user')
                ->orderByDesc('date_creation')
                ->get()
                ->map(fn ($reservation) => [
                    'id' => $reservation->id,
                    'statut' => $reservation->statut,
                    'date_reservation' => optional($reservation->date)->format('d/m/Y'),
                    'montant_total' => $reservation->montant_total,
                    'adresse_intervention' => $reservation->adresse_intervention,
                    'client' => $reservation->client ? [
                        'user' => [
                            'prenom' => $reservation->client->user?->prenom,
                            'nom' => $reservation->client->user?->nom,
                            'telephone' => $reservation->client->user?->telephone,
                            'email' => $reservation->client->user?->email,
                        ],
                    ] : null,
                ])
                ->toArray();

            return Inertia::render('artisan/reservations', ['reservations' => $reservations]);
        })->name('reservations');

        Route::get('reservations/{reservation}', \App\Http\Controllers\Portal\ArtisanReservationDetailController::class)->name('reservations.show');

        Route::get('planning', \App\Http\Controllers\Portal\ArtisanPlanningController::class)->name('planning');

        Route::get('academy', \App\Http\Controllers\Portal\ArtisanAcademyController::class)->name('academy');

        Route::get('revenus', \App\Http\Controllers\Portal\ArtisanEarningsController::class)->name('earnings');

        Route::patch('reservations/{reservation}/statut', function (
            \Illuminate\Http\Request $request,
            \App\Models\Reservation $reservation
        ) {
            // Accept both legacy frontend labels and canonical DB enum values.
            $allowed = [
                'confirme' => 'confirmee',
                'confirmee' => 'confirmee',
                'annule' => 'annulee',
                'annulee' => 'annulee',
                'termine' => 'terminee',
                'terminee' => 'terminee',
                'en_attente' => 'en_cours',
                'en_cours' => 'en_cours',
                'litige' => 'litige',
            ];

            $request->validate(['statut' => ['required']]);

            $input = (string) $request->statut;
            if (! array_key_exists($input, $allowed)) {
                abort(422, 'Statut invalide.');
            }

            if ($reservation->id_artisan !== auth()->user()->artisan?->id) abort(403);

            $dbStatut = $allowed[$input];
            $reservation->update(['statut' => $dbStatut]);

            // Send notifications to client based on status change
            $clientEmail = $reservation->client->user->email;
            $artisanUser = $reservation->artisan->user;
            $notificationMessage = 'Statut mis à jour.';

            try {
                $smsService = new \App\Services\SmsNotificationService();
                $mailable = null;
                if ($dbStatut === 'confirmee') {
                    $mailable = new \App\Mail\ReservationConfirmedMail($reservation);
                } elseif ($dbStatut === 'annulee') {
                    $mailable = new \App\Mail\ReservationRejectedMail($reservation);
                }

                if ($mailable !== null) {
                    $mailable->from(new \Symfony\Component\Mime\Address(
                        $artisanUser->email,
                        $artisanUser->prenom . ' ' . $artisanUser->nom
                    ));

                    $mailer = \Illuminate\Support\Facades\Mail::mailer('smtp');

                    if (! empty($artisanUser->smtp_username) && ! empty($artisanUser->smtp_password)) {
                        config([
                            'mail.mailers.smtp.host' => env('MAIL_HOST', 'smtp.gmail.com'),
                            'mail.mailers.smtp.port' => env('MAIL_PORT', 587),
                            'mail.mailers.smtp.encryption' => env('MAIL_ENCRYPTION', 'tls'),
                            'mail.mailers.smtp.username' => $artisanUser->smtp_username,
                            'mail.mailers.smtp.password' => $artisanUser->smtp_password,
                        ]);
                        app()->forgetInstance('mail.manager');
                        $mailer = \Illuminate\Support\Facades\Mail::mailer('smtp');
                    }

                    $mailer->to($clientEmail)->send($mailable);
                    $smsSendMethod = $dbStatut === 'confirmee' ? 'sendConfirmationSms' : 'sendRejectionSms';
                    $smsService->{$smsSendMethod}($reservation);
                    $notificationMessage = 'Statut mis à jour et notifications envoyées.';
                }
            } catch (\Throwable $exception) {
                \Illuminate\Support\Facades\Log::warning('Notification error for reservation ' . $reservation->id, [
                    'exception' => $exception,
                    'status' => $dbStatut,
                    'client_email' => $clientEmail,
                    'artisan_email' => $artisanUser->email,
                ]);
                $notificationMessage = 'Statut mis à jour. Envoi de notification impossible pour le moment.';
            }

            return back()->with('success', $notificationMessage);
        })->name('reservations.statut');

        Route::get('devis', function () {
            $artisan = auth()->user()->artisan;
            if (! $artisan) {
                abort(403);
            }

            $devis = $artisan->devis()
                ->with('client.user')
                ->orderByDesc('date_demande')
                ->get()
                ->map(fn ($devisModel) => [
                    'id' => $devisModel->id,
                    'description_travaux' => $devisModel->description_travaux,
                    'statut' => $devisModel->statut,
                    'created_at' => optional($devisModel->date_demande)->toDateTimeString(),
                    'client' => [
                        'user' => [
                            'prenom' => $devisModel->client?->user?->prenom,
                            'nom' => $devisModel->client?->user?->nom,
                            'email' => $devisModel->client?->user?->email,
                            'telephone' => $devisModel->client?->user?->telephone,
                        ],
                    ],
                ])
                ->toArray();

            return Inertia::render('artisan/devis', ['devis' => $devis]);
        })->name('devis');

        Route::patch('devis/{devis}/statut', function (
            \Illuminate\Http\Request $request,
            \App\Models\Devis $devis
        ) {
            $request->validate(['statut' => ['required', 'in:accepte,refuse']]);
            if ($devis->id_artisan !== auth()->user()->artisan?->id) abort(403);
            $devis->update(['statut' => $request->statut]);
            return back()->with('success', 'Devis ' . ($request->statut === 'accepte' ? 'accepté' : 'refusé') . '.');
        })->name('devis.statut');

        Route::get('messages/{withUser?}', function (\Illuminate\Http\Request $request, ?\App\Models\User $withUser = null) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($withUser && $withUser->type_utilisateur !== 'client') {
                abort(403);
            }

            $userId = $authUser->id;
            $messageList = \App\Models\Message::query()
                ->where(function ($query) use ($userId) {
                    $query->where('id_expediteur', $userId)
                          ->orWhere('id_destinataire', $userId);
                })
                ->with(['expediteur', 'destinataire'])
                ->orderByDesc('date_envoi')
                ->get();

            $threads = [];
            foreach ($messageList as $message) {
                $otherUser = $message->id_expediteur === $userId
                    ? $message->destinataire
                    : $message->expediteur;

                if (! $otherUser || $otherUser->type_utilisateur !== 'client') {
                    continue;
                }

                $key = $otherUser->id;
                if (! isset($threads[$key])) {
                    $threads[$key] = [
                        'id' => $otherUser->id,
                        'client_nom' => trim($otherUser->prenom . ' ' . $otherUser->nom),
                        'dernier_message' => $message->contenu,
                        'date' => optional($message->date_envoi)->format('d/m à H:i'),
                        'non_lus' => 0,
                        'en_ligne' => false,
                    ];
                }

                if ($message->id_destinataire === $userId && ! $message->lu) {
                    $threads[$key]['non_lus']++;
                }
            }

            $conversations = array_values($threads);
            $selectedConversation = null;
            $chatMessages = [];

            if ($withUser) {
                $selectedConversation = [
                    'id' => $withUser->id,
                    'nom' => trim($withUser->prenom . ' ' . $withUser->nom),
                ];

                $chatMessages = \App\Models\Message::query()
                    ->where(function ($query) use ($userId, $withUser) {
                        $query->where('id_expediteur', $userId)
                              ->where('id_destinataire', $withUser->id);
                    })
                    ->orWhere(function ($query) use ($userId, $withUser) {
                        $query->where('id_expediteur', $withUser->id)
                              ->where('id_destinataire', $userId);
                    })
                    ->with(['expediteur', 'destinataire'])
                    ->orderBy('date_envoi')
                    ->get()
                    ->map(fn ($message) => [
                        'id' => $message->id,
                        'contenu' => $message->contenu,
                        'type' => $message->type,
                        'attachment_url' => $message->attachment_path ? asset('storage/' . $message->attachment_path) : null,
                        'location' => $message->meta ? [
                            'latitude' => $message->meta['latitude'] ?? null,
                            'longitude' => $message->meta['longitude'] ?? null,
                        ] : null,
                        'call_type' => in_array($message->type, ['call_audio', 'call_video']) ? $message->type : null,
                        'call_session_id' => $message->call_session_id,
                        'sender_name' => trim($message->expediteur->prenom . ' ' . $message->expediteur->nom),
                        'isMine' => $message->id_expediteur === $userId,
                        'date' => optional($message->date_envoi)->format('d/m H:i'),
                    ])
                    ->toArray();

                \App\Models\Message::query()
                    ->where('id_expediteur', $withUser->id)
                    ->where('id_destinataire', $userId)
                    ->where('lu', false)
                    ->update(['lu' => true]);
            }

            return Inertia::render('artisan/messages', [
                'conversations' => $conversations,
                'selectedConversation' => $selectedConversation,
                'messages' => $chatMessages,
            ]);
        })->name('messages');

        Route::get('messages/{withUser}/updates', function (\Illuminate\Http\Request $request, \App\Models\User $withUser) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($withUser->type_utilisateur !== 'client') {
                abort(403);
            }

            $userId = $authUser->id;
            $chatMessages = \App\Models\Message::query()
                ->where(function ($query) use ($userId, $withUser) {
                    $query->where('id_expediteur', $userId)
                          ->where('id_destinataire', $withUser->id);
                })
                ->orWhere(function ($query) use ($userId, $withUser) {
                    $query->where('id_expediteur', $withUser->id)
                          ->where('id_destinataire', $userId);
                })
                ->with(['expediteur', 'destinataire'])
                ->orderBy('date_envoi')
                ->get()
                ->map(fn ($message) => [
                    'id' => $message->id,
                    'contenu' => $message->contenu,
                    'type' => $message->type,
                    'attachment_url' => $message->attachment_path ? asset('storage/' . $message->attachment_path) : null,
                    'location' => $message->meta ? [
                        'latitude' => $message->meta['latitude'] ?? null,
                        'longitude' => $message->meta['longitude'] ?? null,
                    ] : null,
                    'call_type' => in_array($message->type, ['call_audio', 'call_video']) ? $message->type : null,
                    'call_session_id' => $message->call_session_id,
                    'sender_name' => trim($message->expediteur->prenom . ' ' . $message->expediteur->nom),
                    'isMine' => $message->id_expediteur === $userId,
                    'date' => optional($message->date_envoi)->format('d/m H:i'),
                ])
                ->toArray();

            return response()->json(['messages' => $chatMessages]);
        })->name('messages.updates');

        Route::post('messages/{withUser}', function (\Illuminate\Http\Request $request, \App\Models\User $withUser) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($withUser->type_utilisateur !== 'client') {
                abort(403);
            }

            $validated = $request->validate([
                'type' => ['nullable', \Illuminate\Validation\Rule::in(['text', 'image', 'voice', 'call_audio', 'call_video', 'location'])],
                'contenu' => ['nullable', 'string', 'max:2000'],
                'attachment' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,audio/mpeg,audio/ogg,audio/wav', 'max:20480'],
                'latitude' => ['nullable', 'numeric'],
                'longitude' => ['nullable', 'numeric'],
            ]);

            $type = $validated['type'] ?? 'text';
            $attachmentPath = null;
            $meta = null;
            $messageContent = trim($validated['contenu'] ?? '');

            if ($request->hasFile('attachment')) {
                $attachmentPath = $request->file('attachment')->store('messages', 'public');
                $mime = $request->file('attachment')->getMimeType() ?? '';
                if ($type === 'text') {
                    $type = str_contains($mime, 'audio/') ? 'voice' : 'image';
                }
            }

            if ($type === 'location' && isset($validated['latitude'], $validated['longitude'])) {
                $messageContent = 'Localisation partagée';
                $meta = [
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                ];
            }

            if ($type === 'call_audio') {
                $messageContent = 'Demande d\'appel audio';
            } elseif ($type === 'call_video') {
                $messageContent = 'Demande d\'appel vidéo';
            } elseif (! in_array($type, ['text', 'image', 'voice', 'location'], true)) {
                $type = 'text';
            }

            if ($type === 'text' && $messageContent === '') {
                abort(400, 'Le message ne peut pas être vide.');
            }

            $message = \App\Models\Message::create([
                'id_expediteur' => $authUser->id,
                'id_destinataire' => $withUser->id,
                'contenu' => $messageContent,
                'type' => $type,
                'attachment_path' => $attachmentPath,
                'meta' => $meta,
                'date_envoi' => now(),
                'lu' => false,
            ]);

            return response()->json([
                'ok' => true,
                'message_id' => $message->id,
                'redirect' => route('artisan.messages', ['withUser' => $withUser->id]),
            ]);
        })->name('messages.send');

        Route::post('messages/{withUser}/call', function (\Illuminate\Http\Request $request, \App\Models\User $withUser) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($withUser->type_utilisateur !== 'client') {
                abort(403);
            }

            $validated = $request->validate([
                'type' => ['required', \Illuminate\Validation\Rule::in(['call_audio', 'call_video'])],
            ]);

            $callType = $validated['type'];
            $sessionType = $callType === 'call_video' ? 'video' : 'audio';
            $callSession = \App\Models\CallSession::create([
                'caller_id' => $authUser->id,
                'callee_id' => $withUser->id,
                'type' => $sessionType,
                'statut' => 'pending',
            ]);

            \App\Models\Message::create([
                'id_expediteur' => $authUser->id,
                'id_destinataire' => $withUser->id,
                'contenu' => $callType === 'call_video' ? 'Demande d\'appel vidéo' : 'Demande d\'appel audio',
                'type' => $callType,
                'call_session_id' => $callSession->id,
                'date_envoi' => now(),
                'lu' => false,
            ]);

            return redirect()->route('artisan.calls.show', ['callSession' => $callSession->id]);
        })->name('messages.call');

        Route::get('calls/{callSession}', function (\Illuminate\Http\Request $request, \App\Models\CallSession $callSession) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($callSession->caller_id !== $authUser->id && $callSession->callee_id !== $authUser->id) {
                abort(403);
            }

            $callSession->load(['caller', 'callee']);
            $isCaller = $callSession->caller_id === $authUser->id;

            return Inertia::render('shared/call', [
                'callSession' => [
                    'id' => $callSession->id,
                    'type' => $callSession->type,
                    'statut' => $callSession->statut,
                    'caller' => [
                        'id' => $callSession->caller->id,
                        'name' => trim($callSession->caller->prenom . ' ' . $callSession->caller->nom),
                    ],
                    'callee' => [
                        'id' => $callSession->callee->id,
                        'name' => trim($callSession->callee->prenom . ' ' . $callSession->callee->nom),
                    ],
                    'isCaller' => $isCaller,
                ],
            ]);
        })->name('calls.show');

        Route::get('calls/{callSession}/state', function (\Illuminate\Http\Request $request, \App\Models\CallSession $callSession) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($callSession->caller_id !== $authUser->id && $callSession->callee_id !== $authUser->id) {
                abort(403);
            }

            $direction = $callSession->caller_id === $authUser->id ? 'answer' : 'offer';
            $remoteDirection = $direction === 'offer' ? 'answer' : 'offer';

            $remoteCandidates = \App\Models\CallSessionCandidate::query()
                ->where('call_session_id', $callSession->id)
                ->where('direction', $remoteDirection)
                ->get()
                ->map(fn ($candidate) => $candidate->candidate)
                ->toArray();

            return response()->json([
                'statut' => $callSession->statut,
                'type' => $callSession->type,
                'offer' => $callSession->offer,
                'answer' => $callSession->answer,
                'remoteCandidates' => $remoteCandidates,
            ]);
        })->name('calls.state');

        Route::post('calls/{callSession}/offer', function (\Illuminate\Http\Request $request, \App\Models\CallSession $callSession) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($callSession->caller_id !== $authUser->id) {
                abort(403);
            }

            $validated = $request->validate([
                'offer' => ['required', 'string'],
            ]);

            $callSession->update(['offer' => $validated['offer']]);
            return response()->json(['ok' => true]);
        })->name('calls.offer');

        Route::post('calls/{callSession}/answer', function (\Illuminate\Http\Request $request, \App\Models\CallSession $callSession) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($callSession->callee_id !== $authUser->id || $callSession->offer === null) {
                abort(403);
            }

            $validated = $request->validate([
                'answer' => ['required', 'string'],
            ]);

            $callSession->update(['answer' => $validated['answer'], 'statut' => 'accepted']);
            return response()->json(['ok' => true]);
        })->name('calls.answer');

        Route::post('calls/{callSession}/candidate', function (\Illuminate\Http\Request $request, \App\Models\CallSession $callSession) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($callSession->caller_id !== $authUser->id && $callSession->callee_id !== $authUser->id) {
                abort(403);
            }

            $direction = $callSession->caller_id === $authUser->id ? 'offer' : 'answer';

            $validated = $request->validate([
                'candidate' => ['required', 'array'],
            ]);

            \App\Models\CallSessionCandidate::create([
                'call_session_id' => $callSession->id,
                'sender_id' => $authUser->id,
                'direction' => $direction,
                'candidate' => $validated['candidate'],
            ]);

            return response()->json(['ok' => true]);
        })->name('calls.candidate');

        Route::post('calls/{callSession}/end', function (\Illuminate\Http\Request $request, \App\Models\CallSession $callSession) {
            $authUser = $request->user();
            if (! $authUser) {
                abort(403);
            }

            if ($callSession->caller_id !== $authUser->id && $callSession->callee_id !== $authUser->id) {
                abort(403);
            }

            $callSession->update(['statut' => 'ended']);
            return response()->json(['ok' => true]);
        })->name('calls.end');

        Route::get('paiements', function () {
            return Inertia::render('artisan/paiements', [
                'paiements' => [], 'revenus_total' => 0,
                'revenus_mois' => 0, 'en_attente' => 0,
            ]);
        })->name('paiements');

        Route::get('avis', function () {
            $artisan = auth()->user()->artisan;
            if (! $artisan) {
                abort(403);
            }

            $avis = $artisan->avis()
                ->with('client.user')
                ->latest('date_avis')
                ->get()
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'note' => $item->note,
                    'commentaire' => $item->commentaire,
                    'date_avis' => optional($item->date_avis)->format('Y-m-d'),
                    'client_prenom' => $item->client?->user?->prenom ?? 'Client',
                    'client_nom' => $item->client?->user?->nom ?? '',
                ])
                ->toArray();

            $noteMoyenne = round((float) $artisan->avis()->avg('note'), 1);

            return Inertia::render('artisan/avis', ['avis' => $avis, 'note_moyenne' => $noteMoyenne]);
        })->name('avis');

        Route::get('portfolio', function () {
            return Inertia::render('artisan/portfolio', ['portfolio' => []]);
        })->name('portfolio');

        Route::get('profil', function () {
            $artisan = auth()->user()->artisan;

            return Inertia::render('artisan/profil', ['artisan' => $artisan ? [
                'metier' => $artisan->metier,
                'description' => $artisan->description,
                'bio' => $artisan->bio,
                'zone_intervention' => $artisan->zone_intervention,
                'tarifs_horaire' => $artisan->tarifs_horaire,
                'note_moyenne' => $artisan->avis()->avg('note') ?? 0,
                'badge' => $artisan->badge ?? 'aucun',
                'payment_provider' => $artisan->payment_provider,
                'payment_account_id' => $artisan->payment_account_id,
                'payment_method' => $artisan->payment_method,
            ] : null]);
        })->name('profil');

        Route::patch('profil', function (\Illuminate\Http\Request $request) {
            $validated = $request->validate([
                'prenom'           => ['required', 'string', 'max:100'],
                'nom'              => ['required', 'string', 'max:100'],
                'email'            => ['required', 'email', 'max:255', 'unique:utilisateurs,email,' . auth()->id()],
                'telephone'        => ['nullable', 'string', 'max:20'],
                'smtp_username'    => ['nullable', 'email', 'max:255'],
                'smtp_password'    => ['nullable', 'string', 'max:255'],
                'metier'           => ['required', 'string', 'max:150'],
                'description'      => ['nullable', 'string'],
                'bio'              => ['nullable', 'string'],
                'zone_intervention'=> ['nullable', 'string', 'max:255'],
                'tarifs_horaire'   => ['nullable', 'numeric', 'min:0'],
                'payment_provider' => ['nullable', 'in:kkiapay,fedapay'],
                'payment_account_id' => ['nullable', 'string', 'max:255'],
                'payment_account_key' => ['nullable', 'string', 'max:255'],
                'payment_method' => ['nullable', 'in:card,mobile_money,virement'],
                'avatar'          => ['nullable', 'image', 'max:2048'],
            ]);

            /** @var \App\Models\User|null $user */
            $user = auth()->user();
            if (! $user) {
                abort(403);
            }

            $userUpdates = [
                'prenom'        => $validated['prenom'],
                'nom'           => $validated['nom'],
                'email'         => $validated['email'],
                'telephone'     => $validated['telephone'] ?? null,
                'smtp_username' => $validated['smtp_username'] ?? null,
            ];

            if ($request->hasFile('avatar')) {
                $path = $request->file('avatar')->store('avatars', 'public');
                $userUpdates['avatar'] = \Illuminate\Support\Facades\Storage::url($path);
            }

            if (! empty($validated['smtp_password'])) {
                $userUpdates['smtp_password'] = $validated['smtp_password'];
            }

            $user->update($userUpdates);

            auth()->user()->artisan?->update([
                'metier'            => $validated['metier'],
                'description'       => $validated['description'] ?? null,
                'bio'               => $validated['bio'] ?? null,
                'zone_intervention' => $validated['zone_intervention'] ?? null,
                'tarifs_horaire'    => $validated['tarifs_horaire'] ?? null,
                'payment_provider'  => $validated['payment_provider'] ?? null,
                'payment_account_id'=> $validated['payment_account_id'] ?? null,
                'payment_account_key'=> $validated['payment_account_key'] ?? null,
                'payment_method'   => $validated['payment_method'] ?? null,
            ]);

            return redirect()->route('artisan.profil')->with('success', 'Profil mis à jour.');
        })->name('profil.update');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
