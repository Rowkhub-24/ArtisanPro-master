import { Head, Link, router, usePage } from '@inertiajs/react';
import { FileText, Clock, CheckCircle, XCircle, ArrowLeft, Search, Eye } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/dashboard' },
    { title: 'Mes Devis', href: '/artisan/devis' },
];

interface DevisItem {
    id: number;
    description_travaux: string;
    statut: 'en_attente' | 'accepte' | 'refuse' | 'contre_offre';
    created_at: string;
    client?: {
        user: {
            prenom: string;
            nom: string;
            email: string;
            telephone?: string;
        };
    };
}

interface Props {
    devis?: DevisItem[];
}

export default function ArtisanDevis({ devis = [] }: Props) {
    const { auth } = usePage<SharedData>().props;

    const updateStatut = (devisId: number, statut: 'accepte' | 'refuse') => {
        router.patch(route('artisan.devis.statut', devisId), { statut }, { preserveScroll: true });
    };

    const getStatusBadge = (statut: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            en_attente: { label: 'En attente', className: 'bg-amber-100 text-amber-800 border border-amber-200' },
            accepte:    { label: 'Accepté',    className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
            refuse:     { label: 'Refusé',     className: 'bg-red-100 text-red-800 border border-red-200' },
            en_cours:   { label: 'En cours',   className: 'bg-blue-100 text-blue-800 border border-blue-200' },
            termine:    { label: 'Terminé',    className: 'bg-gray-100 text-gray-700 border border-gray-200' },
        };
        const config = statusConfig[statut as keyof typeof statusConfig] || statusConfig.en_attente;
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    const getStatusIcon = (statut: string) => {
        switch (statut) {
            case 'accepte':
                return <CheckCircle className="h-5 w-5 text-emerald-600" />;
            case 'refuse':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'en_cours':
                return <Clock className="h-5 w-5 text-blue-600" />;
            default:
                return <Clock className="h-5 w-5 text-amber-600" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Devis - ArtisanPro" />
            <div className="flex flex-col gap-8 p-4 md:p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <Link
                            href={route('artisan.dashboard')}
                            className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Mes Devis</h1>
                            <p className="mt-1 text-sm md:text-base text-[hsl(20,10%,50%)]">Gérez les demandes de devis de vos clients</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(20,10%,50%)]" />
                            <input
                                placeholder="Rechercher..."
                                className="pl-10 w-full md:w-64 rounded-xl border border-[hsl(30,20%,82%)] bg-white focus:border-amber-400 focus:outline-none px-3 py-2 text-sm text-[hsl(20,14%,12%)]"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
                    {[
                        { label: 'Total',      value: devis.length,                                              color: 'text-[hsl(20,14%,12%)]', icon: FileText,   iconColor: 'text-amber-600',   bg: 'bg-amber-100' },
                        { label: 'En attente', value: devis.filter(d => d.statut === 'en_attente').length,       color: 'text-amber-600',          icon: Clock,      iconColor: 'text-amber-600',   bg: 'bg-amber-100' },
                        { label: 'Acceptés',   value: devis.filter(d => d.statut === 'accepte').length,          color: 'text-emerald-600',        icon: CheckCircle, iconColor: 'text-emerald-600', bg: 'bg-emerald-100' },
                        { label: 'En cours',   value: devis.filter(d => d.statut === 'en_cours' as any).length,  color: 'text-blue-600',           icon: Clock,      iconColor: 'text-blue-600',    bg: 'bg-blue-100' },
                    ].map((s) => (
                        <div key={s.label} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-[hsl(20,10%,50%)]">{s.label}</p>
                                    <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                                </div>
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                                    <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Devis List */}
                <div className="space-y-4">
                    {devis.length === 0 ? (
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-12 text-center">
                            <FileText className="h-12 w-12 text-[hsl(20,10%,50%)] mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-[hsl(20,14%,12%)] mb-2">Aucune demande de devis</h3>
                            <p className="text-[hsl(20,10%,50%)]">Vous n'avez pas encore reçu de demandes de devis de clients.</p>
                        </div>
                    ) : (
                        devis.map((devisItem) => (
                            <div key={devisItem.id} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                {/* Amber top strip */}
                                <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                                <div className="p-6">
                                    <div className="flex items-start justify-between flex-wrap gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                {getStatusIcon(devisItem.statut)}
                                                {getStatusBadge(devisItem.statut)}
                                                <span className="text-sm text-[hsl(20,10%,50%)]">
                                                    {new Date(devisItem.created_at).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-[hsl(20,14%,12%)]">
                                                {devisItem.client?.user ? `${devisItem.client.user.prenom} ${devisItem.client.user.nom}` : 'Client inconnu'}
                                            </h3>
                                            <p className="text-[hsl(20,10%,50%)] mt-1 text-sm">
                                                {devisItem.client?.user.email}
                                                {devisItem.client?.user.telephone && ` · ${devisItem.client.user.telephone}`}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {devisItem.statut === 'en_attente' && (
                                                <>
                                                    <button
                                                        onClick={() => updateStatut(devisItem.id, 'accepte')}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 text-sm transition-colors"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        Accepter
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatut(devisItem.id, 'refuse')}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 text-sm font-medium transition-colors"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        Refuser
                                                    </button>
                                                </>
                                            )}
                                            <button className="inline-flex items-center gap-1.5 rounded-xl border border-[hsl(30,20%,82%)] bg-white text-[hsl(20,14%,12%)] hover:border-amber-400 px-3 py-1.5 text-sm font-medium transition-colors">
                                                <Eye className="h-4 w-4" />
                                                Voir détails
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-4 bg-[hsl(36,33%,97%)] rounded-xl p-4">
                                        <p className="text-sm text-[hsl(20,14%,12%)]">
                                            <span className="font-medium">Description :</span>{' '}
                                            {devisItem.description_travaux}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
