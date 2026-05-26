import { Head, Link, usePage } from '@inertiajs/react';
import { Home, Search, Settings, FileText, Calendar, Wrench, ArrowRight, TrendingUp } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/dashboard' },
];

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const role = auth.user?.type_utilisateur;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tableau de bord - ArtisanPro" />
            <div className="min-h-screen bg-[hsl(36,33%,97%)] p-6 space-y-6">

                {/* Welcome banner */}
                <div className="relative overflow-hidden rounded-2xl bg-[hsl(20,14%,10%)] p-8 shadow-xl">
                    <div className="absolute top-0 right-1/4 h-48 w-48 rounded-full bg-amber-500/10 blur-[60px]" />
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                {role === 'client' ? 'Espace Client' : role === 'artisan' ? 'Espace Artisan' : 'Tableau de bord'}
                            </span>
                            <h1 className="text-3xl font-extrabold text-white">Bienvenue, {auth.user?.prenom} 👋</h1>
                            <p className="text-white/50">Plateforme ArtisanPro · Porto-Novo, Bénin</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-sm text-white/60">En ligne</span>
                        </div>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link href={route('artisans.index')}
                        className="group flex flex-col gap-4 rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                                <Search className="h-6 w-6" />
                            </div>
                            <ArrowRight className="h-5 w-5 text-[hsl(20,10%,65%)] group-hover:text-amber-500 transition-colors" />
                        </div>
                        <div>
                            <p className="font-bold text-[hsl(20,14%,12%)] group-hover:text-amber-600 transition-colors">Annuaire</p>
                            <p className="text-sm text-[hsl(20,10%,50%)]">Rechercher des artisans</p>
                        </div>
                    </Link>

                    <Link href={route('home')}
                        className="group flex flex-col gap-4 rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 text-orange-600">
                                <Home className="h-6 w-6" />
                            </div>
                            <ArrowRight className="h-5 w-5 text-[hsl(20,10%,65%)] group-hover:text-amber-500 transition-colors" />
                        </div>
                        <div>
                            <p className="font-bold text-[hsl(20,14%,12%)] group-hover:text-amber-600 transition-colors">Accueil</p>
                            <p className="text-sm text-[hsl(20,10%,50%)]">Page d&apos;accueil publique</p>
                        </div>
                    </Link>

                    {role === 'artisan' && (
                        <Link href={route('artisan.devis')}
                            className="group flex flex-col gap-4 rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <ArrowRight className="h-5 w-5 text-[hsl(20,10%,65%)] group-hover:text-amber-500 transition-colors" />
                            </div>
                            <div>
                                <p className="font-bold text-[hsl(20,14%,12%)] group-hover:text-amber-600 transition-colors">Mes Devis</p>
                                <p className="text-sm text-[hsl(20,10%,50%)]">Gérer les demandes reçues</p>
                            </div>
                        </Link>
                    )}

                    {role === 'client' && (
                        <Link href={route('client.reservations')}
                            className="group flex flex-col gap-4 rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <ArrowRight className="h-5 w-5 text-[hsl(20,10%,65%)] group-hover:text-amber-500 transition-colors" />
                            </div>
                            <div>
                                <p className="font-bold text-[hsl(20,14%,12%)] group-hover:text-amber-600 transition-colors">Réservations</p>
                                <p className="text-sm text-[hsl(20,10%,50%)]">Suivre mes réservations</p>
                            </div>
                        </Link>
                    )}

                    <Link href={role === 'client' ? route('client.profil') : role === 'artisan' ? route('artisan.profil') : route('profile.edit')}
                        className="group flex flex-col gap-4 rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 border border-violet-100 text-violet-600">
                                <Settings className="h-6 w-6" />
                            </div>
                            <ArrowRight className="h-5 w-5 text-[hsl(20,10%,65%)] group-hover:text-amber-500 transition-colors" />
                        </div>
                        <div>
                            <p className="font-bold text-[hsl(20,14%,12%)] group-hover:text-amber-600 transition-colors">Profil</p>
                            <p className="text-sm text-[hsl(20,10%,50%)]">Gérer mes informations</p>
                        </div>
                    </Link>
                </div>

                {/* Info cards */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-[hsl(20,14%,12%)]">Statistiques</h2>
                                <p className="text-xs text-[hsl(20,10%,50%)]">Vue d&apos;ensemble de votre activité</p>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Interactions</p>
                                <p className="text-2xl font-extrabold text-amber-800 mt-1">24</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Taux de réponse</p>
                                <p className="text-2xl font-extrabold text-emerald-800 mt-1">95%</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 text-orange-600">
                                <Wrench className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-[hsl(20,14%,12%)]">Prochaines étapes</h2>
                                <p className="text-xs text-[hsl(20,10%,50%)]">Fonctionnalités en développement</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[
                                { color: 'bg-amber-500', label: 'Intégration Mobile Money' },
                                { color: 'bg-blue-500', label: 'Messagerie instantanée' },
                                { color: 'bg-emerald-500', label: 'Notifications push' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <div className={`h-2 w-2 rounded-full ${item.color}`} />
                                    <span className="text-sm text-[hsl(20,10%,35%)]">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
