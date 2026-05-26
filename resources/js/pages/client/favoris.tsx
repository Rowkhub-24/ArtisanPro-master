import { Head, Link } from '@inertiajs/react';
import { Heart, ArrowLeft, Star, MapPin, Trash2, ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
    avatar_url?: string | null;
    categories: string[];
}

interface Props {
    favoris?: FavoriArtisan[];
}

export default function ClientFavoris({ favoris = [] }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Favoris - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('client.dashboard')}
                            className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Mes Favoris</h1>
                            <p className="mt-1 text-[hsl(20,10%,50%)]">
                                {favoris.length} artisan{favoris.length > 1 ? 's' : ''} sauvegardé{favoris.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route('artisans.index')}
                        className="inline-flex items-center gap-2 rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm font-medium text-[hsl(20,14%,12%)] hover:border-amber-400 transition-colors"
                    >
                        Parcourir l'annuaire
                    </Link>
                </div>

                {favoris.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,88%)] bg-white p-16 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mx-auto mb-6">
                            <Heart className="h-10 w-10 text-red-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-[hsl(20,14%,12%)] mb-2">Aucun favori</h3>
                        <p className="text-[hsl(20,10%,50%)] mb-6 max-w-sm mx-auto">
                            Sauvegardez vos artisans préférés pour les retrouver facilement
                        </p>
                        <Link
                            href={route('artisans.index')}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm transition-all"
                        >
                            Découvrir les artisans
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {favoris.map((f) => (
                            <div
                                key={f.id}
                                className="group rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                            >
                                {/* Amber top strip */}
                                <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                                <div className="p-5">
                                    {/* Card header */}
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-lg font-semibold text-[hsl(20,14%,12%)] group-hover:text-amber-600 transition-colors">
                                                {f.metier}
                                            </h3>
                                            <p className="text-sm text-[hsl(20,10%,50%)]">{f.prenom} {f.nom}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-amber-100 text-amber-800 border border-amber-200">{f.badge}</Badge>
                                            <Link
                                                href={route('client.favoris.destroy', { artisan: f.artisan_id })}
                                                method="delete"
                                                preserveScroll
                                                className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Categories */}
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {f.categories.map((cat) => (
                                            <span key={cat} className="inline-flex items-center rounded-full bg-[hsl(36,33%,94%)] px-2.5 py-1 text-xs font-medium text-[hsl(20,14%,12%)]">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Stars */}
                                    <div className="flex flex-col gap-2 text-sm mb-4">
                                        <div className="flex items-center gap-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i < Math.floor(Number(f.note_moyenne)) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                                />
                                            ))}
                                            <span className="font-medium text-[hsl(20,14%,12%)]">{Number(f.note_moyenne).toFixed(1)} / 5</span>
                                        </div>
                                    </div>

                                    {/* Zone */}
                                    {f.zone_intervention && (
                                        <div className="flex items-center gap-2 text-sm text-[hsl(20,10%,50%)] mb-4">
                                            <MapPin className="h-4 w-4 text-[hsl(20,10%,50%)]" />
                                            <span>{f.zone_intervention}</span>
                                        </div>
                                    )}

                                    {/* Tarif */}
                                    {f.tarifs_horaire != null && (
                                        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 mb-4">
                                            <p className="text-sm font-medium text-amber-900">
                                                {Number(f.tarifs_horaire).toLocaleString('fr-FR')} FCFA / heure
                                            </p>
                                        </div>
                                    )}

                                    {/* Buttons */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={route('artisans.show', f.artisan_id)}
                                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(20,14%,12%)] hover:bg-amber-600 text-white font-semibold px-3 py-2 text-sm transition-colors"
                                        >
                                            Voir le profil
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
