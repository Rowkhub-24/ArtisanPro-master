import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Shield, UserX, UserCheck, Wrench, Star } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface ArtisanData {
    id: number; metier: string; note_moyenne: number; badge: string;
    zone_intervention: string | null; tarifs_horaire: number | null;
    categories: { id: number; nom: string }[];
}
interface UserDetail {
    id: number; nom: string; prenom: string; email: string;
    telephone: string | null; adresse: string | null;
    type_utilisateur: string; statut: string; date_inscription: string;
    email_verified_at: string | null;
    artisan: ArtisanData | null; client: { id: number } | null;
}
interface Props { user: UserDetail; }

const statutColors: Record<string, string> = {
    actif:    'bg-emerald-100 text-emerald-800',
    suspendu: 'bg-yellow-100 text-yellow-800',
    banni:    'bg-red-100 text-red-800',
};
const typeColors: Record<string, string> = {
    client:  'bg-amber-100 text-amber-800',
    artisan: 'bg-orange-100 text-orange-800',
    admin:   'bg-purple-100 text-purple-800',
};
const badgeColors: Record<string, string> = {
    elite:    'bg-purple-100 text-purple-800',
    certifie: 'bg-amber-100 text-amber-800',
    aucun:    'bg-[hsl(36,30%,93%)] text-[hsl(20,14%,35%)]',
};

export default function AdminUserShow({ user }: Props) {
    const updateStatut = (statut: string) => {
        router.patch(route('admin.users.statut', user.id), { statut }, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Détail utilisateur">
            <Head title={`${user.prenom} ${user.nom} - Admin`} />
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={route('admin.users.index')}
                        className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Retour
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">{user.prenom} {user.nom}</h1>
                        <p className="text-sm text-[hsl(20,10%,50%)]">ID #{user.id} · Inscrit le {new Date(user.date_inscription).toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Profile Card */}
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-2xl font-bold mx-auto mb-4">
                            {user.prenom.charAt(0)}{user.nom.charAt(0)}
                        </div>
                        <h2 className="text-lg font-bold text-[hsl(20,14%,12%)]">{user.prenom} {user.nom}</h2>
                        <p className="text-sm text-[hsl(20,10%,50%)] mt-1">{user.email}</p>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statutColors[user.statut] ?? 'bg-[hsl(36,30%,93%)] text-[hsl(20,14%,35%)]'}`}>
                                {user.statut}
                            </span>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeColors[user.type_utilisateur] ?? 'bg-[hsl(36,30%,93%)] text-[hsl(20,14%,35%)]'}`}>
                                {user.type_utilisateur}
                            </span>
                        </div>

                        <div className="mt-6 space-y-2">
                            {user.statut === 'actif' ? (
                                <button onClick={() => updateStatut('suspendu')}
                                    className="w-full rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                    <UserX className="h-4 w-4" /> Suspendre
                                </button>
                            ) : (
                                <button onClick={() => updateStatut('actif')}
                                    className="w-full rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                    <UserCheck className="h-4 w-4" /> Réactiver
                                </button>
                            )}
                            {user.statut !== 'banni' && (
                                <button onClick={() => updateStatut('banni')}
                                    className="w-full rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                    <Shield className="h-4 w-4" /> Bannir
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm">
                            <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4">
                                <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">Informations personnelles</h2>
                            </div>
                            <div className="p-6 grid gap-4 md:grid-cols-2">
                                {[
                                    { icon: Mail,     label: 'Email',         value: user.email },
                                    { icon: Phone,    label: 'Téléphone',     value: user.telephone ?? 'Non renseigné' },
                                    { icon: MapPin,   label: 'Adresse',       value: user.adresse ?? 'Non renseignée' },
                                    { icon: Calendar, label: 'Inscription',   value: new Date(user.date_inscription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
                                    { icon: Shield,   label: 'Email vérifié', value: user.email_verified_at ? '✓ Vérifié' : '✗ Non vérifié' },
                                ].map((info) => (
                                    <div key={info.label} className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(36,30%,93%)] shrink-0">
                                            <info.icon className="h-4 w-4 text-[hsl(20,10%,45%)]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[hsl(20,10%,55%)]">{info.label}</p>
                                            <p className="text-sm font-medium text-[hsl(20,14%,12%)]">{info.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Artisan Info */}
                        {user.artisan && (
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm">
                                <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4 flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-amber-600" />
                                    <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">Profil Artisan</h2>
                                </div>
                                <div className="p-6 grid gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-[hsl(20,10%,55%)]">Métier</p>
                                        <p className="text-sm font-medium text-[hsl(20,14%,12%)]">{user.artisan.metier}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[hsl(20,10%,55%)]">Badge</p>
                                        <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeColors[user.artisan.badge] ?? 'bg-[hsl(36,30%,93%)] text-[hsl(20,14%,35%)]'}`}>
                                            {user.artisan.badge}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[hsl(20,10%,55%)]">Note moyenne</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                            <span className="text-sm font-bold text-[hsl(20,14%,12%)]">{Number(user.artisan.note_moyenne).toFixed(1)}/5</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[hsl(20,10%,55%)]">Zone d&apos;intervention</p>
                                        <p className="text-sm font-medium text-[hsl(20,14%,12%)]">{user.artisan.zone_intervention ?? 'N/A'}</p>
                                    </div>
                                    {user.artisan.categories.length > 0 && (
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-[hsl(20,10%,55%)] mb-2">Catégories</p>
                                            <div className="flex flex-wrap gap-2">
                                                {user.artisan.categories.map((c) => (
                                                    <span key={c.id} className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-semibold">{c.nom}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="px-6 pb-5">
                                    <Link href={route('admin.artisans.show', user.artisan.id)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 px-4 py-2 text-sm font-medium transition-colors">
                                        Voir le profil artisan complet
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
