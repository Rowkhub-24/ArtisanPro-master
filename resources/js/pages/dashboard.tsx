import { Head, Link, usePage } from '@inertiajs/react';
import { Home, Search, Users, Settings, FileText, Calendar, TrendingUp, Wrench, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tableau de bord',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const role = auth.user?.type_utilisateur;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tableau de bord - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
                {/* Welcome Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                Bienvenue, {auth.user?.prenom}
                            </h1>
                            <p className="mt-2 text-lg text-gray-600">
                                Compte {role === 'client' ? 'client' : role === 'artisan' ? 'artisan' : role} · 
                                <span className="font-medium text-blue-600"> Plateforme Porto-Novo</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600">En ligne</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                                    <Search className="h-6 w-6" />
                                </div>
                                <ArrowRight className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" />
                            </div>
                            <CardTitle className="text-xl">Annuaire</CardTitle>
                            <CardDescription className="text-blue-100">
                                Rechercher des artisans par métier
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border-0">
                                <Link href={route('artisans.index')}>
                                    Explorer l'annuaire
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <Home className="h-6 w-6" />
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <CardTitle className="text-xl text-gray-900">Accueil Public</CardTitle>
                            <CardDescription className="text-gray-600">
                                Voir la page d'accueil
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="w-full border-gray-300 hover:border-blue-500 hover:bg-blue-50">
                                <Link href={route('home')}>
                                    Visiter l'accueil
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {role === 'artisan' && (
                        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                                </div>
                                <CardTitle className="text-xl text-gray-900">Mes Devis</CardTitle>
                                <CardDescription className="text-gray-600">
                                    Gérer les demandes reçues
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild variant="outline" className="w-full border-gray-300 hover:border-green-500 hover:bg-green-50">
                                    <Link href={route('artisan.devis')}>
                                        Voir les devis
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {role === 'client' && (
                        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                                </div>
                                <CardTitle className="text-xl text-gray-900">Réservations</CardTitle>
                                <CardDescription className="text-gray-600">
                                    Suivre mes réservations
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild variant="outline" className="w-full border-gray-300 hover:border-orange-500 hover:bg-orange-50">
                                    <Link href={route('client.reservations')}>
                                        Mes réservations
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                                    <Settings className="h-6 w-6" />
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                            </div>
                            <CardTitle className="text-xl text-gray-900">Profil</CardTitle>
                            <CardDescription className="text-gray-600">
                                Gérer mes informations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline" className="w-full border-gray-300 hover:border-purple-500 hover:bg-purple-50">
                                <Link href={role === 'client' ? route('client.profil') : role === 'artisan' ? route('artisan.profil') : route('profile.edit')}>
                                    Paramètres
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats & Info Section */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-gray-200 bg-white">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-gray-900">Statistiques</CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Vue d'ensemble de votre activité
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-lg bg-blue-50 p-4">
                                    <p className="text-sm font-medium text-blue-600">Total des interactions</p>
                                    <p className="text-2xl font-bold text-blue-900">24</p>
                                </div>
                                <div className="rounded-lg bg-green-50 p-4">
                                    <p className="text-sm font-medium text-green-600">Taux de réponse</p>
                                    <p className="text-2xl font-bold text-green-900">95%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 bg-white">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                                    <Wrench className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-gray-900">Prochaines étapes</CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Fonctionnalités en développement
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                                    <span className="text-sm text-gray-700">Intégration Mobile Money</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm text-gray-700">Messagerie instantanée</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-gray-700">Notifications push</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                    <strong>API :</strong> <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">POST /api/v1/auth/login</code>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
