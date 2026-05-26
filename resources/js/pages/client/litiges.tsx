import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Plus, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
    ouvert:   { label: 'Ouvert',   color: 'bg-red-100 text-red-800 border border-red-200',         icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
    en_cours: { label: 'En cours', color: 'bg-amber-100 text-amber-800 border border-amber-200',   icon: <Clock className="h-4 w-4 text-amber-600" /> },
    resolu:   { label: 'Résolu',   color: 'bg-emerald-100 text-emerald-800 border border-emerald-200', icon: <CheckCircle className="h-4 w-4 text-emerald-600" /> },
    ferme:    { label: 'Fermé',    color: 'bg-gray-100 text-gray-700 border border-gray-200',      icon: <XCircle className="h-4 w-4 text-gray-500" /> },
};

export default function ClientLitiges({ litiges = [] }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Litiges - ArtisanPro" />
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
                            <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Litiges & Réclamations</h1>
                            <p className="mt-1 text-[hsl(20,10%,50%)]">Gérez vos litiges avec les artisans</p>
                        </div>
                    </div>
                    <Link
                        href={route('client.litiges.create')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-semibold px-4 py-2 text-sm transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Ouvrir un litige
                    </Link>
                </div>

                {/* Info Banner */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-medium text-amber-900">Comment ça fonctionne ?</p>
                            <p className="text-sm text-amber-700 mt-1">
                                En cas de problème avec un artisan, ouvrez un litige. Notre équipe de médiation interviendra
                                sous 48h pour trouver une solution équitable.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    {[
                        { label: 'Total',     value: litiges.length,                                          color: 'text-[hsl(20,14%,12%)]', bg: 'bg-[hsl(36,33%,94%)]' },
                        { label: 'Ouverts',   value: litiges.filter(l => l.statut === 'ouvert').length,       color: 'text-red-600',            bg: 'bg-red-100' },
                        { label: 'En cours',  value: litiges.filter(l => l.statut === 'en_cours').length,     color: 'text-amber-600',          bg: 'bg-amber-100' },
                        { label: 'Résolus',   value: litiges.filter(l => l.statut === 'resolu').length,       color: 'text-emerald-600',        bg: 'bg-emerald-100' },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-5">
                            <p className="text-sm text-[hsl(20,10%,50%)]">{stat.label}</p>
                            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Litiges List */}
                {litiges.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,88%)] bg-white p-12 text-center">
                        <CheckCircle className="h-14 w-14 text-emerald-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-[hsl(20,14%,12%)] mb-2">Aucun litige</h3>
                        <p className="text-[hsl(20,10%,50%)]">Vous n'avez aucun litige en cours. Continuez à profiter de nos services !</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {litiges.map((l) => {
                            const sc = statusConfig[l.statut] ?? statusConfig.ouvert;
                            return (
                                <div key={l.id} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-md transition-shadow p-6">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 shrink-0">
                                                <AlertTriangle className="h-6 w-6 text-red-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                    {sc.icon}
                                                    <Badge className={sc.color}>{sc.label}</Badge>
                                                    <span className="text-sm text-[hsl(20,10%,50%)]">
                                                        {new Date(l.date_ouverture).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-[hsl(20,14%,12%)] text-lg">{l.sujet}</h3>
                                                <p className="text-sm text-[hsl(20,10%,50%)]">{l.artisan_metier} — {l.artisan_nom}</p>
                                                <p className="text-[hsl(20,10%,50%)] mt-2 text-sm line-clamp-2">{l.description}</p>
                                            </div>
                                        </div>
                                        <button className="inline-flex items-center gap-1.5 rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-1.5 text-sm font-medium text-[hsl(20,14%,12%)] hover:border-amber-400 transition-colors">
                                            <Eye className="h-4 w-4" />
                                            Détails
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
