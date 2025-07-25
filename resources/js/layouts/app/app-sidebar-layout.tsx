import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />

            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="mx-10 my-10">{children}</div>
                {/* footer  */}
                <div className="mt-auto mb-2">
                    <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">© {new Date().getFullYear()} Made with ❤️</p>
                </div>
            </AppContent>
        </AppShell>
    );
}
