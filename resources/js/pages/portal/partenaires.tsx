import { Head } from '@inertiajs/react';
import { Building2, Globe, Mail, Phone, ExternalLink } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Partenaire {
    id: number;
    nom_fournisseur: string;
    description: string | null;
    contact_email: string;
    contact_telephone: string;
    logo_url: string | null;
    site_web: string | null;
    type: string | null;
}

interface Props {
    partenaires: Partenaire[];
}

const typeColors: Record<string, string> = {
    fournisseur: 'bg-blue-100 text-blue-800',
    assureur:    'bg-purple-100 text-purple-800',
    partenaire:  'bg-amber-100 text-amber-800',
};

export default function PartenairesPage({ partenaires }: Props) {
    return (
        <AppLayout>
            <Head title="Partenaires - ArtisanPro" />
            <div className="min-h-screen bg-[hsl(36,33%,97%)]">

                {/* Hero */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white py-16 px-6">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 mx-auto mb-4">
                            <Building2 className="h-8 w-8" />
                        </div>
                        <h1 className="text-4xl font-bold mb-3">Nos Partenaires</h1>
                        <p className="text-amber-100 text-lg max-w-2xl mx-auto">
                            ArtisanPro s'appuie sur un réseau de partenaires de confiance pour vous offrir les meilleurs services.
                        </p>
                    </div>
                </div>

                <div className="mx-auto max-w-6xl px-6 py-12">
                    {partenaires.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,88%)] bg-white p-16 text-center">
                            <Building2 className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun partenaire pour le moment</h3>
                            <p className="text-gray-400">Revenez bientôt pour découvrir nos partenaires.</p>
                        </div>
                    ) : (
                        <>
                            {/* Group by type */}
                            {(() => {
                                const types = [...new Set(partenaires.map(p => p.type ?? 'Autre'))];
                                return types.map(type => {
                                    const group = partenaires.filter(p => (p.type ?? 'Autre') === type);
                                    return (
                                        <div key={type} className="mb-10">
                                            <h2 className="text-xl font-bold text-[hsl(20,14%,12%)] mb-5 capitalize flex items-center gap-2">
                                                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${typeColors[type.toLowerCase()] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {type}
                                                </span>
                                                <span className="text-gray-400 text-sm font-normal">({group.length})</span>
                                            </h2>
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                {group.map((p) => (
                                                    <Card key={p.id} className="rounded-2xl border border-[hsl(30,20%,88%)] shadow-sm bg-white hover:shadow-md transition-shadow">
                                                        <CardContent className="p-6">
                                                            <div className="flex items-center gap-4 mb-4">
                                                                {p.logo_url ? (
                                                                    <img
                                                                        src={p.logo_url}
                                                                        alt={p.nom_fournisseur}
                                                                        className="h-14 w-14 rounded-xl object-contain border border-gray-100 bg-white p-1"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xl font-bold shrink-0">
                                                                        {p.nom_fournisseur.charAt(0)}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <h3 className="font-bold text-[hsl(20,14%,12%)]">{p.nom_fournisseur}</h3>
                                                                    {p.type && (
                                                                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${typeColors[p.type.toLowerCase()] ?? 'bg-gray-100 text-gray-600'}`}>
                                                                            {p.type}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {p.description && (
                                                                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{p.description}</p>
                                                            )}

                                                            <div className="space-y-2 border-t border-gray-100 pt-4">
                                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                    <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                                                                    <a href={`mailto:${p.contact_email}`} className="hover:text-amber-600 truncate">
                                                                        {p.contact_email}
                                                                    </a>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                    <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                                                                    <a href={`tel:${p.contact_telephone}`} className="hover:text-amber-600">
                                                                        {p.contact_telephone}
                                                                    </a>
                                                                </div>
                                                                {p.site_web && (
                                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                        <Globe className="h-4 w-4 text-amber-500 shrink-0" />
                                                                        <a
                                                                            href={p.site_web}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="hover:text-amber-600 flex items-center gap-1 truncate"
                                                                        >
                                                                            {p.site_web.replace(/^https?:\/\//, '')}
                                                                            <ExternalLink className="h-3 w-3 shrink-0" />
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
