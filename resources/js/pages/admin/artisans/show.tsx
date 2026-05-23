import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Star, MapPin, Award, Image, CheckCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';

interface ArtisanDetail {
    id: number;
    metier: string;
    description: string | null;
    bio: string | null;
    zone_intervention: string | null;
    tarifs_horaire: number | null;
    note_moyenne: number;
    badge: string;
    user: { id: number; nom: string; prenom: string; email: string; telephone: string | null; statut: string } | null;
    categories: { id: number; nom: string }[];
    certifications: { id: number; nom_certification: string; organisme_delivrance: string }[];
    portfolio_images: { id: number; titre: string; url_media: string }[];
    avis: { id: number; note: number; commentaire: string | null; date_avis: string; client: { user: { prenom: string; nom: string } | null } | null }[];
    reservations: { id: number; statut: string; created_at: string }[];
}

interface Props { artisan: ArtisanDetail }

const badgeConfig: Record<string, { label: string; color: string }> = {
    elite:    { label: '⭐ Élite',    color: 'bg-purple-100 text-purple-800' },
    certifie: { label: '✓ Certifié', color: 'bg-blue-100 text-blue-800' },
    aucun:    { label: 'Standard',   color: 'bg-gray-100 text-gray-700' },
};

export default function AdminArtisanShow({ artisan }: Props) {
    const updateBadge = (badge: string) => {
        router.patch(route('admin.artisans.badge', artisan.id), { badge }, { preserveScroll: true });
    };

    const bc = badgeConfig[artisan.badge] ?? badgeConfig.aucun;

    return (
        <AdminLayout title="Profil artisan">
            <Head title={`${artisan.metier} - Admin`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('admin.artisans.index')}>
                        <Button variant="outline" size="icon" className="border-gray-200"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{artisan.metier}</h1>
                        <p className="text-sm text-gray-500">{artisan.user?.prenom} {artisan.user?.nom} · ID #{artisan.id}</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left */}
                    <div className="space-y-4">
                        <Card className="border-0 shadow-md bg-white">
                            <CardContent className="p-6 text-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-2xl font-bold mx-auto mb-4">
                                    {artisan.user?.prenom?.charAt(0)}{artisan.user?.nom?.charAt(0)}
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">{artisan.metier}</h2>
                                <p className="text-sm text-gray-500">{artisan.user?.prenom} {artisan.user?.nom}</p>
                                <div className="flex items-center justify-center gap-2 mt-3">
                                    <Badge className={`text-xs ${bc.color}`}>{bc.label}</Badge>
                                </div>
                                <div className="flex items-center justify-center gap-1 mt-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-4 w-4 ${i < Math.floor(Number(artisan.note_moyenne)) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                                    ))}
                                    <span className="text-sm font-bold text-gray-900 ml-1">{Number(artisan.note_moyenne).toFixed(1)}</span>
                                </div>

                                {/* Badge Update */}
                                <div className="mt-5 space-y-2">
                                    <p className="text-xs text-gray-500 font-medium">Modifier le badge</p>
                                    <div className="flex gap-2 justify-center">
                                        {(['aucun', 'certifie', 'elite'] as const).map((b) => (
                                            <Button key={b} size="sm" variant={artisan.badge === b ? 'default' : 'outline'}
                                                className={artisan.badge === b ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-200 text-gray-600'}
                                                onClick={() => updateBadge(b)}>
                                                {b === 'aucun' ? 'Std' : b === 'certifie' ? 'Cert.' : 'Élite'}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats */}
                        <Card className="border-0 shadow-md bg-white">
                            <CardContent className="p-5 space-y-3">
                                {[
                                    { label: 'Avis reçus',     value: artisan.avis.length },
                                    { label: 'Réservations',   value: artisan.reservations.length },
                                    { label: 'Certifications', value: artisan.certifications.length },
                                    { label: 'Portfolio',      value: artisan.portfolio_images.length },
                                ].map((s) => (
                                    <div key={s.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <span className="text-sm text-gray-500">{s.label}</span>
                                        <span className="text-sm font-bold text-gray-900">{s.value}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Info */}
                        <Card className="border-0 shadow-md bg-white">
                            <CardHeader className="border-b border-gray-100 pb-4">
                                <CardTitle className="text-base font-semibold text-gray-900">Informations</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                                <div><p className="text-xs text-gray-400">Email</p><p className="text-sm font-medium text-gray-900">{artisan.user?.email}</p></div>
                                <div><p className="text-xs text-gray-400">Téléphone</p><p className="text-sm font-medium text-gray-900">{artisan.user?.telephone ?? 'N/A'}</p></div>
                                <div><p className="text-xs text-gray-400">Zone</p><p className="text-sm font-medium text-gray-900">{artisan.zone_intervention ?? 'N/A'}</p></div>
                                <div><p className="text-xs text-gray-400">Tarif horaire</p><p className="text-sm font-medium text-gray-900">{artisan.tarifs_horaire ? `${Number(artisan.tarifs_horaire).toLocaleString('fr-FR')} FCFA` : 'N/A'}</p></div>
                                {artisan.categories.length > 0 && (
                                    <div className="md:col-span-2">
                                        <p className="text-xs text-gray-400 mb-2">Catégories</p>
                                        <div className="flex flex-wrap gap-2">
                                            {artisan.categories.map((c) => <Badge key={c.id} className="bg-indigo-100 text-indigo-800 text-xs">{c.nom}</Badge>)}
                                        </div>
                                    </div>
                                )}
                                {artisan.description && (
                                    <div className="md:col-span-2"><p className="text-xs text-gray-400">Description</p><p className="text-sm text-gray-700 mt-1">{artisan.description}</p></div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Certifications */}
                        {artisan.certifications.length > 0 && (
                            <Card className="border-0 shadow-md bg-white">
                                <CardHeader className="border-b border-gray-100 pb-4">
                                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        Certifications
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-2">
                                    {artisan.certifications.map((c) => (
                                        <div key={c.id} className="flex items-center gap-3 rounded-lg bg-green-50 px-4 py-3">
                                            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{c.nom_certification}</p>
                                                <p className="text-xs text-gray-500">{c.organisme_delivrance}</p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Avis */}
                        {artisan.avis.length > 0 && (
                            <Card className="border-0 shadow-md bg-white">
                                <CardHeader className="border-b border-gray-100 pb-4">
                                    <CardTitle className="text-base font-semibold text-gray-900">Derniers avis</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 divide-y divide-gray-50">
                                    {artisan.avis.slice(0, 5).map((a) => (
                                        <div key={a.id} className="px-6 py-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {a.client?.user ? `${a.client.user.prenom} ${a.client.user.nom}` : 'Client'}
                                                </p>
                                                <div className="flex items-center gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`h-3.5 w-3.5 ${i < a.note ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            {a.commentaire && <p className="text-xs text-gray-500">{a.commentaire}</p>}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
