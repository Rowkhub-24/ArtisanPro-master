import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Clock, CheckCircle, XCircle, ArrowLeft, Search, Eye, Phone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/artisan/dashboard' },
    { title: 'Réservations', href: '/artisan/reservations' },
];

interface Reservation {
    id: number;
    statut: 'en_cours' | 'confirmee' | 'terminee' | 'annulee' | 'litige' | string;
    date_reservation: string;
    montant_total: number | null;
    adresse_intervention: string | null;
    has_paiement?: boolean;
    client: {
        user: { prenom: string; nom: string; telephone: string | null; email: string };
    } | null;
}

interface Props {
    reservations?: Reservation[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    en_cours:  { label: 'En cours',  color: 'bg-blue-100 text-blue-800 border border-blue-200',         icon: <Clock className="h-4 w-4 text-blue-600" /> },
    confirmee: { label: 'Confirmée', color: 'bg-emerald-100 text-emerald-800 border border-emerald-200', icon: <CheckCircle className="h-4 w-4 text-emerald-600" /> },
    terminee:  { label: 'Terminée',  color: 'bg-gray-100 text-gray-700 border border-gray-200',         icon: <CheckCircle className="h-4 w-4 text-gray-500" /> },
    annulee:   { label: 'Annulée',   color: 'bg-red-100 text-red-800 border border-red-200',            icon: <XCircle className="h-4 w-4 text-red-600" /> },
    litige:    { label: 'Litige',    color: 'bg-amber-100 text-amber-800 border border-amber-200',      icon: <Clock className="h-4 w-4 text-amber-600" /> },
};

export default function ArtisanReservations({ reservations = [] }: Props) {
    const handleUpdateStatus = (reservationId: number, statut: 'confirmee' | 'annulee' | 'terminee') => {
        const labels: Record<string, string> = {
            confirmee: 'confirmer',
            annulee: 'refuser',
            terminee: 'marquer comme terminée',
        };
        if (!window.confirm(`Êtes-vous sûr de vouloir ${labels[statut] ?? statut} cette réservation ?`)) {
            return;
        }
        router.patch(route('artisan.reservations.statut', reservationId), { statut }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Réservations - ArtisanPro" />
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
                            <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Mes Réservations</h1>
                            <p className="mt-1 text-[hsl(20,10%,50%)]">Gérez les demandes de vos clients</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(20,10%,50%)]" />
                        <input
                            placeholder="Rechercher..."
                            className="pl-10 w-64 rounded-xl border border-[hsl(30,20%,82%)] bg-white focus:border-amber-400 focus:outline-none px-3 py-2 text-sm text-[hsl(20,14%,12%)]"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-5">
                    {[
                        { label: 'Total',      value: reservations.length,                                                                    color: 'text-[hsl(20,14%,12%)]', bg: 'bg-amber-100',   icon: Calendar,     iconColor: 'text-amber-600' },
                        { label: 'En cours',   value: reservations.filter(r => ['en_cours', 'en_attente'].includes(r.statut ?? '')).length,   color: 'text-blue-600',           bg: 'bg-blue-100',    icon: Clock,        iconColor: 'text-blue-600' },
                        { label: 'Confirmées', value: reservations.filter(r => ['confirmee', 'confirme'].includes(r.statut ?? '')).length,    color: 'text-emerald-600',        bg: 'bg-emerald-100', icon: CheckCircle,  iconColor: 'text-emerald-600' },
                        { label: 'Terminées',  value: reservations.filter(r => ['terminee', 'termine'].includes(r.statut ?? '')).length,      color: 'text-gray-600',           bg: 'bg-gray-100',    icon: CheckCircle,  iconColor: 'text-gray-500' },
                        { label: 'Annulées',   value: reservations.filter(r => ['annulee', 'annule'].includes(r.statut ?? '')).length,        color: 'text-red-600',            bg: 'bg-red-100',     icon: XCircle,      iconColor: 'text-red-600' },
                    ].map((s) => (
                        <div key={s.label} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[hsl(20,10%,50%)]">{s.label}</p>
                                    <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                                </div>
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                                    <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-4">
                    {reservations.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,88%)] bg-white p-12 text-center">
                            <Calendar className="h-14 w-14 text-[hsl(20,10%,50%)] mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-[hsl(20,14%,12%)] mb-2">Aucune réservation</h3>
                            <p className="text-[hsl(20,10%,50%)]">Les demandes de vos clients apparaîtront ici</p>
                        </div>
                    ) : (
                        reservations.map((r) => {
                            const normalizedStatus = (s: any) => {
                                const map: Record<string, string> = {
                                    'en_attente': 'en_cours',
                                    'confirme': 'confirmee',
                                    'annule': 'annulee',
                                    'termine': 'terminee',
                                };
                                return map[s] ?? s;
                            };
                            const displayStatus = normalizedStatus(r.statut);
                            const sc = statusConfig[displayStatus] ?? statusConfig.en_cours;
                            return (
                                <div key={r.id} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-md transition-shadow p-6">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 shrink-0">
                                                <Calendar className="h-6 w-6 text-amber-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                    {sc.icon}
                                                    <Badge className={sc.color}>{sc.label}</Badge>
                                                    <span className="text-sm text-[hsl(20,10%,50%)]">{r.date_reservation}</span>
                                                </div>
                                                <h3 className="font-semibold text-[hsl(20,14%,12%)] text-lg">
                                                    {r.client?.user ? `${r.client.user.prenom} ${r.client.user.nom}` : 'Client'}
                                                </h3>
                                                {r.client?.user.telephone && (
                                                    <p className="text-sm text-[hsl(20,10%,50%)] flex items-center gap-1 mt-0.5">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {r.client.user.telephone}
                                                    </p>
                                                )}
                                                {r.adresse_intervention && (
                                                    <p className="text-sm text-[hsl(20,10%,50%)] mt-1">{r.adresse_intervention}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {r.montant_total && (
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-[hsl(20,14%,12%)]">
                                                        {Number(r.montant_total).toLocaleString('fr-FR')} FCFA
                                                    </p>
                                                </div>
                                            )}
                                            {/* Confirmer/Refuser : uniquement si en attente ET aucun paiement reçu */}
                                            {['en_attente', 'en_cours'].includes(r.statut ?? '') && !r.has_paiement && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateStatus(r.id, 'confirmee')}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 text-sm transition-colors"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        Confirmer
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateStatus(r.id, 'annulee')}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 text-sm font-medium transition-colors"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        Refuser
                                                    </button>
                                                </>
                                            )}
                                            {/* Marquer comme terminée : si payée et en cours */}
                                            {['en_cours'].includes(r.statut ?? '') && r.has_paiement && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateStatus(r.id, 'terminee')}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 text-sm transition-colors"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                    Terminer
                                                </button>
                                            )}
                                            <Link
                                                href={route('artisan.reservations.show', r.id)}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 text-sm font-medium transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Détails
                                            </Link>
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
