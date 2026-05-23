import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Mail, Phone, Lock, Wrench, ArrowRight, User, Camera, X } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface RegisterForm {
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    type_utilisateur: 'client' | 'artisan';
    metier: string;
    password: string;
    password_confirmation: string;
    avatar: File | null;
}

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        prenom: '', nom: '', email: '', telephone: '',
        type_utilisateur: 'client', metier: '',
        password: '', password_confirmation: '',
        avatar: null,
    });

    const [preview, setPreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('avatar', file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const removeAvatar = () => {
        setData('avatar', null);
        setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            forceFormData: true,
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const inputCls = "border-[hsl(30,20%,82%)] bg-white focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-11";
    const labelCls = "text-sm font-semibold text-[hsl(20,14%,20%)]";

    return (
        <AuthLayout title="Créer votre compte" description="Rejoignez la plateforme artisans de Porto-Novo">
            <Head title="Inscription — ArtisanPro" />

            <form className="space-y-4" onSubmit={submit}>

                {/* ── Photo de profil ── */}
                <div className="space-y-2">
                    <Label className={labelCls}>Photo de profil <span className="font-normal text-[hsl(20,10%,55%)]">(optionnel)</span></Label>
                    <div className="flex items-center gap-4">
                        {/* Preview / placeholder */}
                        <div className="relative shrink-0">
                            {preview ? (
                                <>
                                    <img src={preview} alt="Aperçu" className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-300" />
                                    <button type="button" onClick={removeAvatar}
                                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors">
                                        <X className="h-3 w-3" />
                                    </button>
                                </>
                            ) : (
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-dashed border-amber-300 flex items-center justify-center text-amber-500">
                                    <User className="h-7 w-7" />
                                </div>
                            )}
                        </div>

                        {/* Upload button */}
                        <div className="flex-1">
                            <input
                                ref={fileRef}
                                id="avatar"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleAvatar}
                                className="hidden"
                            />
                            <label htmlFor="avatar"
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2.5 text-sm font-medium text-[hsl(20,14%,30%)] hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 transition-all">
                                <Camera className="h-4 w-4" />
                                {preview ? 'Changer la photo' : 'Choisir une photo'}
                            </label>
                            <p className="mt-1.5 text-xs text-[hsl(20,10%,55%)]">JPG, PNG, WebP · Max 2 Mo</p>
                        </div>
                    </div>
                    <InputError message={errors.avatar} />
                </div>

                {/* ── Type de compte ── */}
                <div className="space-y-2">
                    <Label className={labelCls}>Type de compte</Label>
                    <div className="grid grid-cols-2 gap-3">
                        {(['client', 'artisan'] as const).map((type) => (
                            <button key={type} type="button" onClick={() => setData('type_utilisateur', type)}
                                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3.5 text-sm font-semibold transition-all ${
                                    data.type_utilisateur === type
                                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                                        : 'border-[hsl(30,20%,82%)] bg-white text-[hsl(20,14%,35%)] hover:border-amber-300'
                                }`}>
                                {type === 'client' ? <User className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                                {type === 'client' ? 'Client' : 'Artisan'}
                            </button>
                        ))}
                    </div>
                    <InputError message={errors.type_utilisateur} />
                </div>

                {/* ── Nom / Prénom ── */}
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="prenom" className={labelCls}>Prénom</Label>
                        <Input id="prenom" value={data.prenom} onChange={(e) => setData('prenom', e.target.value)}
                            required autoFocus autoComplete="given-name" disabled={processing}
                            placeholder="Jean" className={inputCls} />
                        <InputError message={errors.prenom} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="nom" className={labelCls}>Nom</Label>
                        <Input id="nom" value={data.nom} onChange={(e) => setData('nom', e.target.value)}
                            required autoComplete="family-name" disabled={processing}
                            placeholder="Dupont" className={inputCls} />
                        <InputError message={errors.nom} />
                    </div>
                </div>

                {/* ── Métier (artisan) ── */}
                {data.type_utilisateur === 'artisan' && (
                    <div className="space-y-1.5">
                        <Label htmlFor="metier" className={labelCls}>Métier principal</Label>
                        <div className="relative">
                            <Wrench className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(30,20%,60%)]" />
                            <Input id="metier" value={data.metier} onChange={(e) => setData('metier', e.target.value)}
                                required={data.type_utilisateur === 'artisan'} disabled={processing}
                                placeholder="Ex: Plombier, électricien..." className={`pl-10 ${inputCls}`} />
                        </div>
                        <InputError message={errors.metier} />
                    </div>
                )}

                {/* ── Email ── */}
                <div className="space-y-1.5">
                    <Label htmlFor="email" className={labelCls}>Adresse e-mail</Label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(30,20%,60%)]" />
                        <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)}
                            required autoComplete="email" disabled={processing}
                            placeholder="votre@email.com" className={`pl-10 ${inputCls}`} />
                    </div>
                    <InputError message={errors.email} />
                </div>

                {/* ── Téléphone ── */}
                <div className="space-y-1.5">
                    <Label htmlFor="telephone" className={labelCls}>
                        Téléphone <span className="font-normal text-[hsl(20,10%,55%)]">(optionnel)</span>
                    </Label>
                    <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(30,20%,60%)]" />
                        <Input id="telephone" type="tel" value={data.telephone} onChange={(e) => setData('telephone', e.target.value)}
                            autoComplete="tel" disabled={processing}
                            placeholder="+229 XX XX XX XX" className={`pl-10 ${inputCls}`} />
                    </div>
                    <InputError message={errors.telephone} />
                </div>

                {/* ── Mots de passe ── */}
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="password" className={labelCls}>Mot de passe</Label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(30,20%,60%)]" />
                            <Input id="password" type="password" value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required autoComplete="new-password" disabled={processing}
                                placeholder="••••••••" className={`pl-10 ${inputCls}`} />
                        </div>
                        <InputError message={errors.password} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="password_confirmation" className={labelCls}>Confirmer</Label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(30,20%,60%)]" />
                            <Input id="password_confirmation" type="password" value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required autoComplete="new-password" disabled={processing}
                                placeholder="••••••••" className={`pl-10 ${inputCls}`} />
                        </div>
                        <InputError message={errors.password_confirmation} />
                    </div>
                </div>

                <Button type="submit" disabled={processing}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold shadow-lg shadow-amber-900/20 transition-all border-0 mt-2">
                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Créer mon compte
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-[hsl(20,10%,48%)]">
                    Déjà inscrit ?{' '}
                    <TextLink href={route('login')} className="font-semibold text-amber-600 hover:text-amber-700">
                        Se connecter
                    </TextLink>
                </p>
            </div>
        </AuthLayout>
    );
}
