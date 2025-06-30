import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, User } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Key, Mail, Pencil, Shield } from 'lucide-react';

interface Props {
    user: User;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'User Management', href: '/admin/users' },
    { title: 'User Details', href: '#' },
];

export default function ShowUser({ user }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`User - ${user.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" asChild>
                            <Link href="/admin/users">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Users
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">{user.name}</h1>
                            <p className="text-muted-foreground">User details and permissions</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href={`/admin/users/${user.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit User
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                User Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Name</label>
                                <p className="text-lg font-medium">{user.name}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                <p className="text-lg">{user.email}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Email Status</label>
                                <div className="mt-1">
                                    <Badge variant={user.email_verified_at ? 'default' : 'destructive'}>
                                        {user.email_verified_at ? 'Verified' : 'Unverified'}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <p>
                                        {new Date(user.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <p>
                                        {new Date(user.updated_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Roles
                                </CardTitle>
                                <CardDescription>User roles that grant collections of permissions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {user.roles && user.roles.length > 0 ? (
                                    <div className="space-y-3">
                                        {user.roles.map((role) => (
                                            <div key={role.id} className="flex items-center justify-between rounded-lg border p-3">
                                                <div>
                                                    <h4 className="font-medium">{role.name}</h4>
                                                    {role.permissions && (
                                                        <p className="text-sm text-muted-foreground">{role.permissions.length} permissions</p>
                                                    )}
                                                </div>
                                                <Badge variant="secondary">{role.name}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No roles assigned</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    Direct Permissions
                                </CardTitle>
                                <CardDescription>Additional permissions granted directly to this user</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {user.permissions && user.permissions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {user.permissions.map((permission) => (
                                            <Badge key={permission.id} variant="outline">
                                                {permission.name}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No direct permissions assigned</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* All permissions (from roles + direct) */}
                        <Card>
                            <CardHeader>
                                <CardTitle>All Permissions</CardTitle>
                                <CardDescription>All permissions available to this user (from roles and direct assignments)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    const allPermissions = new Set<string>();

                                    // Add permissions from roles
                                    user.roles?.forEach((role) => {
                                        role.permissions?.forEach((permission) => {
                                            allPermissions.add(permission.name);
                                        });
                                    });

                                    // Add direct permissions
                                    user.permissions?.forEach((permission) => {
                                        allPermissions.add(permission.name);
                                    });

                                    const permissionArray = Array.from(allPermissions);

                                    return permissionArray.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {permissionArray.map((permission) => (
                                                <Badge key={permission} variant="default">
                                                    {permission}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No permissions available</p>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
