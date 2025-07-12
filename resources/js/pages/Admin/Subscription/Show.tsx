import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    ArrowLeft,
    Calendar,
    MapPin,
    Phone,
    Mail,
    User,
    CreditCard,
    Settings,
    Clock,
    Wifi
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Subscription, Customer } from '@/types';

interface Props {
    subscription: Subscription & { customer?: Customer };
}

const statusConfig = {
    ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    CANCELED: { label: 'Canceled', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    SUSPEND: { label: 'Suspended', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    DISMANTLE: { label: 'Dismantled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
} as const;

export default function Show({ subscription }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout>
            <Head title={`Subscription ${subscription.subscription_id}`} />
            
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link 
                        href={route('admin.subscriptions.index')}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Subscriptions
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Subscription Details</h1>
                        <p className="text-muted-foreground">
                            View detailed information about subscription {subscription.subscription_id}
                        </p>
                    </div>
                </div>

                {/* Status and Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Status & Basic Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div className="mt-1">
                                    <Badge 
                                        className={statusConfig[subscription.subscription_status as keyof typeof statusConfig]?.className}
                                    >
                                        {statusConfig[subscription.subscription_status as keyof typeof statusConfig]?.label || subscription.subscription_status}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Subscription ID</label>
                                <div className="mt-1 font-mono text-sm">{subscription.subscription_id}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Service ID</label>
                                <div className="mt-1 font-mono text-sm">{subscription.serv_id}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Group</label>
                                <div className="mt-1">
                                    <Badge variant="secondary">{subscription.group || 'N/A'}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Customer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                                <div className="mt-1 font-medium">{subscription.customer?.customer_name || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    {subscription.customer?.customer_email || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {subscription.customer?.customer_phone || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Customer ID</label>
                                <div className="mt-1 font-mono text-sm">{subscription.customer_id}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Billing Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Price</label>
                                <div className="mt-1 text-lg font-semibold">
                                    {subscription.subscription_price ? formatCurrency(Number(subscription.subscription_price)) : 'N/A'}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Billing Cycle</label>
                                <div className="mt-1">{subscription.subscription_billing_cycle || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {subscription.subscription_start_date ? formatDate(subscription.subscription_start_date) : 'N/A'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Location and Technical Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Location & Installation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Address</label>
                                <div className="mt-1">{subscription.subscription_address || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Maps Coordinates</label>
                                <div className="mt-1 font-mono text-sm">{subscription.subscription_maps || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                <div className="mt-1">{subscription.subscription_description || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Installed By</label>
                                <div className="mt-1">{subscription.installed_by || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">ODP Distance</label>
                                <div className="mt-1">{subscription.odp_distance || 'N/A'}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wifi className="h-5 w-5" />
                                Technical Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">CPE Type</label>
                                <div className="mt-1">{subscription.cpe_type || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">CPE Serial</label>
                                <div className="mt-1 font-mono text-sm">{subscription.cpe_serial || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">CPE MAC</label>
                                <div className="mt-1 font-mono text-sm">{subscription.cpe_mac || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">CPE Site</label>
                                <div className="mt-1">{subscription.cpe_site || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                                <div className="mt-1 font-mono text-sm">{subscription.ip_address || 'N/A'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Is CPE Rent</label>
                                <div className="mt-1">
                                    <Badge variant={subscription.is_cpe_rent ? "default" : "secondary"}>
                                        {subscription.is_cpe_rent ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Timeline Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                <div className="mt-1 text-sm">{formatDate(subscription.created_at)}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Approved At</label>
                                <div className="mt-1 text-sm">
                                    {subscription.approved_at ? formatDate(subscription.approved_at) : 'Not approved'}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Installed At</label>
                                <div className="mt-1 text-sm">
                                    {subscription.installed_at ? formatDate(subscription.installed_at) : 'Not installed'}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                <div className="mt-1 text-sm">{formatDate(subscription.updated_at)}</div>
                            </div>
                            {subscription.suspend_at && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Suspended At</label>
                                    <div className="mt-1 text-sm">{formatDate(subscription.suspend_at)}</div>
                                </div>
                            )}
                            {subscription.dismantle_at && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Dismantled At</label>
                                    <div className="mt-1 text-sm">{formatDate(subscription.dismantle_at)}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Information */}
                {(subscription.subscription_test_result || subscription.handle_by || subscription.created_by) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {subscription.subscription_test_result && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Test Result</label>
                                        <div className="mt-1">{subscription.subscription_test_result}</div>
                                    </div>
                                )}
                                {subscription.handle_by && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Handled By</label>
                                        <div className="mt-1">{subscription.handle_by}</div>
                                    </div>
                                )}
                                {subscription.created_by && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Created By</label>
                                        <div className="mt-1">{subscription.created_by}</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
