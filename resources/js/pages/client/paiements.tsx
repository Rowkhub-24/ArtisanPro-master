import { Head, Link } from '@inertiajs/react';
import { CreditCard, ArrowLeft, TrendingUp, CheckCircle, Clock, Download, Filter } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
    complete: { label: 'Complété', color: 'bg-green-100 text-green-800' },
    echoue: { label: 'Échoué', color: 'bg-red-100 text-red-800' },
    rembourse: { label: 'Remboursé', color: 'bg-blue-100 text-blue-800' },
};

export default function ClientPaiements({ paiements = [], total_depense = 0 }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Paiements - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href={route('client.dashboard')}><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Historique des paiements</h1>
                            <p className="mt-1 text-gray-600">Consultez toutes vos transactions</p>
                        </div>
                    </div>
                    <Button variant="outline" className="border-gray-300">
                        <Download className="mr-2 h-4 w-4" />
                        Exporter
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-200 text-sm">Total dépensé</p>
                                    <p className="text-3xl font-bold mt-1">{total_depense.toLocaleString('fr-FR')}</p>
                                    <p className="text-blue-200 text-sm">FCFA</p>
                                </div>
                                <TrendingUp className="h-10 w-10 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Paiements complétés</p>
                                    <p className="text-3xl font-bold text-green-600 mt-1">
                                        {paiements.filter(p => p.statut === 'complete').length}
                                    </p>
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
                                    <p className="text-3xl font-bold text-yellow-600 mt-1">
                                        {paiements.filter(p => p.statut === 'en_attente').length}
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                                    <Clock className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions List */}
                <Card className="border-0 shadow-lg bg-white">
                    <CardHeader className="border-b border-gray-100 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-gray-900">Transactions</CardTitle>
                            <Button variant="outline" size="sm" className="border-gray-300">
                                <Filter className="mr-2 h-4 w-4" />
                                Filtrer
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {paiements.length === 0 ? (
                            <div className="p-12 text-center">
                                <CreditCard className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun paiement</h3>
                                <p className="text-gray-500">Vos transactions apparaîtront ici après vos réservations</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {paiements.map((p) => {
                                    const sc = statusConfig[p.statut] ?? statusConfig.en_attente;
                                    return (
                                        <div key={p.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                                                    <CreditCard className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{p.artisan_metier}</p>
                                                    <p className="text-sm text-gray-500">{p.artisan_nom} · {p.methode}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Réf: {p.reference}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{Number(p.montant).toLocaleString('fr-FR')} FCFA</p>
                                                    <p className="text-xs text-gray-400">{new Date(p.date).toLocaleDateString('fr-FR')}</p>
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
            </div>
        </AppLayout>
    );
}
