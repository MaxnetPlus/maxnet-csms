import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { usePage } from '@inertiajs/react';

export function SalesHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth } = usePage().props as any;

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 bg-card/30 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* Sales Badge - Mobile Friendly */}
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary">
                    Sales
                </Badge>
                <div className="hidden text-sm text-muted-foreground md:block">{auth?.user?.name}</div>
            </div>
        </header>
    );
}
