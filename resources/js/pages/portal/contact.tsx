import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import PublicNavbar from '@/components/public-navbar';

export default function Contact() {
    return (
        <>
            <Head title="Contact - ArtisanPro" />
            <PublicNavbar />

            {/* Page content */}
            <div className="min-h-screen bg-[hsl(36,33%,97%)] pt-16">
                <main className="px-6 py-12">
                    <div className="mx-auto max-w-4xl space-y-8">

                        {/* Hero */}
                        <div className="space-y-3 text-center">
                            <p className="text-sm uppercase tracking-[0.3em] text-amber-600">Contact</p>
                            <h1 className="text-4xl font-semibold text-[hsl(20,14%,12%)]">Nous sommes là pour vous aider</h1>
                            <p className="mx-auto max-w-2xl text-sm leading-7 text-[hsl(20,10%,50%)]">
                                Pour toute question sur la plateforme, les comptes, les devis ou le service client, contactez-nous.
                            </p>
                        </div>

                        {/* Info cards */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Informations</h2>
                                <div className="mt-4 space-y-4 text-sm leading-7 text-[hsl(20,10%,50%)]">
                                    <p>
                                        <strong className="text-[hsl(20,14%,12%)]">Email :</strong>{' '}
                                        <a href="mailto:contact@artisanpro.local" className="text-amber-600 hover:text-amber-500 transition-colors">
                                            contact@artisanpro.local
                                        </a>
                                    </p>
                                    <p>
                                        <strong className="text-[hsl(20,14%,12%)]">Téléphone :</strong>{' '}
                                        <a href="tel:+22900000000" className="text-amber-600 hover:text-amber-500 transition-colors">
                                            +229 00 00 00 00
                                        </a>
                                    </p>
                                    <p>
                                        <strong className="text-[hsl(20,14%,12%)]">Adresse :</strong> Porto-Novo, Bénin
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Envoyer une demande</h2>
                                <p className="mt-4 text-sm leading-7 text-[hsl(20,10%,50%)]">
                                    Racontez-nous votre besoin ou votre problème et nous reviendrons vers vous rapidement.
                                </p>
                                <div className="mt-4 space-y-2 text-sm leading-7 text-[hsl(20,10%,50%)]">
                                    <p>• Support technique et assistance.</p>
                                    <p>• Questions sur les comptes artisan / client.</p>
                                    <p>• Suggestions d&apos;amélioration.</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                            <p className="text-sm leading-7 text-[hsl(20,10%,50%)] mb-4">
                                En attendant, vous pouvez consulter notre page FAQ ou revenir à la page d&apos;accueil.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href={route('faq')}
                                    className="rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm font-medium text-amber-600 hover:bg-[hsl(36,33%,97%)] transition-colors"
                                >
                                    FAQ
                                </Link>
                                <Link
                                    href={route('home')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-5 py-2 shadow-sm transition-all"
                                >
                                    Retour à l&apos;accueil <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
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
