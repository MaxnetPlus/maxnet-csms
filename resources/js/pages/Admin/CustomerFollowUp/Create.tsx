import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';

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
    customer?: Customer;
}

interface Props {
    customers: Customer[];
    users: User[];
    subscription?: Subscription;
}

export default function Create({ customers, users, subscription }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        customer_id: subscription?.customer?.customer_id || '',
        subscription_id: subscription?.subscription_id || '',
        priority: 'medium',
        description: '',
        notes: '',
        assigned_to: 'unassigned',
    });

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(subscription?.customer || null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.follow-ups.store'));
    };

    const handleCustomerChange = (customerId: string) => {
        const customer = customers.find((c) => c.customer_id === customerId);
        setSelectedCustomer(customer || null);
        setData('customer_id', customerId);
    };

    return (
        <AppLayout>
            <Head title="Create Follow Up" />

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
                    <div>
                        <h1 className="text-3xl font-bold">Create Follow Up</h1>
                        <p className="text-muted-foreground">Create a new customer follow up</p>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Follow Up Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Customer Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="customer_id">Customer *</Label>
                                    <Select value={data.customer_id} onValueChange={handleCustomerChange} disabled={!!subscription}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.customer_id} value={customer.customer_id}>
                                                    {customer.customer_name} ({customer.customer_id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.customer_id && <p className="text-sm text-red-600">{errors.customer_id}</p>}
                                </div>

                                {/* Subscription ID */}
                                <div className="space-y-2">
                                    <Label htmlFor="subscription_id">Subscription ID (Optional)</Label>
                                    <Input
                                        id="subscription_id"
                                        value={data.subscription_id}
                                        onChange={(e) => setData('subscription_id', e.target.value)}
                                        placeholder="Enter subscription ID"
                                        disabled={!!subscription}
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
                                <Label htmlFor="description">Description</Label>
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

                            {/* Subscription Info Preview */}
                            {subscription && (
                                <Card className="bg-muted/50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Subscription Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                            <div>
                                                <p className="text-sm font-medium">Subscription ID</p>
                                                <p className="text-sm text-muted-foreground">{subscription.subscription_id}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Description</p>
                                                <p className="text-sm text-muted-foreground">{subscription.subscription_description || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Submit Buttons */}
                            <div className="flex items-center gap-4 pt-6">
                                <Button type="submit" disabled={processing} className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Creating...' : 'Create Follow Up'}
                                </Button>
                                <Link href={route('admin.follow-ups.index')}>
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
