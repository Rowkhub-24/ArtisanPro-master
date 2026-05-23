import { Head, Link } from '@inertiajs/react';

export default function FAQ() {
    return (
        <>
            <Head title="FAQ - ArtisanPro" />

            <main className="min-h-screen bg-slate-50 px-6 py-12">
                <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
                    <div className="space-y-6 text-slate-700">
                        <div className="space-y-3 text-center">
                            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">FAQ</p>
                            <h1 className="text-4xl font-semibold text-slate-900">Questions fréquentes</h1>
                            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600">
                                Retrouvez les réponses aux questions les plus courantes sur l’utilisation d’ArtisanPro.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                                <h2 className="text-xl font-semibold text-slate-900">Comment trouver un artisan ?</h2>
                                <p className="mt-3 text-sm leading-7 text-slate-600">
                                    Utilisez l’annuaire, filtrez par catégorie ou recherchez par mot-clé pour voir les fiches des artisans disponibles.
                                </p>
                            </article>

                            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                                <h2 className="text-xl font-semibold text-slate-900">Comment demander un devis ?</h2>
                                <p className="mt-3 text-sm leading-7 text-slate-600">
                                    Depuis la fiche d’un artisan, cliquez sur le bouton « Demander un devis » et décrivez votre besoin.
                                </p>
                            </article>

                            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                                <h2 className="text-xl font-semibold text-slate-900">Puis-je réserver directement un artisan ?</h2>
                                <p className="mt-3 text-sm leading-7 text-slate-600">
                                    Oui, une fois le devis accepté, vous pouvez gérer vos réservations depuis votre espace client.
                                </p>
                            </article>

                            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                                <h2 className="text-xl font-semibold text-slate-900">Comment modifier mon profil ?</h2>
                                <p className="mt-3 text-sm leading-7 text-slate-600">
                                    Allez dans votre espace personnel, puis dans la section « Profil » pour mettre à jour vos informations.
                                </p>
                            </article>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                            <p className="text-sm leading-7 text-slate-600">Vous ne trouvez pas la réponse ? Contactez-nous via la page de contact.</p>
                            <Link href={route('contact')} className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                                Contactez-nous
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
