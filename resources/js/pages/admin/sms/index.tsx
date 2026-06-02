import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    MessageSquare, CheckCircle, XCircle, Clock, RefreshCw,
    Search, Filter, Eye, Send, TrendingUp, Calendar, DollarSign, BarChart3
} from 'lucide-react';
import { useState } from 'react';

import AdminLayout from '@/layouts/admin-layout';
import { type SharedData } from '@/types';

interface SmsLog {
    id: number;
    recipient: string;
    message: string;
    status: 'pending' | 'sent' | 'failed' | 'retrying';
    type: string;
    provider: string;
    attempt: number;
    error_message: string | null;
    sent_at: string | null;
    created_at: string;
}

interface PaginatedSmsLogs {
    data: SmsLog[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Stats {
    total: number;
    envoyes: number;
    echoues: number;
    aujourd_hui: number;
    ce_mois: number;
    cout_estime_xof: number;
}

interface Props {
    smsLogs: PaginatedSmsLogs;
    stats: Stats;
    smsByDay: Record<string, number>;
    smsByMonth: Record<string, number>;
    filters: {
        q?: string;
        status?: string;
        type?: string;
        date_from?: string;
        date_to?: string;
    };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    sent:     { label: 'Envoyé',     color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    pending:  { label: 'En attente', color: 'bg-amber-100 text-amber-800',    icon: Clock },
    retrying: { label: 'Retry',      color: 'bg-orange-100 text-orange-800',  icon: RefreshCw },
    failed:   { label: 'Échoué',     color: 'bg-red-100 text-red-800',        icon: XCircle },
};

const typeLabels: Record<string, string> = {
    bienvenue:       'Bienvenue',
    confirmation:    'Confirmation',
    annulation:      'Annulation',
    paiement:        'Paiement',
    litige:          'Litige',
    nouvelle_demande:'Nouvelle demande',
    mission_terminee:'Mission terminée',
    fonds_liberes:   'Fonds libérés',
    compte_valide:   'Compte validé',
    general:         'Général',
};

export default function AdminSmsIndex({ smsLogs, stats, smsByDay, smsByMonth, filters }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [search, setSearch] = useState(filters.q ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');
    const [typeFilter, setTypeFilter] = useState(filters.type ?? '');

    const applyFilters = () => {
        router.get(route('admin.sms.index'), {
            q: search || undefined,
            status: statusFilter || undefined,
            type: typeFilter || undefined,
        }, { preserveState: true });
    };

    const handleResend = (smsLogId: number) => {
        if (! confirm('Renvoyer ce SMS ?')) return;
        router.post(route('admin.sms.resend', smsLogId), {}, {
            preserveScroll: true,
        });
    };

    // Préparer données graphique par jour (30 derniers jours)
    const dayLabels = Object.keys(smsByDay).map(d =>
        new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    );
    const dayValues = Object.values(smsByDay);
    const maxDay = Math.max(...dayValues, 1);

    // Graphique par mois
    const monthLabels = Object.keys(smsByMonth).map(m => {
        const [year, month] = m.split('-');
        return new Date(Number(year), Number(month) - 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    });
    const monthValues = Object.values(smsByMonth);
    const maxMonth = Math.max(...monthValues, 1);

    return (
        <AdminLayout title="Communication SMS">
            <Head title="Communication SMS - ArtisanPro Admin" />
            <div className="space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[hsl(20,14%,12%)]">Centre de communication</h1>
                        <p className="mt-1 text-[hsl(20,10%,50%)]">
                            Historique et statistiques des SMS Africa's Talking
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium text-emerald-700">
                            Africa's Talking · {import.meta.env.VITE_APP_ENV === 'production' ? 'Production' : 'Sandbox'}
                        </span>
                    </div>
                </div>

                {/* Flash */}
                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {[
                        { label: 'Total SMS',       value: stats.total,           icon: MessageSquare, color: 'bg-violet-50 border-violet-100 text-violet-600' },
                        { label: 'Envoyés',         value: stats.envoyes,         icon: CheckCircle,   color: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                        { label: 'Échoués',         value: stats.echoues,         icon: XCircle,       color: 'bg-red-50 border-red-100 text-red-600' },
                        { label: "Aujourd'hui",     value: stats.aujourd_hui,     icon: Calendar,      color: 'bg-amber-50 border-amber-100 text-amber-600' },
                        { label: 'Ce mois',         value: stats.ce_mois,         icon: BarChart3,     color: 'bg-blue-50 border-blue-100 text-blue-600' },
                        { label: 'Coût estimé',     value: `${stats.cout_estime_xof.toLocaleString('fr-FR')} F`, icon: DollarSign, color: 'bg-orange-50 border-orange-100 text-orange-600' },
                    ].map((kpi) => (
                        <div key={kpi.label} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${kpi.color} shrink-0`}>
                                    <kpi.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-[hsl(20,10%,50%)]">{kpi.label}</p>
                                    <p className="text-xl font-bold text-[hsl(20,14%,12%)]">{kpi.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Graphiques */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* SMS par jour */}
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="h-4 w-4 text-amber-500" />
                            <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">SMS par jour (30 derniers jours)</h2>
                        </div>
                        {dayValues.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-sm text-[hsl(20,10%,55%)]">
                                Aucune donnée disponible
                            </div>
                        ) : (
                            <div className="flex items-end gap-1 h-32">
                                {dayValues.map((val, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                        <div className="relative w-full">
                                            <div
                                                className="w-full bg-amber-400 rounded-t-sm group-hover:bg-amber-500 transition-colors"
                                                style={{ height: `${Math.max(4, (val / maxDay) * 112)}px` }}
                                                title={`${dayLabels[i]}: ${val} SMS`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {dayLabels.length > 0 && (
                            <div className="flex justify-between mt-2 text-xs text-[hsl(20,10%,55%)]">
                                <span>{dayLabels[0]}</span>
                                <span>{dayLabels[Math.floor(dayLabels.length / 2)]}</span>
                                <span>{dayLabels[dayLabels.length - 1]}</span>
                            </div>
                        )}
                    </div>

                    {/* SMS par mois */}
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart3 className="h-4 w-4 text-violet-500" />
                            <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">SMS par mois (12 derniers mois)</h2>
                        </div>
                        {monthValues.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-sm text-[hsl(20,10%,55%)]">
                                Aucune donnée disponible
                            </div>
                        ) : (
                            <div className="flex items-end gap-2 h-32">
                                {monthValues.map((val, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                        <div
                                            className="w-full bg-violet-400 rounded-t-sm group-hover:bg-violet-500 transition-colors"
                                            style={{ height: `${Math.max(4, (val / maxMonth) * 112)}px` }}
                                            title={`${monthLabels[i]}: ${val} SMS`}
                                        />
                                        <span className="text-xs text-[hsl(20,10%,55%)] rotate-0">{monthLabels[i]}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filtres */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-48">
                            <label className="block text-xs font-medium text-[hsl(20,10%,50%)] mb-1">
                                Rechercher
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(20,10%,55%)]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                    placeholder="Numéro ou message..."
                                    className="w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white pl-9 pr-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[hsl(20,10%,50%)] mb-1">Statut</label>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="sent">Envoyé</option>
                                <option value="pending">En attente</option>
                                <option value="retrying">Retry</option>
                                <option value="failed">Échoué</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[hsl(20,10%,50%)] mb-1">Type</label>
                            <select
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                                className="rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                            >
                                <option value="">Tous les types</option>
                                {Object.entries(typeLabels).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={applyFilters}
                            className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm font-medium transition-colors"
                        >
                            <Filter className="h-4 w-4" />
                            Filtrer
                        </button>

                        {(filters.q || filters.status || filters.type) && (
                            <Link
                                href={route('admin.sms.index')}
                                className="text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                            >
                                Réinitialiser
                            </Link>
                        )}
                    </div>
                </div>

                {/* Tableau SMS */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[hsl(30,20%,88%)] px-6 py-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-amber-500" />
                            <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">
                                Historique SMS
                            </h2>
                        </div>
                        <span className="text-xs text-[hsl(20,10%,55%)]">
                            {smsLogs.from ?? 0}–{smsLogs.to ?? 0} sur {smsLogs.total}
                        </span>
                    </div>

                    {smsLogs.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm text-[hsl(20,10%,55%)]">Aucun SMS trouvé</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[hsl(30,20%,92%)] bg-[hsl(36,33%,97%)]">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(20,10%,50%)]">Destinataire</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(20,10%,50%)]">Message</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(20,10%,50%)]">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(20,10%,50%)]">Statut</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(20,10%,50%)]">Tentatives</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(20,10%,50%)]">Date</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-[hsl(20,10%,50%)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[hsl(30,20%,92%)]">
                                    {smsLogs.data.map((sms) => {
                                        const sc = statusConfig[sms.status] ?? statusConfig.pending;
                                        const StatusIcon = sc.icon;
                                        return (
                                            <tr key={sms.id} className="hover:bg-[hsl(36,33%,98%)] transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs text-[hsl(20,14%,25%)]">
                                                    {sms.recipient}
                                                </td>
                                                <td className="px-4 py-3 max-w-xs">
                                                    <p className="text-xs text-[hsl(20,14%,25%)] truncate" title={sms.message}>
                                                        {sms.message}
                                                    </p>
                                                    {sms.error_message && (
                                                        <p className="text-xs text-red-500 mt-0.5 truncate" title={sms.error_message}>
                                                            {sms.error_message}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="rounded-full bg-[hsl(36,30%,93%)] px-2 py-0.5 text-xs font-medium text-[hsl(20,14%,35%)]">
                                                        {typeLabels[sms.type] ?? sms.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.color}`}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {sc.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-xs text-[hsl(20,10%,50%)]">
                                                    {sms.attempt}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-[hsl(20,10%,50%)]">
                                                    {sms.sent_at
                                                        ? new Date(sms.sent_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                                        : new Date(sms.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                                    }
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('admin.sms.show', sms.id)}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-[hsl(30,20%,82%)] bg-white px-2.5 py-1 text-xs text-[hsl(20,14%,35%)] hover:bg-[hsl(36,33%,97%)] transition-colors"
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                            Voir
                                                        </Link>
                                                        {['failed', 'pending'].includes(sms.status) && (
                                                            <button
                                                                onClick={() => handleResend(sms.id)}
                                                                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700 hover:bg-amber-100 transition-colors"
                                                            >
                                                                <Send className="h-3 w-3" />
                                                                Renvoyer
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {smsLogs.last_page > 1 && (
                        <div className="border-t border-[hsl(30,20%,88%)] px-6 py-4 flex items-center justify-between">
                            <p className="text-xs text-[hsl(20,10%,55%)]">
                                Page {smsLogs.current_page} sur {smsLogs.last_page}
                            </p>
                            <div className="flex gap-1">
                                {smsLogs.links.map((link, i) => (
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                                link.active
                                                    ? 'bg-amber-500 text-white'
                                                    : 'border border-[hsl(30,20%,82%)] text-[hsl(20,14%,35%)] hover:bg-[hsl(36,33%,97%)]'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="rounded-lg px-3 py-1.5 text-xs text-[hsl(20,10%,65%)] opacity-50"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
