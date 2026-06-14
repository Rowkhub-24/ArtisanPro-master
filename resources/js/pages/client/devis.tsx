import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, ArrowLeft, Search, Plus, Eye, ChevronDown, ChevronUp, Bell } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import MaterielsReadOnly from '@/components/MaterielsReadOnly';
import { type LigneMateriel } from '@/components/MaterielsEditor';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { useDevisRealtimeUpdates } from '@/hooks/useDevisRealtimeUpdates';

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
    notes_artisan?: string | null;
    sous_total_materiels?: number | null;
    materiels?: LigneMateriel[];
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
    accepte:      { label: 'Offre reçue',  color: 'bg-emerald-100 text-emerald-800 border border-emerald-200', icon: <CheckCircle className="h-4 w-4 text-emerald-600" /> },
    accepte_sans_offre: { label: 'Accepté', color: 'bg-blue-100 text-blue-800 border border-blue-200',       icon: <CheckCircle className="h-4 w-4 text-blue-600" /> },
    refuse:       { label: 'Refusé',       color: 'bg-red-100 text-red-800 border border-red-200',           icon: <XCircle className="h-4 w-4 text-red-600" /> },
    contre_offre: { label: 'Contre-offre', color: 'bg-blue-100 text-blue-800 border border-blue-200',        icon: <FileText className="h-4 w-4 text-blue-600" /> },
};

export default function ClientDevis({ devis = [] }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Écouter les mises à jour temps réel sur le canal privé du client
    useDevisRealtimeUpdates(auth.user?.id);

    const toggleExpand = (id: number) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    // Devis avec offre chiffrée de l'artisan (statut accepte avec montant_propose)
    const devisAvecOffre = devis.filter(d => d.statut === 'accepte' && d.montant_propose != null);

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

                {/* Bannière alerte : offres reçues */}
                {devisAvecOffre.length > 0 && (
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                        <Bell className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-emerald-800">
                                {devisAvecOffre.length === 1
                                    ? 'Un artisan a répondu à votre demande de devis'
                                    : `${devisAvecOffre.length} artisans ont répondu à vos demandes de devis`}
                            </p>
                            <p className="text-sm text-emerald-700 mt-0.5">
                                Consultez l'offre ci-dessous et cliquez sur "Détails" pour voir le montant et les matériels proposés.
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
                    {[
                        { label: 'Total',         value: devis.length,                                                                              color: 'text-[hsl(20,14%,12%)]', bg: 'bg-amber-100',   icon: FileText,      iconColor: 'text-amber-600' },
                        { label: 'En attente',    value: devis.filter(d => d.statut === 'en_attente').length,                                       color: 'text-amber-600',          bg: 'bg-amber-100',   icon: Clock,         iconColor: 'text-amber-600' },
                        { label: 'Offres reçues', value: devis.filter(d => d.statut === 'accepte' && d.montant_propose != null).length,             color: 'text-emerald-600',        bg: 'bg-emerald-100', icon: CheckCircle,   iconColor: 'text-emerald-600' },
                        { label: 'Refusés',       value: devis.filter(d => d.statut === 'refuse').length,                                           color: 'text-red-600',            bg: 'bg-red-100',     icon: XCircle,       iconColor: 'text-red-600' },
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
                            const sc = d.statut === 'accepte' && d.montant_propose == null
                                ? statusConfig['accepte_sans_offre']
                                : (statusConfig[d.statut] ?? statusConfig.en_attente);
                            const isExpanded = expandedId === d.id;
                            // Afficher Détails dès que l'artisan a répondu avec un montant ou des notes
                            const hasOffer = d.statut === 'accepte' && (
                                d.montant_propose != null ||
                                d.notes_artisan != null ||
                                (d.materiels && d.materiels.length > 0) ||
                                Number(d.sous_total_materiels ?? 0) > 0
                            );
                            const hasDetails = hasOffer;
                            const hasMateriels =
                                (d.materiels && d.materiels.length > 0) ||
                                Number(d.sous_total_materiels ?? 0) > 0;

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
                                                    {d.statut === 'accepte' && d.montant_propose == null && (
                                                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5">
                                                            <Clock className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                                                            <span className="text-sm text-blue-700">
                                                                L'artisan prépare son offre…
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
                                                {hasDetails && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleExpand(d.id)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 text-sm font-medium transition-colors"
                                                        aria-expanded={isExpanded}
                                                    >
                                                        {isExpanded ? (
                                                            <>
                                                                <ChevronUp className="h-4 w-4" />
                                                                Masquer
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="h-4 w-4" />
                                                                Détails
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Section détails dépliable (matériels + notes) */}
                                        {isExpanded && (
                                            <div className="mt-5 space-y-4 border-t border-[hsl(30,20%,88%)] pt-4">
                                                {/* Notes artisan */}
                                                {d.notes_artisan && (
                                                    <div className="rounded-xl bg-[hsl(36,33%,97%)] px-4 py-3">
                                                        <p className="text-xs font-semibold text-[hsl(20,10%,50%)] uppercase tracking-wide mb-1">
                                                            Notes de l'artisan
                                                        </p>
                                                        <p className="text-sm text-[hsl(20,14%,12%)]">{d.notes_artisan}</p>
                                                    </div>
                                                )}

                                                {/* Liste des matériels */}
                                                {hasMateriels ? (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-[hsl(20,14%,12%)] mb-2">
                                                            Liste des matériels
                                                        </h4>
                                                        <MaterielsReadOnly
                                                            materiels={d.materiels ?? []}
                                                            sousTotalMateriels={Number(d.sous_total_materiels ?? 0)}
                                                        />
                                                    </div>
                                                ) : !d.notes_artisan && (
                                                    <p className="text-sm text-[hsl(20,10%,50%)] italic">
                                                        L'artisan n'a pas encore ajouté de matériels ni de notes.
                                                    </p>
                                                )}
                                            </div>
                                        )}
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
