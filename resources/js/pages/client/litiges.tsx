import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Plus, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/client/dashboard' },
    { title: 'Litiges', href: '/client/litiges' },
];

interface Litige {
    id: number;
    sujet: string;
    description: string;
    statut: 'ouvert' | 'en_cours' | 'resolu' | 'ferme';
    date_ouverture: string;
    artisan_nom: string;
    artisan_metier: string;
}

interface Props {
    litiges?: Litige[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    ouvert: { label: 'Ouvert', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
    en_cours: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4 text-yellow-600" /> },
    resolu: { label: 'Résolu', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4 text-green-600" /> },
    ferme: { label: 'Fermé', color: 'bg-gray-100 text-gray-800', icon: <XCircle className="h-4 w-4 text-gray-600" /> },
};

export default function ClientLitiges({ litiges = [] }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Litiges - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href={route('client.dashboard')}><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Litiges & Réclamations</h1>
                            <p className="mt-1 text-gray-600">Gérez vos litiges avec les artisans</p>
                        </div>
                    </div>
                    <Button asChild className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">
                        <Link href={route('client.litiges.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Ouvrir un litige
                        </Link>
                    </Button>
                </div>

                {/* Info Banner */}
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium text-orange-900">Comment ça fonctionne ?</p>
                                <p className="text-sm text-orange-700 mt-1">
                                    En cas de problème avec un artisan, ouvrez un litige. Notre équipe de médiation interviendra 
                                    sous 48h pour trouver une solution équitable.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    {[
                        { label: 'Total', value: litiges.length, color: 'text-gray-900', bg: 'bg-gray-100' },
                        { label: 'Ouverts', value: litiges.filter(l => l.statut === 'ouvert').length, color: 'text-red-600', bg: 'bg-red-100' },
                        { label: 'En cours', value: litiges.filter(l => l.statut === 'en_cours').length, color: 'text-yellow-600', bg: 'bg-yellow-100' },
                        { label: 'Résolus', value: litiges.filter(l => l.statut === 'resolu').length, color: 'text-green-600', bg: 'bg-green-100' },
                    ].map((stat) => (
                        <Card key={stat.label} className="border-0 shadow-lg bg-white">
                            <CardContent className="p-5">
                                <p className="text-sm text-gray-500">{stat.label}</p>
                                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Litiges List */}
                {litiges.length === 0 ? (
                    <Card className="border-dashed border-2 border-gray-200 bg-white">
                        <CardContent className="p-12 text-center">
                            <CheckCircle className="h-14 w-14 text-green-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun litige</h3>
                            <p className="text-gray-500">Vous n'avez aucun litige en cours. Continuez à profiter de nos services !</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {litiges.map((l) => {
                            const sc = statusConfig[l.statut] ?? statusConfig.ouvert;
                            return (
                                <Card key={l.id} className="border-gray-200 bg-white hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 shrink-0">
                                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        {sc.icon}
                                                        <Badge className={sc.color}>{sc.label}</Badge>
                                                        <span className="text-sm text-gray-400">
                                                            {new Date(l.date_ouverture).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-semibold text-gray-900 text-lg">{l.sujet}</h3>
                                                    <p className="text-sm text-gray-500">{l.artisan_metier} — {l.artisan_nom}</p>
                                                    <p className="text-gray-600 mt-2 text-sm line-clamp-2">{l.description}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline">
                                                <Eye className="mr-1.5 h-4 w-4" />
                                                Détails
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
