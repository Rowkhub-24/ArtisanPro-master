import { Head, Link, router, usePage } from '@inertiajs/react';
import { MapPin, Star, Search, Home, User, Wrench, ChevronRight, SlidersHorizontal, Hammer, Map } from 'lucide-react';
import { useMemo, useState, lazy, Suspense } from 'react';
import type { FormEventHandler } from 'react';
import { type SharedData } from '@/types';

const ArtisansMap = lazy(() => import('@/components/artisans-map'));

interface CategoryOption { id: number; nom: string; }
interface ArtisanRow {
    id: number; metier: string; description: string | null;
    zone_intervention: string | null; tarifs_horaire: string | number | null;
    note_moyenne: string | number; badge: string;
    user: { prenom: string; nom: string; telephone: string | null } | null;
    categories: { id: number; nom: string }[];
}
interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; per_page: number; total: number; };
}
interface Props {
    artisans: Paginated<ArtisanRow>;
    categories: CategoryOption[];
    filters: { q: string; category_id?: string | number };
    mapArtisans?: { id: number; metier: string; prenom: string | null; nom: string | null; note_moyenne: string | number; badge: string; tarifs_horaire: string | number | null; zone_intervention: string | null; lat: number; lng: number }[];
}

export default function ArtisansIndex({ artisans, categories, filters, mapArtisans = [] }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [showMap, setShowMap] = useState(false);

    const safeArtisans: Paginated<ArtisanRow> = (() => {
        if (!artisans) return { data: [], links: [], meta: { current_page: 1, last_page: 1, per_page: 12, total: 0 } };
        if ((artisans as any).meta) return artisans as unknown as Paginated<ArtisanRow>;
        const a = artisans as unknown as any;
        return { data: a.data ?? [], links: a.links ?? [], meta: { current_page: a.current_page ?? 1, last_page: a.last_page ?? 1, per_page: a.per_page ?? 12, total: a.total ?? 0 } } as Paginated<ArtisanRow>;
    })();

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        router.get(route('artisans.index'), Object.fromEntries(fd.entries()), { preserveState: true });
    };

    const categoryLabel = useMemo(() => {
        if (!filters.category_id) return 'Toutes';
        return categories.find((c) => String(c.id) === String(filters.category_id))?.nom ?? 'Toutes';
    }, [categories, filters.category_id]);

    return (
        <div className="min-h-screen bg-[hsl(36,33%,97%)]">
            <Head title="Annuaire des Artisans — ArtisanPro" />

            {/* Navbar */}
            <header className="sticky top-0 z-50 border-b border-[hsl(30,20%,88%)] bg-white/95 backdrop-blur-md shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
                    <Link href={route('home')} className="flex items-center gap-2.5">
                        <img src="/images/ArtisanPro.jpg" alt="ArtisanPro" className="h-11 w-11 object-contain" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href={route('home')} className="flex items-center gap-1.5 text-sm text-[hsl(20,10%,45%)] hover:text-amber-600 transition-colors">
                            <Home className="h-4 w-4" /><span className="hidden sm:block">Accueil</span>
                        </Link>
                        {auth.user ? (
                            <Link href={route('dashboard')} className="inline-flex items-center gap-2 rounded-xl bg-[hsl(20,14%,12%)] hover:bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-all">
                                <User className="h-4 w-4" /> Mon espace
                            </Link>
                        ) : (
                            <Link href={route('login')} className="inline-flex items-center gap-2 rounded-xl bg-[hsl(20,14%,12%)] hover:bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-all">
                                <User className="h-4 w-4" /> Connexion
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero band */}
            <div className="relative overflow-hidden py-14">
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/hero-artisan2.jpg)' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(20,14%,8%)]/95 to-[hsl(25,40%,14%)]/88" />
                <div className="absolute top-0 right-1/3 h-64 w-64 rounded-full bg-amber-500/10 blur-[60px]" />
                <div className="relative mx-auto max-w-7xl px-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-4">
                        <Search className="h-3.5 w-3.5" /> Annuaire des artisans
                    </div>
                    <h1 className="text-4xl font-extrabold text-white lg:text-5xl mb-3">
                        Trouvez votre artisan{' '}
                        <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">de confiance</span>
                    </h1>
                    <p className="text-white/50 max-w-xl">Tous nos artisans sont vérifiés et notés par les clients de Porto-Novo.</p>
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
                {/* Search form */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-4">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-xs font-semibold text-[hsl(20,14%,35%)] uppercase tracking-wide">Mots-clés</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(20,10%,60%)]" />
                                <input name="q" defaultValue={filters.q} placeholder="Plombier, électricité, quartier..."
                                    className="flex h-10 w-full rounded-xl border border-[hsl(30,20%,88%)] bg-[hsl(36,33%,97%)] pl-10 pr-4 text-sm text-[hsl(20,14%,12%)] placeholder:text-[hsl(20,10%,60%)] focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[hsl(20,14%,35%)] uppercase tracking-wide">Catégorie</label>
                            <select name="category_id" defaultValue={filters.category_id ? String(filters.category_id) : ''}
                                className="flex h-10 w-full rounded-xl border border-[hsl(30,20%,88%)] bg-[hsl(36,33%,97%)] px-3 text-sm text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all">
                                <option value="">Toutes les catégories</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button type="submit" className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white shadow-md hover:from-amber-400 hover:to-orange-400 transition-all">
                                <SlidersHorizontal className="h-4 w-4" /> Rechercher
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results header */}
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[hsl(20,14%,25%)]">
                        <span className="text-amber-600 text-base">{safeArtisans.meta.total}</span> artisan{safeArtisans.meta.total > 1 ? 's' : ''} trouvé{safeArtisans.meta.total > 1 ? 's' : ''}
                        {filters.q && <span className="font-normal text-[hsl(20,10%,50%)]"> pour « {filters.q} »</span>}
                        {filters.category_id && <span className="font-normal text-[hsl(20,10%,50%)]"> dans {categoryLabel}</span>}
                    </p>
                    <div className="flex items-center gap-2">
                        {safeArtisans.meta.last_page > 1 && (
                            <p className="text-xs text-[hsl(20,10%,55%)]">Page {safeArtisans.meta.current_page}/{safeArtisans.meta.last_page}</p>
                        )}
                        <button onClick={() => setShowMap(v => !v)}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${showMap ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-[hsl(30,20%,88%)] bg-white text-[hsl(20,14%,35%)] hover:border-amber-300'}`}>
                            <Map className="h-4 w-4" />
                            {showMap ? 'Masquer la carte' : 'Voir sur la carte'}
                        </button>
                    </div>
                </div>

                {/* Map */}
                {showMap && mapArtisans.length > 0 && (
                    <div>
                        <Suspense fallback={<div className="h-[420px] rounded-2xl bg-[hsl(36,30%,93%)] animate-pulse" />}>
                            <ArtisansMap artisans={mapArtisans} />
                        </Suspense>
                    </div>
                )}

                {/* Grid */}
                {safeArtisans.data.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[hsl(30,20%,82%)] bg-white p-16 text-center">
                        <Wrench className="h-12 w-12 text-[hsl(30,20%,75%)] mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-[hsl(20,14%,25%)] mb-2">Aucun artisan trouvé</h3>
                        <p className="text-sm text-[hsl(20,10%,50%)]">Essayez d'autres mots-clés ou une autre catégorie.</p>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {safeArtisans.data.map((a) => (
                            <div key={a.id} className="group flex flex-col rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                                <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
                                <div className="flex flex-col flex-1 p-5 gap-3.5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 font-bold text-base border border-amber-200">
                                            {(a.user?.prenom?.[0] ?? '?')}{(a.user?.nom?.[0] ?? '')}
                                        </div>
                                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">{a.badge}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[hsl(20,14%,12%)] group-hover:text-amber-600 transition-colors">{a.metier}</h3>
                                        <p className="text-sm text-[hsl(20,10%,50%)] mt-0.5">{a.user ? `${a.user.prenom} ${a.user.nom}` : 'Artisan professionnel'}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {a.categories.slice(0, 2).map((c) => (
                                            <span key={c.id} className="rounded-full bg-[hsl(36,30%,93%)] px-2.5 py-0.5 text-xs font-medium text-[hsl(20,14%,35%)]">{c.nom}</span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(Number(a.note_moyenne)) ? 'fill-amber-400 text-amber-400' : 'text-[hsl(30,20%,80%)]'}`} />)}
                                        </div>
                                        <span className="text-sm font-semibold text-[hsl(20,14%,20%)]">{a.note_moyenne}</span>
                                    </div>
                                    {a.zone_intervention && (
                                        <div className="flex items-center gap-1.5 text-xs text-[hsl(20,10%,50%)]">
                                            <MapPin className="h-3.5 w-3.5 shrink-0 text-[hsl(20,10%,60%)]" />
                                            <span className="truncate">{a.zone_intervention}</span>
                                        </div>
                                    )}
                                    {a.tarifs_horaire != null && (
                                        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                                            <p className="text-xs font-semibold text-amber-700">{Number(a.tarifs_horaire).toLocaleString('fr-FR')} FCFA / heure</p>
                                        </div>
                                    )}
                                    <Link href={route('artisans.show', a.id)} className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-[hsl(20,14%,12%)] hover:bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200">
                                        Voir le profil <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {safeArtisans.links.length > 3 && (
                    <nav className="flex justify-center">
                        <div className="inline-flex items-center gap-1 rounded-xl border border-[hsl(30,20%,88%)] bg-white p-1 shadow-sm">
                            {safeArtisans.links.map((l, i) => l.url ? (
                                <Link key={i} href={l.url} preserveScroll
                                    className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${l.active ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm' : 'text-[hsl(20,14%,35%)] hover:bg-[hsl(36,30%,93%)]'}`}
                                    dangerouslySetInnerHTML={{ __html: l.label }} />
                            ) : (
                                <span key={i} className="px-3 py-2 text-sm text-[hsl(20,10%,65%)]" dangerouslySetInnerHTML={{ __html: l.label }} />
                            ))}
                        </div>
                    </nav>
                )}
            </main>
        </div>
    );
}
