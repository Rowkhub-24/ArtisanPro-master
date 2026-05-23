import { Head, Link } from '@inertiajs/react';
import { Heart, ArrowLeft, Star, MapPin, Trash2, ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/client/dashboard' },
    { title: 'Favoris', href: '/client/favoris' },
];

interface FavoriArtisan {
    id: number;
    artisan_id: number;
    metier: string;
    note_moyenne: number;
    badge: string;
    zone_intervention: string | null;
    tarifs_horaire: number | null;
    prenom: string;
    nom: string;
    categories: string[];
}

interface Props {
    favoris?: FavoriArtisan[];
}

export default function ClientFavoris({ favoris = [] }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Favoris - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href={route('client.dashboard')}><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mes Favoris</h1>
                            <p className="mt-1 text-gray-600">{favoris.length} artisan{favoris.length > 1 ? 's' : ''} sauvegardé{favoris.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <Button asChild variant="outline" className="border-gray-300">
                        <Link href={route('artisans.index')}>
                            Parcourir l'annuaire
                        </Link>
                    </Button>
                </div>

                {favoris.length === 0 ? (
                    <Card className="border-dashed border-2 border-gray-200 bg-white">
                        <CardContent className="p-16 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mx-auto mb-6">
                                <Heart className="h-10 w-10 text-red-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun favori</h3>
                            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                Sauvegardez vos artisans préférés pour les retrouver facilement
                            </p>
                            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                <Link href={route('artisans.index')}>
                                    Découvrir les artisans
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {favoris.map((f) => (
                            <Card key={f.id} className="group border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <CardTitle className="text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {f.metier}
                                            </CardTitle>
                                            <CardDescription className="text-gray-600">
                                                {f.prenom} {f.nom}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-blue-100 text-blue-800 border-0">{f.badge}</Badge>
                                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                                                <Link
                                                    href={route('client.favoris.destroy', { artisan: f.artisan_id })}
                                                    method="delete"
                                                    preserveScroll
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {f.categories.map((cat) => (
                                            <span key={cat} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex flex-col gap-2 text-sm text-gray-700">
                                        <div className="flex items-center gap-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-4 w-4 ${i < Math.floor(Number(f.note_moyenne)) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                                            ))}
                                            <span className="font-medium text-gray-900">{Number(f.note_moyenne).toFixed(1)} / 5</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Note moyenne :</span>
                                            <span className="font-medium text-gray-900"> {Number(f.note_moyenne).toFixed(1)}</span>
                                            <span className="text-gray-500"> · {Math.round(Number(f.note_moyenne))} étoile{Math.round(Number(f.note_moyenne)) > 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                    {f.zone_intervention && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span>{f.zone_intervention}</span>
                                        </div>
                                    )}
                                    {f.tarifs_horaire != null && (
                                        <div className="rounded-lg bg-blue-50 p-3">
                                            <p className="text-sm font-medium text-blue-900">
                                                {Number(f.tarifs_horaire).toLocaleString('fr-FR')} FCFA / heure
                                            </p>
                                        </div>
                                    )}
                                    <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                        <Link href={route('artisans.show', f.artisan_id)}>
                                            Voir le profil
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
