import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Permission, Role } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Key, Pencil, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    roles: Role[];
    permissions: Permission[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Role & Permission Management', href: '/admin/roles-permissions' },
];

export default function RolePermissionsIndex({ roles, permissions }: Props) {
    const [showCreateRole, setShowCreateRole] = useState(false);
    const [showCreatePermission, setShowCreatePermission] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
    const [deleteRole, setDeleteRole] = useState<Role | null>(null);
    const [deletePermission, setDeletePermission] = useState<Permission | null>(null);

    const roleForm = useForm({
        name: '',
        permissions: [] as string[],
    });

    const permissionForm = useForm({
        name: '',
    });

    const editRoleForm = useForm({
        name: '',
        permissions: [] as string[],
    });

    const editPermissionForm = useForm({
        name: '',
    });

    const handleCreateRole = (e: React.FormEvent) => {
        e.preventDefault();
        roleForm.post('/admin/roles', {
            onSuccess: () => {
                roleForm.reset();
                setShowCreateRole(false);
            },
        });
    };

    const handleCreatePermission = (e: React.FormEvent) => {
        e.preventDefault();
        permissionForm.post('/admin/permissions', {
            onSuccess: () => {
                permissionForm.reset();
                setShowCreatePermission(false);
            },
        });
    };

    const handleEditRole = (role: Role) => {
        setEditingRole(role);
        editRoleForm.setData({
            name: role.name,
            permissions: role.permissions?.map((p) => p.name) || [],
        });
    };

    const handleUpdateRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole) return;

        editRoleForm.put(`/admin/roles/${editingRole.id}`, {
            onSuccess: () => {
                editRoleForm.reset();
                setEditingRole(null);
            },
        });
    };

    const handleEditPermission = (permission: Permission) => {
        setEditingPermission(permission);
        editPermissionForm.setData({
            name: permission.name,
        });
    };

    const handleUpdatePermission = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPermission) return;

        editPermissionForm.put(`/admin/permissions/${editingPermission.id}`, {
            onSuccess: () => {
                editPermissionForm.reset();
                setEditingPermission(null);
            },
        });
    };

    const handleDeleteRole = (role: Role) => {
        router.delete(`/admin/roles/${role.id}`, {
            onSuccess: () => setDeleteRole(null),
        });
    };

    const handleDeletePermission = (permission: Permission) => {
        router.delete(`/admin/permissions/${permission.id}`, {
            onSuccess: () => setDeletePermission(null),
        });
    };

    const handleRolePermissionChange = (permissionName: string, checked: boolean, form: any) => {
        if (checked) {
            form.setData('permissions', [...form.data.permissions, permissionName]);
        } else {
            form.setData(
                'permissions',
                form.data.permissions.filter((p: string) => p !== permissionName),
            );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role & Permission Management" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Role & Permission Management</h1>
                        <p className="text-muted-foreground">Manage system roles and permissions</p>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 md:mt-0 md:flex-row">
                        <Dialog open={showCreatePermission} onOpenChange={setShowCreatePermission}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full md:w-auto">
                                    <Key className="mr-2 h-4 w-4" />
                                    Add Permission
                                </Button>
                            </DialogTrigger>
                        </Dialog>
                        <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
                            <DialogTrigger asChild>
                                <Button className="w-full md:w-auto">
                                    <Shield className="mr-2 h-4 w-4" />
                                    Add Role
                                </Button>
                            </DialogTrigger>
                        </Dialog>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Roles Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Roles ({roles.length})
                            </CardTitle>
                            <CardDescription>Manage user roles and their permissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {roles.map((role) => (
                                    <div key={role.id} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex-1">
                                            <h4 className="font-medium">{role.name}</h4>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {role.permissions?.map((permission) => (
                                                    <Badge key={permission.id} variant="secondary" className="text-xs">
                                                        {permission.name}
                                                    </Badge>
                                                )) || <span className="text-sm text-muted-foreground">No permissions</span>}
                                            </div>
                                        </div>
                                        <div className="ml-4 flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteRole(role)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {roles.length === 0 && <p className="py-8 text-center text-muted-foreground">No roles found</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permissions Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Permissions ({permissions.length})
                            </CardTitle>
                            <CardDescription>Manage system permissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {permissions.map((permission) => (
                                    <div key={permission.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <span className="font-medium">{permission.name}</span>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditPermission(permission)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeletePermission(permission)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {permissions.length === 0 && <p className="py-8 text-center text-muted-foreground">No permissions found</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Create Role Dialog */}
            <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Role</DialogTitle>
                        <DialogDescription>Create a new role and assign permissions to it.</DialogDescription>
                    </DialogHeader>
                    <Form onSubmit={handleCreateRole}>
                        <FormField>
                            <FormLabel htmlFor="role-name" required>
                                Role Name
                            </FormLabel>
                            <Input
                                id="role-name"
                                value={roleForm.data.name}
                                onChange={(e) => roleForm.setData('name', e.target.value)}
                                placeholder="Enter role name"
                            />
                            <FormMessage>{roleForm.errors.name}</FormMessage>
                        </FormField>

                        <FormField>
                            <FormLabel>Permissions</FormLabel>
                            <div className="grid max-h-64 grid-cols-2 gap-3 overflow-y-auto rounded-lg border p-4">
                                {permissions.map((permission) => (
                                    <div key={permission.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`create-permission-${permission.id}`}
                                            checked={roleForm.data.permissions.includes(permission.name)}
                                            onCheckedChange={(checked) => handleRolePermissionChange(permission.name, checked as boolean, roleForm)}
                                        />
                                        <Label htmlFor={`create-permission-${permission.id}`} className="text-sm">
                                            {permission.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <FormMessage>{roleForm.errors.permissions}</FormMessage>
                        </FormField>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreateRole(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={roleForm.processing}>
                                {roleForm.processing ? 'Creating...' : 'Create Role'}
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Role</DialogTitle>
                        <DialogDescription>Update role information and permissions.</DialogDescription>
                    </DialogHeader>
                    <Form onSubmit={handleUpdateRole}>
                        <FormField>
                            <FormLabel htmlFor="edit-role-name" required>
                                Role Name
                            </FormLabel>
                            <Input
                                id="edit-role-name"
                                value={editRoleForm.data.name}
                                onChange={(e) => editRoleForm.setData('name', e.target.value)}
                                placeholder="Enter role name"
                            />
                            <FormMessage>{editRoleForm.errors.name}</FormMessage>
                        </FormField>

                        <FormField>
                            <FormLabel>Permissions</FormLabel>
                            <div className="grid max-h-64 grid-cols-2 gap-3 overflow-y-auto rounded-lg border p-4">
                                {permissions.map((permission) => (
                                    <div key={permission.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`edit-permission-${permission.id}`}
                                            checked={editRoleForm.data.permissions.includes(permission.name)}
                                            onCheckedChange={(checked) =>
                                                handleRolePermissionChange(permission.name, checked as boolean, editRoleForm)
                                            }
                                        />
                                        <Label htmlFor={`edit-permission-${permission.id}`} className="text-sm">
                                            {permission.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <FormMessage>{editRoleForm.errors.permissions}</FormMessage>
                        </FormField>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingRole(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editRoleForm.processing}>
                                {editRoleForm.processing ? 'Updating...' : 'Update Role'}
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Create Permission Dialog */}
            <Dialog open={showCreatePermission} onOpenChange={setShowCreatePermission}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Permission</DialogTitle>
                        <DialogDescription>Create a new permission that can be assigned to roles.</DialogDescription>
                    </DialogHeader>
                    <Form onSubmit={handleCreatePermission}>
                        <FormField>
                            <FormLabel htmlFor="permission-name" required>
                                Permission Name
                            </FormLabel>
                            <Input
                                id="permission-name"
                                value={permissionForm.data.name}
                                onChange={(e) => permissionForm.setData('name', e.target.value)}
                                placeholder="Enter permission name (e.g., manage-reports)"
                            />
                            <FormMessage>{permissionForm.errors.name}</FormMessage>
                        </FormField>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreatePermission(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={permissionForm.processing}>
                                {permissionForm.processing ? 'Creating...' : 'Create Permission'}
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Edit Permission Dialog */}
            <Dialog open={!!editingPermission} onOpenChange={() => setEditingPermission(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Permission</DialogTitle>
                        <DialogDescription>Update permission information.</DialogDescription>
                    </DialogHeader>
                    <Form onSubmit={handleUpdatePermission}>
                        <FormField>
                            <FormLabel htmlFor="edit-permission-name" required>
                                Permission Name
                            </FormLabel>
                            <Input
                                id="edit-permission-name"
                                value={editPermissionForm.data.name}
                                onChange={(e) => editPermissionForm.setData('name', e.target.value)}
                                placeholder="Enter permission name"
                            />
                            <FormMessage>{editPermissionForm.errors.name}</FormMessage>
                        </FormField>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingPermission(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editPermissionForm.processing}>
                                {editPermissionForm.processing ? 'Updating...' : 'Update Permission'}
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Role Dialog */}
            <Dialog open={!!deleteRole} onOpenChange={() => setDeleteRole(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Role</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the role "{deleteRole?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteRole(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => deleteRole && handleDeleteRole(deleteRole)}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Permission Dialog */}
            <Dialog open={!!deletePermission} onOpenChange={() => setDeletePermission(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Permission</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the permission "{deletePermission?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletePermission(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => deletePermission && handleDeletePermission(deletePermission)}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
