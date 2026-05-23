import { Head, Link } from '@inertiajs/react';

export default function APropos() {
    return (
        <>
            <Head title="À propos - ArtisanPro" />

            <main className="min-h-screen bg-slate-50 px-6 py-12">
                <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
                    <div className="space-y-6">
                        <div className="space-y-3 text-center">
                            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">À propos</p>
                            <h1 className="text-4xl font-semibold text-slate-900">ArtisanPro, votre passerelle vers des artisans fiables</h1>
                            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600">
                                ArtisanPro met en relation les clients et les artisans de Porto-Novo avec une expérience simple,
                                transparente et locale. Notre mission : faciliter la recherche de professionnels qualifiés et aider
                                les artisans à développer leur activité.
                            </p>
                        </div>

                        <section className="grid gap-8 lg:grid-cols-2">
                            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                                <h2 className="text-xl font-semibold text-slate-900">Notre mission</h2>
                                <p className="text-sm leading-7 text-slate-600">
                                    Permettre aux clients de trouver rapidement un artisan qualifié pour tous leurs travaux,
                                    du dépannage à la rénovation. Nous voulons aussi offrir aux artisans un espace clair pour
                                    présenter leurs services et recevoir des demandes de devis.
                                </p>
                            </div>
                            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                                <h2 className="text-xl font-semibold text-slate-900">Nos valeurs</h2>
                                <ul className="space-y-3 text-sm leading-7 text-slate-600">
                                    <li>• Confiance et transparence entre clients et artisans.</li>
                                    <li>• Simplicité d’utilisation et accès rapide aux informations.</li>
                                    <li>• Soutien aux artisans locaux et qualité de service.</li>
                                </ul>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6">
                            <h2 className="text-xl font-semibold text-slate-900">Ce que vous trouvez sur ArtisanPro</h2>
                            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                                <p>• Un annuaire d’artisans vérifiés et triés par spécialité.</p>
                                <p>• Des fiches détaillées avec avis, tarifs et zone d’intervention.</p>
                                <p>• La possibilité d’envoyer une demande de devis personnalisée.</p>
                                <p>• Un espace dédié pour les clients, artisans et administrateurs.</p>
                            </div>
                        </section>

                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Commencez dès maintenant</h3>
                                <p className="text-sm leading-6 text-slate-600">Consultez l’annuaire ou créez un compte pour accéder à votre espace.</p>
                            </div>
                            <Link
                                href={route('artisans.index')}
                                className="inline-flex items-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 transition hover:bg-blue-700"
                            >
                                Voir l’annuaire
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
