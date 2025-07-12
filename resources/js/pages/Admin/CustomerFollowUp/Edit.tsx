import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Save, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface User {
    id: number;
    name: string;
}

interface Customer {
    customer_id: string;
    customer_name: string;
    customer_email: string;
}

interface Subscription {
    subscription_id: string;
    subscription_description: string;
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
    customer?: Customer;
    subscription?: Subscription;
    assignee?: User;
}

interface Props {
    followUp: CustomerFollowUp;
    customers: Customer[];
    users: User[];
}

const statusConfig = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
} as const;

export default function Edit({ followUp, customers, users }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        customer_id: followUp.customer_id,
        subscription_id: followUp.subscription_id || '',
        priority: followUp.priority,
        status: followUp.status,
        description: followUp.description,
        notes: followUp.notes || '',
        resolution: followUp.resolution || '',
        assigned_to: followUp.assignee?.id?.toString() || 'unassigned',
    });

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(followUp.customer || null);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');

    // Filter customers based on search term
    const filteredCustomers = useMemo(() => {
        if (!customerSearchTerm) return customers.slice(0, 50); // Show first 50 by default

        return customers
            .filter(
                (customer) =>
                    customer.customer_name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                    customer.customer_id.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                    customer.customer_email.toLowerCase().includes(customerSearchTerm.toLowerCase()),
            )
            .slice(0, 20); // Limit to 20 results when searching
    }, [customers, customerSearchTerm]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.follow-ups.update', followUp.id));
    };

    const handleCustomerChange = (customerId: string) => {
        const customer = customers.find((c) => c.customer_id === customerId);
        setSelectedCustomer(customer || null);
        setData('customer_id', customerId);
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
            <Head title={`Edit Follow Up #${followUp.id}`} />

            <div className="container mx-auto space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route('admin.follow-ups.show', followUp.id)}
                        className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Details
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Edit Follow Up</h1>
                        <p className="text-muted-foreground">Follow Up #{followUp.id}</p>
                    </div>
                </div>

                {/* Current Status Info */}
                <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            Current Status
                            <Badge className={statusConfig[followUp.status as keyof typeof statusConfig]?.className}>
                                {statusConfig[followUp.status as keyof typeof statusConfig]?.label}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Created</p>
                                    <p className="text-sm">{formatDate(followUp.created_at)}</p>
                                </div>
                            </div>
                            {followUp.completed_at && (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Completed</p>
                                        <p className="text-sm">{formatDate(followUp.completed_at)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Follow Up Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Customer Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="customer_id">Customer *</Label>
                                    <div className="relative">
                                        <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search customers..."
                                            value={customerSearchTerm}
                                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                            className="mb-2 pl-9"
                                        />
                                    </div>
                                    <Select value={data.customer_id} onValueChange={handleCustomerChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select customer" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px] overflow-y-auto">
                                            {filteredCustomers.length === 0 ? (
                                                <div className="px-2 py-3 text-sm text-muted-foreground">No customers found</div>
                                            ) : (
                                                filteredCustomers.map((customer) => (
                                                    <SelectItem key={customer.customer_id} value={customer.customer_id}>
                                                        {customer.customer_name} ({customer.customer_id})
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.customer_id && <p className="text-sm text-red-600">{errors.customer_id}</p>}
                                    {customerSearchTerm && filteredCustomers.length > 0 && (
                                        <p className="text-xs text-muted-foreground">Showing {filteredCustomers.length} result(s)</p>
                                    )}
                                </div>

                                {/* Subscription ID */}
                                <div className="space-y-2">
                                    <Label htmlFor="subscription_id">Subscription ID (Optional)</Label>
                                    <Input
                                        id="subscription_id"
                                        value={data.subscription_id}
                                        onChange={(e) => setData('subscription_id', e.target.value)}
                                        placeholder="Enter subscription ID"
                                    />
                                    {errors.subscription_id && <p className="text-sm text-red-600">{errors.subscription_id}</p>}
                                </div>

                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority *</Label>
                                    <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.priority && <p className="text-sm text-red-600">{errors.priority}</p>}
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
                                </div>

                                {/* Assigned To */}
                                <div className="space-y-2">
                                    <Label htmlFor="assigned_to">Assigned To</Label>
                                    <Select value={data.assigned_to} onValueChange={(value) => setData('assigned_to', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Not Assigned</SelectItem>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.assigned_to && <p className="text-sm text-red-600">{errors.assigned_to}</p>}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                                    placeholder="Describe the follow up requirement..."
                                    rows={4}
                                />
                                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Additional Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('notes', e.target.value)}
                                    placeholder="Any additional notes..."
                                    rows={3}
                                />
                                {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
                            </div>

                            {/* Resolution */}
                            <div className="space-y-2">
                                <Label htmlFor="resolution">Resolution</Label>
                                <Textarea
                                    id="resolution"
                                    value={data.resolution}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('resolution', e.target.value)}
                                    placeholder="Describe the resolution (if completed)..."
                                    rows={3}
                                />
                                {errors.resolution && <p className="text-sm text-red-600">{errors.resolution}</p>}
                            </div>

                            {/* Customer Info Preview */}
                            {selectedCustomer && (
                                <Card className="bg-muted/50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Customer Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                            <div>
                                                <p className="text-sm font-medium">Name</p>
                                                <p className="text-sm text-muted-foreground">{selectedCustomer.customer_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Email</p>
                                                <p className="text-sm text-muted-foreground">{selectedCustomer.customer_email || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Customer ID</p>
                                                <p className="text-sm text-muted-foreground">{selectedCustomer.customer_id}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Submit Buttons */}
                            <div className="flex items-center gap-4 pt-6">
                                <Button type="submit" disabled={processing} className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Updating...' : 'Update Follow Up'}
                                </Button>
                                <Link href={route('admin.follow-ups.show', followUp.id)}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
