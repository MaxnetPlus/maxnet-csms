import SalesLayoutTemplate from '@/layouts/sales/sales-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface SalesLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: SalesLayoutProps) => (
    <SalesLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
    </SalesLayoutTemplate>
);
