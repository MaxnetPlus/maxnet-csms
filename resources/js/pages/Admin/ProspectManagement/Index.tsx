import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Download, Plus } from 'lucide-react';
import ProspectList from './ProspectList';

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
}

interface ProspectCategory {
    id: number;
    name: string;
    points: number;
}

interface Prospect {
    id: number;
    customer_name: string;
    customer_email: string;
    customer_number: string;
    address: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
    created_at: string;
    converted_at?: string;
    points?: number; // From the getPointsAttribute accessor
    sales: User;
    category: ProspectCategory;
}

interface PaginatedProspects {
    data: Prospect[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    prospects: PaginatedProspects;
    categories: ProspectCategory[];
    salesUsers: User[];
    filters: {
        search?: string;
        status?: string;
        category_id?: string;
        sales_id?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
        direction?: string;
        per_page?: number;
    };
    stats: {
        total: number;
        new: number;
        contacted: number;
        qualified: number;
        converted: number;
        rejected: number;
    };
}

export default function ProspectManagementIndex({ prospects, categories, salesUsers, filters, stats }: Props) {
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const handleExport = (format: string = 'excel') => {
        const params = new URLSearchParams();

        // Add current filters to export
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.append(key, String(value));
            }
        });

        params.append('format', format);

        window.open(`/admin/prospect-management/export?${params.toString()}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Prospect Management', href: '/admin/prospect-management' },
            ]}
        >
            <Head title="Prospect Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Prospect Management</h1>
                        <p className="text-muted-foreground">Manage and monitor all prospects from sales team</p>
                    </div>
                    <div className="flex flex-col gap-2 md:static md:flex-row md:gap-2">
                        {userPermissions.includes('export-data') && (
                            <Button variant="outline" onClick={() => handleExport('excel')} className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Export Excel
                            </Button>
                        )}
                        <Link href="/sales/prospects/create">
                            <Button className="flex w-full items-center gap-2 md:w-auto">
                                <Plus className="h-4 w-4" />
                                Create Prospect
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600">New</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.new.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-yellow-600">Contacted</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.contacted.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">Qualified</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.qualified.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-purple-600">Converted</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{stats.converted.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.rejected.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Prospect List Component */}
                <ProspectList initialFilters={filters} categories={categories} salesUsers={salesUsers} />
            </div>
        </AppLayout>
    );
}
