import { Head, Link, router, usePage } from '@inertiajs/react';
import { FileText, Clock, CheckCircle, XCircle, ArrowLeft, Search, Eye } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tableau de bord',
        href: '/dashboard',
    },
    {
        title: 'Mes Devis',
        href: '/artisan/devis',
    },
];

interface DevisItem {
    id: number;
    description_travaux: string;
    statut: 'en_attente' | 'accepte' | 'refuse' | 'contre_offre';
    created_at: string;
    client?: {
        user: {
            prenom: string;
            nom: string;
            email: string;
            telephone?: string;
        };
    };
}

interface Props {
    devis?: DevisItem[];
}

export default function ArtisanDevis({ devis = [] }: Props) {
    const { auth } = usePage<SharedData>().props;

    const updateStatut = (devisId: number, statut: 'accepte' | 'refuse') => {
        router.patch(route('artisan.devis.statut', devisId), { statut }, { preserveScroll: true });
    };

    const getStatusBadge = (statut: string) => {
        const statusConfig = {
            en_attente: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
            accepte: { label: 'Accepté', className: 'bg-green-100 text-green-800' },
            refuse: { label: 'Refusé', className: 'bg-red-100 text-red-800' },
            en_cours: { label: 'En cours', className: 'bg-blue-100 text-blue-800' },
            termine: { label: 'Terminé', className: 'bg-gray-100 text-gray-800' },
        };
        const config = statusConfig[statut as keyof typeof statusConfig] || statusConfig.en_attente;
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    const getStatusIcon = (statut: string) => {
        switch (statut) {
            case 'accepte':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'refuse':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'en_cours':
                return <Clock className="h-5 w-5 text-blue-600" />;
            default:
                return <Clock className="h-5 w-5 text-yellow-600" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Devis - ArtisanPro" />
            <div className="flex flex-col gap-8 p-4 md:p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <Button asChild variant="outline" size="icon">
                            <Link href={route('artisan.dashboard')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Mes Devis</h1>
                            <p className="mt-1 text-sm md:text-base text-gray-600">Gérez les demandes de devis de vos clients</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Rechercher..."
                                className="pl-10 w-full md:w-64 border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
                    <Card className="border-gray-200 bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total</p>
                                    <p className="text-2xl font-bold text-gray-900">{devis.length}</p>
                                </div>
                                <FileText className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">En attente</p>
                                    <p className="text-2xl font-bold text-yellow-600">{devis.filter(d => d.statut === 'en_attente').length}</p>
                                </div>
                                <Clock className="h-8 w-8 text-yellow-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Acceptés</p>
                                    <p className="text-2xl font-bold text-green-600">{devis.filter(d => d.statut === 'accepte').length}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">En cours</p>
                                    <p className="text-2xl font-bold text-blue-600">{devis.filter(d => d.statut === 'en_cours').length}</p>
                                </div>
                                <Clock className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Devis List */}
                <div className="space-y-4">
                    {devis.length === 0 ? (
                        <Card className="border-gray-200 bg-white">
                            <CardContent className="p-12 text-center">
                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune demande de devis</h3>
                                <p className="text-gray-600">Vous n'avez pas encore reçu de demandes de devis de clients.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        devis.map((devisItem) => (
                            <Card key={devisItem.id} className="border-gray-200 bg-white hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {getStatusIcon(devisItem.statut)}
                                                {getStatusBadge(devisItem.statut)}
                                                <span className="text-sm text-gray-500">
                                                    {new Date(devisItem.created_at).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            <CardTitle className="text-lg text-gray-900">
                                                {devisItem.client?.user ? `${devisItem.client.user.prenom} ${devisItem.client.user.nom}` : 'Client inconnu'}
                                            </CardTitle>
                                            <CardDescription className="text-gray-600 mt-1">
                                                {devisItem.client?.user.email}
                                                {devisItem.client?.user.telephone && ` · ${devisItem.client.user.telephone}`}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            {devisItem.statut === 'en_attente' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => updateStatut(devisItem.id, 'accepte')}
                                                    >
                                                        <CheckCircle className="mr-1.5 h-4 w-4" />
                                                        Accepter
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-300 text-red-700 hover:bg-red-50"
                                                        onClick={() => updateStatut(devisItem.id, 'refuse')}
                                                    >
                                                        <XCircle className="mr-1.5 h-4 w-4" />
                                                        Refuser
                                                    </Button>
                                                </>
                                            )}
                                            <Button size="sm" variant="outline">
                                                <Eye className="mr-1.5 h-4 w-4" />
                                                Voir détails
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium text-gray-900">Description :</span>{' '}
                                            {devisItem.description_travaux}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
