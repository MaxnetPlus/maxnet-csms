import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Customer, Subscription } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Download } from 'lucide-react';
import SubscriptionList from './SubscriptionList';

interface PaginatedSubscriptions {
    data: (Subscription & { customer?: Customer })[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    subscriptions: PaginatedSubscriptions;
    filters: {
        search?: string;
        status?: string;
        group?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
        direction?: string;
        per_page?: number;
    };
    stats: {
        total: number;
        active: number;
        canceled: number;
        suspended: number;
        dismantled: number;
    };
    groups: string[];
}

export default function Index({ subscriptions, filters, stats, groups }: Props) {
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const handleExport = (format: string = 'csv') => {
        const params = new URLSearchParams();

        // Add current filters to export
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.append(key, String(value));
            }
        });

        params.append('format', format);

        window.open(`/admin/subscriptions/export?${params.toString()}`);
    };

    return (
        <AppLayout>
            <Head title="Subscription Management" />

            <div className="mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Subscription Management</h1>
                        <p className="text-muted-foreground">Manage and view all customer subscriptions</p>
                    </div>
                    <div className="flex gap-2">
                        {userPermissions.includes('export-data') && (
                            <Button variant="outline" onClick={() => handleExport('csv')} className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Export CSV
                            </Button>
                        )}
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-600">Canceled</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.canceled.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-yellow-600">Suspended</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.suspended.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Dismantled</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-600">{stats.dismantled.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Subscription List Component */}
                <SubscriptionList initialFilters={filters} groups={groups} />
            </div>
        </AppLayout>
    );
}
