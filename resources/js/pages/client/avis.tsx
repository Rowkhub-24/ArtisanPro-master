import { Head, Link, usePage } from '@inertiajs/react';
import { Star, ArrowLeft, MessageSquare, Plus } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/client/dashboard' },
    { title: 'Mes Avis', href: '/client/avis' },
];

interface AvisItem {
    id: number;
    note: number;
    commentaire: string | null;
    date_avis: string;
    artisan_metier: string;
    artisan_nom: string;
}

interface Props {
    avis?: AvisItem[];
    note_moyenne?: number;
}

function StarRating({ note, size = 'sm' }: { note: number; size?: 'sm' | 'lg' }) {
    const cls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`${cls} ${i < note ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
            ))}
        </div>
    );
}

export default function ClientAvis({ avis = [], note_moyenne = 0 }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Avis - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href={route('client.dashboard')}><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mes Avis</h1>
                            <p className="mt-1 text-gray-600">Évaluations que vous avez laissées aux artisans</p>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                {avis.length > 0 && (
                    <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-5xl font-bold text-gray-900">{note_moyenne.toFixed(1)}</p>
                                    <StarRating note={Math.round(note_moyenne)} size="lg" />
                                    <p className="text-sm text-gray-500 mt-1">{avis.length} avis donnés</p>
                                </div>
                                <div className="flex-1 space-y-2">
                                    {[5, 4, 3, 2, 1].map((n) => {
                                        const count = avis.filter(a => a.note === n).length;
                                        const pct = avis.length > 0 ? (count / avis.length) * 100 : 0;
                                        return (
                                            <div key={n} className="flex items-center gap-3">
                                                <span className="text-sm text-gray-600 w-4">{n}</span>
                                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="text-sm text-gray-500 w-6">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Avis List */}
                {avis.length === 0 ? (
                    <Card className="border-dashed border-2 border-gray-200 bg-white">
                        <CardContent className="p-12 text-center">
                            <MessageSquare className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun avis</h3>
                            <p className="text-gray-500 mb-6">Après une réservation terminée, vous pouvez évaluer l'artisan</p>
                            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                <Link href={route('client.reservations')}>Voir mes réservations</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {avis.map((a) => (
                            <Card key={a.id} className="border-gray-200 bg-white hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 shrink-0">
                                                <Star className="h-6 w-6 text-yellow-600 fill-current" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <StarRating note={a.note} />
                                                    <span className="font-bold text-gray-900">{a.note}/5</span>
                                                </div>
                                                <p className="font-semibold text-gray-900">{a.artisan_metier}</p>
                                                <p className="text-sm text-gray-500">{a.artisan_nom}</p>
                                                {a.commentaire && (
                                                    <p className="text-gray-700 mt-3 leading-relaxed">{a.commentaire}</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-400 shrink-0">
                                            {new Date(a.date_avis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
