import { NavUser } from '@/components/nav-user';
import { ThemeToggle } from '@/components/theme-toggle';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import { BarChart3, CheckSquare, Users } from 'lucide-react';
import AppLogo from './app-logo';

export function SalesSidebar() {
    const { auth } = usePage().props as any;
    const page = usePage();

    // Function to check if menu item is active
    const isActive = (href: string) => {
        // Exact match for dashboard
        if (href === '/sales') {
            return page.url === '/sales' || page.url === '/sales/';
        }
        // For other items, check if current URL starts with the href
        return page.url.startsWith(href);
    };

    // Sales navigation items - mobile-first design
    const salesNavItems = [
        {
            title: 'Dashboard',
            href: '/sales',
            icon: BarChart3,
            isActive: isActive('/sales'),
        },
        {
            title: 'Prospek',
            href: '/sales/prospects',
            icon: Users,
            isActive: isActive('/sales/prospects'),
        },
        {
            title: 'Follow Up',
            href: '/sales/follow-ups',
            icon: CheckSquare,
            isActive: isActive('/sales/follow-ups'),
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
                                    <span className="truncate text-xs text-muted-foreground">Mobile Ready</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-card/30">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">Menu Utama</SidebarGroupLabel>
                    <SidebarMenu>
                        {salesNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={item.isActive}
                                    tooltip={{ children: item.title }}
                                    className="h-10 hover:bg-muted/50"
                                >
                                    <Link href={item.href} prefetch>
                                        <item.icon className="h-4 w-4" />
                                        <span className="text-sm font-medium">{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t bg-card/50">
                <div className="space-y-2 p-2">
                    <ThemeToggle />
                    <NavUser />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
