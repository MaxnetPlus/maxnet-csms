import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookX, CaptionsOff, Database, FileText, List, Pickaxe, Shield, Users } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    // Helper function to check if user has permission
    const hasPermission = (permission: string) => {
        return userPermissions.includes(permission);
    };

    // Define all possible nav items with their required permissions
    const allNavItems: (NavItem & { permission?: string })[] = [
        {
            title: 'Dashboard',
            href: '/admin/reports',
            icon: FileText,
            permission: 'view-reports',
        },
        {
            title: 'Subscriptions',
            href: '/admin/subscriptions',
            icon: List,
            permission: 'view-reports',
        },
        {
            title: 'User Management',
            href: '/admin/users',
            icon: Users,
            permission: 'view-users',
        },
        {
            title: 'Roles & Permissions',
            href: '/admin/roles-permissions',
            icon: Shield,
            permission: 'manage-roles-and-permissions',
        },
        {
            title: 'Database Import',
            href: '/admin/database-import',
            icon: Database,
            permission: 'import-database',
        },
        {
            title: 'Cancel Subscription',
            href: '/admin/cancel-subscription',
            icon: BookX,
            permission: 'view-reports',
        },
        {
            title: 'Dismantle Subscription',
            href: '/admin/dismantle-subscription',
            icon: Pickaxe,
            permission: 'view-reports',
        },
        {
            title: 'Suspend Subscription',
            href: '/admin/suspend-subscription',
            icon: CaptionsOff,
            permission: 'view-reports',
        },
    ];

    // Filter nav items based on user permissions
    const mainNavItems = allNavItems.filter((item) => {
        // Always show dashboard
        if (!item.permission) return true;
        // Show item if user has the required permission
        return hasPermission(item.permission);
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-b">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">MaxNet CSMS</span>
                                    <span className="truncate text-xs">Customer Management</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <ThemeToggle />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
