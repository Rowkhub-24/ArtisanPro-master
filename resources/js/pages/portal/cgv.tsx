import { Head, Link } from '@inertiajs/react';

export default function CGV() {
    return (
        <>
            <Head title="CGV - ArtisanPro" />

            <main className="min-h-screen bg-slate-50 px-6 py-12">
                <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
                    <div className="space-y-6 text-slate-700">
                        <div className="space-y-3 text-center">
                            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Conditions Générales de Vente</p>
                            <h1 className="text-4xl font-semibold text-slate-900">Conditions générales</h1>
                            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600">
                                Ces conditions définissent les règles d’utilisation de la plateforme ArtisanPro et les engagements de nos utilisateurs.
                            </p>
                        </div>

                        <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm leading-7">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">1. Objet</h2>
                                <p className="mt-2 text-slate-600">
                                    ArtisanPro facilite la mise en relation entre clients et artisans. Nous ne sommes pas fournisseurs de services, mais une plateforme.
                                </p>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">2. Inscription</h2>
                                <p className="mt-2 text-slate-600">
                                    L’inscription est requise pour accéder aux espaces réservés. Chaque utilisateur s’engage à fournir des informations exactes.
                                </p>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">3. Demande de devis</h2>
                                <p className="mt-2 text-slate-600">
                                    Le client peut envoyer une demande de devis via la fiche d’un artisan. Le devis doit être accepté par l’artisan pour engager un service.
                                </p>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">4. Paiement</h2>
                                <p className="mt-2 text-slate-600">
                                    Les paiements sont gérés entre le client et l’artisan selon les modalités indiquées. ArtisanPro ne facture pas de frais supplémentaires pour l’usage de la plateforme.
                                </p>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">5. Réclamations</h2>
                                <p className="mt-2 text-slate-600">
                                    En cas de litige, contactez notre support via la page de contact. Nous aidons à trouver une solution amiable.
                                </p>
                            </div>
                        </section>

                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                            <p className="text-sm leading-7 text-slate-600">Pour en savoir plus sur la confidentialité, consultez notre politique de confidentialité.</p>
                            <Link href={route('privacy')} className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                                Politique de confidentialité
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
