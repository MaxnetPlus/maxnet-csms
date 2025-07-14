import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import { BarChart3, CheckSquare, Users } from 'lucide-react';
import AppLogo from './app-logo';

export function SalesSidebar() {
    const { auth } = usePage().props as any;

    // Sales navigation items - mobile-first design
    const salesNavItems = [
        {
            title: 'Dashboard',
            href: '/sales',
            icon: BarChart3,
        },
        {
            title: 'Prospek',
            href: '/sales/prospects',
            icon: Users,
        },
        {
            title: 'Follow Up',
            href: '/sales/follow-ups',
            icon: CheckSquare,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r bg-card">
            <SidebarHeader className="border-b bg-card/50">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/sales" prefetch>
                                <AppLogo />
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold text-primary">Sales Portal</span>
                                    <span className="truncate text-xs text-muted-foreground">Mobile Friendly</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-card/30">
                <NavMain items={salesNavItems} groups={[]} />
            </SidebarContent>

            <SidebarFooter className="bg-card/50">
                <ThemeToggle />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
