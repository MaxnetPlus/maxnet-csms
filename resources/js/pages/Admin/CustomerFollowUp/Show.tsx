import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle, Clock, User } from 'lucide-react';

interface User {
    id: number;
    name: string;
}

interface Customer {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
}

interface Subscription {
    subscription_id: string;
    subscription_description: string;
    subscription_address: string;
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
    updated_at: string;
    customer?: Customer;
    subscription?: Subscription;
    creator?: User;
    assignee?: User;
    is_overdue?: boolean;
}

interface Props {
    followUp: CustomerFollowUp;
}

const statusConfig = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
} as const;

const priorityConfig = {
    low: { label: 'Low', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
    medium: { label: 'Medium', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    high: { label: 'High', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
} as const;

export default function Show({ followUp }: Props) {
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
            <Head title={`Follow Up #${followUp.id}`} />

            <div className="container mx-auto space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route('admin.follow-ups.index')}
                        className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Follow Ups
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">Follow Up Details</h1>
                        <p className="text-muted-foreground">Follow Up #{followUp.id}</p>
                    </div>
                    <Link href={route('admin.follow-ups.edit', followUp.id)}>
                        <Button>Edit Follow Up</Button>
                    </Link>
                </div>

                {/* Status Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <span>Status Overview</span>
                            {followUp.is_overdue && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                            <div>
                                <p className="mb-2 text-sm font-medium">Current Status</p>
                                <Badge className={statusConfig[followUp.status as keyof typeof statusConfig]?.className}>
                                    {statusConfig[followUp.status as keyof typeof statusConfig]?.label}
                                </Badge>
                                {followUp.is_overdue && <p className="mt-1 text-xs text-red-600">⚠️ Overdue</p>}
                            </div>
                            <div>
                                <p className="mb-2 text-sm font-medium">Priority</p>
                                <Badge className={priorityConfig[followUp.priority as keyof typeof priorityConfig]?.className}>
                                    {priorityConfig[followUp.priority as keyof typeof priorityConfig]?.label}
                                </Badge>
                            </div>
                            <div>
                                <p className="mb-2 text-sm font-medium">Assigned To</p>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>{followUp.assignee?.name || 'Not assigned'}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Customer & Subscription Info */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Customer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium">Customer Name</p>
                                <p className="text-sm text-muted-foreground">{followUp.customer?.customer_name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Customer ID</p>
                                <p className="text-sm text-muted-foreground">{followUp.customer_id}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Email</p>
                                <p className="text-sm text-muted-foreground">{followUp.customer?.customer_email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Phone</p>
                                <p className="text-sm text-muted-foreground">{followUp.customer?.customer_phone || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {followUp.subscription && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Subscription Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium">Subscription ID</p>
                                    <p className="text-sm text-muted-foreground">{followUp.subscription_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Description</p>
                                    <p className="text-sm text-muted-foreground">{followUp.subscription.subscription_description || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Address</p>
                                    <p className="text-sm text-muted-foreground">{followUp.subscription.subscription_address || 'N/A'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Follow Up Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Follow Up Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <p className="mb-2 text-sm font-medium">Description</p>
                            <div className="rounded-md bg-muted p-3">
                                <p className="text-sm">{followUp.description}</p>
                            </div>
                        </div>

                        {followUp.notes && (
                            <div>
                                <p className="mb-2 text-sm font-medium">Notes</p>
                                <div className="rounded-md bg-muted p-3">
                                    <p className="text-sm">{followUp.notes}</p>
                                </div>
                            </div>
                        )}

                        {followUp.resolution && (
                            <div>
                                <p className="mb-2 text-sm font-medium">Resolution</p>
                                <div className="rounded-md border border-green-200 bg-green-50 p-3">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                                        <p className="text-sm">{followUp.resolution}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="mb-1 text-sm font-medium">Created At</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">{formatDate(followUp.created_at)}</p>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">by {followUp.creator?.name}</p>
                            </div>

                            {followUp.completed_at && (
                                <div>
                                    <p className="mb-1 text-sm font-medium">Completed At</p>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <p className="text-sm text-muted-foreground">{formatDate(followUp.completed_at)}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="mb-1 text-sm font-medium">Last Updated</p>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">{formatDate(followUp.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
