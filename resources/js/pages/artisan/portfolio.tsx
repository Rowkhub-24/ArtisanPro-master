import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Plus, Image, Trash2, ExternalLink, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/artisan/dashboard' },
    { title: 'Portfolio', href: '/artisan/portfolio' },
];

interface PortfolioItem {
    id: number;
    titre: string;
    description: string | null;
    url_media: string;
    type_media: 'image' | 'video';
    created_at: string;
}

interface Props {
    portfolio?: PortfolioItem[];
}

export default function ArtisanPortfolio({ portfolio = [] }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [titre, setTitre] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (f: File) => {
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !titre.trim()) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('titre', titre);
        formData.append('description', description);
        formData.append('media', file);

        router.post(route('artisan.portfolio.store'), formData, {
            forceFormData: true,
            onSuccess: () => {
                setShowModal(false);
                setTitre('');
                setDescription('');
                setFile(null);
                setPreview(null);
                setUploading(false);
            },
            onError: () => setUploading(false),
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Supprimer cette réalisation ?')) return;
        router.delete(route('artisan.portfolio.destroy', id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mon Portfolio - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('artisan.dashboard')} className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Mon Portfolio</h1>
                            <p className="mt-1 text-[hsl(20,10%,50%)]">{portfolio.length} réalisation{portfolio.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-5 py-2.5 shadow-sm transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Ajouter une réalisation
                    </button>
                </div>

                {flash?.success && (
                    <Alert className="border-emerald-200 bg-emerald-50">
                        <AlertDescription className="text-emerald-800">{flash.success}</AlertDescription>
                    </Alert>
                )}

                {/* Info banner */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-800">
                        <strong>Conseil :</strong> Un portfolio complet avec des photos de vos réalisations augmente vos chances d'être contacté de 3x.
                        Ajoutez au moins 5 photos de vos meilleurs travaux.
                    </p>
                </div>

                {/* Grid */}
                {portfolio.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,82%)] bg-white p-16 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mx-auto mb-6">
                            <Image className="h-10 w-10 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-[hsl(20,14%,12%)] mb-2">Portfolio vide</h3>
                        <p className="text-[hsl(20,10%,50%)] mb-6 max-w-sm mx-auto">
                            Ajoutez des photos de vos réalisations pour montrer votre savoir-faire aux clients
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-5 py-2.5 shadow-sm transition-all"
                        >
                            <Plus className="h-4 w-4" />
                            Ajouter ma première réalisation
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {portfolio.map((item) => (
                            <div key={item.id} className="group rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                                <div className="relative aspect-video bg-[hsl(36,33%,97%)] overflow-hidden">
                                    {item.url_media ? (
                                        <img
                                            src={item.url_media}
                                            alt={item.titre}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full bg-[hsl(36,20%,92%)]">
                                            <Image className="h-12 w-12 text-[hsl(20,10%,50%)]" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                                        {item.url_media && (
                                            <a
                                                href={item.url_media}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[hsl(20,14%,12%)] shadow-lg hover:bg-[hsl(36,33%,97%)] transition-colors"
                                            >
                                                <ExternalLink className="h-5 w-5" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-[hsl(20,14%,12%)] truncate">{item.titre}</h3>
                                    {item.description && (
                                        <p className="text-sm text-[hsl(20,10%,50%)] mt-1 line-clamp-2">{item.description}</p>
                                    )}
                                    <p className="text-xs text-[hsl(20,10%,50%)] mt-2">
                                        {new Date(item.created_at).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal ajout */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                        <div className="relative w-full max-w-lg rounded-2xl bg-white border border-[hsl(30,20%,88%)] p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-[hsl(20,14%,12%)]">Ajouter une réalisation</h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Zone upload */}
                                <div
                                    className="rounded-xl border-2 border-dashed border-[hsl(30,20%,82%)] p-6 text-center cursor-pointer hover:border-amber-400 transition-colors"
                                    onClick={() => fileRef.current?.click()}
                                >
                                    {preview ? (
                                        <img src={preview} alt="preview" className="mx-auto max-h-40 rounded-lg object-cover" />
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                                            <p className="text-sm text-[hsl(20,10%,50%)]">Cliquez pour choisir une image ou vidéo</p>
                                            <p className="text-xs text-[hsl(20,10%,65%)] mt-1">JPG, PNG, WebP, MP4 — max 20 Mo</p>
                                        </>
                                    )}
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[hsl(20,14%,12%)] mb-1">Titre *</label>
                                    <input
                                        type="text"
                                        value={titre}
                                        onChange={(e) => setTitre(e.target.value)}
                                        required
                                        maxLength={150}
                                        placeholder="Ex: Installation électrique appartement"
                                        className="w-full rounded-xl border border-[hsl(30,20%,82%)] px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[hsl(20,14%,12%)] mb-1">Description (optionnel)</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        maxLength={500}
                                        rows={3}
                                        placeholder="Décrivez brièvement cette réalisation..."
                                        className="w-full rounded-xl border border-[hsl(30,20%,82%)] px-3 py-2 text-sm focus:border-amber-400 focus:outline-none resize-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm font-medium text-[hsl(20,14%,12%)] hover:border-amber-400 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading || !file || !titre.trim()}
                                        className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm transition-all disabled:opacity-60"
                                    >
                                        {uploading ? 'Envoi...' : 'Ajouter'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
