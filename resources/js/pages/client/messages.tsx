import { Head, Link, useForm } from '@inertiajs/react';
import { ChangeEventHandler, FormEventHandler, useEffect, useState } from 'react';
import { MessageSquare, ArrowLeft, Send, Search, Circle } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/client/dashboard' },
    { title: 'Messages', href: '/client/messages' },
];

interface Conversation {
    id: number;
    artisan_nom: string;
    artisan_metier: string;
    dernier_message: string;
    date: string;
    non_lus: number;
    en_ligne: boolean;
}

interface MessageItem {
    id: number;
    contenu: string;
    sender_name: string;
    isMine: boolean;
    date: string;
    type?: 'text' | 'image' | 'voice' | 'call_audio' | 'call_video' | 'location';
    attachment_url?: string | null;
    location?: { latitude: number; longitude: number } | null;
    call_type?: 'call_audio' | 'call_video' | null;
    call_session_id?: number | null;
}

interface SelectedConversation {
    id: number;
    nom: string;
    metier?: string;
}

interface Props {
    conversations?: Conversation[];
    selectedConversation?: SelectedConversation | null;
    messages?: MessageItem[];
}

export default function ClientMessages({ conversations = [], selectedConversation = null, messages = [] }: Props) {
    const [sending, setSending] = useState(false);
    const [messagesState, setMessagesState] = useState<MessageItem[]>(messages);
    const { data, setData, errors, reset } = useForm({
        contenu: '',
        type: 'text',
        attachment: null as File | null,
        latitude: null as number | null,
        longitude: null as number | null,
    });

    useEffect(() => {
        if (!selectedConversation) return;
        let mounted = true;
        const fetchMessages = async () => {
            try {
                const res = await fetch(route('client.messages.updates', { withUser: selectedConversation.id }));
                if (!res.ok) return;
                const json = await res.json();
                if (mounted && Array.isArray(json.messages)) setMessagesState(json.messages);
            } catch (error) { console.error('Message polling error:', error); }
        };
        fetchMessages();
        const interval = window.setInterval(fetchMessages, 3000);
        return () => { mounted = false; window.clearInterval(interval); };
    }, [selectedConversation?.id]);

    const handleSend: FormEventHandler = async (e) => {
        e.preventDefault();
        if (!selectedConversation) return;
        if (data.type === 'text' && !data.contenu.trim() && !data.attachment) return;
        setSending(true);
        const formData = new FormData();
        formData.append('contenu', data.contenu ?? '');
        formData.append('type', data.type);
        if (data.attachment) formData.append('attachment', data.attachment);
        if (data.latitude !== null) formData.append('latitude', data.latitude.toString());
        if (data.longitude !== null) formData.append('longitude', data.longitude.toString());
        const res = await fetch(route('client.messages.send', { withUser: selectedConversation.id }), {
            method: 'POST', body: formData,
            headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '' },
        });
        setSending(false);
        if (res.ok) {
            const d = await res.json();
            reset('contenu', 'type', 'attachment', 'latitude', 'longitude');
            window.location.href = d.redirect || route('client.messages', { withUser: selectedConversation.id });
        } else {
            alert('Envoi impossible. Vérifiez le jeton CSRF et réessayez.');
        }
    };

    const handleAttachmentChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) { setData('attachment', null); setData('type', 'text'); return; }
        setData('attachment', file);
        setData('type', file.type.startsWith('audio/') ? 'voice' : 'image');
    };

    const handleSendLocation = async () => {
        if (!selectedConversation) return;
        if (!navigator.geolocation) { alert("La géolocalisation n'est pas prise en charge."); return; }
        navigator.geolocation.getCurrentPosition(async (position) => {
            setSending(true);
            const formData = new FormData();
            formData.append('type', 'location');
            formData.append('contenu', 'Localisation partagée');
            formData.append('latitude', position.coords.latitude.toString());
            formData.append('longitude', position.coords.longitude.toString());
            const res = await fetch(route('client.messages.send', { withUser: selectedConversation.id }), {
                method: 'POST', body: formData,
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '' },
            });
            setSending(false);
            if (res.ok) {
                const d = await res.json();
                reset('contenu', 'type', 'attachment', 'latitude', 'longitude');
                window.location.href = d.redirect || route('client.messages', { withUser: selectedConversation.id });
            } else { alert('Envoi impossible.'); }
        }, () => { alert('Impossible de récupérer votre position.'); });
    };

    const handleSendCall = async (callType: 'call_audio' | 'call_video') => {
        if (!selectedConversation) return;
        setSending(true);
        const formData = new FormData();
        formData.append('type', callType);
        formData.append('contenu', callType === 'call_audio' ? "Demande d'appel audio" : "Demande d'appel vidéo");
        const res = await fetch(route('client.messages.send', { withUser: selectedConversation.id }), {
            method: 'POST', body: formData,
            headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '' },
        });
        setSending(false);
        if (res.ok) {
            const d = await res.json();
            reset('contenu', 'type', 'attachment', 'latitude', 'longitude');
            window.location.href = d.redirect || route('client.messages', { withUser: selectedConversation.id });
        } else { alert('Envoi impossible.'); }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Messages - ArtisanPro" />
            <div className="flex flex-col gap-6 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                <div className="flex items-center gap-4">
                    <Link href={route('client.dashboard')} className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Retour
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Messages</h1>
                        <p className="mt-1 text-[hsl(20,10%,50%)]">Vos conversations avec les artisans</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-220px)]">
                    {/* Conversation list */}
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-[hsl(30,20%,88%)]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(20,10%,55%)]" />
                                <input placeholder="Rechercher..." className="w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white pl-10 pr-4 py-2 text-sm text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none" />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {conversations.length === 0 ? (
                                <div className="p-8 text-center">
                                    <MessageSquare className="h-10 w-10 text-amber-300 mx-auto mb-3" />
                                    <p className="text-[hsl(20,10%,50%)] text-sm">Aucune conversation</p>
                                </div>
                            ) : (
                                conversations.map((conv) => (
                                    <Link key={conv.id} href={route('client.messages', { withUser: conv.id })}
                                        className="flex items-center gap-3 p-4 hover:bg-[hsl(36,33%,97%)] cursor-pointer border-b border-[hsl(30,20%,92%)] transition-colors">
                                        <div className="relative shrink-0">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-lg">
                                                {conv.artisan_nom.charAt(0)}
                                            </div>
                                            {conv.en_ligne && <Circle className="absolute bottom-0 right-0 h-3.5 w-3.5 text-green-500 fill-green-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-[hsl(20,14%,12%)] truncate">{conv.artisan_nom}</p>
                                                <span className="text-xs text-[hsl(20,10%,55%)] shrink-0">{conv.date}</span>
                                            </div>
                                            <p className="text-xs text-[hsl(20,10%,50%)] truncate">{conv.artisan_metier}</p>
                                            <p className="text-sm text-[hsl(20,10%,45%)] truncate mt-0.5">{conv.dernier_message}</p>
                                        </div>
                                        {conv.non_lus > 0 && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shrink-0">
                                                {conv.non_lus}
                                            </span>
                                        )}
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat panel */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm h-full flex flex-col">
                            {selectedConversation ? (
                                <>
                                    <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm text-[hsl(20,10%,50%)]">Conversation avec</p>
                                                <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">{selectedConversation.nom}</h2>
                                                {selectedConversation.metier && <p className="text-sm text-[hsl(20,10%,50%)]">{selectedConversation.metier}</p>}
                                            </div>
                                            <div className="text-xs text-[hsl(20,10%,55%)]">{messages.length} {messages.length === 1 ? 'message' : 'messages'}</div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                        {messagesState.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-[hsl(30,20%,82%)] bg-[hsl(36,33%,97%)] px-6 py-12 text-center text-[hsl(20,10%,50%)]">
                                                Aucune discussion encore. Envoyez le premier message.
                                            </div>
                                        ) : (
                                            messagesState.map((message) => (
                                                <div key={message.id} className={`flex items-end gap-3 ${message.isMine ? 'justify-end' : 'justify-start'}`}>
                                                    {!message.isMine && (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-semibold uppercase text-white">
                                                            {message.sender_name?.charAt(0) ?? 'A'}
                                                        </div>
                                                    )}
                                                    <div className={`relative max-w-[70%] space-y-1 px-5 py-3 shadow-sm ${message.isMine ? 'bg-[hsl(20,14%,12%)] text-white rounded-tl-3xl rounded-tr-3xl rounded-bl-3xl' : 'bg-[hsl(36,30%,93%)] text-[hsl(20,14%,12%)] rounded-tl-3xl rounded-tr-3xl rounded-br-3xl'}`}>
                                                        {message.isMine
                                                            ? <span className="absolute right-[-8px] top-4 h-0 w-0 border-y-8 border-y-transparent border-l-8 border-l-[hsl(20,14%,12%)]" />
                                                            : <span className="absolute left-[-8px] top-4 h-0 w-0 border-y-8 border-y-transparent border-r-8 border-r-[hsl(36,30%,93%)]" />
                                                        }
                                                        <div className={`text-xs font-semibold uppercase tracking-wide ${message.isMine ? 'text-amber-300' : 'text-[hsl(20,10%,50%)]'}`}>
                                                            {message.isMine ? 'Vous' : message.sender_name}
                                                        </div>
                                                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                            {message.type === 'image' && message.attachment_url ? (
                                                                <img src={message.attachment_url} alt="Photo envoyée" className="rounded-2xl max-h-96 w-full object-cover" />
                                                            ) : message.type === 'voice' && message.attachment_url ? (
                                                                <audio controls src={message.attachment_url} className="mt-2 w-full" />
                                                            ) : message.type === 'location' && message.location ? (
                                                                <a href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`} target="_blank" rel="noreferrer" className="text-amber-400 underline">
                                                                    Localisation : {message.location.latitude.toFixed(5)}, {message.location.longitude.toFixed(5)}
                                                                </a>
                                                            ) : message.type === 'call_audio' ? (
                                                                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Demande d&apos;appel audio</span>
                                                            ) : message.type === 'call_video' ? (
                                                                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Demande d&apos;appel vidéo</span>
                                                            ) : message.contenu}
                                                        </div>
                                                        <div className={`mt-2 text-[11px] ${message.isMine ? 'text-amber-300/80' : 'text-[hsl(20,10%,55%)]'}`}>{message.date}</div>
                                                        {message.call_session_id && (message.type === 'call_audio' || message.type === 'call_video') && (
                                                            <Link href={route('client.calls.show', { callSession: message.call_session_id })}
                                                                className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50">
                                                                Rejoindre l&apos;appel
                                                            </Link>
                                                        )}
                                                    </div>
                                                    {message.isMine && (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-semibold uppercase text-white">V</div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <form onSubmit={handleSend} className="border-t border-[hsl(30,20%,88%)] px-6 py-4">
                                        <div className="mb-3 flex flex-wrap items-center gap-3">
                                            <label className="inline-flex cursor-pointer items-center rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm text-[hsl(20,14%,12%)] hover:bg-[hsl(36,33%,97%)] transition-colors">
                                                <input type="file" accept="image/*,audio/*" className="hidden" onChange={handleAttachmentChange} />
                                                {data.attachment ? data.attachment.name : 'Photo ou vocal'}
                                            </label>
                                            <button type="button" onClick={handleSendLocation} className="rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm text-[hsl(20,14%,12%)] hover:bg-[hsl(36,33%,97%)] transition-colors">
                                                Envoyer ma position
                                            </button>
                                            <button type="button" onClick={() => handleSendCall('call_audio')} className="rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm text-[hsl(20,14%,12%)] hover:bg-[hsl(36,33%,97%)] transition-colors">
                                                Appel audio
                                            </button>
                                            <button type="button" onClick={() => handleSendCall('call_video')} className="rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm text-[hsl(20,14%,12%)] hover:bg-[hsl(36,33%,97%)] transition-colors">
                                                Appel vidéo
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <textarea id="contenu" value={data.contenu} onChange={(e) => setData('contenu', e.target.value)}
                                                placeholder="Écrire un message..."
                                                className="w-full min-h-[110px] rounded-xl border border-[hsl(30,20%,82%)] bg-white p-4 text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none" />
                                            {data.attachment && <p className="text-sm text-[hsl(20,10%,50%)]">Fichier : {data.attachment.name}</p>}
                                            <p className="text-xs text-[hsl(20,10%,55%)]">Tapez votre message puis cliquez sur Envoyer.</p>
                                            {errors.contenu && <p className="text-sm text-red-600">{errors.contenu}</p>}
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button type="submit" disabled={sending || (data.contenu.trim() === '' && !data.attachment)}
                                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-5 py-2.5 shadow-sm transition-all disabled:opacity-50">
                                                <Send className="h-4 w-4" />
                                                {sending ? 'Envoi...' : 'Envoyer'}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mb-6">
                                        <MessageSquare className="h-10 w-10 text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-[hsl(20,14%,12%)] mb-2">Sélectionnez une conversation</h3>
                                    <p className="text-[hsl(20,10%,50%)] max-w-sm">Choisissez une conversation dans la liste pour commencer à échanger avec un artisan.</p>
                                    <Link href={route('artisans.index')}
                                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-5 py-2.5 shadow-sm transition-all">
                                        Trouver un artisan
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
