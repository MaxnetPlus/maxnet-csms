import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Customer, Subscription } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Activity, BarChart3, Calendar, Database, Download, FileText, TrendingUp, Users } from 'lucide-react';

interface Props {
    stats: {
        total_customers: number;
        total_subscriptions: number;
        active_subscriptions: number;
        inactive_subscriptions: number;
        customers_with_subscriptions: number;
        customers_without_subscriptions: number;
    };
    recentImports: {
        recent_customers: Customer[];
        recent_subscriptions: Subscription[];
    };
    subscriptionsByStatus: Record<string, number>;
    monthlyGrowth: {
        customers: Record<string, number>;
        subscriptions: Record<string, number>;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
];

export default function ReportsIndex({ stats, recentImports, subscriptionsByStatus, monthlyGrowth }: Props) {
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];
    console.log('User Permissions:', userPermissions);
    const handleExport = (type: 'customers' | 'subscriptions') => {
        window.open(`/admin/reports/export?type=${type}`, '_blank');
    };

    const customerColumns = [
        {
            header: 'Customer ID',
            accessorKey: 'customer_id' as keyof Customer,
        },
        {
            header: 'Name',
            accessorKey: 'customer_name' as keyof Customer,
        },
        {
            header: 'Email',
            accessorKey: 'customer_email' as keyof Customer,
        },
        {
            header: 'Phone',
            accessorKey: 'customer_phone' as keyof Customer,
        },
        {
            header: 'Created',
            accessorKey: 'created_at' as keyof Customer,
            cell: (customer: Customer) => new Date(customer.created_at).toLocaleDateString(),
        },
    ];

    const subscriptionColumns = [
        {
            header: 'Subscription ID',
            accessorKey: 'subscription_id' as keyof Subscription,
        },
        {
            header: 'Customer',
            accessorKey: 'customer' as keyof Subscription,
            cell: (subscription: Subscription) => subscription.customer?.customer_name || 'N/A',
        },
        {
            header: 'Service ID',
            accessorKey: 'serv_id' as keyof Subscription,
        },
        {
            header: 'Status',
            accessorKey: 'subscription_status' as keyof Subscription,
            cell: (subscription: Subscription) => (
                <Badge variant={subscription.subscription_status === 'active' ? 'default' : 'secondary'}>{subscription.subscription_status}</Badge>
            ),
        },
        {
            header: 'Created',
            accessorKey: 'created_at' as keyof Subscription,
            cell: (subscription: Subscription) => new Date(subscription.created_at).toLocaleDateString(),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Reports</h1>
                        <p className="text-muted-foreground">Analytics and insights for your business</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleExport('customers')}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Customers
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('subscriptions')}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Subscriptions
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_customers.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{stats.customers_with_subscriptions} with subscriptions</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_subscriptions.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{stats.active_subscriptions} active</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_subscriptions.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                {((stats.active_subscriptions / stats.total_subscriptions) * 100).toFixed(1)}% of total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inactive Subscriptions</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.inactive_subscriptions.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                {((stats.inactive_subscriptions / stats.total_subscriptions) * 100).toFixed(1)}% of total
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts and Analytics */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Subscriptions by Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(subscriptionsByStatus).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={status === 'active' ? 'default' : 'secondary'}>{status}</Badge>
                                        </div>
                                        <div className="text-sm font-medium">{count.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Monthly Growth
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="mb-2 text-sm font-medium">Recent Months - Customers</h4>
                                    <div className="space-y-1">
                                        {Object.entries(monthlyGrowth.customers)
                                            .slice(-3)
                                            .map(([month, count]) => (
                                                <div key={month} className="flex justify-between text-sm">
                                                    <span>{month}</span>
                                                    <span className="font-medium">{count}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="mb-2 text-sm font-medium">Recent Months - Subscriptions</h4>
                                    <div className="space-y-1">
                                        {Object.entries(monthlyGrowth.subscriptions)
                                            .slice(-3)
                                            .map(([month, count]) => (
                                                <div key={month} className="flex justify-between text-sm">
                                                    <span>{month}</span>
                                                    <span className="font-medium">{count}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Data Tables */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Customers</CardTitle>
                            <CardDescription>Latest imported customer records</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={customerColumns} data={recentImports.recent_customers} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Subscriptions</CardTitle>
                            <CardDescription>Latest imported subscription records</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={subscriptionColumns} data={recentImports.recent_subscriptions} />
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common tasks and navigation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <Button asChild variant="outline">
                                <Link href="/admin/database-import">
                                    <Database className="mr-2 h-4 w-4" />
                                    Import Data
                                </Link>
                            </Button>
                            {userPermissions.includes('manage-users') && (
                                <Button asChild variant="outline">
                                    <Link href="/admin/users">
                                        <Users className="mr-2 h-4 w-4" />
                                        Manage Users
                                    </Link>
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => handleExport('customers')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Generate Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
