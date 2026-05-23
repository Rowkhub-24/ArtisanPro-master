import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Star, MapPin, Search, UserPlus, Wrench, ChevronRight, CheckCircle, Phone, Hammer, Zap, Paintbrush, Layers } from 'lucide-react';
import { SharedData } from '@/types';

interface CategoryRow { id: number; nom: string; icone: string | null; description: string | null; nombre_artisans: number; }
interface ArtisanCard { id: number; metier: string; note_moyenne: string | number; badge: string; tarifs_horaire: string | number | null; zone_intervention: string | null; prenom: string | null; nom: string | null; categories: string[]; }
interface Props { categories: CategoryRow[]; artisansMisEnAvant: ArtisanCard[]; }

const CAT_ICONS: Record<string, React.ElementType> = {
    'Plomberie': Wrench, 'Électricité': Zap, 'Maçonnerie': Layers,
    'Menuiserie': Hammer, 'Peinture': Paintbrush,
};

const STEPS = [
    { n: '01', icon: Search, title: 'Recherchez', desc: "Parcourez l'annuaire par métier, catégorie ou zone d'intervention.", color: 'from-amber-500 to-orange-500' },
    { n: '02', icon: Phone, title: 'Demandez un devis', desc: "Envoyez votre demande depuis la plateforme. L'artisan vous répond sous 2h.", color: 'from-orange-500 to-red-500' },
    { n: '03', icon: CheckCircle, title: 'Réservez & Payez', desc: 'Confirmez votre réservation et payez via Mobile Money ou carte.', color: 'from-emerald-500 to-teal-500' },
];

const STATS = [
    { value: '500+', label: 'Artisans vérifiés' },
    { value: '2 000+', label: 'Clients satisfaits' },
    { value: '4.8/5', label: 'Note moyenne' },
    { value: '< 2h', label: 'Délai de réponse' },
];

