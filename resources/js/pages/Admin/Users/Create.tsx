import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Permission, Role } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
    roles: Role[];
    permissions: Permission[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'User Management', href: '/admin/users' },
    { title: 'Create User', href: '/admin/users/create' },
];

export default function CreateUser({ roles, permissions }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [] as string[],
        permissions: [] as string[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/users');
    };

    const handleRoleChange = (roleName: string, checked: boolean) => {
        if (checked) {
            setData('roles', [...data.roles, roleName]);
        } else {
            setData(
                'roles',
                data.roles.filter((role) => role !== roleName),
            );
        }
    };

    const handlePermissionChange = (permissionName: string, checked: boolean) => {
        if (checked) {
            setData('permissions', [...data.permissions, permissionName]);
        } else {
            setData(
                'permissions',
                data.permissions.filter((permission) => permission !== permissionName),
            );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/admin/users">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Create User</h1>
                        <p className="text-muted-foreground">Add a new user to the system</p>
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
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter full name"
                                    />
                                    <FormMessage>{errors.name}</FormMessage>
                                </FormField>

                                <FormField>
                                    <FormLabel htmlFor="email" required>
                                        Email
                                    </FormLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="Enter email address"
                                    />
                                    <FormMessage>{errors.email}</FormMessage>
                                </FormField>

                                <FormField>
                                    <FormLabel htmlFor="password" required>
                                        Password
                                    </FormLabel>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter password"
                                    />
                                    <FormMessage>{errors.password}</FormMessage>
                                </FormField>

                                <FormField>
                                    <FormLabel htmlFor="password_confirmation" required>
                                        Confirm Password
                                    </FormLabel>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Confirm password"
                                    />
                                    <FormMessage>{errors.password_confirmation}</FormMessage>
                                </FormField>

                                <div className="flex gap-4 pt-4">
                                    <Button type="submit" disabled={processing}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Creating...' : 'Create User'}
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
                                                checked={data.roles.includes(role.name)}
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
                                                checked={data.permissions.includes(permission.name)}
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
