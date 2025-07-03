import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Invitation, PaginatedData, Role } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, History, Mail, RefreshCcw, Search, Trash2, User, Users } from 'lucide-react';
import { useState } from 'react';

interface Props {
    invitations: PaginatedData<Invitation>;
    roles: Role[];
    filters: {
        search?: string;
        status?: string;
        role?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'User Management', href: '/admin/users' },
    { title: 'Invitation History', href: '/admin/users/invitation-history' },
];

export default function InvitationHistory({ invitations, roles, filters }: Props) {
    const { auth } = usePage().props as any;
    const userPermissions = auth?.user?.permissions || [];

    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedRole, setSelectedRole] = useState(filters.role || 'all');
    const [deleteInvitation, setDeleteInvitation] = useState<Invitation | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params: any = { search };

        // Only include status and role if they're not "all"
        if (selectedStatus !== 'all') {
            params.status = selectedStatus;
        }
        if (selectedRole !== 'all') {
            params.role = selectedRole;
        }

        router.get('/admin/users/invitation-history', params, {
            preserveState: true,
            replace: true,
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

    const getStatusBadge = (invitation: Invitation) => {
        const now = new Date();
        const expiresAt = new Date(invitation.expires_at);

        if (invitation.accepted_at) {
            return <Badge variant="default">Accepted</Badge>;
        } else if (expiresAt < now) {
            return <Badge variant="destructive">Expired</Badge>;
        } else {
            return <Badge variant="secondary">Pending</Badge>;
        }
    };

    const getStatusActions = (invitation: Invitation) => {
        const now = new Date();
        const expiresAt = new Date(invitation.expires_at);
            if (expiresAt < now) {
            return (
                <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleResendInvitation(invitation)} title="Resend invitation">
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteInvitation(invitation)}
                        className="text-destructive hover:text-destructive"
                        title="Delete invitation"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            );
        } else {
            return (
                <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleResendInvitation(invitation)} title="Resend invitation">
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteInvitation(invitation)}
                        className="text-destructive hover:text-destructive"
                        title="Cancel invitation"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            );
        }
    };

    const columns = [
        {
            header: 'Email',
            accessorKey: 'email' as keyof Invitation,
            cell: (invitation: Invitation) => (
                <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{invitation.email}</span>
                </div>
            ),
        },
        {
            header: 'Role',
            accessorKey: 'role' as keyof Invitation,
            cell: (invitation: Invitation) => <Badge variant="outline">{invitation.role}</Badge>,
        },
        {
            header: 'Invited By',
            accessorKey: 'inviter' as keyof Invitation,
            cell: (invitation: Invitation) => (
                <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{invitation.inviter?.name || 'Unknown'}</span>
                </div>
            ),
        },
        {
            header: 'Status',
            accessorKey: 'accepted_at' as keyof Invitation,
            cell: (invitation: Invitation) => getStatusBadge(invitation),
        },
        {
            header: 'Created',
            accessorKey: 'created_at' as keyof Invitation,
            cell: (invitation: Invitation) => (
                <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(invitation.created_at).toLocaleDateString()}</span>
                </div>
            ),
        },
        {
            header: 'Expires',
            accessorKey: 'expires_at' as keyof Invitation,
            cell: (invitation: Invitation) => (
                <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(invitation.expires_at).toLocaleDateString()}</span>
                </div>
            ),
        },
        {
            header: 'Actions',
            accessorKey: 'id' as keyof Invitation,
            cell: (invitation: Invitation) => getStatusActions(invitation),
        },
    ];

    const getInvitationStats = () => {
        const total = invitations.total;
        const pending = invitations.data.filter((inv) => !inv.accepted_at && new Date(inv.expires_at) > new Date()).length;
        const accepted = invitations.data.filter((inv) => inv.accepted_at).length;
        const expired = invitations.data.filter((inv) => !inv.accepted_at && new Date(inv.expires_at) <= new Date()).length;

        return { total, pending, accepted, expired };
    };

    const stats = getInvitationStats();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invitation History" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-3xl font-bold">
                            <History className="h-8 w-8" />
                            Invitation History
                        </h1>
                        <p className="text-muted-foreground">Manage and track all user invitations</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/admin/users">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Users
                            </Link>
                        </Button>
                        {userPermissions?.includes('manage-users') && (
                            <Button asChild>
                                <Link href="/admin/users/invite">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Invitation
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                            <div className="h-4 w-4 rounded-full bg-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expired</CardTitle>
                            <div className="h-4 w-4 rounded-full bg-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>Filter invitations by search term, status, and role</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1">
                                <Input placeholder="Search by email or inviter name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                            <div className="w-48">
                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="accepted">Accepted</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-48">
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.name}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit">
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Invitations Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Invitations ({invitations.total})</CardTitle>
                        <CardDescription>Complete history of all user invitations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={invitations.data} searchKey="email" searchPlaceholder="Search invitations..." />

                        {/* Pagination */}
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">
                                    Showing {invitations.from} to {invitations.to} of {invitations.total} invitations
                                </span>
                            </div>
                            <div className="space-x-2">
                                {invitations.prev_page_url && (
                                    <Button variant="outline" size="sm" onClick={() => router.visit(invitations.prev_page_url!)}>
                                        Previous
                                    </Button>
                                )}
                                {invitations.next_page_url && (
                                    <Button variant="outline" size="sm" onClick={() => router.visit(invitations.next_page_url!)}>
                                        Next
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete Invitation Confirmation Dialog */}
            <Dialog open={!!deleteInvitation} onOpenChange={() => setDeleteInvitation(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Invitation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the invitation for {deleteInvitation?.email}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteInvitation(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => deleteInvitation && handleDeleteInvitation(deleteInvitation)}>
                            Delete Invitation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
