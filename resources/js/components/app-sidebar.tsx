import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
    SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid, Search, Hammer, Calendar, FileText,
    MessageSquare, CreditCard, Star, Heart, AlertTriangle,
    User, Award, Image, Users, Tag,
} from 'lucide-react';

// ── Navigation par rôle ──────────────────────────────────────────────────────

const clientNavItems: NavItem[] = [
    { title: 'Tableau de bord',  url: '/client/dashboard',    icon: LayoutGrid },
    { title: 'Réservations',     url: '/client/reservations', icon: Calendar },
    { title: 'Mes Devis',        url: '/client/devis',        icon: FileText },
    { title: 'Messages',         url: '/client/messages',     icon: MessageSquare },
    { title: 'Paiements',        url: '/client/paiements',    icon: CreditCard },
    { title: 'Mes Avis',         url: '/client/avis',         icon: Star },
    { title: 'Favoris',          url: '/client/favoris',      icon: Heart },
    { title: 'Litiges',          url: '/client/litiges',      icon: AlertTriangle },
    { title: 'Mon Profil',       url: '/client/profil',       icon: User },
];

const artisanNavItems: NavItem[] = [
    { title: 'Tableau de bord',  url: '/artisan/dashboard',    icon: LayoutGrid },
    { title: 'Réservations',     url: '/artisan/reservations', icon: Calendar },
    { title: 'Mes Devis',        url: '/artisan/devis',        icon: FileText },
    { title: 'Messages',         url: '/artisan/messages',     icon: MessageSquare },
    { title: 'Mes Revenus',      url: '/artisan/paiements',    icon: CreditCard },
    { title: 'Mes Avis',         url: '/artisan/avis',         icon: Star },
    { title: 'Portfolio',        url: '/artisan/portfolio',    icon: Image },
    { title: 'Mon Profil',       url: '/artisan/profil',       icon: User },
];

const adminNavItems: NavItem[] = [
    { title: 'Tableau de bord',  url: '/admin',              icon: LayoutGrid },
    { title: 'Utilisateurs',     url: '/admin/users',        icon: Users },
    { title: 'Artisans',         url: '/admin/artisans',     icon: Award },
    { title: 'Catégories',       url: '/admin/categories',   icon: Tag },
    { title: 'Réservations',     url: '/admin/reservations', icon: Calendar },
    { title: 'Paiements',        url: '/admin/paiements',    icon: CreditCard },
];

const defaultNavItems: NavItem[] = [
    { title: 'Tableau de bord',  url: '/dashboard', icon: LayoutGrid },
    { title: 'Annuaire',         url: '/artisans',  icon: Search },
    { title: 'Accueil',          url: '/',          icon: Hammer },
];

const homeNavItem: NavItem[] = [
    { title: "Page d'accueil",   url: '/',          icon: Hammer },
];

// ── Component ────────────────────────────────────────────────────────────────

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const role = auth?.user?.type_utilisateur;

    const navItems =
        role === 'client'  ? clientNavItems  :
        role === 'artisan' ? artisanNavItems :
        role === 'admin'   ? adminNavItems   :
        defaultNavItems;

    const logoHref = role === 'admin' ? '/admin' : route('home');

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm"
        >
            <SidebarHeader className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3 px-2 py-2">
                    <Link href={logoHref} prefetch className="flex items-center gap-2.5">
                        <img src="/images/ArtisanPro.jpg" alt="ArtisanPro" className="h-12 w-12 object-contain" />
                    </Link>
                </div>

                {auth?.user && (
                    <div className="rounded-xl bg-[hsl(36,30%,93%)] p-3">
                        <Link
                            href={role === 'client' ? '/client/profil' : role === 'artisan' ? '/artisan/profil' : '/settings/profile'}
                            className="flex items-center gap-3 rounded-lg bg-white p-2.5 shadow-sm hover:shadow-md transition-all"
                        >
                            {(auth.user.avatar_url ?? auth.user.avatar) ? (
                                <img
                                    src={auth.user.avatar_url ?? auth.user.avatar ?? ''}
                                    alt={auth.user.name}
                                    className="h-10 w-10 rounded-full object-cover ring-2 ring-amber-200 shrink-0"
                                />
                            ) : (
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 font-bold text-sm ring-2 ring-amber-200">
                                    {auth.user.prenom?.[0]}{auth.user.nom?.[0]}
                                </div>
                            )}
                            <div className="hidden md:flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-[hsl(20,14%,12%)] truncate">{auth.user.prenom} {auth.user.nom}</span>
                                <span className="text-xs text-[hsl(20,10%,50%)] truncate">{auth.user.email}</span>
                            </div>
                        </Link>
                    </div>
                )}
            </SidebarHeader>

            <SidebarContent className="px-4 pb-4">
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter className="px-4 pb-4">
                {(role === 'client' || role === 'artisan') && (
                    <NavFooter items={homeNavItem} className="mt-auto" />
                )}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
