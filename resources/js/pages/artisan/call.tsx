import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function ArtisanCall(props: any) {
    const { role, peer } = props;

    return (
        <AppLayout>
            <Head title="Appel - ArtisanPro" />
            <div className="p-6">
                <h1 className="text-2xl font-semibold">Appel {role}</h1>
                <p className="mt-2 text-gray-600">Vous appelez : {peer?.nom ?? '—'}</p>
                <p className="mt-4 text-sm text-gray-500">Interface WebRTC à implémenter ici.</p>
                <div className="mt-4">
                    <button id="answerCall" className="rounded bg-indigo-600 text-white px-4 py-2">Répondre</button>
                    <div className="mt-4">
                        <video id="localVideo" autoPlay muted className="w-48 h-36 bg-black" />
                        <video id="remoteVideo" autoPlay className="w-48 h-36 bg-black ml-4" />
                    </div>
                </div>
                <script dangerouslySetInnerHTML={{ __html: `
                    (function(){
                        const answerBtn = document.getElementById('answerCall');
                        const localVideo = document.getElementById('localVideo');
                        const remoteVideo = document.getElementById('remoteVideo');
                        let pc;
                        let pendingOffer = null;
                        let pendingCallId = null;
                        let pendingCallerId = null;

                        const userId = document.querySelector('meta[name="user-id"]').getAttribute('content');
                        const ws = new WebSocket((location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.hostname + ':6001');

                        ws.addEventListener('open', () => {
                            ws.send(JSON.stringify({ type: 'register', payload: { userId } }));
                        });

                        ws.addEventListener('message', async (ev) => {
                            const m = JSON.parse(ev.data || '{}');
                            if (m.type === 'incoming-call') {
                                // store offer and call id
                                pendingOffer = m.payload.offer;
                                pendingCallId = m.payload.callId;
                                pendingCallerId = m.payload.callerId;
                                // optionally notify user (UI could be improved)
                                alert('Appel entrant... cliquez sur Répondre pour accepter.');
                            }
                            if (m.type === 'ice-candidate') {
                                const cand = m.payload.candidate;
                                if (cand && pc) {
                                    try { await pc.addIceCandidate(cand); } catch(e) { }
                                }
                            }
                            if (m.type === 'call-end') {
                                if (pc) { pc.close(); pc = null; }
                                alert('Appel terminé');
                            }
                        });

                        async function answer() {
                            if (!pendingCallId || !pendingOffer) { alert('Aucun appel en attente'); return; }

                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                            localVideo.srcObject = stream;

                            pc = new RTCPeerConnection();
                            stream.getTracks().forEach(t => pc.addTrack(t, stream));
                            pc.ontrack = (ev) => { remoteVideo.srcObject = ev.streams[0]; };
                            pc.onicecandidate = async (e) => {
                                if (!e.candidate) return;
                                ws.send(JSON.stringify({ type: 'ice-candidate', payload: { callId: pendingCallId, candidate: e.candidate, toUserId: pendingCallerId } }));
                            };

                            await pc.setRemoteDescription(pendingOffer);
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);

                            ws.send(JSON.stringify({ type: 'call-answer', payload: { callId: pendingCallId, answer, toUserId: pendingCallerId } }));

                            // clear pending
                            pendingOffer = null;
                            pendingCallId = null;
                            pendingCallerId = null;
                        }

                        answerBtn.addEventListener('click', answer);
                    })();
                ` }} />

                <div className="mt-6">
                    <Link href={route('artisan.messages', { withUser: peer?.id })} className="text-indigo-600">Retourner au chat</Link>
                </div>
            </div>
        </AppLayout>
    );
}
