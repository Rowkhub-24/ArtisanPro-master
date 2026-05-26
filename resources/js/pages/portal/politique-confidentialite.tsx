import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import PublicNavbar from '@/components/public-navbar';

export default function PolitiqueConfidentialite() {
    return (
        <>
            <Head title="Politique de confidentialité - ArtisanPro" />
            <PublicNavbar />

            <div className="min-h-screen bg-[hsl(36,33%,97%)] pt-16">
                <main className="px-6 py-12">
                    <div className="mx-auto max-w-5xl space-y-8">
                        <div className="space-y-3 text-center">
                            <p className="text-sm uppercase tracking-[0.3em] text-amber-600">Politique de confidentialité</p>
                            <h1 className="text-4xl font-semibold text-[hsl(20,14%,12%)]">Protection de vos données</h1>
                            <p className="mx-auto max-w-2xl text-sm leading-7 text-[hsl(20,10%,50%)]">
                                ArtisanPro respecte la vie privée de ses utilisateurs. Voici comment nous collectons et traitons vos données.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm space-y-6 text-sm leading-7">
                            {[
                                { title: 'Données collectées', text: "Nous collectons uniquement les informations nécessaires pour créer un compte, gérer les demandes de devis et faciliter la communication entre clients et artisans." },
                                { title: 'Utilisation des données', text: "Vos données servent à améliorer l'expérience sur la plateforme : notification de devis, contact par e-mail, gestion de profil et sécurité du compte." },
                                { title: 'Partage des données', text: "Nous ne vendons pas vos informations à des tiers. Les données restent confidentielles et ne sont partagées qu'avec les services nécessaires au fonctionnement du site." },
                                { title: 'Sécurité', text: "Nous utilisons des mesures standards pour protéger vos informations contre l'accès non autorisé." },
                            ].map((item) => (
                                <div key={item.title}>
                                    <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">{item.title}</h2>
                                    <p className="mt-2 text-[hsl(20,10%,50%)]">{item.text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                            <p className="text-sm text-[hsl(20,10%,50%)]">Si vous avez des questions sur vos données, contactez-nous.</p>
                            <Link href={route('contact')} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-5 py-2.5 shadow-sm transition-all">
                                Voir la page contact <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </main>

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
