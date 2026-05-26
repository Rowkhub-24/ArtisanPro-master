import { Head, Link } from '@inertiajs/react';
import { Star, ArrowLeft, MessageSquare } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/artisan/dashboard' },
    { title: 'Mes Avis', href: '/artisan/avis' },
];

interface AvisItem {
    id: number;
    note: number;
    commentaire: string | null;
    date_avis: string;
    client_prenom: string;
    client_nom: string;
}

interface Props {
    avis?: AvisItem[];
    note_moyenne?: number;
}

function Stars({ note, size = 'sm' }: { note: number; size?: 'sm' | 'lg' }) {
    const cls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`${cls} ${i < note ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
            ))}
        </div>
    );
}

export default function ArtisanAvis({ avis = [], note_moyenne = 0 }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Avis - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route('artisan.dashboard')}
                        className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Mes Avis Clients</h1>
                        <p className="mt-1 text-[hsl(20,10%,50%)]">Évaluations laissées par vos clients</p>
                    </div>
                </div>

                {/* Summary */}
                {avis.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm p-6">
                        <div className="flex items-center gap-8 flex-wrap">
                            <div className="text-center">
                                <p className="text-6xl font-bold text-[hsl(20,14%,12%)]">{note_moyenne.toFixed(1)}</p>
                                <Stars note={Math.round(note_moyenne)} size="lg" />
                                <p className="text-sm text-[hsl(20,10%,50%)] mt-2">{avis.length} avis reçus</p>
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
                                                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
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
                        <h3 className="text-xl font-semibold text-[hsl(20,14%,12%)] mb-2">Aucun avis pour l'instant</h3>
                        <p className="text-[hsl(20,10%,50%)]">Les avis de vos clients apparaîtront ici après chaque prestation</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {avis.map((a) => (
                            <div key={a.id} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-md transition-shadow p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-lg shrink-0">
                                            {a.client_prenom.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <Stars note={a.note} />
                                                <span className="font-bold text-[hsl(20,14%,12%)]">{a.note}/5</span>
                                            </div>
                                            <p className="font-semibold text-[hsl(20,14%,12%)]">{a.client_prenom} {a.client_nom}</p>
                                            {a.commentaire && (
                                                <p className="text-[hsl(20,14%,12%)] mt-2 leading-relaxed">{a.commentaire}</p>
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
