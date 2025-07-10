import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Invitation, PaginatedData, Role, User } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, History, Mail, Pencil, Plus, RefreshCcw, Search, Trash2, UserPlus, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
    users: PaginatedData<User>;
    invitations: Invitation[];
    roles: Role[];
    filters: {
        search?: string;
        role?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'User Management', href: '/admin/users' },
];

export default function UsersIndex({ users, invitations, roles, filters }: Props) {
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];
    console.log('User Permissions:', userPermissions);
    const [search, setSearch] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [deleteInvitation, setDeleteInvitation] = useState<Invitation | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/users',
            { search, role: selectedRole },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = (user: User) => {
        router.delete(`/admin/users/${user.id}`, {
            onSuccess: () => setDeleteUser(null),
        });
    };

    const handleDeleteInvitation = (invitation: Invitation) => {
        router.delete(`/admin/users/invitations/${invitation.id}`, {
            onSuccess: () => setDeleteInvitation(null),
        });
    };

    const handleResendInvitation = (invitation: Invitation) => {
        router.post(`/admin/users/invitations/${invitation.id}/resend`);
    };

    const columns = [
        {
            header: 'Name',
            accessorKey: 'name' as keyof User,
            cell: (user: User) => (
                <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
            ),
        },
        {
            header: 'Roles',
            accessorKey: 'roles' as keyof User,
            cell: (user: User) => (
                <div className="flex flex-wrap gap-1">
                    {user.roles?.map((role) => (
                        <Badge key={role.id} variant="secondary">
                            {role.name}
                        </Badge>
                    )) || <span className="text-muted-foreground">No roles</span>}
                </div>
            ),
        },
        {
            header: 'Email Verified',
            accessorKey: 'email_verified_at' as keyof User,
            cell: (user: User) => (
                <Badge variant={user.email_verified_at ? 'default' : 'destructive'}>{user.email_verified_at ? 'Verified' : 'Unverified'}</Badge>
            ),
        },
        {
            header: 'Created',
            accessorKey: 'created_at' as keyof User,
            cell: (user: User) => new Date(user.created_at).toLocaleDateString(),
        },

        {
            header: 'Actions',
            accessorKey: 'id' as keyof User,
            cell: (user: User) =>
                userPermissions?.includes('manage-users') ? (
                    <div className="flex space-x-2">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/users/${user.id}`}>
                                <Eye className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/users/${user.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteUser(user)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ) : null,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">User Management</h1>
                        <p className="text-muted-foreground">Manage users and their permissions</p>
                    </div>
                    {userPermissions?.includes('manage-users') && (
                        <div className="flex gap-2">
                            <Button asChild variant="outline">
                                <Link href="/admin/users/invitation-history">
                                    <History className="mr-2 h-4 w-4" />
                                    Invitation History
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/admin/users/invite">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Invite User
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/admin/users/sso-pending">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Pending SSO Users
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/admin/users/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add User
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>Filter users by search term and role</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1">
                                <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                            <div className="w-48">
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                                >
                                    <option value="">All Roles</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.name}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button type="submit">
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Users ({users.total})</CardTitle>
                        <CardDescription>All users in the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={users.data} searchKey="name" searchPlaceholder="Search users..." />

                        {/* Pagination */}
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="space-x-2">
                                {users.prev_page_url && (
                                    <Button variant="outline" size="sm" onClick={() => router.visit(users.prev_page_url!)}>
                                        Previous
                                    </Button>
                                )}
                                {users.next_page_url && (
                                    <Button variant="outline" size="sm" onClick={() => router.visit(users.next_page_url!)}>
                                        Next
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Invitations */}
                {invitations && invitations.length > 0 && userPermissions?.includes('manage-users') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
                            <CardDescription>Users who have been invited but haven't accepted yet</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {invitations.map((invitation) => (
                                    <div key={invitation.id} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{invitation.email}</span>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>Role: {invitation.role}</span>
                                                <span>•</span>
                                                <span>Invited by: {invitation.inviter?.name}</span>
                                                <span>•</span>
                                                <span>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleResendInvitation(invitation)}
                                                title="Resend invitation"
                                            >
                                                <RefreshCcw className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteInvitation(invitation)}
                                                className="text-destructive hover:text-destructive"
                                                title="Cancel invitation"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>Are you sure you want to delete {deleteUser?.name}? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteUser(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => deleteUser && handleDelete(deleteUser)}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Invitation Confirmation Dialog */}
            <Dialog open={!!deleteInvitation} onOpenChange={() => setDeleteInvitation(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Invitation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel the invitation for {deleteInvitation?.email}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteInvitation(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => deleteInvitation && handleDeleteInvitation(deleteInvitation)}>
                            Cancel Invitation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
