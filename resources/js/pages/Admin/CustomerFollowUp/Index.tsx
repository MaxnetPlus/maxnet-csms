import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Notification, useNotification } from '@/components/ui/notification';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Download, Plus } from 'lucide-react';
import { useEffect } from 'react';
import CustomerFollowUpList from './CustomerFollowUpList';

interface User {
    id: number;
    name: string;
    role: any;
    roles?: Array<{
        id: number;
        name: string;
        guard_name: string;
    }>;
}

interface CustomerFollowUp {
    id: number;
    customer_id: string;
    subscription_id?: string;
    priority: string;
    status: string;
    description: string;
    notes?: string;
    resolution?: string;
    completed_at?: string;
    created_at: string;
}

interface PaginatedFollowUps {
    data: CustomerFollowUp[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    followUps: PaginatedFollowUps;
    filters: {
        search?: string;
        status?: string;
        priority?: string;
        assigned_to?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
        direction?: string;
        per_page?: number;
    };
    users: User[];
    stats: {
        total: number;
        pending: number;
        in_progress: number;
        completed: number;
    };
}

export default function Index({ followUps, filters, users, stats }: Props) {
    const { auth, flash } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];
    const { notification, showNotification, hideNotification } = useNotification();

    // Check for flash notification when component mounts
    useEffect(() => {
        if (flash && flash.notification) {
            showNotification(flash.notification.type, flash.notification.title, flash.notification.message);
        }
    }, [flash]);

    const handleExport = (format: string = 'excel') => {
        const params = new URLSearchParams();

        // Add current filters to export
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.append(key, String(value));
            }
        });

        params.append('format', format);

        window.open(`/admin/follow-ups/export?${params.toString()}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin' },
                { title: 'Customer Follow Up Management', href: '/admin/follow-ups' },
            ]}
        >
            <Head title="Customer Follow Up Management" />

            <Notification
                show={notification.show}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onClose={hideNotification}
                autoHide={true}
                duration={5000}
                position="top-right"
            />

            <div className="mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Customer Follow Up Management</h1>
                        <p className="text-muted-foreground">Manage customer follow ups and track progress</p>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
                        {userPermissions.includes('export-data') && (
                            <Button variant="outline" onClick={() => handleExport('excel')} className="flex w-full items-center gap-2 md:w-auto">
                                <Download className="h-4 w-4" />
                                Export Excel
                            </Button>
                        )}
                        <Link href={route('admin.follow-ups.create')} className="w-full md:w-auto">
                            <Button className="flex w-full items-center gap-2 md:w-auto">
                                <Plus className="h-4 w-4" />
                                Create Follow Up
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                            <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600">In Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.in_progress.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.completed.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Customer Follow Up List Component */}
                <CustomerFollowUpList initialFilters={filters} users={users} />
            </div>
        </AppLayout>
    );
}
