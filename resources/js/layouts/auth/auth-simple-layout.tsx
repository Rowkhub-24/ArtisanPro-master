import { Link } from '@inertiajs/react';
import { Hammer, Shield, Star, Users, CheckCircle } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen">
            {/* ── Left panel ── */}
            <div className="relative hidden lg:flex lg:w-[45%] flex-col justify-between overflow-hidden">
                {/* Real background image */}
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/hero-artisan.jpg)' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(20,14%,8%)]/95 via-[hsl(20,14%,10%)]/90 to-[hsl(25,40%,14%)]/85" />
                <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-amber-500/10 blur-[80px]" />

                <div className="relative flex flex-col h-full p-10 justify-between">
                    {/* Logo */}
                    <Link href={route('home')} className="w-fit">
                        <img src="/images/ArtisanPro.jpg" alt="ArtisanPro" className="h-14 w-14 object-contain" />
                    </Link>

                    {/* Main content */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-extrabold text-white leading-tight">
                                La plateforme des<br />
                                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                    artisans de confiance
                                </span>
                            </h2>
                            <p className="text-white/50 leading-relaxed max-w-xs">
                                Rejoignez des milliers de clients et artisans qui font confiance à ArtisanPro à Porto-Novo.
                            </p>
                        </div>
                        <div className="space-y-3">
                            {[
                                { icon: Shield, text: 'Artisans vérifiés et certifiés' },
                                { icon: Star, text: 'Avis clients authentiques' },
                                { icon: Users, text: '500+ professionnels disponibles' },
                                { icon: CheckCircle, text: 'Paiements Mobile Money sécurisés' },
                            ].map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/20">
                                        <Icon className="h-4 w-4 text-amber-400" />
                                    </div>
                                    <span className="text-sm text-white/60">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Testimonial */}
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
                        <p className="text-sm text-white/55 italic leading-relaxed">
                            "ArtisanPro m'a permis de trouver un plombier qualifié en moins de 2 heures. Service impeccable !"
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">MK</div>
                            <div>
                                <p className="text-xs font-semibold text-white">Marie K.</p>
                                <p className="text-xs text-white/35">Cliente vérifiée · Porto-Novo</p>
                            </div>
                            <div className="ml-auto flex">
                                {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right panel ── */}
            <div className="flex flex-1 flex-col items-center justify-center bg-[hsl(36,33%,97%)] px-6 py-12 lg:px-12">
                {/* Mobile logo */}
                <div className="mb-8 lg:hidden">
                    <Link href={route('home')}>
                        <img src="/images/ArtisanPro.jpg" alt="ArtisanPro" className="h-14 w-14 object-contain" />
                    </Link>
                </div>
                <div className="w-full max-w-md">
                    {(title || description) && (
                        <div className="mb-8">
                            {title && <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">{title}</h1>}
                            {description && <p className="mt-2 text-[hsl(20,10%,48%)]">{description}</p>}
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}
