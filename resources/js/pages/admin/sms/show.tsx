import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, XCircle, Clock, RefreshCw, Send, Phone, MessageSquare } from 'lucide-react';

import AdminLayout from '@/layouts/admin-layout';

interface SmsLog {
    id: number;
    recipient: string;
    message: string;
    status: string;
    type: string;
    provider: string;
    context_id: number | null;
    context_type: string | null;
    response: string | null;
    error_message: string | null;
    attempt: number;
    sent_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    smsLog: SmsLog;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    sent:     { label: 'Envoyé',     color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
    pending:  { label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-200',       icon: Clock },
    retrying: { label: 'Retry',      color: 'bg-orange-100 text-orange-800 border-orange-200',    icon: RefreshCw },
    failed:   { label: 'Échoué',     color: 'bg-red-100 text-red-800 border-red-200',             icon: XCircle },
};

const typeLabels: Record<string, string> = {
    bienvenue: 'Bienvenue', confirmation: 'Confirmation', annulation: 'Annulation',
    paiement: 'Paiement', litige: 'Litige', nouvelle_demande: 'Nouvelle demande',
    mission_terminee: 'Mission terminée', fonds_liberes: 'Fonds libérés',
    compte_valide: 'Compte validé', general: 'Général',
};

export default function AdminSmsShow({ smsLog }: Props) {
    const sc = statusConfig[smsLog.status] ?? statusConfig.pending;
    const StatusIcon = sc.icon;

    const handleResend = () => {
        if (! confirm('Renvoyer ce SMS ?')) return;
        router.post(route('admin.sms.resend', smsLog.id));
    };

    let parsedResponse: unknown = null;
    try {
        if (smsLog.response) parsedResponse = JSON.parse(smsLog.response);
    } catch (_) {}

    return (
        <AdminLayout title="Détail SMS">
            <Head title={`SMS #${smsLog.id} - ArtisanPro Admin`} />
            <div className="max-w-2xl space-y-6">

                {/* Back */}
                <Link
                    href={route('admin.sms.index')}
                    className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour à la liste
                </Link>

                {/* Card */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[hsl(30,20%,88%)] px-6 py-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-amber-500" />
                            <h1 className="text-base font-semibold text-[hsl(20,14%,12%)]">SMS #{smsLog.id}</h1>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${sc.color}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {sc.label}
                        </span>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Destinataire */}
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(30,20%,88%)] bg-[hsl(36,33%,97%)] shrink-0">
                                <Phone className="h-4 w-4 text-[hsl(20,10%,50%)]" />
                            </div>
                            <div>
                                <p className="text-xs text-[hsl(20,10%,50%)]">Destinataire</p>
                                <p className="text-sm font-mono font-medium text-[hsl(20,14%,12%)]">{smsLog.recipient}</p>
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <p className="text-xs text-[hsl(20,10%,50%)] mb-2">Message</p>
                            <div className="rounded-xl border border-[hsl(30,20%,88%)] bg-[hsl(36,33%,97%)] p-4">
                                <p className="text-sm text-[hsl(20,14%,12%)] leading-relaxed whitespace-pre-wrap">{smsLog.message}</p>
                            </div>
                        </div>

                        {/* Metadata grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Type', value: typeLabels[smsLog.type] ?? smsLog.type },
                                { label: 'Provider', value: smsLog.provider },
                                { label: 'Tentatives', value: String(smsLog.attempt) },
                                { label: 'Contexte', value: smsLog.context_type ? `${smsLog.context_type} #${smsLog.context_id}` : '—' },
                                { label: 'Envoyé le', value: smsLog.sent_at ? new Date(smsLog.sent_at).toLocaleString('fr-FR') : '—' },
                                { label: 'Créé le', value: new Date(smsLog.created_at).toLocaleString('fr-FR') },
                            ].map((item) => (
                                <div key={item.label}>
                                    <p className="text-xs text-[hsl(20,10%,50%)]">{item.label}</p>
                                    <p className="text-sm font-medium text-[hsl(20,14%,12%)]">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Error */}
                        {smsLog.error_message && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                <p className="text-xs font-medium text-red-700 mb-1">Erreur</p>
                                <p className="text-sm text-red-800 font-mono">{smsLog.error_message}</p>
                            </div>
                        )}

                        {/* API Response */}
                        {parsedResponse && (
                            <div>
                                <p className="text-xs text-[hsl(20,10%,50%)] mb-2">Réponse API Africa's Talking</p>
                                <pre className="rounded-xl border border-[hsl(30,20%,88%)] bg-[hsl(36,33%,97%)] p-4 text-xs overflow-auto max-h-48 text-[hsl(20,14%,25%)]">
                                    {JSON.stringify(parsedResponse, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {['failed', 'pending'].includes(smsLog.status) && (
                        <div className="border-t border-[hsl(30,20%,88%)] px-6 py-4">
                            <button
                                onClick={handleResend}
                                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm font-medium transition-colors"
                            >
                                <Send className="h-4 w-4" />
                                Renvoyer ce SMS
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
