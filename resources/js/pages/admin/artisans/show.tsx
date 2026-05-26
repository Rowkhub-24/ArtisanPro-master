import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Star, MapPin, CheckCircle } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface ArtisanDetail {
    id: number; metier: string; description: string | null; bio: string | null;
    zone_intervention: string | null; tarifs_horaire: number | null;
    note_moyenne: number; badge: string;
    user: { id: number; nom: string; prenom: string; email: string; telephone: string | null; statut: string } | null;
    categories: { id: number; nom: string }[];
    certifications: { id: number; nom_certification: string; organisme_delivrance: string }[];
    portfolio_images: { id: number; titre: string; url_media: string }[];
    avis: { id: number; note: number; commentaire: string | null; date_avis: string; client: { user: { prenom: string; nom: string } | null } | null }[];
    reservations: { id: number; statut: string; created_at: string }[];
}
interface Props { artisan: ArtisanDetail; }

const badgeConfig: Record<string, { label: string; color: string }> = {
    elite:    { label: '⭐ Élite',    color: 'bg-purple-100 text-purple-800' },
    certifie: { label: '✓ Certifié', color: 'bg-amber-100 text-amber-800' },
    aucun:    { label: 'Standard',   color: 'bg-[hsl(36,30%,93%)] text-[hsl(20,14%,35%)]' },
};

export default function AdminArtisanShow({ artisan }: Props) {
    const updateBadge = (badge: string) => {
        router.patch(route('admin.artisans.badge', artisan.id), { badge }, { preserveScroll: true });
    };
    const bc = badgeConfig[artisan.badge] ?? badgeConfig.aucun;

    return (
        <AdminLayout title="Profil artisan">
            <Head title={`${artisan.metier} - Admin`} />
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={route('admin.artisans.index')}
                        className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Retour
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">{artisan.metier}</h1>
                        <p className="text-sm text-[hsl(20,10%,50%)]">{artisan.user?.prenom} {artisan.user?.nom} · ID #{artisan.id}</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left */}
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-2xl font-bold mx-auto mb-4">
                                {artisan.user?.prenom?.charAt(0)}{artisan.user?.nom?.charAt(0)}
                            </div>
                            <h2 className="text-lg font-bold text-[hsl(20,14%,12%)]">{artisan.metier}</h2>
                            <p className="text-sm text-[hsl(20,10%,50%)]">{artisan.user?.prenom} {artisan.user?.nom}</p>
                            <div className="flex items-center justify-center gap-2 mt-3">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${bc.color}`}>{bc.label}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1 mt-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(Number(artisan.note_moyenne)) ? 'fill-amber-400 text-amber-400' : 'text-[hsl(30,20%,80%)]'}`} />
                                ))}
                                <span className="text-sm font-bold text-[hsl(20,14%,12%)] ml-1">{Number(artisan.note_moyenne).toFixed(1)}</span>
                            </div>

                            {/* Badge Update */}
                            <div className="mt-5 space-y-2">
                                <p className="text-xs text-[hsl(20,10%,55%)] font-medium">Modifier le badge</p>
                                <div className="flex gap-2 justify-center">
                                    {(['aucun', 'certifie', 'elite'] as const).map((b) => (
                                        <button key={b} onClick={() => updateBadge(b)}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                                artisan.badge === b
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                                                    : 'border border-[hsl(30,20%,82%)] bg-white text-[hsl(20,14%,35%)] hover:border-amber-300'
                                            }`}>
                                            {b === 'aucun' ? 'Std' : b === 'certifie' ? 'Cert.' : 'Élite'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-5 space-y-3">
                            {[
                                { label: 'Avis reçus',     value: artisan.avis.length },
                                { label: 'Réservations',   value: artisan.reservations.length },
                                { label: 'Certifications', value: artisan.certifications.length },
                                { label: 'Portfolio',      value: artisan.portfolio_images.length },
                            ].map((s) => (
                                <div key={s.label} className="flex items-center justify-between py-2 border-b border-[hsl(30,20%,92%)] last:border-0">
                                    <span className="text-sm text-[hsl(20,10%,50%)]">{s.label}</span>
                                    <span className="text-sm font-bold text-[hsl(20,14%,12%)]">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Info */}
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm">
                            <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4">
                                <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">Informations</h2>
                            </div>
                            <div className="p-6 grid gap-4 md:grid-cols-2">
                                <div><p className="text-xs text-[hsl(20,10%,55%)]">Email</p><p className="text-sm font-medium text-[hsl(20,14%,12%)]">{artisan.user?.email}</p></div>
                                <div><p className="text-xs text-[hsl(20,10%,55%)]">Téléphone</p><p className="text-sm font-medium text-[hsl(20,14%,12%)]">{artisan.user?.telephone ?? 'N/A'}</p></div>
                                <div><p className="text-xs text-[hsl(20,10%,55%)]">Zone</p><p className="text-sm font-medium text-[hsl(20,14%,12%)]">{artisan.zone_intervention ?? 'N/A'}</p></div>
                                <div><p className="text-xs text-[hsl(20,10%,55%)]">Tarif horaire</p><p className="text-sm font-medium text-[hsl(20,14%,12%)]">{artisan.tarifs_horaire ? `${Number(artisan.tarifs_horaire).toLocaleString('fr-FR')} FCFA` : 'N/A'}</p></div>
                                {artisan.categories.length > 0 && (
                                    <div className="md:col-span-2">
                                        <p className="text-xs text-[hsl(20,10%,55%)] mb-2">Catégories</p>
                                        <div className="flex flex-wrap gap-2">
                                            {artisan.categories.map((c) => (
                                                <span key={c.id} className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-semibold">{c.nom}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {artisan.description && (
                                    <div className="md:col-span-2"><p className="text-xs text-[hsl(20,10%,55%)]">Description</p><p className="text-sm text-[hsl(20,10%,35%)] mt-1">{artisan.description}</p></div>
                                )}
                            </div>
                        </div>

                        {/* Certifications */}
                        {artisan.certifications.length > 0 && (
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm">
                                <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                    <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">Certifications</h2>
                                </div>
                                <div className="p-4 space-y-2">
                                    {artisan.certifications.map((c) => (
                                        <div key={c.id} className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                                            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-[hsl(20,14%,12%)]">{c.nom_certification}</p>
                                                <p className="text-xs text-[hsl(20,10%,50%)]">{c.organisme_delivrance}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Avis */}
                        {artisan.avis.length > 0 && (
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden">
                                <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4">
                                    <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">Derniers avis</h2>
                                </div>
                                <div className="divide-y divide-[hsl(30,20%,92%)]">
                                    {artisan.avis.slice(0, 5).map((a) => (
                                        <div key={a.id} className="px-6 py-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-medium text-[hsl(20,14%,12%)]">
                                                    {a.client?.user ? `${a.client.user.prenom} ${a.client.user.nom}` : 'Client'}
                                                </p>
                                                <div className="flex items-center gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`h-3.5 w-3.5 ${i < a.note ? 'fill-amber-400 text-amber-400' : 'text-[hsl(30,20%,80%)]'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            {a.commentaire && <p className="text-xs text-[hsl(20,10%,50%)]">{a.commentaire}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
