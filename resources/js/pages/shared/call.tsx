import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';

declare const route: any;

type CallSessionProps = {
    callSession: {
        id: number;
        type: 'audio' | 'video';
        statut: string;
        caller: { id: number; name: string };
        callee: { id: number; name: string };
        isCaller: boolean;
    };
    routePrefix: 'client' | 'artisan';
};

export default function SharedCall(props: CallSessionProps) {
    const { callSession, routePrefix } = props;
    const [status, setStatus] = useState('En attente');
    const [pendingOffer, setPendingOffer] = useState<RTCSessionDescriptionInit | null>(null);
    const [pendingCallerId, setPendingCallerId] = useState<string | null>(null);
    const [callStarted, setCallStarted] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const userId = typeof document !== 'undefined'
        ? document.querySelector('meta[name="user-id"]')?.getAttribute('content') ?? ''
        : '';

    const otherUser = callSession.isCaller ? callSession.callee : callSession.caller;
    const otherUserId = String(otherUser.id);
    const callId = String(callSession.id);

    useEffect(() => {
        if (!userId) {
            return;
        }

        const ws = new WebSocket((location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.hostname + ':6001');
        wsRef.current = ws;

        ws.addEventListener('open', () => {
            ws.send(JSON.stringify({ type: 'register', payload: { userId } }));
        });

        ws.addEventListener('message', async (event) => {
            const m = JSON.parse(event.data || '{}');
            const payload = m.payload || {};

            if (m.type === 'incoming-call' && String(payload.callId) === callId) {
                setPendingOffer(payload.offer);
                setPendingCallerId(String(payload.callerId));
                setStatus('Appel entrant');
            }

            if (m.type === 'call-answer' && String(payload.callId) === callId && pcRef.current) {
                try {
                    await pcRef.current.setRemoteDescription(payload.answer);
                    setStatus('Connecté');
                } catch (error) {
                    console.error('Erreur setRemoteDescription answer', error);
                }
            }

            if (m.type === 'ice-candidate' && String(payload.callId) === callId && pcRef.current) {
                try {
                    await pcRef.current.addIceCandidate(payload.candidate);
                } catch (error) {
                    console.error('Erreur addIceCandidate', error);
                }
            }

            if (m.type === 'call-end' && String(payload.callId) === callId) {
                if (pcRef.current) {
                    pcRef.current.close();
                    pcRef.current = null;
                }
                setStatus('Appel terminé');
            }
        });

        return () => {
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            ws.close();
        };
    }, [callId, userId]);

    const createPeerConnection = async (stream: MediaStream) => {
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        pc.onicecandidate = (event) => {
            if (!event.candidate || !wsRef.current) {
                return;
            }
            wsRef.current.send(JSON.stringify({
                type: 'ice-candidate',
                payload: {
                    callId,
                    candidate: event.candidate,
                    toUserId: otherUserId,
                },
            }));
        };

        return pc;
    };

    const startCall = async () => {
        if (!wsRef.current || callStarted) return;

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callSession.type === 'video',
        });

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        const pc = await createPeerConnection(stream);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        wsRef.current.send(JSON.stringify({
            type: 'call-created',
            payload: {
                callId,
                calleeId: otherUserId,
                offer,
                callerId: userId,
            },
        }));

        setCallStarted(true);
        setStatus('Appel en cours');
    };

    const answerCall = async () => {
        if (!wsRef.current || !pendingOffer || !pendingCallerId) {
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callSession.type === 'video',
        });

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        const pc = await createPeerConnection(stream);
        await pc.setRemoteDescription(pendingOffer);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        wsRef.current.send(JSON.stringify({
            type: 'call-answer',
            payload: {
                callId,
                answer,
                toUserId: pendingCallerId,
            },
        }));

        setPendingOffer(null);
        setPendingCallerId(null);
        setCallStarted(true);
        setStatus('Connecté');
    };

    const endCall = () => {
        if (!wsRef.current) return;
        wsRef.current.send(JSON.stringify({
            type: 'call-end',
            payload: {
                callId,
                toUserId: otherUserId,
            },
        }));
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        setStatus('Appel terminé');
    };

    const messagesRoute = route(`${routePrefix}.messages`, { withUser: otherUser.id });

    return (
        <AppLayout>
            <Head title="Appel - ArtisanPro" />
            <div className="p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold">Appel {callSession.type === 'video' ? 'vidéo' : 'audio'}</h1>
                        <p className="mt-2 text-gray-600">Avec {otherUser.name}</p>
                        <p className="mt-1 text-sm text-gray-500">Statut : {status}</p>
                    </div>
                    <Link href={messagesRoute} className="text-blue-600 underline">Retour au chat</Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                        <div className="rounded-3xl border border-gray-200 bg-slate-950/5 p-4">
                            <p className="text-sm font-semibold text-slate-700 mb-3">Ma caméra</p>
                            <video ref={localVideoRef} autoPlay muted playsInline className="w-full rounded-2xl bg-black aspect-video" />
                        </div>
                        <div className="rounded-3xl border border-gray-200 bg-slate-950/5 p-4">
                            <p className="text-sm font-semibold text-slate-700 mb-3">Flux distant</p>
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded-2xl bg-black aspect-video" />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <p className="text-sm text-gray-500">Vous êtes connecté en tant que {callSession.isCaller ? 'appelant' : 'appelé'}.</p>
                        <div className="mt-6 flex flex-col gap-3">
                            {callSession.isCaller ? (
                                <button
                                    type="button"
                                    onClick={startCall}
                                    disabled={callStarted}
                                    className="rounded-full bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                    Démarrer l'appel
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={answerCall}
                                    disabled={!pendingOffer || callStarted}
                                    className="rounded-full bg-indigo-600 px-5 py-3 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                    Répondre à l'appel
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={endCall}
                                className="rounded-full border border-gray-200 px-5 py-3 text-gray-700 hover:bg-gray-50"
                            >
                                Terminer l'appel
                            </button>
                        </div>
                        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                            <p>Identifiant de session : {callSession.id}</p>
                            <p>Type : {callSession.type}</p>
                            <p>Utilisateur distant : {otherUser.name}</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
