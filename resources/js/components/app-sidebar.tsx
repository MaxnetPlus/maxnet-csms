import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { createSidebarGroups, MAIN_NAV_ITEMS, SIDEBAR_GROUPS } from '@/lib/sidebar-config';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    // Helper function to check if user has permission
    const hasPermission = (permission: string) => {
        return userPermissions.includes(permission);
    };

    // Filter main nav items based on user permissions
    const filteredMainNavItems = MAIN_NAV_ITEMS.filter((item) => {
        if (!item.permission) return true;
        return hasPermission(item.permission);
    });

    // Create navigation groups using the configuration utility
    const navGroups = createSidebarGroups(SIDEBAR_GROUPS, hasPermission);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <style>{`
                [data-state="collapsed"] .collapsed-user {
                    display: flex !important;
                }
                [data-state="collapsed"] .collapsed-theme {
                    display: flex !important;
                }
                .collapsed-user {
                    display: none;
                }
            `}</style>

            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo
                                    className="group-data-[collapsible=icon]:px-2"
                                    normalLogoClassName="transition-all duration-200"
                                    collapsedLogoClassName="transition-all duration-200"
                                />
                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:sr-only">
                                    <span className="truncate font-semibold">MaxNet CSMS</span>
                                    <span className="truncate text-xs opacity-80">Customer Management</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredMainNavItems} groups={navGroups} />
            </SidebarContent>

            <SidebarFooter className="space-y-6">
                <ThemeToggle />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
