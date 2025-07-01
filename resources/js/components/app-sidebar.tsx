import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, BookX, Database, FileText, Folder, Shield, Users } from 'lucide-react';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

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
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
