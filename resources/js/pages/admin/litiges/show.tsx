import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Clock, CheckCircle, XCircle, User, Wrench, Calendar, FileText } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';

interface LitigeDetail {
    id: number;
    description_litige: string;
    date_ouverture: string;
    statut: 'ouvert' | 'en_cours' | 'resolu' | 'clos';
    resolution_details: string | null;
    client: {
        user: { id: number; nom: string; prenom: string; email: string; telephone: string | null } | null;
    } | null;
    artisan: {
        metier: string;
        user: { id: number; nom: string; prenom: string; email: string; telephone: string | null } | null;
    } | null;
    reservation: {
        id: number;
        statut: string;
        montant_total: number | null;
        date: string | null;
    } | null;
}

interface Props {
    litige: LitigeDetail;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    ouvert:   { label: 'Ouvert',   color: 'bg-red-100 text-red-800 border border-red-200',             icon: <AlertTriangle className="h-4 w-4" /> },
    en_cours: { label: 'En cours', color: 'bg-amber-100 text-amber-800 border border-amber-200',       icon: <Clock className="h-4 w-4" /> },
    resolu:   { label: 'Résolu',   color: 'bg-emerald-100 text-emerald-800 border border-emerald-200', icon: <CheckCircle className="h-4 w-4" /> },
    clos:     { label: 'Clos',     color: 'bg-gray-100 text-gray-700 border border-gray-200',          icon: <XCircle className="h-4 w-4" /> },
};

export default function AdminLitigeShow({ litige }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        statut: litige.statut,
        resolution_details: litige.resolution_details ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('admin.litiges.statut', litige.id));
    };

    const sc = statusConfig[litige.statut] ?? statusConfig.ouvert;

    return (
        <AdminLayout title={`Litige #${litige.id}`}>
            <Head title={`Litige #${litige.id} - Admin ArtisanPro`} />

            <div className="space-y-6 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={route('admin.litiges.index')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-600 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Retour aux litiges
                    </Link>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Litige #{litige.id}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Ouvert le {new Date(litige.date_ouverture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <Badge className={`${sc.color} flex items-center gap-1.5 px-3 py-1.5 text-sm`}>
                        {sc.icon}
                        {sc.label}
                    </Badge>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Parties */}
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6 space-y-4">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <User className="h-4 w-4 text-amber-500" />
                            Parties impliquées
                        </h2>
                        <div className="space-y-3">
                            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Client</p>
                                <p className="font-semibold text-gray-900">
                                    {litige.client?.user ? `${litige.client.user.prenom} ${litige.client.user.nom}` : 'Inconnu'}
                                </p>
                                {litige.client?.user?.email && (
                                    <p className="text-sm text-gray-500">{litige.client.user.email}</p>
                                )}
                                {litige.client?.user?.telephone && (
                                    <p className="text-sm text-gray-500">{litige.client.user.telephone}</p>
                                )}
                            </div>
                            <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
                                <p className="text-xs font-medium text-orange-600 uppercase tracking-wide mb-1">Artisan</p>
                                <p className="font-semibold text-gray-900">
                                    {litige.artisan?.user ? `${litige.artisan.user.prenom} ${litige.artisan.user.nom}` : 'Inconnu'}
                                </p>
                                {litige.artisan?.metier && (
                                    <p className="text-sm text-orange-700 font-medium">{litige.artisan.metier}</p>
                                )}
                                {litige.artisan?.user?.email && (
                                    <p className="text-sm text-gray-500">{litige.artisan.user.email}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Réservation */}
                    {litige.reservation && (
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6 space-y-4">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-amber-500" />
                                Réservation concernée
                            </h2>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Référence</span>
                                    <span className="font-medium">#{litige.reservation.id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Statut</span>
                                    <span className="font-medium capitalize">{litige.reservation.statut.replace('_', ' ')}</span>
                                </div>
                                {litige.reservation.montant_total && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Montant</span>
                                        <span className="font-medium">{Number(litige.reservation.montant_total).toLocaleString('fr-FR')} FCFA</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Description */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <FileText className="h-4 w-4 text-amber-500" />
                        Description du litige
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{litige.description_litige}</p>
                </div>

                {/* Résolution */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
                        <Wrench className="h-4 w-4 text-amber-500" />
                        Traitement du litige
                    </h2>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
                            <select
                                value={data.statut}
                                onChange={(e) => setData('statut', e.target.value as typeof data.statut)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                            >
                                <option value="ouvert">Ouvert</option>
                                <option value="en_cours">En cours de traitement</option>
                                <option value="resolu">Résolu</option>
                                <option value="clos">Clos</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Détails de résolution
                                <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
                            </label>
                            <textarea
                                value={data.resolution_details}
                                onChange={(e) => setData('resolution_details', e.target.value)}
                                rows={5}
                                placeholder="Décrivez la résolution apportée, les décisions prises, les compensations accordées..."
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 resize-none"
                            />
                            {errors.resolution_details && (
                                <p className="text-xs text-red-600 mt-1">{errors.resolution_details}</p>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                            >
                                {processing ? 'Enregistrement...' : 'Enregistrer la décision'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
