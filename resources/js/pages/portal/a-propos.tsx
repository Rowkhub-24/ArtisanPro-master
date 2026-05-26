import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import PublicNavbar from '@/components/public-navbar';

export default function APropos() {
    return (
        <>
            <Head title="À propos - ArtisanPro" />
            <PublicNavbar />

            {/* Page content */}
            <div className="min-h-screen bg-[hsl(36,33%,97%)] pt-16">
                <main className="px-6 py-12">
                    <div className="mx-auto max-w-5xl space-y-8">

                        {/* Hero */}
                        <div className="space-y-3 text-center">
                            <p className="text-sm uppercase tracking-[0.3em] text-amber-600">À propos</p>
                            <h1 className="text-4xl font-semibold text-[hsl(20,14%,12%)]">ArtisanPro, votre passerelle vers des artisans fiables</h1>
                            <p className="mx-auto max-w-2xl text-sm leading-7 text-[hsl(20,10%,50%)]">
                                ArtisanPro met en relation les clients et les artisans de Porto-Novo avec une expérience simple,
                                transparente et locale. Notre mission : faciliter la recherche de professionnels qualifiés et aider
                                les artisans à développer leur activité.
                            </p>
                        </div>

                        {/* Mission & Values */}
                        <section className="grid gap-6 lg:grid-cols-2">
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm space-y-4">
                                <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Notre mission</h2>
                                <p className="text-sm leading-7 text-[hsl(20,10%,50%)]">
                                    Permettre aux clients de trouver rapidement un artisan qualifié pour tous leurs travaux,
                                    du dépannage à la rénovation. Nous voulons aussi offrir aux artisans un espace clair pour
                                    présenter leurs services et recevoir des demandes de devis.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm space-y-4">
                                <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Nos valeurs</h2>
                                <ul className="space-y-3 text-sm leading-7 text-[hsl(20,10%,50%)]">
                                    <li>• Confiance et transparence entre clients et artisans.</li>
                                    <li>• Simplicité d&apos;utilisation et accès rapide aux informations.</li>
                                    <li>• Soutien aux artisans locaux et qualité de service.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Features */}
                        <section className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Ce que vous trouvez sur ArtisanPro</h2>
                            <div className="mt-4 space-y-3 text-sm leading-7 text-[hsl(20,10%,50%)]">
                                <p>• Un annuaire d&apos;artisans vérifiés et triés par spécialité.</p>
                                <p>• Des fiches détaillées avec avis, tarifs et zone d&apos;intervention.</p>
                                <p>• La possibilité d&apos;envoyer une demande de devis personnalisée.</p>
                                <p>• Un espace dédié pour les clients, artisans et administrateurs.</p>
                            </div>
                        </section>

                        {/* CTA */}
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                            <div>
                                <h3 className="text-lg font-semibold text-[hsl(20,14%,12%)]">Commencez dès maintenant</h3>
                                <p className="text-sm leading-6 text-[hsl(20,10%,50%)]">Consultez l&apos;annuaire ou créez un compte pour accéder à votre espace.</p>
                            </div>
                            <Link
                                href={route('artisans.index')}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-5 py-3 shadow-sm transition-all"
                            >
                                Voir l&apos;annuaire <ArrowRight className="h-4 w-4" />
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
