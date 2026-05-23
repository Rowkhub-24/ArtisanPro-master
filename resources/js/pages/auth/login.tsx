import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Lock, Mail, ArrowRight } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface LoginForm { email: string; password: string; remember: boolean; }
interface LoginProps { status?: string; canResetPassword: boolean; }

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '', password: '', remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <AuthLayout title="Bon retour !" description="Connectez-vous pour accéder à votre espace">
            <Head title="Connexion — ArtisanPro" />

            <form className="space-y-5" onSubmit={submit}>
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-[hsl(20,14%,20%)]">Adresse e-mail</Label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(30,20%,60%)]" />
                        <Input id="email" type="email" required autoFocus tabIndex={1} autoComplete="email"
                            value={data.email} onChange={(e) => setData('email', e.target.value)}
                            placeholder="votre@email.com"
                            className="pl-10 border-[hsl(30,20%,82%)] bg-white focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-11" />
                    </div>
                    <InputError message={errors.email} />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-semibold text-[hsl(20,14%,20%)]">Mot de passe</Label>
                        {canResetPassword && (
                            <TextLink href={route('password.request')} className="text-xs font-medium text-amber-600 hover:text-amber-700" tabIndex={5}>
                                Mot de passe oublié ?
                            </TextLink>
                        )}
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(30,20%,60%)]" />
                        <Input id="password" type="password" required tabIndex={2} autoComplete="current-password"
                            value={data.password} onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            className="pl-10 border-[hsl(30,20%,82%)] bg-white focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-11" />
                    </div>
                    <InputError message={errors.password} />
                </div>

                <div className="flex items-center gap-2.5">
                    <Checkbox id="remember" name="remember" tabIndex={3}
                        checked={data.remember}
                        onCheckedChange={(v) => setData('remember', !!v)}
                        className="border-[hsl(30,20%,75%)] data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500" />
                    <Label htmlFor="remember" className="text-sm text-[hsl(20,10%,45%)] cursor-pointer">Se souvenir de moi</Label>
                </div>

                <Button type="submit" tabIndex={4} disabled={processing}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold shadow-lg shadow-amber-900/20 transition-all border-0">
                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Se connecter
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-[hsl(20,10%,48%)]">
                    Pas encore de compte ?{' '}
                    <TextLink href={route('register')} className="font-semibold text-amber-600 hover:text-amber-700" tabIndex={6}>
                        Créer un compte
                    </TextLink>
                </p>
            </div>

            {status && (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                    <p className="text-sm font-medium text-emerald-700">{status}</p>
                </div>
            )}
        </AuthLayout>
    );
}
