import { Head, Link, router } from '@inertiajs/react';
import { Star, Search, Filter, CheckCircle, Trash2, Flag, MessageSquare, X } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';

interface AvisRow {
    id: number;
    note: number;
    commentaire: string | null;
    date_avis: string;
    signale: boolean;
    masque: boolean;
    client: { user: { id: number; nom: string; prenom: string; email: string } | null } | null;
    artisan: { user: { id: number; nom: string; prenom: string } | null } | null;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; total: number };
}

interface Props {
    avis: Paginated<AvisRow>;
    stats: { total: number; signale: number };
    filters: { q?: string; statut?: string };
}

type ModalAction = 'valider' | 'supprimer';

interface ModalState {
    open: boolean;
    action: ModalAction | null;
    avisId: number | null;
    raison: string;
}

function StarRating({ note }: { note: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < note ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
            ))}
        </div>
    );
}

const MIN_RAISON = 50;

export default function AdminAvisIndex({ avis, stats, filters }: Props) {
    const [modal, setModal] = useState<ModalState>({
        open: false,
        action: null,
        avisId: null,
        raison: '',
    });

    const openModal = (action: ModalAction, avisId: number) => {
        setModal({ open: true, action, avisId, raison: '' });
    };

    const closeModal = () => {
        setModal({ open: false, action: null, avisId: null, raison: '' });
    };

    const submitModal = () => {
        if (!modal.avisId || !modal.action || modal.raison.length < MIN_RAISON) return;

        if (modal.action === 'valider') {
            router.patch(
                route('admin.avis.valider', modal.avisId),
                { raison: modal.raison },
                { preserveScroll: true, onSuccess: closeModal },
            );
        } else {
            router.delete(
                route('admin.avis.supprimer', modal.avisId),
                { data: { raison: modal.raison }, preserveScroll: true, onSuccess: closeModal },
            );
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        router.get(route('admin.avis.index'), Object.fromEntries(fd), { preserveState: true });
    };

    const isValider = modal.action === 'valider';
    const raisonLen = modal.raison.length;
    const raisonValid = raisonLen >= MIN_RAISON;

    return (
        <AdminLayout title="Modération des avis">
            <Head title="Avis - Admin ArtisanPro" />

            {/* Modal */}
            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {isValider ? 'Valider cet avis' : 'Supprimer cet avis'}
                            </h2>
                            <button onClick={closeModal} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <p className="text-sm text-gray-600">
                                {isValider
                                    ? "Saisissez la raison pour laquelle vous validez cet avis. Cette raison sera enregistrée dans le journal de modération."
                                    : "Saisissez la raison pour laquelle vous supprimez définitivement cet avis. Cette action est irréversible."}
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Raison de la décision <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={modal.raison}
                                    onChange={(e) => setModal((m) => ({ ...m, raison: e.target.value }))}
                                    rows={4}
                                    placeholder="Décrivez la raison de votre décision (minimum 50 caractères)..."
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                                />
                                <p className={`mt-1 text-xs text-right ${raisonValid ? 'text-emerald-600' : 'text-gray-400'}`}>
                                    {raisonLen}/{MIN_RAISON}
                                    {raisonValid && ' ✓'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                            <Button variant="outline" onClick={closeModal} className="border-gray-200 text-gray-700">
                                Annuler
                            </Button>
                            <Button
                                onClick={submitModal}
                                disabled={!raisonValid}
                                className={
                                    isValider
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-50'
                                        : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 disabled:opacity-50'
                                }
                            >
                                {isValider ? (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Valider l'avis
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer définitivement
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Modération des avis</h1>
                        <p className="text-sm text-gray-500 mt-1">{stats.total} avis au total</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2">
                    {[
                        { label: 'Total',    value: stats.total,   color: 'text-gray-900',  bg: 'bg-gray-50 border-gray-200' },
                        { label: 'Signalés', value: stats.signale, color: 'text-red-600',   bg: 'bg-red-50 border-red-200' },
                    ].map((s) => (
                        <div key={s.label} className={`rounded-2xl border ${s.bg} p-5`}>
                            <p className="text-sm text-gray-500">{s.label}</p>
                            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <Card className="rounded-2xl border border-[hsl(30,20%,88%)] shadow-sm bg-white">
                    <CardContent className="p-4">
                        <form onSubmit={submit} className="flex flex-wrap gap-3">
                            <div className="relative flex-1 min-w-48">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input name="q" defaultValue={filters.q} placeholder="Rechercher dans les commentaires..." className="pl-9 border-gray-200" />
                            </div>
                            <select name="statut" defaultValue={filters.statut ?? ''} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-amber-400 focus:outline-none">
                                <option value="">Tous</option>
                                <option value="signale">Signalés</option>
                                <option value="visible">Visibles</option>
                            </select>
                            <Button type="submit" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400">
                                <Filter className="mr-2 h-4 w-4" />
                                Filtrer
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Table */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden">
                    {avis.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Aucun avis trouvé</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[hsl(30,20%,92%)]">
                            {avis.data.map((a) => (
                                <div key={a.id} className="p-5 hover:bg-[hsl(36,33%,97%)] transition-colors">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <StarRating note={a.note} />
                                                <span className="font-bold text-gray-900">{a.note}/5</span>
                                                {a.signale && (
                                                    <Badge className="bg-red-100 text-red-800 border border-red-200 text-xs">
                                                        <Flag className="h-3 w-3 mr-1" />
                                                        Signalé
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-gray-400">
                                                    {new Date(a.date_avis).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                <span className="font-medium">
                                                    {a.client?.user ? `${a.client.user.prenom} ${a.client.user.nom}` : 'Client inconnu'}
                                                </span>
                                                <span className="text-gray-400">→</span>
                                                <span className="font-medium">
                                                    {a.artisan?.user ? `${a.artisan.user.prenom} ${a.artisan.user.nom}` : 'Artisan inconnu'}
                                                </span>
                                            </div>
                                            {a.commentaire && (
                                                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 line-clamp-3">
                                                    {a.commentaire}
                                                </p>
                                            )}
                                        </div>
                                        {a.signale && (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openModal('valider', a.id)}
                                                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                >
                                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                                    Valider
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openModal('supprimer', a.id)}
                                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                    Supprimer
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {avis.meta.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {avis.links.map((l, i) =>
                            l.url ? (
                                <Link key={i} href={l.url}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${l.active ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                    dangerouslySetInnerHTML={{ __html: l.label }} />
                            ) : (
                                <span key={i} className="px-3 py-1.5 text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: l.label }} />
                            )
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
