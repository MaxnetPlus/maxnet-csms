import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Permission, Role, User } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
    user: User;
    roles: Role[];
    permissions: Permission[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'User Management', href: '/admin/users' },
    { title: 'Edit User', href: '#' },
];

export default function EditUser({ user, roles, permissions }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        username: user.username || '',
        email: user.email,
        password: '',
        password_confirmation: '',
        roles: user.roles?.map((role) => role.name) || [],
        permissions: user.permissions?.map((permission) => permission.name) || [],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/users/${user.id}`);
    };

    const handleRoleChange = (roleName: string, checked: boolean) => {
        const currentRoles = data.roles as string[];
        if (checked) {
            setData('roles', [...currentRoles, roleName]);
        } else {
            setData(
                'roles',
                currentRoles.filter((role) => role !== roleName),
            );
        }
    };

    const handlePermissionChange = (permissionName: string, checked: boolean) => {
        const currentPermissions = data.permissions as string[];
        if (checked) {
            setData('permissions', [...currentPermissions, permissionName]);
        } else {
            setData(
                'permissions',
                currentPermissions.filter((permission) => permission !== permissionName),
            );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit User - ${user.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/admin/users">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Edit User</h1>
                        <p className="text-muted-foreground">Update user information and permissions</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form onSubmit={submit}>
                                <FormField>
                                    <FormLabel htmlFor="name" required>
                                        Name
                                    </FormLabel>
                                    <Input
                                        id="name"
                                        value={data.name as string}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter full name"
                                    />
                                    <FormMessage>{errors.name}</FormMessage>
                                </FormField>

                                <FormField>
                                    <FormLabel htmlFor="username">Username</FormLabel>
                                    <Input
                                        id="username"
                                        value={data.username as string}
                                        onChange={(e) => setData('username', e.target.value)}
                                        placeholder="Enter username (optional)"
                                    />
                                    <FormMessage>{errors.username}</FormMessage>
                                </FormField>

                                <FormField>
                                    <FormLabel htmlFor="email" required>
                                        Email
                                    </FormLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email as string}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="Enter email address"
                                    />
                                    <FormMessage>{errors.email}</FormMessage>
                                </FormField>

                                <FormField>
                                    <FormLabel htmlFor="password">New Password</FormLabel>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password as string}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Leave blank to keep current password"
                                    />
                                    <FormMessage type="description">Leave blank to keep current password</FormMessage>
                                    <FormMessage>{errors.password}</FormMessage>
                                </FormField>

                                {data.password && (
                                    <FormField>
                                        <FormLabel htmlFor="password_confirmation" required>
                                            Confirm New Password
                                        </FormLabel>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation as string}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder="Confirm new password"
                                        />
                                        <FormMessage>{errors.password_confirmation}</FormMessage>
                                    </FormField>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <Button type="submit" disabled={processing}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Updating...' : 'Update User'}
                                    </Button>
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/admin/users">Cancel</Link>
                                    </Button>
                                </div>
                            </Form>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Roles</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {roles.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`role-${role.id}`}
                                                checked={(data.roles as string[]).includes(role.name)}
                                                onCheckedChange={(checked) => handleRoleChange(role.name, checked as boolean)}
                                            />
                                            <Label htmlFor={`role-${role.id}`} className="text-sm font-medium">
                                                {role.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <FormMessage>{errors.roles}</FormMessage>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Permissions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-64 space-y-3 overflow-y-auto">
                                    {permissions.map((permission) => (
                                        <div key={permission.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`permission-${permission.id}`}
                                                checked={(data.permissions as string[]).includes(permission.name)}
                                                onCheckedChange={(checked) => handlePermissionChange(permission.name, checked as boolean)}
                                            />
                                            <Label htmlFor={`permission-${permission.id}`} className="text-sm font-medium">
                                                {permission.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <FormMessage>{errors.permissions}</FormMessage>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
