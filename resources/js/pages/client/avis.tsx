import { Head, Link, usePage } from '@inertiajs/react';
import { Star, ArrowLeft, MessageSquare } from 'lucide-react';

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
                <Star key={i} className={`${cls} ${i < note ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
            ))}
        </div>
    );
}

export default function ClientAvis({ avis = [], note_moyenne = 0 }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Avis - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('client.dashboard')}
                            className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Mes Avis</h1>
                            <p className="mt-1 text-[hsl(20,10%,50%)]">Évaluations que vous avez laissées aux artisans</p>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                {avis.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm p-6">
                        <div className="flex items-center gap-6 flex-wrap">
                            <div className="text-center">
                                <p className="text-5xl font-bold text-[hsl(20,14%,12%)]">{note_moyenne.toFixed(1)}</p>
                                <StarRating note={Math.round(note_moyenne)} size="lg" />
                                <p className="text-sm text-[hsl(20,10%,50%)] mt-1">{avis.length} avis donnés</p>
                            </div>
                            <div className="flex-1 space-y-2 min-w-48">
                                {[5, 4, 3, 2, 1].map((n) => {
                                    const count = avis.filter(a => a.note === n).length;
                                    const pct = avis.length > 0 ? (count / avis.length) * 100 : 0;
                                    return (
                                        <div key={n} className="flex items-center gap-3">
                                            <span className="text-sm text-[hsl(20,10%,50%)] w-4">{n}</span>
                                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                            <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-sm text-[hsl(20,10%,50%)] w-6">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Avis List */}
                {avis.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,88%)] bg-white p-12 text-center">
                        <MessageSquare className="h-14 w-14 text-[hsl(20,10%,50%)] mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-[hsl(20,14%,12%)] mb-2">Aucun avis</h3>
                        <p className="text-[hsl(20,10%,50%)] mb-6">Après une réservation terminée, vous pouvez évaluer l'artisan</p>
                        <Link
                            href={route('client.reservations')}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm transition-all"
                        >
                            Voir mes réservations
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {avis.map((a) => (
                            <div key={a.id} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-md transition-shadow p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 shrink-0">
                                            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <StarRating note={a.note} />
                                                <span className="font-bold text-[hsl(20,14%,12%)]">{a.note}/5</span>
                                            </div>
                                            <p className="font-semibold text-[hsl(20,14%,12%)]">{a.artisan_metier}</p>
                                            <p className="text-sm text-[hsl(20,10%,50%)]">{a.artisan_nom}</p>
                                            {a.commentaire && (
                                                <p className="text-[hsl(20,14%,12%)] mt-3 leading-relaxed">{a.commentaire}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm text-[hsl(20,10%,50%)] shrink-0">
                                        {new Date(a.date_avis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
