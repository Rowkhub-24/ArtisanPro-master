import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import PublicNavbar from '@/components/public-navbar';

export default function FAQ() {
    return (
        <>
            <Head title="FAQ - ArtisanPro" />
            <PublicNavbar />

            {/* Page content */}
            <div className="min-h-screen bg-[hsl(36,33%,97%)] pt-16">
                <main className="px-6 py-12">
                    <div className="mx-auto max-w-5xl space-y-8">

                        {/* Hero */}
                        <div className="space-y-3 text-center">
                            <p className="text-sm uppercase tracking-[0.3em] text-amber-600">FAQ</p>
                            <h1 className="text-4xl font-semibold text-[hsl(20,14%,12%)]">Questions fréquentes</h1>
                            <p className="mx-auto max-w-2xl text-sm leading-7 text-[hsl(20,10%,50%)]">
                                Retrouvez les réponses aux questions les plus courantes sur l&apos;utilisation d&apos;ArtisanPro.
                            </p>
                        </div>

                        {/* FAQ articles */}
                        <div className="space-y-4">
                            <article className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Comment trouver un artisan ?</h2>
                                <p className="mt-3 text-sm leading-7 text-[hsl(20,10%,50%)]">
                                    Utilisez l&apos;annuaire, filtrez par catégorie ou recherchez par mot-clé pour voir les fiches des artisans disponibles.
                                </p>
                            </article>

                            <article className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Comment demander un devis ?</h2>
                                <p className="mt-3 text-sm leading-7 text-[hsl(20,10%,50%)]">
                                    Depuis la fiche d&apos;un artisan, cliquez sur le bouton « Demander un devis » et décrivez votre besoin.
                                </p>
                            </article>

                            <article className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Puis-je réserver directement un artisan ?</h2>
                                <p className="mt-3 text-sm leading-7 text-[hsl(20,10%,50%)]">
                                    Oui, une fois le devis accepté, vous pouvez gérer vos réservations depuis votre espace client.
                                </p>
                            </article>

                            <article className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Comment modifier mon profil ?</h2>
                                <p className="mt-3 text-sm leading-7 text-[hsl(20,10%,50%)]">
                                    Allez dans votre espace personnel, puis dans la section « Profil » pour mettre à jour vos informations.
                                </p>
                            </article>
                        </div>

                        {/* CTA */}
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                            <p className="text-sm leading-7 text-[hsl(20,10%,50%)]">
                                Vous ne trouvez pas la réponse ? Contactez-nous via la page de contact.
                            </p>
                            <Link
                                href={route('contact')}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-5 py-3 shadow-sm transition-all"
                            >
                                Contactez-nous <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-[hsl(20,14%,8%)] text-[hsl(36,10%,55%)]">
                    <div className="mx-auto max-w-7xl px-6 py-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                            <p>© 2025 ArtisanPro. Tous droits réservés.</p>
                            <p className="text-[hsl(36,10%,35%)]">Porto-Novo, Bénin</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
