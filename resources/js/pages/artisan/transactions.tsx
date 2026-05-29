import { Head, Link, usePage, useForm } from '@inertiajs/react';
import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';

interface TransactionItem {
    id: number;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    created_at: string;
    metadata?: any;
}

interface PayoutItem {
    id: number;
    amount: number;
    currency: string;
    status: string;
    provider?: string;
    created_at: string;
}

interface Props {
    balance?: number;
    outstanding?: number;
    available?: number;
    transactions?: TransactionItem[];
    payouts?: PayoutItem[];
}

export default function ArtisanTransactions({ balance, outstanding, available, transactions, payouts }: Props) {
    const txs = transactions ?? [];
    const payoutsList = payouts ?? [];

    return (
        <AppLayout breadcrumbs={[{ title: 'Tableau de bord', href: '/artisan/dashboard' }, { title: 'Mes paiements', href: '/artisan/transactions' }]}>
            <Head title="Mes paiements - ArtisanPro" />

            <div className="p-6 space-y-6">
                <div className="rounded-2xl border bg-white p-6">
                    <h2 className="text-lg font-semibold">Solde</h2>
                    <p className="text-3xl font-bold mt-2">{(balance ?? 0).toLocaleString('fr-FR')} FCFA</p>
                    <div className="mt-2 text-sm text-gray-500 space-y-1">
                        <div>En attente: {(outstanding ?? 0).toLocaleString('fr-FR')} FCFA</div>
                        <div>Disponible: {(available ?? (balance ?? 0)).toLocaleString('fr-FR')} FCFA</div>
                        <div>Somme des transactions validées</div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-white p-6">
                    <h3 className="text-lg font-semibold mb-3">Demande de retrait</h3>
                    <PayoutForm balance={balance ?? 0} />
                </div>

                <div className="rounded-2xl border bg-white p-6">
                    <h3 className="text-lg font-semibold mb-3">Demandes de retrait</h3>
                    <div className="mt-4 space-y-3">
                        {payoutsList.length === 0 ? (
                            <p className="text-sm text-gray-500">Aucune demande de retrait.</p>
                        ) : (
                            payoutsList.map((p) => (
                                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <div className="font-medium">{p.provider?.toUpperCase() ?? '—'}</div>
                                        <div className="text-sm text-gray-500">{new Date(p.created_at).toLocaleString('fr-FR')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{p.amount.toLocaleString('fr-FR')} {p.currency}</div>
                                        <div className="text-sm text-gray-500">{p.status}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border bg-white p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Historique des transactions</h3>
                        <Link href={route('artisan.earnings')} className="text-sm text-amber-600">Voir revenus détaillés</Link>
                    </div>

                    <div className="mt-4 space-y-3">
                        {txs.length === 0 ? (
                            <p className="text-sm text-gray-500">Aucune transaction pour le moment.</p>
                        ) : (
                            txs.map((t) => (
                                <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <div className="font-medium">{t.provider.toUpperCase()}</div>
                                        <div className="text-sm text-gray-500">{new Date(t.created_at).toLocaleString('fr-FR')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{t.amount.toLocaleString('fr-FR')} {t.currency}</div>
                                        <div className="text-sm text-gray-500">{t.status}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function PayoutForm({ balance }: { balance: number }) {
    const { data, setData, post, processing, errors } = useForm<{ amount: string }>({ amount: '' });

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(route('artisan.payouts.request'));
    }

    return (
        <form onSubmit={submit} className="space-y-3">
            <div>
                <label htmlFor="payout-amount" className="block text-sm font-medium text-gray-700">Montant (FCFA)</label>
                <input
                    id="payout-amount"
                    type="number"
                    min={1000}
                    value={data.amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('amount', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
                {errors.amount && <p className="text-red-600 text-sm">{errors.amount}</p>}
                <p className="text-xs text-gray-500 mt-1">Solde disponible: {balance.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <div>
                <button type="submit" disabled={processing} className="rounded-xl bg-amber-600 text-white px-4 py-2">Demander retrait</button>
            </div>
        </form>
    );
}
