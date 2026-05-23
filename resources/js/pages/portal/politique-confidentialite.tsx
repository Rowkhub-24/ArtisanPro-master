import { Head, Link } from '@inertiajs/react';

export default function PolitiqueConfidentialite() {
    return (
        <>
            <Head title="Politique de confidentialité - ArtisanPro" />

            <main className="min-h-screen bg-slate-50 px-6 py-12">
                <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
                    <div className="space-y-6 text-slate-700">
                        <div className="space-y-3 text-center">
                            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Politique de confidentialité</p>
                            <h1 className="text-4xl font-semibold text-slate-900">Protection de vos données</h1>
                            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600">
                                ArtisanPro respecte la vie privée de ses utilisateurs. Voici comment nous collectons et traitons vos données.
                            </p>
                        </div>

                        <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm leading-7">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Données collectées</h2>
                                <p className="mt-2 text-slate-600">
                                    Nous collectons uniquement les informations nécessaires pour créer un compte, gérer les demandes de devis
                                    et faciliter la communication entre clients et artisans.
                                </p>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Utilisation des données</h2>
                                <p className="mt-2 text-slate-600">
                                    Vos données servent à améliorer l’expérience sur la plateforme : notification de devis, contact par e-mail,
                                    gestion de profil et sécurité du compte.
                                </p>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Partage des données</h2>
                                <p className="mt-2 text-slate-600">
                                    Nous ne vendons pas vos informations à des tiers. Les données restent confidentielles et ne sont partagées qu’avec
                                    les services nécessaires au fonctionnement du site.
                                </p>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Sécurité</h2>
                                <p className="mt-2 text-slate-600">
                                    Nous utilisons des mesures standards pour protéger vos informations contre l’accès non autorisé.
                                </p>
                            </div>
                        </section>

                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                            <p className="text-sm leading-7 text-slate-600">Si vous avez des questions sur vos données, contactez-nous.</p>
                            <Link href={route('contact')} className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                                Voir la page contact
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
