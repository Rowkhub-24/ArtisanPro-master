import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

interface TransactionItem {
    id: number;
    amount: number;
    currency: string;
    provider: string;
    status: string;
    created_at: string;
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

export default function ArtisanEarnings({ summary, recentTransactions, recentPayouts }: Props) {
    return (
        <AppLayout>
            <Head title="Revenus - ArtisanPro" />
            <div className="min-h-screen bg-[hsl(36,33%,97%)]">
                <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-amber-600">Mes revenus</h1>
                        <p className="mt-2 text-[hsl(20,10%,50%)]">Historique des paiements, soldes et retraits.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-3xl border bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium text-[hsl(20,10%,50%)]">Revenu total</p>
                            <p className="mt-4 text-3xl font-semibold text-[hsl(20,14%,12%)]">{summary.totalRevenue.toLocaleString('fr-FR')} FCFA</p>
                            <p className="mt-2 text-sm text-[hsl(20,10%,50%)]">Transactions réglées</p>
                        </div>
                        <div className="rounded-3xl border bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium text-[hsl(20,10%,50%)]">Solde disponible</p>
                            <p className="mt-4 text-3xl font-semibold text-[hsl(20,14%,12%)]">{summary.availableBalance.toLocaleString('fr-FR')} FCFA</p>
                            <p className="mt-2 text-sm text-[hsl(20,10%,50%)]">Revenu total moins retraits en cours</p>
                        </div>
                        <div className="rounded-3xl border bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium text-[hsl(20,10%,50%)]">Retraits demandés</p>
                            <p className="mt-4 text-3xl font-semibold text-[hsl(20,14%,12%)]">{summary.outstandingPayouts.toLocaleString('fr-FR')} FCFA</p>
                            <p className="mt-2 text-sm text-[hsl(20,10%,50%)]">En attente ou en traitement</p>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <section className="rounded-3xl border bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Transactions récentes</h2>
                            <p className="mt-2 text-sm text-[hsl(20,10%,50%)]">Dernières opérations ayant réussi.</p>
                            <div className="mt-4 space-y-3">
                                {recentTransactions.length === 0 ? (
                                    <p className="text-sm text-[hsl(20,10%,50%)]">Aucune transaction disponible.</p>
                                ) : (
                                    recentTransactions.map((transaction) => (
                                        <div key={transaction.id} className="flex items-center justify-between rounded-2xl border border-[hsl(30,20%,88%)] p-4">
                                            <div>
                                                <p className="font-medium text-[hsl(20,14%,12%)]">{transaction.provider?.toUpperCase()}</p>
                                                <p className="text-sm text-[hsl(20,10%,50%)]">{new Date(transaction.created_at).toLocaleString('fr-FR')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-[hsl(20,14%,12%)]">{transaction.amount.toLocaleString('fr-FR')} {transaction.currency}</p>
                                                <p className="text-sm text-[hsl(20,10%,50%)]">{transaction.status}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className="rounded-3xl border bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Retraits récents</h2>
                            <p className="mt-2 text-sm text-[hsl(20,10%,50%)]">Dernières demandes de retrait et leur statut.</p>
                            <div className="mt-4 space-y-3">
                                {recentPayouts.length === 0 ? (
                                    <p className="text-sm text-[hsl(20,10%,50%)]">Aucune demande de retrait enregistrée.</p>
                                ) : (
                                    recentPayouts.map((payout) => (
                                        <div key={payout.id} className="flex items-center justify-between rounded-2xl border border-[hsl(30,20%,88%)] p-4">
                                            <div>
                                                <p className="font-medium text-[hsl(20,14%,12%)]">{payout.provider?.toUpperCase()}</p>
                                                <p className="text-sm text-[hsl(20,10%,50%)]">{new Date(payout.created_at).toLocaleString('fr-FR')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-[hsl(20,14%,12%)]">{payout.amount.toLocaleString('fr-FR')} {payout.currency}</p>
                                                <p className="text-sm text-[hsl(20,10%,50%)]">{payout.status}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
