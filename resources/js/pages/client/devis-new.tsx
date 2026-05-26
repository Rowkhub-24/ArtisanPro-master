import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

export default function ClientNewDevis() {
    return (
        <AppLayout>
            <Head title="Nouveau devis - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('client.devis')}
                        className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour à mes devis
                    </Link>
                </div>
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-8">
                    <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">Créer un nouveau devis</h1>
                    <p className="mt-4 text-[hsl(20,10%,50%)]">Formulaire pour créer un devis destiné à un artisan.</p>
                </div>
            </div>
        </AppLayout>
    );
}
