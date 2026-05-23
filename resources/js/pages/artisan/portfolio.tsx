import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Plus, Image, Trash2, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href={route('artisan.dashboard')}><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mon Portfolio</h1>
                            <p className="mt-1 text-gray-600">{portfolio.length} réalisation{portfolio.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter une réalisation
                    </Button>
                </div>

                {/* Info */}
                <Card className="border-indigo-200 bg-indigo-50">
                    <CardContent className="p-4">
                        <p className="text-sm text-indigo-800">
                            <strong>Conseil :</strong> Un portfolio complet avec des photos de vos réalisations augmente vos chances d'être contacté de 3x.
                            Ajoutez au moins 5 photos de vos meilleurs travaux.
                        </p>
                    </CardContent>
                </Card>

                {/* Grid */}
                {portfolio.length === 0 ? (
                    <Card className="border-dashed border-2 border-gray-200 bg-white">
                        <CardContent className="p-16 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 mx-auto mb-6">
                                <Image className="h-10 w-10 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Portfolio vide</h3>
                            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                Ajoutez des photos de vos réalisations pour montrer votre savoir-faire aux clients
                            </p>
                            <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Ajouter ma première réalisation
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {portfolio.map((item) => (
                            <Card key={item.id} className="group border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                                {/* Media */}
                                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                    {item.type_media === 'image' ? (
                                        <img
                                            src={item.url_media}
                                            alt={item.titre}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full bg-gray-200">
                                            <Image className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                                        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg hover:bg-gray-100 transition-colors">
                                            <ExternalLink className="h-5 w-5" />
                                        </button>
                                        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="font-semibold text-gray-900 truncate">{item.titre}</h3>
                                    {item.description && (
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(item.created_at).toLocaleDateString('fr-FR')}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