export default function Accueil({ categories, artisansMisEnAvant }: Props) {
    const { auth } = usePage<SharedData>().props;

    return (
        <div className="min-h-screen bg-[hsl(36,33%,97%)]">
            <Head title="ArtisanPro — Trouvez votre artisan à Porto-Novo" />

            {/* NAVBAR */}
            <header className="fixed top-0 inset-x-0 z-50 border-b border-white/8 bg-[hsl(20,14%,10%)]/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
                    <Link href="/" className="flex items-center gap-2.5">
                        <img src="/images/ArtisanPro.jpg" alt="ArtisanPro" className="h-12 w-12 object-contain" />
                    </Link>
                    <nav className="hidden md:flex items-center gap-1">
                        <Link href={route('artisans.index')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">Annuaire</Link>
                        <Link href={route('about')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">À propos</Link>
                        <Link href={route('faq')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">FAQ</Link>
                        <Link href={route('contact')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">Contact</Link>
                    </nav>
                    <div className="flex items-center gap-2">
                        {auth.user ? (
                            <Link href={route('dashboard')} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-900/25 transition-all">
                                Mon espace <ArrowRight className="h-4 w-4" />
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all">Connexion</Link>
                                <Link href={route('register')} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-900/25 transition-all">
                                    S&apos;inscrire
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* HERO */}
            <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
                {/* Real background image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: 'url(/images/hero-artisan.jpg)' }}
                />
                {/* Dark overlay with warm tint */}
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(20,14%,6%)]/92 via-[hsl(20,14%,10%)]/85 to-[hsl(25,40%,15%)]/80" />
                {/* Warm glow */}
                <div className="absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[100px]" />
                <div className="absolute bottom-1/4 left-1/5 h-[300px] w-[300px] rounded-full bg-orange-600/8 blur-[80px]" />

                <div className="relative mx-auto max-w-7xl px-6 py-20 w-full">
                    <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Plateforme artisans · Porto-Novo, Bénin
                            </div>
                            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white lg:text-6xl">
                                L&apos;artisan qu&apos;il vous faut,{' '}
                                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                                    près de chez vous
                                </span>
                            </h1>
                            <p className="text-lg text-white/60 leading-relaxed max-w-lg">
                                Devis instantanés, réservations simples, paiements Mobile Money sécurisés.
                                Tous nos artisans sont vérifiés et notés par la communauté.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link href={route('artisans.index')} className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-amber-900/30 hover:from-amber-400 hover:to-orange-400 transition-all duration-200">
                                    <Search className="h-5 w-5" />
                                    Trouver un artisan
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                {!auth.user && (
                                    <Link href={route('register')} className="inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/8 px-6 py-3.5 text-base font-semibold text-white hover:bg-white/15 transition-all duration-200">
                                        <UserPlus className="h-5 w-5" />
                                        Créer un compte
                                    </Link>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/8">
                                {STATS.map(({ value, label }) => (
                                    <div key={label} className="text-center">
                                        <div className="text-xl font-bold text-amber-400">{value}</div>
                                        <div className="text-xs text-white/50 mt-0.5">{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="rounded-2xl border border-white/10 bg-white/6 backdrop-blur-xl p-6 shadow-2xl">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                        <Search className="h-4 w-4 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Recherche par métier</h3>
                                        <p className="text-xs text-white/40">Catégories populaires</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {categories.slice(0, 7).map((c) => {
                                        const Icon = CAT_ICONS[c.nom] ?? Wrench;
                                        return (
                                            <Link key={c.id} href={route('artisans.index', { category_id: c.id })}
                                                className="group flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3 hover:bg-amber-500/15 hover:border-amber-500/30 transition-all duration-150">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/8 group-hover:bg-amber-500/20 transition-colors">
                                                        <Icon className="h-4 w-4 text-white/60 group-hover:text-amber-400 transition-colors" />
                                                    </div>
                                                    <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{c.nom}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-white/35">{c.nombre_artisans}</span>
                                                    <ChevronRight className="h-3.5 w-3.5 text-white/25 group-hover:text-amber-400 transition-colors" />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                                <Link href={route('artisans.index')} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-sm font-semibold text-white transition-all">
                                    Voir tous les artisans <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-24 pattern-bg">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block rounded-full bg-amber-100 border border-amber-200 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 mb-4">Comment ça marche</span>
                        <h2 className="text-4xl font-extrabold text-[hsl(20,14%,12%)]">Simple, rapide, fiable</h2>
                        <p className="mt-3 text-lg text-[hsl(20,10%,45%)] max-w-xl mx-auto">En 3 étapes, trouvez et réservez votre artisan à Porto-Novo.</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {STEPS.map(({ n, icon: Icon, title, desc, color }, i) => (
                            <div key={n} className="relative group">
                                {i < 2 && <div className="absolute top-10 left-[calc(50%+3rem)] w-[calc(100%-3rem)] h-px bg-gradient-to-r from-amber-200 to-transparent hidden md:block" />}
                                <div className="relative bg-white rounded-2xl border border-[hsl(30,20%,88%)] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
                                    <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-lg mb-6`}>
                                        <Icon className="h-8 w-8 text-white" />
                                    </div>
                                    <div className="text-xs font-bold text-amber-500 tracking-widest mb-2">ÉTAPE {n}</div>
                                    <h3 className="text-xl font-bold text-[hsl(20,14%,12%)] mb-3">{title}</h3>
                                    <p className="text-[hsl(20,10%,45%)] leading-relaxed text-sm">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURED ARTISANS */}
            <section className="py-24 bg-white">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12">
                        <div>
                            <span className="inline-block rounded-full bg-amber-100 border border-amber-200 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 mb-4">Artisans recommandés</span>
                            <h2 className="text-4xl font-extrabold text-[hsl(20,14%,12%)]">Les meilleurs de Porto-Novo</h2>
                            <p className="mt-2 text-[hsl(20,10%,45%)]">Sélectionnés pour leur excellence et leurs avis clients.</p>
                        </div>
                        <Link href={route('artisans.index')} className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors whitespace-nowrap">
                            Voir tous <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {artisansMisEnAvant.map((a) => (
                            <div key={a.id} className="group flex flex-col rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
                                <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
                                <div className="flex flex-col flex-1 p-5 gap-3.5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 font-bold text-base border border-amber-200">
                                            {(a.prenom?.[0] ?? '?')}{(a.nom?.[0] ?? '')}
                                        </div>
                                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">{a.badge}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[hsl(20,14%,12%)] group-hover:text-amber-600 transition-colors leading-tight">{a.metier}</h3>
                                        <p className="text-sm text-[hsl(20,10%,50%)] mt-0.5">{a.prenom} {a.nom}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {a.categories.slice(0, 2).map((cat) => (
                                            <span key={cat} className="rounded-full bg-[hsl(36,30%,93%)] px-2.5 py-0.5 text-xs font-medium text-[hsl(20,14%,35%)]">{cat}</span>
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
                                            <MapPin className="h-3.5 w-3.5 text-[hsl(20,10%,60%)] shrink-0" />
                                            <span className="truncate">{a.zone_intervention}</span>
                                        </div>
                                    )}
                                    {a.tarifs_horaire != null && (
                                        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                                            <p className="text-xs font-semibold text-amber-700">{Number(a.tarifs_horaire).toLocaleString('fr-FR')} FCFA / heure</p>
                                        </div>
                                    )}
                                    <Link href={route('artisans.show', a.id)} className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-[hsl(20,14%,12%)] hover:bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 shadow-sm">
                                        Voir le profil <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CATEGORIES */}
            <section className="py-24 pattern-bg">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center mb-12">
                        <span className="inline-block rounded-full bg-amber-100 border border-amber-200 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 mb-4">Nos métiers</span>
                        <h2 className="text-4xl font-extrabold text-[hsl(20,14%,12%)]">Tous les corps de métier</h2>
                    </div>
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                        {categories.map((c) => {
                            const Icon = CAT_ICONS[c.nom] ?? Wrench;
                            return (
                                <Link key={c.id} href={route('artisans.index', { category_id: c.id })}
                                    className="group flex items-center gap-3 rounded-xl border border-[hsl(30,20%,88%)] bg-white p-4 hover:border-amber-300 hover:shadow-md transition-all duration-200">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-[hsl(20,14%,15%)] group-hover:text-amber-600 transition-colors truncate">{c.nom}</div>
                                        <div className="text-xs text-[hsl(20,10%,55%)]">{c.nombre_artisans} artisan{c.nombre_artisans > 1 ? 's' : ''}</div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative py-24 overflow-hidden">
                {/* Real background image */}
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/hero-artisan2.jpg)' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(20,14%,8%)]/95 to-[hsl(25,40%,15%)]/88" />
                <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-amber-500/8 blur-[80px]" />
                <div className="relative mx-auto max-w-3xl px-6 text-center">
                    <span className="inline-block rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-6">Rejoignez-nous</span>
                    <h2 className="text-4xl font-extrabold text-white mb-5 lg:text-5xl">
                        Vous êtes artisan ?<br />
                        <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Développez votre activité</span>
                    </h2>
                    <p className="text-lg text-white/55 mb-10 max-w-xl mx-auto">
                        Gérez vos réservations, recevez vos paiements en ligne et développez votre clientèle à Porto-Novo.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href={route('register')} className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-amber-900/30 hover:from-amber-400 hover:to-orange-400 transition-all">
                            <UserPlus className="h-5 w-5" />
                            S&apos;inscrire gratuitement
                        </Link>
                        <Link href={route('about')} className="inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/8 px-8 py-4 text-base font-semibold text-white hover:bg-white/15 transition-all">
                            En savoir plus <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-[hsl(20,14%,8%)] text-[hsl(36,10%,55%)]">
                <div className="mx-auto max-w-7xl px-6 py-16">
                    <div className="grid gap-10 md:grid-cols-4 mb-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5 font-bold text-lg text-white">
                                <img src="/images/ArtisanPro.jpg" alt="ArtisanPro" className="h-10 w-10 object-contain" />
                            </div>
                            <p className="text-sm leading-relaxed">La plateforme de référence pour mettre en relation clients et artisans à Porto-Novo, Bénin.</p>
                            <div className="flex items-center gap-2 text-sm text-emerald-400">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Service disponible 24h/24
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-white text-sm">Services</h3>
                            <ul className="space-y-2.5 text-sm">
                                <li><Link href={route('artisans.index')} className="hover:text-amber-400 transition-colors">Annuaire artisans</Link></li>
                                <li><Link href={route('home')} className="hover:text-amber-400 transition-colors">Devis en ligne</Link></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-white text-sm">Compte</h3>
                            <ul className="space-y-2.5 text-sm">
                                <li><Link href={route('login')} className="hover:text-amber-400 transition-colors">Connexion</Link></li>
                                <li><Link href={route('register')} className="hover:text-amber-400 transition-colors">Inscription</Link></li>
                                <li><Link href={route('faq')} className="hover:text-amber-400 transition-colors">FAQ</Link></li>
                                <li><Link href={route('contact')} className="hover:text-amber-400 transition-colors">Contact</Link></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-white text-sm">Légal</h3>
                            <ul className="space-y-2.5 text-sm">
                                <li><Link href={route('about')} className="hover:text-amber-400 transition-colors">À propos</Link></li>
                                <li><Link href={route('terms')} className="hover:text-amber-400 transition-colors">CGV</Link></li>
                                <li><Link href={route('privacy')} className="hover:text-amber-400 transition-colors">Confidentialité</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                        <p>© 2025 ArtisanPro. Tous droits réservés.</p>
                        <p className="text-[hsl(36,10%,35%)]">Porto-Novo, Bénin · Plateforme artisans-clients</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
