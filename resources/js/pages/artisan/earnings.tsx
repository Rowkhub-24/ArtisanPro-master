import { Head } from '@inertiajs/react';
import { CreditCard, TrendingUp, Wallet, ArrowDownCircle, User, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/artisan/dashboard' },
    { title: 'Mes revenus', href: '/artisan/revenus' },
];

interface TransactionItem {
    id: string | number;
    amount: number;
    currency: string;
    provider: string;
    status: string;
    created_at: string;
    metadata?: {
        reservation_id?: number;
        reference?: string;
        client?: string;
        type?: string;
    };
}

interface PayoutItem {
    id: number;
    amount: number;
    currency: string;
    provider: string;
    status: string;
    created_at: string;
}

interface Summary {
    totalRevenue: number;
    totalTransactions: number;
    outstandingPayouts: number;
    completedPayouts: number;
    availableBalance: number;
}

interface Props {
    summary: Summary;
    recentTransactions: TransactionItem[];
    recentPayouts: PayoutItem[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
    succeeded: { label: 'Reçu',       color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    reussi:    { label: 'Reçu',       color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    complete:  { label: 'Complété',   color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    pending:   { label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    failed:    { label: 'Échoué',     color: 'bg-red-100 text-red-800 border-red-200' },
};

const payoutStatusLabels: Record<string, { label: string; color: string }> = {
    requested:  { label: 'Demandé',    color: 'bg-amber-100 text-amber-800 border-amber-200' },
    processing: { label: 'En cours',   color: 'bg-blue-100 text-blue-800 border-blue-200' },
    completed:  { label: 'Versé',      color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    failed:     { label: 'Échoué',     color: 'bg-red-100 text-red-800 border-red-200' },
};

export default function ArtisanEarnings({ summary, recentTransactions, recentPayouts }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Revenus - ArtisanPro" />
            <div className="min-h-screen bg-[hsl(36,33%,97%)]">
                <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">

                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-amber-600">Mes revenus</h1>
                        <p className="mt-2 text-[hsl(20,10%,50%)]">Historique des acomptes reçus, soldes et retraits.</p>
                    </div>

                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-3xl border bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                                </div>
                                <p className="text-sm font-medium text-[hsl(20,10%,50%)]">Revenus totaux</p>
                            </div>
                            <p className="text-3xl font-bold text-[hsl(20,14%,12%)]">
                                {summary.totalRevenue.toLocaleString('fr-FR')}
                            </p>
                            <p className="text-sm text-[hsl(20,10%,50%)] mt-1">FCFA · {summary.totalTransactions} transaction(s)</p>
                        </div>

                        <div className="rounded-3xl border bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                                    <Wallet className="h-5 w-5 text-amber-600" />
                                </div>
                                <p className="text-sm font-medium text-[hsl(20,10%,50%)]">Solde disponible</p>
                            </div>
                            <p className="text-3xl font-bold text-[hsl(20,14%,12%)]">
                                {summary.availableBalance.toLocaleString('fr-FR')}
                            </p>
                            <p className="text-sm text-[hsl(20,10%,50%)] mt-1">FCFA · après retraits</p>
                        </div>

                        <div className="rounded-3xl border bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                                    <ArrowDownCircle className="h-5 w-5 text-blue-600" />
                                </div>
                                <p className="text-sm font-medium text-[hsl(20,10%,50%)]">Retraits demandés</p>
                            </div>
                            <p className="text-3xl font-bold text-[hsl(20,14%,12%)]">
                                {summary.outstandingPayouts.toLocaleString('fr-FR')}
                            </p>
                            <p className="text-sm text-[hsl(20,10%,50%)] mt-1">FCFA · en attente ou traitement</p>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">

                        {/* Transactions reçues */}
                        <section className="rounded-3xl border bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <CreditCard className="h-5 w-5 text-amber-500" />
                                <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Acomptes reçus</h2>
                            </div>
                            <p className="text-sm text-[hsl(20,10%,50%)] mb-4">Paiements confirmés via KkiaPay.</p>

                            <div className="space-y-3">
                                {recentTransactions.length === 0 ? (
                                    <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,82%)] p-8 text-center">
                                        <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-[hsl(20,10%,55%)]">Aucun paiement reçu pour le moment.</p>
                                    </div>
                                ) : (
                                    recentTransactions.map((tx) => {
                                        const sc = statusLabels[tx.status] ?? statusLabels.pending;
                                        return (
                                            <div key={String(tx.id)} className="rounded-2xl border border-[hsl(30,20%,88%)] p-4 hover:border-amber-200 transition-colors">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-semibold text-[hsl(20,14%,12%)]">
                                                                {tx.amount.toLocaleString('fr-FR')} {tx.currency}
                                                            </p>
                                                            <Badge className={`text-xs border ${sc.color}`}>{sc.label}</Badge>
                                                            <Badge className="text-xs bg-amber-50 text-amber-700 border border-amber-200">
                                                                Acompte 30%
                                                            </Badge>
                                                        </div>

                                                        {tx.metadata?.client && (
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <User className="h-3 w-3 text-[hsl(20,10%,55%)]" />
                                                                <p className="text-xs text-[hsl(20,10%,55%)]">{tx.metadata.client}</p>
                                                            </div>
                                                        )}

                                                        {tx.metadata?.reservation_id && (
                                                            <p className="text-xs text-[hsl(20,10%,55%)] mt-0.5">
                                                                Réservation #{tx.metadata.reservation_id}
                                                            </p>
                                                        )}

                                                        {tx.metadata?.reference && (
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <Hash className="h-3 w-3 text-[hsl(20,10%,65%)]" />
                                                                <p className="text-xs font-mono text-[hsl(20,10%,65%)] truncate">
                                                                    {tx.metadata.reference}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <p className="text-xs text-[hsl(20,10%,60%)] mt-1">
                                                            {new Date(tx.created_at).toLocaleString('fr-FR')} · {tx.provider?.toUpperCase()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </section>

                        {/* Retraits */}
                        <section className="rounded-3xl border bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <ArrowDownCircle className="h-5 w-5 text-blue-500" />
                                <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Retraits récents</h2>
                            </div>
                            <p className="text-sm text-[hsl(20,10%,50%)] mb-4">Demandes de retrait et leur statut.</p>

                            <div className="space-y-3">
                                {recentPayouts.length === 0 ? (
                                    <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,82%)] p-8 text-center">
                                        <ArrowDownCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-[hsl(20,10%,55%)]">Aucune demande de retrait enregistrée.</p>
                                    </div>
                                ) : (
                                    recentPayouts.map((payout) => {
                                        const sc = payoutStatusLabels[payout.status] ?? payoutStatusLabels.requested;
                                        return (
                                            <div key={payout.id} className="rounded-2xl border border-[hsl(30,20%,88%)] p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-[hsl(20,14%,12%)]">
                                                            {payout.amount.toLocaleString('fr-FR')} {payout.currency}
                                                        </p>
                                                        <p className="text-xs text-[hsl(20,10%,55%)] mt-0.5">
                                                            {new Date(payout.created_at).toLocaleString('fr-FR')} · {payout.provider?.toUpperCase()}
                                                        </p>
                                                    </div>
                                                    <Badge className={`text-xs border ${sc.color}`}>{sc.label}</Badge>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
