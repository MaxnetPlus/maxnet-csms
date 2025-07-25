import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { SalesHeader } from '@/components/sales-header';
import { SalesSidebar } from '@/components/sales-sidebar';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function SalesLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <SalesSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <SalesHeader breadcrumbs={breadcrumbs} />
                <div className="space-y-4 px-4 py-4 md:space-y-6 md:px-6 lg:px-8">{children}</div>
                <div className="mt-auto mb-2">
                    <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">© {new Date().getFullYear()} Made with ❤️</p>
                </div>
            </AppContent>
        </AppShell>
    );
}
