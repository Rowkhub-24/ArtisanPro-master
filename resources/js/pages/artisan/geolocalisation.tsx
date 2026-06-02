import { Head, router } from '@inertiajs/react';
import { MapPin, Navigation, Trash2, Clock, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/artisan/dashboard' },
    { title: 'Géolocalisation', href: '/artisan/geolocalisation' },
];

interface HistoriqueEntry {
    id: number;
    latitude: number;
    longitude: number;
    date_position: string;
}

interface Props {
    historique: HistoriqueEntry[];
    position_actuelle: { latitude: number | null; longitude: number | null };
}

export default function ArtisanGeolocalisation({ historique: historiqueInitial, position_actuelle }: Props) {
    const [tracking, setTracking] = useState(false);
    const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(
        position_actuelle.latitude && position_actuelle.longitude
            ? { lat: position_actuelle.latitude, lng: position_actuelle.longitude }
            : null
    );
    const [status, setStatus] = useState<string>('');
    const [historique, setHistorique] = useState<HistoriqueEntry[]>(historiqueInitial);
    const watchIdRef = useRef<number | null>(null);

    const enregistrerPosition = (lat: number, lng: number) => {
        fetch(route('artisan.geolocalisation.enregistrer'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
            },
            body: JSON.stringify({ latitude: lat, longitude: lng }),
        })
            .then((res) => res.json())
            .then((response: { ok?: boolean; date_position?: string }) => {
                setCurrentPos({ lat, lng });
                if (response.ok && response.date_position) {
                    setHistorique((prev) => [
                        { id: Date.now(), latitude: lat, longitude: lng, date_position: response.date_position as string },
                        ...prev,
                    ]);
                    setStatus(`Position enregistrée le ${response.date_position}`);
                } else {
                    setStatus(`Position enregistrée à ${new Date().toLocaleTimeString('fr-FR')}`);
                }
            })
            .catch(() => {
                setStatus("Erreur lors de l'enregistrement");
            });
    };

    const startTracking = () => {
        if (!navigator.geolocation) {
            setStatus('La géolocalisation n\'est pas supportée par votre navigateur.');
            return;
        }
        setTracking(true);
        setStatus('Localisation en cours...');

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                enregistrerPosition(pos.coords.latitude, pos.coords.longitude);
            },
            (err) => {
                setStatus(`Erreur : ${err.message}`);
                setTracking(false);
            },
            { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
        );
    };

    const stopTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setTracking(false);
        setStatus('Suivi arrêté.');
    };

    const getOnce = () => {
        if (!navigator.geolocation) {
            setStatus('Géolocalisation non supportée.');
            return;
        }
        setStatus('Récupération de la position...');
        navigator.geolocation.getCurrentPosition(
            (pos) => enregistrerPosition(pos.coords.latitude, pos.coords.longitude),
            (err) => setStatus(`Erreur : ${err.message}`),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const effacerHistorique = () => {
        if (confirm('Effacer tout l\'historique de géolocalisation ?')) {
            router.delete(route('artisan.geolocalisation.effacer'), { preserveScroll: true });
        }
    };

    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Géolocalisation - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Géolocalisation</h1>
                            <p className="mt-1 text-[hsl(20,10%,50%)]">Partagez et suivez votre position en temps réel</p>
                        </div>
                    </div>
                    {historique.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={effacerHistorique}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Effacer l'historique
                        </Button>
                    )}
                </div>

                {/* Position actuelle */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="rounded-2xl border border-[hsl(30,20%,88%)] shadow-sm bg-white">
                        <CardContent className="p-6">
                            <h2 className="font-semibold text-[hsl(20,14%,12%)] mb-4 flex items-center gap-2">
                                <Navigation className="h-4 w-4 text-amber-500" />
                                Position actuelle
                            </h2>
                            {currentPos ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Latitude</span>
                                        <span className="font-mono font-medium">{currentPos.lat.toFixed(6)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Longitude</span>
                                        <span className="font-mono font-medium">{currentPos.lng.toFixed(6)}</span>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps?q=${currentPos.lat},${currentPos.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 mt-2"
                                    >
                                        <MapPin className="h-3.5 w-3.5" />
                                        Voir sur Google Maps
                                    </a>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">Aucune position enregistrée</p>
                            )}
                            {status && (
                                <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded-lg px-3 py-2">{status}</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-[hsl(30,20%,88%)] shadow-sm bg-white">
                        <CardContent className="p-6">
                            <h2 className="font-semibold text-[hsl(20,14%,12%)] mb-4">Contrôles</h2>
                            <div className="space-y-3">
                                <Button
                                    onClick={getOnce}
                                    variant="outline"
                                    className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Enregistrer ma position maintenant
                                </Button>
                                {!tracking ? (
                                    <Button
                                        onClick={startTracking}
                                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                                    >
                                        <Navigation className="h-4 w-4 mr-2" />
                                        Démarrer le suivi automatique
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={stopTracking}
                                        variant="outline"
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                        <Navigation className="h-4 w-4 mr-2" />
                                        Arrêter le suivi
                                    </Button>
                                )}
                                {tracking && (
                                    <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Suivi actif — position mise à jour automatiquement
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Historique */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[hsl(30,20%,88%)] px-6 py-4">
                        <h2 className="font-semibold text-[hsl(20,14%,12%)] flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            Historique des positions
                        </h2>
                        <span className="text-sm text-gray-400">{historique.length} entrées</span>
                    </div>
                    {historique.length === 0 ? (
                        <div className="p-12 text-center">
                            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Aucun historique de position</p>
                            <p className="text-sm text-gray-400 mt-1">Utilisez les contrôles ci-dessus pour enregistrer votre position</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[hsl(30,20%,92%)] max-h-96 overflow-y-auto">
                            {historique.map((h) => (
                                <div key={h.id} className="flex items-center justify-between px-6 py-3 hover:bg-[hsl(36,33%,97%)] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500 shrink-0">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-mono text-gray-700">
                                                {h.latitude.toFixed(6)}, {h.longitude.toFixed(6)}
                                            </p>
                                            <p className="text-xs text-gray-400">{h.date_position}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps?q=${h.latitude},${h.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-amber-600 hover:text-amber-700 shrink-0"
                                    >
                                        Voir
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
