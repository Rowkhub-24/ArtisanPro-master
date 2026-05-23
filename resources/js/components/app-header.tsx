import { Breadcrumbs } from '@/components/breadcrumbs';
import { Icon } from '@/components/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Menu, Search } from 'lucide-react';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';

const rightNavItems: NavItem[] = [
    {
        title: 'Repository',
        url: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        url: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
    },
];

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();

    // Résoudre le dashboard selon le rôle
    const role = auth?.user?.type_utilisateur;
    const dashboardUrl =
        role === 'client'  ? route('client.dashboard')  :
        role === 'artisan' ? route('artisan.dashboard') :
        role === 'admin'   ? '/admin'                   :
        route('dashboard');

    const mainNavItems: NavItem[] = [
        { title: 'Tableau de bord', url: dashboardUrl, icon: LayoutGrid },
    ];

    return (
        <>
            <div>
                <div>
                    {/* Mobile Menu */}
                    <div>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left">
                                <SheetTitle>Navigation Menu</SheetTitle>
                                <SheetHeader>
                                    <AppLogoIcon />
                                </SheetHeader>
                                <div>
                                    <div>
                                        <div>
                                            {mainNavItems.map((item) => (
                                                <Link key={item.title} href={item.url}>
                                                    {item.icon && <Icon iconNode={item.icon} />}
                                                    <span>{item.title}</span>
                                                </Link>
                                            ))}
                                        </div>
                                        <div>
                                            {rightNavItems.map((item) => (
                                                <a key={item.title} href={item.url} target="_blank" rel="noopener noreferrer">
                                                    {item.icon && <Icon iconNode={item.icon} />}
                                                    <span>{item.title}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link href={dashboardUrl} prefetch>
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div>
                        <NavigationMenu>
                            <NavigationMenuList>
                                {mainNavItems.map((item, index) => (
                                    <NavigationMenuItem key={index}>
                                        <Link href={item.url}>
                                            {item.icon && <Icon iconNode={item.icon} />}
                                            {item.title}
                                        </Link>
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div>
                        <div>
                            <Button variant="ghost" size="icon">
                                <Search />
                            </Button>
                            <div>
                                {rightNavItems.map((item) => (
                                    <TooltipProvider key={item.title} delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                    <span>{item.title}</span>
                                                    {item.icon && <Icon iconNode={item.icon} />}
                                                </a>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{item.title}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost">
                                    <Avatar>
                                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                        <AvatarFallback>
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            {breadcrumbs.length > 1 && (
                <div>
                    <div>
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
