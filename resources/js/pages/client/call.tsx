import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function ClientCall(props: any) {
    const { role, peer } = props;

    return (
        <AppLayout>
            <Head title="Appel - ArtisanPro" />
            <div className="p-6">
                <h1 className="text-2xl font-semibold">Appel {role}</h1>
                <p className="mt-2 text-gray-600">Vous appelez : {peer?.nom ?? '—'}</p>
                <p className="mt-4 text-sm text-gray-500">Interface WebRTC à implémenter ici.</p>
                <div className="mt-4">
                    <button id="startCall" className="rounded bg-blue-600 text-white px-4 py-2">Démarrer l'appel</button>
                    <div className="mt-4">
                        <video id="localVideo" autoPlay muted className="w-48 h-36 bg-black" />
                        <video id="remoteVideo" autoPlay className="w-48 h-36 bg-black ml-4" />
                    </div>
                </div>
                <script dangerouslySetInnerHTML={{ __html: `
                    (function(){
                        const startBtn = document.getElementById('startCall');
                        const localVideo = document.getElementById('localVideo');
                        const remoteVideo = document.getElementById('remoteVideo');
                        let pc;
                        let callId;

                        const userId = document.querySelector('meta[name="user-id"]').getAttribute('content');
                        const ws = new WebSocket((location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.hostname + ':6001');

                        ws.addEventListener('open', () => {
                            ws.send(JSON.stringify({ type: 'register', payload: { userId } }));
                        });

                        ws.addEventListener('message', async (ev) => {
                            const m = JSON.parse(ev.data || '{}');
                            if (m.type === 'call-answer') {
                                const answer = m.payload.answer;
                                if (answer && pc) {
                                    await pc.setRemoteDescription(answer);
                                }
                            }
                            if (m.type === 'ice-candidate') {
                                const cand = m.payload.candidate;
                                if (cand && pc) {
                                    try { await pc.addIceCandidate(cand); } catch(e) { }
                                }
                            }
                        });

                        async function start() {
                            const res = await fetch(route('client.call.start'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                                body: JSON.stringify({ callee_id: ${peer?.id ?? 'null'}, type: 'video' })
                            });
                            const json = await res.json();
                            callId = json.call_session_id;

                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                            localVideo.srcObject = stream;

                            pc = new RTCPeerConnection();
                            stream.getTracks().forEach(t => pc.addTrack(t, stream));
                            pc.ontrack = (ev) => { remoteVideo.srcObject = ev.streams[0]; };
                            pc.onicecandidate = async (e) => {
                                if (!e.candidate) return;
                                ws.send(JSON.stringify({ type: 'ice-candidate', payload: { callId, candidate: e.candidate, toUserId: ${peer?.id ?? 'null'} } }));
                            };

                            const offer = await pc.createOffer();
                            await pc.setLocalDescription(offer);

                            // send offer via websocket (and let server queue if offline)
                            ws.send(JSON.stringify({ type: 'call-created', payload: { callId, calleeId: ${peer?.id ?? 'null'}, offer, callerId: userId } }));
                        }

                        startBtn.addEventListener('click', start);
                    })();
                ` }} />
                <div className="mt-6">
                    <Link href={route('client.messages', { withUser: peer?.id })} className="text-blue-600">Retourner au chat</Link>
                </div>
            </div>
        </AppLayout>
    );
}
