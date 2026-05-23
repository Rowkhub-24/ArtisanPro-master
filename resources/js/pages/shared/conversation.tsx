import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function ConversationPage() {
    return (
        <AppLayout>
            <Head title="Conversation - ArtisanPro" />
            <div className="mx-auto max-w-4xl px-6 py-10">
                <h1 className="text-2xl font-bold">Conversation</h1>
                <p className="mt-4 text-gray-600">Interface de messagerie entre client et artisan.</p>
            </div>
        </AppLayout>
    );
}
