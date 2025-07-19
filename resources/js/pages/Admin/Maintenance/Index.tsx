import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Download } from 'lucide-react';
import MaintenanceList from './MaintenanceList';

interface MaintenanceStats {
    total: number;
    open: number;
    closed: number;
    in_progress: number;
    sales: number;
}

interface Customer {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
}

interface Maintenance {
    ticket_id: string;
    subscription_id: string | null;
    customer_id: string;
    subject_problem: string;
    customer_report: string;
    technician_update_desc: string;
    status: string;
    work_by: string;
    created_by: string;
    ticket_close_date: string | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedMaintenances {
    data: (Maintenance & { customer?: Customer })[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    maintenances: PaginatedMaintenances;
    filters: {
        search?: string;
        status?: string;
        subject_problem?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
        direction?: string;
        per_page?: number;
    };
    stats: {
        total: number;
        open: number;
        closed: number;
        in_progress: number;
        sales: number;
    };
    subjectProblems: string[];
    statuses: string[];
}

export default function Index({ maintenances, filters, stats, subjectProblems, statuses }: Props) {
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const handleExport = (format: string = 'csv') => {
        const params = new URLSearchParams();

        // Add current filters to export
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, String(value));
                }
            });
        }

        params.append('format', format);

        window.open(`/admin/maintenances/export?${params.toString()}`);
    };

    return (
        <AppLayout>
            <Head title="Maintenance Management" />

            <div className="mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Maintenance Management</h1>
                        <p className="text-muted-foreground">Manage and track maintenance tickets</p>
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
                            <CardTitle className="text-sm font-medium text-red-600">Open</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.open.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">Closed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.closed.toLocaleString()}</div>
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
                            <CardTitle className="text-sm font-medium text-purple-600">Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{stats.sales.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Maintenance List Component */}
                <MaintenanceList initialFilters={filters} subjectProblems={subjectProblems} />
            </div>
        </AppLayout>
    );
}
