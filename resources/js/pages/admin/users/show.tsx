import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Shield, UserX, UserCheck, Wrench, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';

interface ArtisanData {
    id: number;
    metier: string;
    note_moyenne: number;
    badge: string;
    zone_intervention: string | null;
    tarifs_horaire: number | null;
    categories: { id: number; nom: string }[];
}

interface UserDetail {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
    adresse: string | null;
    type_utilisateur: string;
    statut: string;
    date_inscription: string;
    email_verified_at: string | null;
    artisan: ArtisanData | null;
    client: { id: number } | null;
}

interface Props {
    user: UserDetail;
}

const statutColors: Record<string, string> = {
    actif:    'bg-green-100 text-green-800',
    suspendu: 'bg-yellow-100 text-yellow-800',
    banni:    'bg-red-100 text-red-800',
};

const badgeColors: Record<string, string> = {
    elite:    'bg-purple-100 text-purple-800',
    certifie: 'bg-blue-100 text-blue-800',
    aucun:    'bg-gray-100 text-gray-700',
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
                    <Link href={route('admin.users.index')}>
                        <Button variant="outline" size="icon" className="border-gray-200">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.prenom} {user.nom}</h1>
                        <p className="text-sm text-gray-500">ID #{user.id} · Inscrit le {new Date(user.date_inscription).toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Profile Card */}
                    <Card className="border-0 shadow-md bg-white">
                        <CardContent className="p-6 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold mx-auto mb-4">
                                {user.prenom.charAt(0)}{user.nom.charAt(0)}
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">{user.prenom} {user.nom}</h2>
                            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                            <div className="flex items-center justify-center gap-2 mt-3">
                                <Badge className={`text-xs ${statutColors[user.statut] ?? 'bg-gray-100 text-gray-700'}`}>
                                    {user.statut}
                                </Badge>
                                <Badge className="text-xs bg-blue-100 text-blue-800">
                                    {user.type_utilisateur}
                                </Badge>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 space-y-2">
                                {user.statut === 'actif' ? (
                                    <Button onClick={() => updateStatut('suspendu')} variant="outline" className="w-full border-yellow-200 text-yellow-700 hover:bg-yellow-50">
                                        <UserX className="mr-2 h-4 w-4" />
                                        Suspendre
                                    </Button>
                                ) : (
                                    <Button onClick={() => updateStatut('actif')} variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50">
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Réactiver
                                    </Button>
                                )}
                                {user.statut !== 'banni' && (
                                    <Button onClick={() => updateStatut('banni')} variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50">
                                        <Shield className="mr-2 h-4 w-4" />
                                        Bannir
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Info */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="border-0 shadow-md bg-white">
                            <CardHeader className="border-b border-gray-100 pb-4">
                                <CardTitle className="text-base font-semibold text-gray-900">Informations personnelles</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                                {[
                                    { icon: Mail,     label: 'Email',       value: user.email },
                                    { icon: Phone,    label: 'Téléphone',   value: user.telephone ?? 'Non renseigné' },
                                    { icon: MapPin,   label: 'Adresse',     value: user.adresse ?? 'Non renseignée' },
                                    { icon: Calendar, label: 'Inscription', value: new Date(user.date_inscription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
                                    { icon: Shield,   label: 'Email vérifié', value: user.email_verified_at ? '✓ Vérifié' : '✗ Non vérifié' },
                                ].map((info) => (
                                    <div key={info.label} className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                                            <info.icon className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">{info.label}</p>
                                            <p className="text-sm font-medium text-gray-900">{info.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Artisan Info */}
                        {user.artisan && (
                            <Card className="border-0 shadow-md bg-white">
                                <CardHeader className="border-b border-gray-100 pb-4">
                                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                        <Wrench className="h-4 w-4 text-indigo-600" />
                                        Profil Artisan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <p className="text-xs text-gray-400">Métier</p>
                                            <p className="text-sm font-medium text-gray-900">{user.artisan.metier}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Badge</p>
                                            <Badge className={`text-xs mt-1 ${badgeColors[user.artisan.badge]}`}>
                                                {user.artisan.badge}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Note moyenne</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                                <span className="text-sm font-bold text-gray-900">{Number(user.artisan.note_moyenne).toFixed(1)}/5</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Zone d'intervention</p>
                                            <p className="text-sm font-medium text-gray-900">{user.artisan.zone_intervention ?? 'N/A'}</p>
                                        </div>
                                        {user.artisan.categories.length > 0 && (
                                            <div className="md:col-span-2">
                                                <p className="text-xs text-gray-400 mb-2">Catégories</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {user.artisan.categories.map((c) => (
                                                        <Badge key={c.id} className="bg-indigo-100 text-indigo-800 text-xs">{c.nom}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <Link href={route('admin.artisans.show', user.artisan.id)}>
                                            <Button variant="outline" size="sm" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                                Voir le profil artisan complet
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
