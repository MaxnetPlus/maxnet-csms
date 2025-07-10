import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PaginatedData, User } from '@/types';

interface Props {
    pendingUsers: PaginatedData<User>;
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'User Management', href: '/admin/users' },
    { title: 'Pending SSO Users', href: '/admin/users/sso-pending' },
];

export default function PendingSSOUsers({ pendingUsers, filters }: Props) {
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];
    const [search, setSearch] = useState(filters.search || '');
    const [rejectUser, setRejectUser] = useState<User | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/users/sso-pending',
            { search },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleApprove = (user: User) => {
        router.post(`/admin/users/${user.id}/approve`);
    };

    const handleReject = (user: User) => {
        router.post(
            `/admin/users/${user.id}/reject`,
            {},
            {
                onSuccess: () => setRejectUser(null),
            },
        );
    };

    const columns = [
        {
            header: 'Name',
            accessorKey: 'name' as keyof User,
            cell: (user: User) => (
                <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                    {user.username && <span className="text-xs text-muted-foreground">@{user.username}</span>}
                </div>
            ),
        },
        {
            header: 'Department',
            accessorKey: 'department' as keyof User,
            cell: (user: User) => user.department || <span className="text-muted-foreground">-</span>,
        },
        {
            header: 'Phone',
            accessorKey: 'phone_number' as keyof User,
            cell: (user: User) => user.phone_number || <span className="text-muted-foreground">-</span>,
        },
        {
            header: 'Registered',
            accessorKey: 'created_at' as keyof User,
            cell: (user: User) => new Date(user.created_at).toLocaleDateString(),
        },
        {
            header: 'Actions',
            accessorKey: 'id' as keyof User,
            cell: (user: User) =>
                userPermissions?.includes('manage-users') ? (
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleApprove(user)}>
                            Approve
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setRejectUser(user)}>
                            Reject
                        </Button>
                    </div>
                ) : null,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pending SSO Users" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Pending SSO Users</h1>
                        <p className="text-muted-foreground">Approve or reject users who registered via SSO</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={route('admin.users.index')}>Back to Users</Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>Search pending SSO users</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, email or username..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <Button type="submit">Search</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pending SSO Users ({pendingUsers.total})</CardTitle>
                        <CardDescription>Users who registered via SSO and are waiting for approval</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={pendingUsers.data} searchKey="name" searchPlaceholder="Filter users..." />

                        {pendingUsers.data.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8">
                                <p className="text-muted-foreground">No pending SSO users found</p>
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {pendingUsers.from || 0} to {pendingUsers.to || 0} of {pendingUsers.total} users
                            </div>
                            <div className="flex items-center space-x-6 lg:space-x-8">
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium">Rows per page</p>
                                    <select className="h-8 w-16 rounded-md border border-input bg-transparent text-sm" value="10" onChange={() => {}}>
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                    </select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => pendingUsers.prev_page_url && router.get(pendingUsers.prev_page_url)}
                                        disabled={!pendingUsers.prev_page_url}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => pendingUsers.next_page_url && router.get(pendingUsers.next_page_url)}
                                        disabled={!pendingUsers.next_page_url}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reject Confirmation Dialog */}
            <Dialog open={!!rejectUser} onOpenChange={() => setRejectUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject SSO User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject {rejectUser?.name}? This action cannot be undone and will delete the user's account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectUser(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => rejectUser && handleReject(rejectUser)}>
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
