import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid, Users, Wrench, Tag, Calendar,
    CreditCard, Home, ChevronRight,
    Menu, LogOut, Bell, MessageSquare, AlertTriangle, Building2, BarChart3, User,
} from 'lucide-react';
import { useState } from 'react';
import { type SharedData } from '@/types';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    routePrefix: string;
}

const navItems: NavItem[] = [
    { label: 'Tableau de bord', href: '/admin',              icon: LayoutGrid,    routePrefix: '/admin' },
    { label: 'Utilisateurs',    href: '/admin/users',        icon: Users,         routePrefix: '/admin/users' },
    { label: 'Artisans',        href: '/admin/artisans',     icon: Wrench,        routePrefix: '/admin/artisans' },
    { label: 'Catégories',      href: '/admin/categories',   icon: Tag,           routePrefix: '/admin/categories' },
    { label: 'Réservations',    href: '/admin/reservations', icon: Calendar,      routePrefix: '/admin/reservations' },
    { label: 'Paiements',       href: '/admin/paiements',    icon: CreditCard,    routePrefix: '/admin/paiements' },
    { label: 'Avis',            href: '/admin/avis',         icon: MessageSquare, routePrefix: '/admin/avis' },
    { label: 'Litiges',         href: '/admin/litiges',      icon: AlertTriangle, routePrefix: '/admin/litiges' },
    { label: 'Partenaires',     href: '/admin/partenaires',  icon: Building2,     routePrefix: '/admin/partenaires' },
    { label: 'Rapports',        href: '/admin/reports',      icon: BarChart3,     routePrefix: '/admin/reports' },
    { label: 'Profil',          href: '/settings/profile',   icon: User,          routePrefix: '/settings/profile' },
];

interface Props {
    children: React.ReactNode;
    title?: string;
}

export default function AdminLayout({ children, title }: Props) {
    const { auth, flash } = usePage<SharedData>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const isActive = (item: NavItem) => {
        if (item.routePrefix === '/admin') return currentPath === '/admin';
        return currentPath.startsWith(item.routePrefix);
    };

    const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
        <aside className={`flex h-full flex-col bg-[hsl(20,14%,8%)] ${mobile ? 'w-72' : 'w-64'}`}>
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 border-b border-white/8 px-5">
                <img src="/images/ArtisanPro.jpg" alt="ArtisanPro" className="h-11 w-11 object-contain" />
                <p className="text-xs text-white/35 ml-1">Administration</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
                {navItems.map((item) => {
                    const active = isActive(item);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                                active
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                    : 'text-white/50 hover:bg-white/6 hover:text-white/80'
                            }`}
                        >
                            <item.icon className="h-4.5 w-4.5 shrink-0" />
                            {item.label}
                            {active && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-white/8 p-4 space-y-1">
                <Link href={route('home')} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/45 hover:bg-white/6 hover:text-white/70 transition-all">
                    <Home className="h-4 w-4" /> Voir le site
                </Link>
                <Link href={route('logout')} method="post" as="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/45 hover:bg-red-500/10 hover:text-red-400 transition-all">
                    <LogOut className="h-4 w-4" /> Déconnexion
                </Link>
                <div className="flex items-center gap-3 rounded-xl px-3 py-2 mt-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-bold shrink-0">
                        {auth.user?.prenom?.charAt(0)}{auth.user?.nom?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">{auth.user?.prenom} {auth.user?.nom}</p>
                        <p className="truncate text-xs text-white/35">Administrateur</p>
                    </div>
                </div>
            </div>
        </aside>
    );

    return (
        <div className="flex h-screen bg-[hsl(36,33%,97%)] overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:shrink-0">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <div className="absolute left-0 top-0 h-full">
                        <Sidebar mobile />
                    </div>
                </div>
            )}

            {/* Main */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-[hsl(30,20%,88%)] bg-white px-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden rounded-xl p-2 text-[hsl(20,10%,45%)] hover:bg-[hsl(36,30%,93%)] transition-colors">
                            <Menu className="h-5 w-5" />
                        </button>
                        {title && <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">{title}</h2>}
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="relative rounded-xl p-2 text-[hsl(20,10%,45%)] hover:bg-[hsl(36,30%,93%)] transition-colors">
                            <Bell className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-2 rounded-xl border border-[hsl(30,20%,88%)] bg-[hsl(36,33%,97%)] px-3 py-1.5">
                            {(auth.user?.avatar_url ?? auth.user?.avatar) ? (
                                <img
                                    src={(auth.user?.avatar_url ?? auth.user?.avatar) as string}
                                    alt={auth.user?.name}
                                    className="h-7 w-7 rounded-full object-cover ring-1 ring-amber-200"
                                />
                            ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-bold">
                                    {auth.user?.prenom?.charAt(0)}{auth.user?.nom?.charAt(0)}
                                </div>
                            )}
                            <span className="text-sm font-medium text-[hsl(20,14%,20%)] hidden sm:block">
                                {auth.user?.prenom} {auth.user?.nom}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Flash */}
                {flash?.success && (
                    <div className="mx-6 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                        ✓ {flash.success}
                    </div>
                )}

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
