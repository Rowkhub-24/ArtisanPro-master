import { Head, Link, router, usePage } from '@inertiajs/react';
import { FileText, Clock, CheckCircle, XCircle, ArrowLeft, Search, Plus, Eye } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/client/dashboard' },
    { title: 'Mes Devis', href: '/client/devis' },
];

interface DevisItem {
    id: number;
    description_travaux: string;
    statut: 'en_attente' | 'accepte' | 'refuse' | 'contre_offre';
    date_demande: string;
    montant_propose: number | null;
    artisan: {
        id: number;
        metier: string;
        user: { prenom: string; nom: string; telephone: string | null };
    } | null;
}

interface Props {
    devis?: DevisItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4 text-yellow-600" /> },
    accepte: { label: 'Accepté', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4 text-green-600" /> },
    refuse: { label: 'Refusé', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4 text-red-600" /> },
    contre_offre: { label: 'Contre-offre', color: 'bg-blue-100 text-blue-800', icon: <FileText className="h-4 w-4 text-blue-600" /> },
};

export default function ClientDevis({ devis = [] }: Props) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Devis - ArtisanPro" />
            <div className="flex flex-col gap-8 p-4 md:p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <Button asChild variant="outline" size="icon">
                            <Link href={route('client.dashboard')}><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Mes Devis</h1>
                            <p className="mt-1 text-sm md:text-base text-gray-600">Suivez vos demandes de devis auprès des artisans</p>
                        </div>
                    </div>
                    <Button asChild className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                        <Link href={route('artisans.index')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nouvelle demande
                        </Link>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
                    {[
                        { label: 'Total', value: devis.length, color: 'text-gray-900', bg: 'bg-gray-100', icon: FileText },
                        { label: 'En attente', value: devis.filter(d => d.statut === 'en_attente').length, color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock },
                        { label: 'Acceptés', value: devis.filter(d => d.statut === 'accepte').length, color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
                        { label: 'Refusés', value: devis.filter(d => d.statut === 'refuse').length, color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
                    ].map((stat) => (
                        <Card key={stat.label} className="border-0 shadow-lg bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                        <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                                    </div>
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Devis List */}
                <div className="space-y-4">
                    {devis.length === 0 ? (
                        <Card className="border-dashed border-2 border-gray-200 bg-white">
                            <CardContent className="p-12 text-center">
                                <FileText className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune demande de devis</h3>
                                <p className="text-gray-500 mb-6">Trouvez un artisan et demandez un devis gratuit</p>
                                <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    <Link href={route('artisans.index')}>
                                        <Search className="mr-2 h-4 w-4" />
                                        Trouver un artisan
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        devis.map((d) => {
                            const sc = statusConfig[d.statut] ?? statusConfig.en_attente;
                            return (
                                <Card key={d.id} className="border-gray-200 bg-white hover:shadow-lg transition-all">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 shrink-0">
                                                    <FileText className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {sc.icon}
                                                        <Badge className={sc.color}>{sc.label}</Badge>
                                                        <span className="text-sm text-gray-400">
                                                            {new Date(d.date_demande).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-semibold text-gray-900 text-lg">
                                                        {d.artisan ? `${d.artisan.metier} — ${d.artisan.user.prenom} ${d.artisan.user.nom}` : 'Artisan inconnu'}
                                                    </h3>
                                                    <p className="text-gray-600 mt-1 text-sm line-clamp-2">{d.description_travaux}</p>
                                                    {d.montant_propose && (
                                                        <div className="mt-3 inline-flex items-center rounded-lg bg-green-50 px-3 py-1.5">
                                                            <span className="text-sm font-semibold text-green-800">
                                                                Offre : {Number(d.montant_propose).toLocaleString('fr-FR')} FCFA
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 shrink-0">
                                                {d.artisan && (
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link href={route('artisans.show', d.artisan.id)}>
                                                            <Eye className="mr-1.5 h-4 w-4" />
                                                            Voir artisan
                                                        </Link>
                                                    </Button>
                                                )}
                                                {d.statut === 'accepte' && (
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                                        Réserver
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
