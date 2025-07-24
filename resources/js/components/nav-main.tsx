import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGroup, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ExtendedNavGroup extends NavGroup {
    collapsible?: boolean;
    defaultOpen?: boolean;
}

export function NavMain({ items = [], groups = [] }: { items?: NavItem[]; groups?: ExtendedNavGroup[] }) {
    const page = usePage();

    // Helper function to check if a group has an active item
    const hasActiveItem = (groupItems: NavItem[]) => {
        return groupItems.some((item) => page.url.startsWith(item.href));
    };

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
        // Initialize with default open states
        const initial: Record<string, boolean> = {};
        groups.forEach((group) => {
            if (group.collapsible !== false) {
                // If group has an active item, it should be open regardless of defaultOpen
                const hasActive = hasActiveItem(group.items);
                initial[group.title] = hasActive || (group.defaultOpen ?? true);
            }
        });
        return initial;
    });

    // Update openGroups when page changes to ensure active groups stay open
    useEffect(() => {
        setOpenGroups((prev) => {
            const updated = { ...prev };
            let hasChanges = false;

            groups.forEach((group) => {
                if (group.collapsible !== false) {
                    const hasActive = hasActiveItem(group.items);
                    if (hasActive && !updated[group.title]) {
                        updated[group.title] = true;
                        hasChanges = true;
                    }
                }
            });

            return hasChanges ? updated : prev;
        });
    }, [page.url, groups]);

    const toggleGroup = (groupTitle: string) => {
        setOpenGroups((prev) => ({
            ...prev,
            [groupTitle]: !prev[groupTitle],
        }));
    };

    return (
        <>
            {/* Render ungrouped items */}
            {items.length > 0 && (
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarMenu>
                        {items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={page.url.startsWith(item.href)} tooltip={{ children: item.title }}>
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            )}

            {/* Render grouped items */}
            {groups.map((group) => {
                const isCollapsible = group.collapsible !== false;
                const hasActive = hasActiveItem(group.items);
                // Group should be open if it has active item OR if manually opened by user
                const isOpen = hasActive || (openGroups[group.title] ?? true);

                if (!isCollapsible) {
                    // Non-collapsible group (original behavior)
                    return (
                        <SidebarGroup key={group.title}>
                            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={page.url.startsWith(item.href)} tooltip={{ children: item.title }}>
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    );
                }

                // Collapsible group
                return (
                    <Collapsible key={group.title} open={isOpen} onOpenChange={() => toggleGroup(group.title)}>
                        <SidebarGroup>
                            <CollapsibleTrigger asChild>
                                <SidebarGroupLabel className="group/label relative flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-all duration-200 ease-out before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-white/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-200 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground hover:before:opacity-100">
                                    <span className="font-medium tracking-wide">{group.title}</span>
                                    <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 ease-out group-data-[state=open]/label:rotate-180" />
                                </SidebarGroupLabel>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down transition-all duration-200 ease-out">
                                <SidebarMenu>
                                    {group.items.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild isActive={page.url.startsWith(item.href)} tooltip={{ children: item.title }}>
                                                <Link href={item.href} prefetch>
                                                    {item.icon && <item.icon />}
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </CollapsibleContent>
                        </SidebarGroup>
                    </Collapsible>
                );
            })}
        </>
    );
}
