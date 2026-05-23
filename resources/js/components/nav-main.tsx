import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    return (
        <SidebarGroup className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-3">
            <SidebarGroupLabel className="text-xs uppercase tracking-widest text-[hsl(20,10%,55%)] px-2 mb-2">
                Navigation
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-0.5">
                {items.map((item) => {
                    const isActive = item.url === '/' ? page.url === '/' : page.url.startsWith(item.url);
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={isActive}>
                                <Link
                                    href={item.url}
                                    prefetch
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                                        isActive
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                            : 'text-[hsl(20,14%,35%)] hover:bg-[hsl(36,30%,93%)] hover:text-[hsl(20,14%,12%)]'
                                    }`}
                                >
                                    {item.icon && (
                                        <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-amber-600' : 'text-[hsl(20,10%,55%)]'}`} />
                                    )}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
