import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { CreditCard, ArrowLeft, TrendingUp, CheckCircle, Clock, Download, ArrowDownToLine } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/artisan/dashboard' },
    { title: 'Mes Revenus', href: '/artisan/paiements' },
];

interface Paiement {
    id: number;
    montant: number;
    commission: number;
    montant_net: number;
    statut: 'en_attente' | 'complete' | 'vire';
    methode: string;
    date: string;
    reference: string;
    client_nom: string;
}

interface Props {
    paiements?: Paiement[];
    revenus_total?: number;
    revenus_mois?: number;
    en_attente?: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-800 border border-amber-200' },
    complete:   { label: 'Complété',   color: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    vire:       { label: 'Viré',       color: 'bg-blue-100 text-blue-800 border border-blue-200' },
};

export default function ArtisanPaiements({ paiements = [], revenus_total = 0, revenus_mois = 0, en_attente = 0 }: Props) {
    const [showExportModal, setShowExportModal] = useState(false);
    const [showVirementModal, setShowVirementModal] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Revenus - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('artisan.dashboard')}
                            className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Mes Revenus</h1>
                            <p className="mt-1 text-[hsl(20,10%,50%)]">Historique de vos paiements et virements</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm font-medium text-[hsl(20,14%,12%)] hover:border-amber-400 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Exporter
                        </button>
                        <button
                            onClick={() => setShowVirementModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm transition-all"
                        >
                            <ArrowDownToLine className="h-4 w-4" />
                            Demander un virement
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Dark total card */}
                    <div className="rounded-2xl bg-[hsl(20,14%,10%)] p-6 text-white shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-400 text-sm font-medium">Revenus totaux</p>
                                <p className="text-3xl font-bold mt-1">{revenus_total.toLocaleString('fr-FR')}</p>
                                <p className="text-[hsl(20,10%,60%)] text-sm">FCFA</p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-amber-400" />
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[hsl(20,10%,50%)]">Ce mois</p>
                                <p className="text-3xl font-bold text-emerald-600 mt-1">{revenus_mois.toLocaleString('fr-FR')}</p>
                                <p className="text-xs text-[hsl(20,10%,50%)]">FCFA</p>
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
                                <p className="text-3xl font-bold text-amber-600 mt-1">{en_attente.toLocaleString('fr-FR')}</p>
                                <p className="text-xs text-[hsl(20,10%,50%)]">FCFA</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Commission Info */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-800">
                        <strong>Commission plateforme :</strong> ArtisanPro prélève une commission de 10% sur chaque transaction.
                        Le montant net vous est versé sous 48h après confirmation de la prestation.
                    </p>
                </div>

                {/* Transactions */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4">
                        <h2 className="font-semibold text-[hsl(20,14%,12%)]">Transactions</h2>
                    </div>
                    {paiements.length === 0 ? (
                        <div className="p-12 text-center">
                            <CreditCard className="h-14 w-14 text-[hsl(20,10%,50%)] mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-[hsl(20,14%,12%)] mb-2">Aucune transaction</h3>
                            <p className="text-[hsl(20,10%,50%)]">Vos revenus apparaîtront ici après vos prestations</p>
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
                                                <p className="font-semibold text-[hsl(20,14%,12%)]">{p.client_nom}</p>
                                                <p className="text-sm text-[hsl(20,10%,50%)]">{p.methode} · Réf: {p.reference}</p>
                                                <p className="text-xs text-[hsl(20,10%,50%)]">{new Date(p.date).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            <div>
                                                <p className="font-bold text-[hsl(20,14%,12%)]">{Number(p.montant_net).toLocaleString('fr-FR')} FCFA</p>
                                                <p className="text-xs text-[hsl(20,10%,50%)]">Brut: {Number(p.montant).toLocaleString('fr-FR')} · Com: {Number(p.commission).toLocaleString('fr-FR')}</p>
                                            </div>
                                            <Badge className={sc.color}>{sc.label}</Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Export Modal */}
                {showExportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[hsl(20,14%,6%)]/70 backdrop-blur-sm" onClick={() => setShowExportModal(false)} />
                        <div className="relative w-full max-w-md rounded-2xl bg-white border border-[hsl(30,20%,88%)] p-6 shadow-2xl">
                            <h3 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Export des paiements</h3>
                            <p className="mt-2 text-[hsl(20,10%,50%)]">Cette fonctionnalité est en cours d'implémentation. Vous pourrez bientôt télécharger l'historique de vos revenus.</p>
                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="inline-flex items-center rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm font-medium text-[hsl(20,14%,12%)] hover:border-amber-400 transition-colors"
                                >
                                    Fermer
                                </button>
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm transition-all"
                                >
                                    Ok
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Virement Modal */}
                {showVirementModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[hsl(20,14%,6%)]/70 backdrop-blur-sm" onClick={() => setShowVirementModal(false)} />
                        <div className="relative w-full max-w-md rounded-2xl bg-white border border-[hsl(30,20%,88%)] p-6 shadow-2xl">
                            <h3 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Demande de virement</h3>
                            <p className="mt-2 text-[hsl(20,10%,50%)]">Votre demande de virement a bien été enregistrée. Le virement sera traité sous 48h ouvrées.</p>
                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    onClick={() => setShowVirementModal(false)}
                                    className="inline-flex items-center rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm font-medium text-[hsl(20,14%,12%)] hover:border-amber-400 transition-colors"
                                >
                                    Fermer
                                </button>
                                <button
                                    onClick={() => setShowVirementModal(false)}
                                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm transition-all"
                                >
                                    Très bien
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
