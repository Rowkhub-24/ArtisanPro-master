import { Head, Link, router, usePage } from '@inertiajs/react';
import { FileText, Clock, CheckCircle, XCircle, ArrowLeft, Search, Plus, Eye } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
    en_attente:   { label: 'En attente',   color: 'bg-amber-100 text-amber-800 border border-amber-200',     icon: <Clock className="h-4 w-4 text-amber-600" /> },
    accepte:      { label: 'Accepté',      color: 'bg-emerald-100 text-emerald-800 border border-emerald-200', icon: <CheckCircle className="h-4 w-4 text-emerald-600" /> },
    refuse:       { label: 'Refusé',       color: 'bg-red-100 text-red-800 border border-red-200',           icon: <XCircle className="h-4 w-4 text-red-600" /> },
    contre_offre: { label: 'Contre-offre', color: 'bg-blue-100 text-blue-800 border border-blue-200',        icon: <FileText className="h-4 w-4 text-blue-600" /> },
};

export default function ClientDevis({ devis = [] }: Props) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Devis - ArtisanPro" />
            <div className="flex flex-col gap-8 p-4 md:p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <Link
                            href={route('client.dashboard')}
                            className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Mes Devis</h1>
                            <p className="mt-1 text-sm md:text-base text-[hsl(20,10%,50%)]">Suivez vos demandes de devis auprès des artisans</p>
                        </div>
                    </div>
                    <Link
                        href={route('artisans.index')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm transition-all w-full md:w-auto justify-center"
                    >
                        <Plus className="h-4 w-4" />
                        Nouvelle demande
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
                    {[
                        { label: 'Total',      value: devis.length,                                              color: 'text-[hsl(20,14%,12%)]', bg: 'bg-amber-100',   icon: FileText,      iconColor: 'text-amber-600' },
                        { label: 'En attente', value: devis.filter(d => d.statut === 'en_attente').length,       color: 'text-amber-600',          bg: 'bg-amber-100',   icon: Clock,         iconColor: 'text-amber-600' },
                        { label: 'Acceptés',   value: devis.filter(d => d.statut === 'accepte').length,          color: 'text-emerald-600',        bg: 'bg-emerald-100', icon: CheckCircle,   iconColor: 'text-emerald-600' },
                        { label: 'Refusés',    value: devis.filter(d => d.statut === 'refuse').length,           color: 'text-red-600',            bg: 'bg-red-100',     icon: XCircle,       iconColor: 'text-red-600' },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-[hsl(20,10%,50%)]">{stat.label}</p>
                                    <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                                </div>
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Devis List */}
                <div className="space-y-4">
                    {devis.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,88%)] bg-white p-12 text-center">
                            <FileText className="h-14 w-14 text-[hsl(20,10%,50%)] mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-[hsl(20,14%,12%)] mb-2">Aucune demande de devis</h3>
                            <p className="text-[hsl(20,10%,50%)] mb-6">Trouvez un artisan et demandez un devis gratuit</p>
                            <Link
                                href={route('artisans.index')}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm transition-all"
                            >
                                <Search className="h-4 w-4" />
                                Trouver un artisan
                            </Link>
                        </div>
                    ) : (
                        devis.map((d) => {
                            const sc = statusConfig[d.statut] ?? statusConfig.en_attente;
                            return (
                                <div key={d.id} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-md transition-all overflow-hidden">
                                    {/* Amber top strip */}
                                    <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                                    <div className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 shrink-0">
                                                    <FileText className="h-6 w-6 text-amber-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        {sc.icon}
                                                        <Badge className={sc.color}>{sc.label}</Badge>
                                                        <span className="text-sm text-[hsl(20,10%,50%)]">
                                                            {new Date(d.date_demande).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-semibold text-[hsl(20,14%,12%)] text-lg">
                                                        {d.artisan ? `${d.artisan.metier} — ${d.artisan.user.prenom} ${d.artisan.user.nom}` : 'Artisan inconnu'}
                                                    </h3>
                                                    <p className="text-[hsl(20,10%,50%)] mt-1 text-sm line-clamp-2">{d.description_travaux}</p>
                                                    {d.montant_propose && (
                                                        <div className="mt-3 inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5">
                                                            <span className="text-sm font-semibold text-emerald-800">
                                                                Offre : {Number(d.montant_propose).toLocaleString('fr-FR')} FCFA
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 shrink-0">
                                                {d.artisan && (
                                                    <Link
                                                        href={route('artisans.show', d.artisan.id)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-[hsl(30,20%,82%)] bg-white text-[hsl(20,14%,12%)] hover:border-amber-400 px-3 py-1.5 text-sm font-medium transition-colors"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Voir artisan
                                                    </Link>
                                                )}
                                                {d.statut === 'accepte' && (
                                                    <button className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 text-sm transition-colors">
                                                        Réserver
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
