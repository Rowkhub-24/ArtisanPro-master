import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { CreditCard, ArrowLeft, TrendingUp, CheckCircle, Clock, Download, ArrowDownToLine } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
    complete:   { label: 'Complété',   color: 'bg-green-100 text-green-800' },
    vire:       { label: 'Viré',       color: 'bg-blue-100 text-blue-800' },
};

export default function ArtisanPaiements({ paiements = [], revenus_total = 0, revenus_mois = 0, en_attente = 0 }: Props) {
    const [showExportModal, setShowExportModal] = useState(false);
    const [showVirementModal, setShowVirementModal] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Revenus - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href={route('artisan.dashboard')}><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mes Revenus</h1>
                            <p className="mt-1 text-gray-600">Historique de vos paiements et virements</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="border-gray-300"
                            onClick={() => setShowExportModal(true)}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Exporter
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                            onClick={() => setShowVirementModal(true)}
                        >
                            <ArrowDownToLine className="mr-2 h-4 w-4" />
                            Demander un virement
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-indigo-200 text-sm">Revenus totaux</p>
                                    <p className="text-3xl font-bold mt-1">{revenus_total.toLocaleString('fr-FR')}</p>
                                    <p className="text-indigo-200 text-sm">FCFA</p>
                                </div>
                                <TrendingUp className="h-10 w-10 text-indigo-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Ce mois</p>
                                    <p className="text-3xl font-bold text-green-600 mt-1">{revenus_mois.toLocaleString('fr-FR')}</p>
                                    <p className="text-xs text-gray-400">FCFA</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">En attente</p>
                                    <p className="text-3xl font-bold text-yellow-600 mt-1">{en_attente.toLocaleString('fr-FR')}</p>
                                    <p className="text-xs text-gray-400">FCFA</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                                    <Clock className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Commission Info */}
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Commission plateforme :</strong> ArtisanPro prélève une commission de 10% sur chaque transaction.
                            Le montant net vous est versé sous 48h après confirmation de la prestation.
                        </p>
                    </CardContent>
                </Card>

                {/* Transactions */}
                <Card className="border-0 shadow-lg bg-white">
                    <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-gray-900">Transactions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {paiements.length === 0 ? (
                            <div className="p-12 text-center">
                                <CreditCard className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune transaction</h3>
                                <p className="text-gray-500">Vos revenus apparaîtront ici après vos prestations</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {paiements.map((p) => {
                                    const sc = statusConfig[p.statut] ?? statusConfig.en_attente;
                                    return (
                                        <div key={p.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                                                    <CreditCard className="h-6 w-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{p.client_nom}</p>
                                                    <p className="text-sm text-gray-500">{p.methode} · Réf: {p.reference}</p>
                                                    <p className="text-xs text-gray-400">{new Date(p.date).toLocaleDateString('fr-FR')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-right">
                                                <div>
                                                    <p className="font-bold text-gray-900">{Number(p.montant_net).toLocaleString('fr-FR')} FCFA</p>
                                                    <p className="text-xs text-gray-400">Brut: {Number(p.montant).toLocaleString('fr-FR')} · Com: {Number(p.commission).toLocaleString('fr-FR')}</p>
                                                </div>
                                                <Badge className={sc.color}>{sc.label}</Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {showExportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setShowExportModal(false)} />
                        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                            <h3 className="text-xl font-semibold text-gray-900">Export des paiements</h3>
                            <p className="mt-2 text-gray-600">Cette fonctionnalité est en cours d'implémentation. Vous pourrez bientôt télécharger l'historique de vos revenus.</p>
                            <div className="mt-6 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowExportModal(false)}>
                                    Fermer
                                </Button>
                                <Button onClick={() => setShowExportModal(false)}>
                                    Ok
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {showVirementModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setShowVirementModal(false)} />
                        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                            <h3 className="text-xl font-semibold text-gray-900">Demande de virement</h3>
                            <p className="mt-2 text-gray-600">Votre demande de virement a bien été enregistrée. Le virement sera traité sous 48h ouvrées.</p>
                            <div className="mt-6 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowVirementModal(false)}>
                                    Fermer
                                </Button>
                                <Button onClick={() => setShowVirementModal(false)}>
                                    Très bien
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
