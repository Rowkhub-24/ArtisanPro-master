import { Head, Link } from '@inertiajs/react';
import { CreditCard, ArrowLeft, TrendingUp, CheckCircle, Clock, Download, Filter } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/client/dashboard' },
    { title: 'Paiements', href: '/client/paiements' },
];

interface Paiement {
    id: number;
    montant: number;
    statut: 'en_attente' | 'complete' | 'echoue' | 'rembourse';
    methode: string;
    date: string;
    reference: string;
    artisan_nom: string;
    artisan_metier: string;
}

interface Props {
    paiements?: Paiement[];
    total_depense?: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-800 border border-amber-200' },
    complete:   { label: 'Complété',   color: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    echoue:     { label: 'Échoué',     color: 'bg-red-100 text-red-800 border border-red-200' },
    rembourse:  { label: 'Remboursé',  color: 'bg-blue-100 text-blue-800 border border-blue-200' },
};

export default function ClientPaiements({ paiements = [], total_depense = 0 }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Paiements - ArtisanPro" />
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
                            <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Historique des paiements</h1>
                            <p className="mt-1 text-[hsl(20,10%,50%)]">Consultez toutes vos transactions</p>
                        </div>
                    </div>
                    <button className="inline-flex items-center gap-2 rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm font-medium text-[hsl(20,14%,12%)] hover:border-amber-400 transition-colors">
                        <Download className="h-4 w-4" />
                        Exporter
                    </button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Dark total card */}
                    <div className="rounded-2xl bg-[hsl(20,14%,10%)] p-6 text-white shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-400 text-sm font-medium">Total dépensé</p>
                                <p className="text-3xl font-bold mt-1">{total_depense.toLocaleString('fr-FR')}</p>
                                <p className="text-[hsl(20,10%,60%)] text-sm">FCFA</p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-amber-400" />
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[hsl(20,10%,50%)]">Paiements complétés</p>
                                <p className="text-3xl font-bold text-emerald-600 mt-1">
                                    {paiements.filter(p => p.statut === 'complete').length}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[hsl(20,10%,50%)]">En attente</p>
                                <p className="text-3xl font-bold text-amber-600 mt-1">
                                    {paiements.filter(p => p.statut === 'en_attente').length}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4 flex items-center justify-between">
                        <h2 className="font-semibold text-[hsl(20,14%,12%)]">Transactions</h2>
                        <button className="inline-flex items-center gap-2 rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-1.5 text-sm font-medium text-[hsl(20,14%,12%)] hover:border-amber-400 transition-colors">
                            <Filter className="h-4 w-4" />
                            Filtrer
                        </button>
                    </div>
                    {paiements.length === 0 ? (
                        <div className="p-12 text-center">
                            <CreditCard className="h-14 w-14 text-[hsl(20,10%,50%)] mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-[hsl(20,14%,12%)] mb-2">Aucun paiement</h3>
                            <p className="text-[hsl(20,10%,50%)]">Vos transactions apparaîtront ici après vos réservations</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[hsl(30,20%,92%)]">
                            {paiements.map((p) => {
                                const sc = statusConfig[p.statut] ?? statusConfig.en_attente;
                                return (
                                    <div key={p.id} className="flex items-center justify-between p-5 hover:bg-[hsl(36,33%,97%)] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                                                <CreditCard className="h-6 w-6 text-amber-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-[hsl(20,14%,12%)]">{p.artisan_metier}</p>
                                                    <span className="rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 text-xs font-medium">
                                                        Acompte 30%
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[hsl(20,10%,50%)]">{p.artisan_nom} · {p.methode}</p>
                                                <p className="text-xs font-mono text-[hsl(20,10%,60%)] mt-0.5">Réf: {p.reference}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-bold text-[hsl(20,14%,12%)]">{Number(p.montant).toLocaleString('fr-FR')} FCFA</p>
                                                <p className="text-xs text-[hsl(20,10%,50%)]">{new Date(p.date).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                            <Badge className={sc.color}>{sc.label}</Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
