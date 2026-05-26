import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import PublicNavbar from '@/components/public-navbar';

export default function CGV() {
    return (
        <>
            <Head title="CGV - ArtisanPro" />
            <PublicNavbar />

            <div className="min-h-screen bg-[hsl(36,33%,97%)] pt-16">
                <main className="px-6 py-12">
                    <div className="mx-auto max-w-5xl space-y-8">
                        <div className="space-y-3 text-center">
                            <p className="text-sm uppercase tracking-[0.3em] text-amber-600">Conditions Générales de Vente</p>
                            <h1 className="text-4xl font-semibold text-[hsl(20,14%,12%)]">Conditions générales</h1>
                            <p className="mx-auto max-w-2xl text-sm leading-7 text-[hsl(20,10%,50%)]">
                                Ces conditions définissent les règles d&apos;utilisation de la plateforme ArtisanPro et les engagements de nos utilisateurs.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm space-y-6 text-sm leading-7">
                            {[
                                { title: '1. Objet', text: "ArtisanPro facilite la mise en relation entre clients et artisans. Nous ne sommes pas fournisseurs de services, mais une plateforme." },
                                { title: '2. Inscription', text: "L'inscription est requise pour accéder aux espaces réservés. Chaque utilisateur s'engage à fournir des informations exactes." },
                                { title: '3. Demande de devis', text: "Le client peut envoyer une demande de devis via la fiche d'un artisan. Le devis doit être accepté par l'artisan pour engager un service." },
                                { title: '4. Paiement', text: "Les paiements sont gérés entre le client et l'artisan selon les modalités indiquées. ArtisanPro ne facture pas de frais supplémentaires pour l'usage de la plateforme." },
                                { title: '5. Réclamations', text: "En cas de litige, contactez notre support via la page de contact. Nous aidons à trouver une solution amiable." },
                            ].map((item) => (
                                <div key={item.title}>
                                    <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">{item.title}</h2>
                                    <p className="mt-2 text-[hsl(20,10%,50%)]">{item.text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                            <p className="text-sm text-[hsl(20,10%,50%)]">Pour en savoir plus sur la confidentialité, consultez notre politique de confidentialité.</p>
                            <Link href={route('privacy')} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-5 py-2.5 shadow-sm transition-all">
                                Politique de confidentialité <ArrowRight className="h-4 w-4" />
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
