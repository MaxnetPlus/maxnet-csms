import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, FileText, Mail, Phone, Settings, User, UserPlus } from 'lucide-react';
import { useState } from 'react';
import CreateFollowUpDialog from './CreateFollowUpDialog';

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
    customer: {
        customer_id: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
    };
    subscription: {
        subscription_id: string;
        subscription_description: string;
    } | null;
}

interface MaintenanceShowProps {
    maintenance: Maintenance;
    [key: string]: any;
}

export default function Show() {
    const { maintenance } = usePage<MaintenanceShowProps>().props;
    const [showCreateFollowUpDialog, setShowCreateFollowUpDialog] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'open':
                return 'bg-red-100 text-red-800';
            case 'closed':
                return 'bg-green-100 text-green-800';
            case 'in progress':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (error) {
            return '-';
        }
    };

    const handleBack = () => {
        router.visit(route('admin.maintenances.index'));
    };

    const handleCreateFollowUp = () => {
        setShowCreateFollowUpDialog(true);
    };

    const handleFollowUpCreated = () => {
        setShowCreateFollowUpDialog(false);
        // Optionally refresh the page or show success message
        router.reload();
    };

    return (
        <AppLayout>
            <Head title={`Maintenance Ticket ${maintenance.ticket_id}`} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={handleBack} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Maintenance List
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Maintenance Ticket {maintenance.ticket_id}</h1>
                            <p className="text-sm text-gray-600">Created on {formatDate(maintenance.created_at)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(maintenance.status)}>{maintenance.status || 'Unknown'}</Badge>
                        <Button onClick={handleCreateFollowUp} className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Create Follow Up
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Ticket Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Ticket Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Ticket ID</label>
                                    <p className="font-mono text-lg">{maintenance.ticket_id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Status</label>
                                    <div className="mt-1">
                                        <Badge className={getStatusColor(maintenance.status)}>{maintenance.status || 'Unknown'}</Badge>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <label className="text-sm font-medium text-gray-600">Subject Problem</label>
                                <p className="mt-1">{maintenance.subject_problem || '-'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">Customer Report</label>
                                <p className="mt-1 text-sm whitespace-pre-wrap text-gray-700">{maintenance.customer_report || '-'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">Technician Update</label>
                                <p className="mt-1 text-sm whitespace-pre-wrap text-gray-700">{maintenance.technician_update_desc || '-'}</p>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Work By</label>
                                    <p className="mt-1">{maintenance.work_by || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Created By</label>
                                    <p className="mt-1">{maintenance.created_by || '-'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Created Date</label>
                                    <p className="mt-1 text-sm">{formatDate(maintenance.created_at)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Close Date</label>
                                    <p className="mt-1 text-sm">{formatDate(maintenance.ticket_close_date)}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">Last Updated</label>
                                <p className="mt-1 text-sm">{formatDate(maintenance.updated_at)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Information */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Customer Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Customer ID</label>
                                    <p className="mt-1 font-mono">{maintenance.customer?.customer_id || '-'}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Customer Name</label>
                                    <p className="mt-1 font-semibold">{maintenance.customer?.customer_name || '-'}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Email</label>
                                        <p className="text-sm">{maintenance.customer?.customer_email || '-'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Phone</label>
                                        <p className="text-sm">{maintenance.customer?.customer_phone || '-'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Subscription Information */}
                        {maintenance.subscription && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5" />
                                        Subscription Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Subscription ID</label>
                                        <p className="mt-1 font-mono">{maintenance.subscription.subscription_id}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Description</label>
                                        <p className="mt-1">{maintenance.subscription.subscription_description || '-'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Follow Up Dialog */}
            <CreateFollowUpDialog
                isOpen={showCreateFollowUpDialog}
                onClose={() => setShowCreateFollowUpDialog(false)}
                maintenance={maintenance}
                onFollowUpCreated={handleFollowUpCreated}
            />
        </AppLayout>
    );
}
