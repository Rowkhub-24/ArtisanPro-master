import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Plus, Image, Trash2, ExternalLink } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/artisan/dashboard' },
    { title: 'Portfolio', href: '/artisan/portfolio' },
];

interface PortfolioItem {
    id: number;
    titre: string;
    description: string | null;
    url_media: string;
    type_media: 'image' | 'video';
    created_at: string;
}

interface Props {
    portfolio?: PortfolioItem[];
}

export default function ArtisanPortfolio({ portfolio = [] }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mon Portfolio - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('artisan.dashboard')}
                            className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Mon Portfolio</h1>
                            <p className="mt-1 text-[hsl(20,10%,50%)]">{portfolio.length} réalisation{portfolio.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-5 py-2.5 shadow-sm transition-all">
                        <Plus className="h-4 w-4" />
                        Ajouter une réalisation
                    </button>
                </div>

                {/* Info banner */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-800">
                        <strong>Conseil :</strong> Un portfolio complet avec des photos de vos réalisations augmente vos chances d&apos;être contacté de 3x.
                        Ajoutez au moins 5 photos de vos meilleurs travaux.
                    </p>
                </div>

                {/* Grid */}
                {portfolio.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,82%)] bg-white p-16 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mx-auto mb-6">
                            <Image className="h-10 w-10 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-[hsl(20,14%,12%)] mb-2">Portfolio vide</h3>
                        <p className="text-[hsl(20,10%,50%)] mb-6 max-w-sm mx-auto">
                            Ajoutez des photos de vos réalisations pour montrer votre savoir-faire aux clients
                        </p>
                        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-5 py-2.5 shadow-sm transition-all">
                            <Plus className="h-4 w-4" />
                            Ajouter ma première réalisation
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {portfolio.map((item) => (
                            <div
                                key={item.id}
                                className="group rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                            >
                                {/* Media */}
                                <div className="relative aspect-video bg-[hsl(36,33%,97%)] overflow-hidden">
                                    {item.type_media === 'image' ? (
                                        <img
                                            src={item.url_media}
                                            alt={item.titre}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full bg-[hsl(36,20%,92%)]">
                                            <Image className="h-12 w-12 text-[hsl(20,10%,50%)]" />
                                        </div>
                                    )}
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                                        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[hsl(20,14%,12%)] shadow-lg hover:bg-[hsl(36,33%,97%)] transition-colors">
                                            <ExternalLink className="h-5 w-5" />
                                        </button>
                                        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-[hsl(20,14%,12%)] truncate">{item.titre}</h3>
                                    {item.description && (
                                        <p className="text-sm text-[hsl(20,10%,50%)] mt-1 line-clamp-2">{item.description}</p>
                                    )}
                                    <p className="text-xs text-[hsl(20,10%,50%)] mt-2">
                                        {new Date(item.created_at).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
