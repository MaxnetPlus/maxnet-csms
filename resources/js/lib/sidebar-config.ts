import { NavGroup, NavItem } from '@/types';
import { BookX, CaptionsOff, Database, FileText, HeadphonesIcon, List, Pickaxe, Shield, Tag, Target, UserCheck, Users } from 'lucide-react';

export interface SidebarNavItem extends NavItem {
    permission?: string;
}

export interface SidebarGroupConfig {
    title: string;
    items: SidebarNavItem[];
    collapsible?: boolean;
    defaultOpen?: boolean;
    permission?: string; // Optional group-level permission
}

/**
 * Helper function to create sidebar groups with permission filtering
 */
export function createSidebarGroups(groupConfigs: SidebarGroupConfig[], hasPermission: (permission: string) => boolean): NavGroup[] {
    return groupConfigs
        .map((group) => {
            // Filter items based on permissions
            const filteredItems = group.items.filter((item) => {
                if (!item.permission) return true;
                return hasPermission(item.permission);
            });

            // Check group-level permission if exists
            if (group.permission && !hasPermission(group.permission)) {
                return null;
            }

            // Only include group if it has items
            if (filteredItems.length === 0) return null;

            return {
                title: group.title,
                items: filteredItems,
                collapsible: group.collapsible ?? true,
                defaultOpen: group.defaultOpen ?? true,
            } as NavGroup;
        })
        .filter((group): group is NavGroup => group !== null);
}

/**
 * Predefined sidebar configurations
 * You can easily add, remove, or modify groups here
 */
export const SIDEBAR_GROUPS: SidebarGroupConfig[] = [
    {
        title: 'Subscription Map',
        collapsible: true,
        defaultOpen: false,
        items: [
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
        ],
    },
    {
        title: 'Sales Management',
        collapsible: true,
        defaultOpen: false,
        items: [
            {
                title: 'Sales Users',
                href: '/admin/sales-management',
                icon: UserCheck,
                permission: 'manage-sales-targets',
            },
            {
                title: 'Prospects',
                href: '/admin/prospect-management',
                icon: Target,
                permission: 'manage-prospects',
            },
            {
                title: 'Prospect Categories',
                href: '/admin/prospect-categories',
                icon: Tag,
                permission: 'manage-prospect-categories',
            },
        ],
    },
    // Example: Analytics group (commented out - uncomment to enable)
    // {
    //     title: 'Analytics',
    //     collapsible: true,
    //     defaultOpen: false,
    //     items: [
    //         {
    //             title: 'Reports',
    //             href: '/admin/analytics/reports',
    //             icon: BarChart,
    //             permission: 'view-analytics',
    //         },
    //         {
    //             title: 'Activity Logs',
    //             href: '/admin/analytics/activity',
    //             icon: Activity,
    //             permission: 'view-activity-logs',
    //         },
    //         {
    //             title: 'Performance',
    //             href: '/admin/analytics/performance',
    //             icon: Clock,
    //             permission: 'view-performance',
    //         },
    //     ],
    // },

    // Example: System Administration group
    // {
    //     title: 'System Administration',
    //     collapsible: true,
    //     defaultOpen: false,
    //     permission: 'system-admin', // Group-level permission
    //     items: [
    //         {
    //             title: 'System Settings',
    //             href: '/admin/system/settings',
    //             icon: Settings,
    //             permission: 'manage-settings',
    //         },
    //         {
    //             title: 'Backup & Restore',
    //             href: '/admin/system/backup',
    //             icon: Database,
    //             permission: 'manage-backups',
    //         },
    //     ],
    // },
];

/**
 * Main navigation items (ungrouped)
 */
export const MAIN_NAV_ITEMS: SidebarNavItem[] = [
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
        title: 'Customer Follow Up',
        href: '/admin/follow-ups',
        icon: HeadphonesIcon,
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
];
