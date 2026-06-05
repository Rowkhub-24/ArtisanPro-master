import { Head, router } from '@inertiajs/react';
import { BookOpen, CheckCircle, ExternalLink, GraduationCap, Trophy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type Formation } from '@/types/academie';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/artisan/dashboard' },
    { title: 'Académie', href: '/artisan/academy' },
];

interface Props {
    formations: Formation[];
    completees: number;
    total: number;
}

export default function ArtisanAcademy({ formations, completees, total }: Props) {
    const pct = total > 0 ? Math.round((completees / total) * 100) : 0;

    const marquerComplete = (id: number) => {
        router.post(route('artisan.academy.completer', id), {}, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Académie - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Académie ArtisanPro</h1>
                            <p className="mt-1 text-[hsl(20,10%,50%)]">Formations pour développer vos compétences</p>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                {total > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                <span className="font-semibold text-[hsl(20,14%,12%)]">Progression globale</span>
                            </div>
                            <span className="text-2xl font-bold text-amber-600">{completees}/{total}</span>
                        </div>
                        <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <p className="text-sm text-[hsl(20,10%,50%)] mt-2">{pct}% des formations complétées</p>
                    </div>
                )}

                {/* Formations */}
                {formations.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,88%)] bg-white p-12 text-center">
                        <BookOpen className="h-14 w-14 text-[hsl(20,10%,50%)] mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-[hsl(20,14%,12%)] mb-2">Aucune formation disponible</h3>
                        <p className="text-[hsl(20,10%,50%)]">De nouvelles formations seront bientôt disponibles.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {formations.map((f) => {
                            const complete = f.pivot?.date_achevement != null;
                            return (
                            <Card
                                key={f.id}
                                className={`rounded-2xl border shadow-sm bg-white hover:shadow-md transition-shadow ${
                                    complete
                                        ? 'border-emerald-200 bg-emerald-50/30'
                                        : 'border-[hsl(30,20%,88%)]'
                                }`}
                            >
                                <CardContent className="p-5 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                                            complete
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-amber-100 text-amber-600'
                                        }`}>
                                            {complete
                                                ? <CheckCircle className="h-5 w-5" />
                                                : <BookOpen className="h-5 w-5" />
                                            }
                                        </div>
                                        {complete && (
                                            <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs">
                                                ✓ Complétée
                                            </Badge>
                                        )}
                                    </div>

                                    <h3 className="font-semibold text-[hsl(20,14%,12%)] mb-2">{f.titre}</h3>

                                    {f.description && (
                                        <p className="text-sm text-[hsl(20,10%,50%)] mb-4 flex-1 line-clamp-3">
                                            {f.description}
                                        </p>
                                    )}

                                    {complete && f.pivot?.date_achevement && (
                                        <p className="text-xs text-emerald-600 mb-3">
                                            Complétée le {new Date(f.pivot.date_achevement).toLocaleDateString('fr-FR')}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-2 mt-auto pt-3">
                                        {f.url_contenu && (
                                            <a
                                                href={f.url_contenu}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-amber-400 hover:text-amber-600 transition-colors"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                Accéder
                                            </a>
                                        )}
                                        {!complete && (
                                            <Button
                                                size="sm"
                                                onClick={() => marquerComplete(f.id)}
                                                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                                            >
                                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                                Marquer complétée
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
