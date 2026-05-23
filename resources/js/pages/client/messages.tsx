import { Head, Link, useForm } from '@inertiajs/react';
import { ChangeEventHandler, FormEventHandler, useEffect, useState } from 'react';
import { MessageSquare, ArrowLeft, Send, Search, Circle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
        if (!selectedConversation) {
            return;
        }

        let mounted = true;
        const fetchMessages = async () => {
            try {
                const res = await fetch(route('client.messages.updates', { withUser: selectedConversation.id }));
                if (!res.ok) return;
                const json = await res.json();
                if (mounted && Array.isArray(json.messages)) {
                    setMessagesState(json.messages);
                }
            } catch (error) {
                console.error('Message polling error:', error);
            }
        };

        fetchMessages();
        const interval = window.setInterval(fetchMessages, 3000);
        return () => {
            mounted = false;
            window.clearInterval(interval);
        };
    }, [selectedConversation?.id]);

    const handleSend: FormEventHandler = async (e) => {
        e.preventDefault();

        if (!selectedConversation) {
            return;
        }

        if (data.type === 'text' && !data.contenu.trim() && !data.attachment) {
            return;
        }

        setSending(true);

        const formData = new FormData();
        formData.append('contenu', data.contenu ?? '');
        formData.append('type', data.type);
        if (data.attachment) {
            formData.append('attachment', data.attachment);
        }
        if (data.latitude !== null) {
            formData.append('latitude', data.latitude.toString());
        }
        if (data.longitude !== null) {
            formData.append('longitude', data.longitude.toString());
        }

        const res = await fetch(route('client.messages.send', { withUser: selectedConversation.id }), {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
            },
        });

        setSending(false);
        if (res.ok) {
            const data = await res.json();
            reset('contenu', 'type', 'attachment', 'latitude', 'longitude');
            window.location.href = data.redirect || route('client.messages', { withUser: selectedConversation.id });
        } else {
            const text = await res.text();
            alert('Envoi impossible. Vérifiez le jeton CSRF et réessayez.');
            console.error('Message send failed:', res.status, text);
        }
    };

    const handleAttachmentChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) {
            setData('attachment', null);
            setData('type', 'text');
            return;
        }

        setData('attachment', file);
        setData('type', file.type.startsWith('audio/') ? 'voice' : 'image');
    };

    const handleSendLocation = async () => {
        if (!selectedConversation) {
            return;
        }

        if (!navigator.geolocation) {
            alert('La géolocalisation n\'est pas prise en charge par ce navigateur.');
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            setSending(true);
            const formData = new FormData();
            formData.append('type', 'location');
            formData.append('contenu', 'Localisation partagée');
            formData.append('latitude', position.coords.latitude.toString());
            formData.append('longitude', position.coords.longitude.toString());

            const res = await fetch(route('client.messages.send', { withUser: selectedConversation.id }), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
            });

            setSending(false);
            if (res.ok) {
                const data = await res.json();
                reset('contenu', 'type', 'attachment', 'latitude', 'longitude');
                window.location.href = data.redirect || route('client.messages', { withUser: selectedConversation.id });
            } else {
                const text = await res.text();
                alert('Envoi impossible. Vérifiez le jeton CSRF et réessayez.');
                console.error('Location send failed:', res.status, text);
            }
        }, () => {
            alert('Impossible de récupérer votre position.');
        });
    };

    const handleSendCall = async (callType: 'call_audio' | 'call_video') => {
        if (!selectedConversation) {
            return;
        }

        setSending(true);
        const formData = new FormData();
        formData.append('type', callType);
        formData.append('contenu', callType === 'call_audio' ? 'Demande d\'appel audio' : 'Demande d\'appel vidéo');

        const res = await fetch(route('client.messages.send', { withUser: selectedConversation.id }), {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
            },
        });

        setSending(false);
        if (res.ok) {
            const data = await res.json();
            reset('contenu', 'type', 'attachment', 'latitude', 'longitude');
            window.location.href = data.redirect || route('client.messages', { withUser: selectedConversation.id });
        } else {
            const text = await res.text();
            alert('Envoi impossible. Vérifiez le jeton CSRF et réessayez.');
            console.error('Call request send failed:', res.status, text);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Messages - ArtisanPro" />
            <div className="flex flex-col gap-6 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">

                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href={route('client.dashboard')}><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Messages</h1>
                        <p className="mt-1 text-gray-600">Vos conversations avec les artisans</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-220px)]">
                    <Card className="border-0 shadow-lg bg-white overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input placeholder="Rechercher..." className="pl-10 border-gray-200" />
                            </div>
                        </div>
                        <div className="overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-8 text-center">
                                    <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">Aucune conversation</p>
                                </div>
                            ) : (
                                conversations.map((conv) => (
                                    <Link
                                        key={conv.id}
                                        href={route('client.messages', { withUser: conv.id })}
                                        className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors"
                                    >
                                        <div className="relative">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                                                {conv.artisan_nom.charAt(0)}
                                            </div>
                                            {conv.en_ligne && (
                                                <Circle className="absolute bottom-0 right-0 h-3.5 w-3.5 text-green-500 fill-green-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-gray-900 truncate">{conv.artisan_nom}</p>
                                                <span className="text-xs text-gray-400 shrink-0">{conv.date}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{conv.artisan_metier}</p>
                                            <p className="text-sm text-gray-600 truncate mt-0.5">{conv.dernier_message}</p>
                                        </div>
                                        {conv.non_lus > 0 && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shrink-0">
                                                {conv.non_lus}
                                            </span>
                                        )}
                                    </Link>
                                ))
                            )}
                        </div>
                    </Card>

                    <div className="lg:col-span-2">
                        <Card className="border-0 shadow-lg bg-white h-full flex flex-col">
                            {selectedConversation ? (
                                <>
                                    <div className="border-b border-gray-100 px-6 py-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Conversation avec</p>
                                                <h2 className="text-xl font-semibold text-gray-900">{selectedConversation.nom}</h2>
                                                {selectedConversation.metier && (
                                                    <p className="text-sm text-gray-500">{selectedConversation.metier}</p>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400">{messages.length} {messageCountLabel(messages.length)}</div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                        {messagesState.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center text-gray-500">
                                                Aucune discussion encore. Envoyez le premier message.
                                            </div>
                                        ) : (
                                            messagesState.map((message) => (
                                                <div key={message.id} className={`flex items-end gap-3 ${message.isMine ? 'justify-end' : 'justify-start'}`}>
                                                    {!message.isMine && (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs font-semibold uppercase text-gray-700">
                                                            {message.sender_name?.charAt(0) ?? 'A'}
                                                        </div>
                                                    )}
                                                    <div className={`relative max-w-[70%] space-y-1 px-5 py-3 shadow-sm ${message.isMine ? 'bg-blue-600 text-white rounded-tl-3xl rounded-tr-3xl rounded-bl-3xl' : 'bg-gray-100 text-gray-900 rounded-tl-3xl rounded-tr-3xl rounded-br-3xl'}`}>
                                                        {message.isMine ? (
                                                            <span className="absolute right-[-8px] top-4 h-0 w-0 border-y-8 border-y-transparent border-l-8 border-l-blue-600" />
                                                        ) : (
                                                            <span className="absolute left-[-8px] top-4 h-0 w-0 border-y-8 border-y-transparent border-r-8 border-r-gray-100" />
                                                        )}
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-100">
                                                            {message.isMine ? 'Vous' : message.sender_name}
                                                        </div>
                                                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                            {message.type === 'image' && message.attachment_url ? (
                                                                <img
                                                                    src={message.attachment_url}
                                                                    alt="Photo envoyée"
                                                                    className="rounded-2xl max-h-96 w-full object-cover"
                                                                />
                                                            ) : message.type === 'voice' && message.attachment_url ? (
                                                                <audio controls src={message.attachment_url} className="mt-2 w-full" />
                                                            ) : message.type === 'location' && message.location ? (
                                                                <a
                                                                    href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-blue-100 underline"
                                                                >
                                                                    Localisation : {message.location.latitude.toFixed(5)}, {message.location.longitude.toFixed(5)}
                                                                </a>
                                                            ) : message.type === 'call_audio' ? (
                                                                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                                                                    Demande d'appel audio
                                                                </span>
                                                            ) : message.type === 'call_video' ? (
                                                                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                                                                    Demande d'appel vidéo
                                                                </span>
                                                            ) : (
                                                                message.contenu
                                                            )}
                                                        </div>
                                                        <div className={`mt-2 text-[11px] ${message.isMine ? 'text-blue-100/80' : 'text-gray-500'}`}>
                                                            {message.date}
                                                        </div>
                                                        {message.call_session_id && (message.type === 'call_audio' || message.type === 'call_video') && (
                                                            <Link
                                                                href={route('client.calls.show', { callSession: message.call_session_id })}
                                                                className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50"
                                                            >
                                                                Rejoindre l'appel
                                                            </Link>
                                                        )}
                                                    </div>
                                                    {message.isMine && (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold uppercase text-white">
                                                            V
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <form onSubmit={handleSend} className="border-t border-gray-100 px-6 py-4">
                                        <div className="mb-3 flex flex-wrap items-center gap-3">
                                            <label className="inline-flex cursor-pointer items-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-50">
                                                <input
                                                    type="file"
                                                    accept="image/*,audio/*"
                                                    className="hidden"
                                                    onChange={handleAttachmentChange}
                                                />
                                                {data.attachment ? data.attachment.name : 'Photo ou vocal'}
                                            </label>
                                            <Button type="button" variant="outline" onClick={handleSendLocation} className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                Envoyer ma position
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => handleSendCall('call_audio')} className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                Appel audio
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => handleSendCall('call_video')} className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                Appel vidéo
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            <textarea
                                                id="contenu"
                                                value={data.contenu}
                                                onChange={(e) => setData('contenu', e.target.value)}
                                                placeholder="Écrire un message..."
                                                className="w-full min-h-[110px] rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            />
                                            {data.attachment && (
                                                <p className="text-sm text-gray-500">Fichier sélectionné : {data.attachment.name}</p>
                                            )}
                                            <p className="text-xs text-gray-500">Tapez votre message puis cliquez sur Envoyer.</p>
                                            {errors.contenu && <p className="text-sm text-red-600">{errors.contenu}</p>}
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <Button type="submit" disabled={sending || (data.contenu.trim() === '' && !data.attachment)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                                <Send className="mr-2 h-4 w-4" />
                                                {sending ? 'Envoi...' : 'Envoyer'}
                                            </Button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 mb-6">
                                        <MessageSquare className="h-10 w-10 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Sélectionnez une conversation</h3>
                                    <p className="text-gray-500 max-w-sm">
                                        Choisissez une conversation dans la liste pour commencer à échanger avec un artisan.
                                    </p>
                                    <Button asChild className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                        <Link href={route('artisans.index')}>
                                            Trouver un artisan
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function messageCountLabel(count: number) {
    return count === 1 ? 'message' : 'messages';
}
