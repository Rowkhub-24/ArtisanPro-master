import { Head, Link } from '@inertiajs/react';

export default function Contact() {
    return (
        <>
            <Head title="Contact - ArtisanPro" />

            <main className="min-h-screen bg-slate-50 px-6 py-12">
                <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
                    <div className="space-y-6 text-slate-700">
                        <div className="space-y-3 text-center">
                            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Contact</p>
                            <h1 className="text-4xl font-semibold text-slate-900">Nous sommes là pour vous aider</h1>
                            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600">
                                Pour toute question sur la plateforme, les comptes, les devis ou le service client, contactez-nous.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                                <h2 className="text-xl font-semibold text-slate-900">Informations</h2>
                                <div className="mt-4 space-y-4 text-sm leading-7">
                                    <p>
                                        <strong>Email :</strong> <a href="mailto:contact@artisanpro.local" className="text-blue-600 hover:underline">contact@artisanpro.local</a>
                                    </p>
                                    <p>
                                        <strong>Téléphone :</strong> <a href="tel:+22900000000" className="text-blue-600 hover:underline">+229 00 00 00 00</a>
                                    </p>
                                    <p>
                                        <strong>Adresse :</strong> Porto-Novo, Bénin
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-6">
                                <h2 className="text-xl font-semibold text-slate-900">Envoyer une demande</h2>
                                <p className="mt-4 text-sm leading-7 text-slate-600">Racontez-nous votre besoin ou votre problème et nous reviendrons vers vous rapidement.</p>
                                <div className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
                                    <p>• Support technique et assistance.</p>
                                    <p>• Questions sur les comptes artisan / client.</p>
                                    <p>• Suggestions d’amélioration.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm leading-7 text-slate-600">
                            <p>En attendant, vous pouvez consulter notre page FAQ ou revenir à la page d’accueil.</p>
                            <div className="flex flex-wrap gap-3">
                                <Link href={route('faq')} className="rounded-full bg-white px-4 py-2 text-blue-600 ring-1 ring-blue-200 hover:bg-blue-50">
                                    FAQ
                                </Link>
                                <Link href={route('home')} className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                                    Retour à l’accueil
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
