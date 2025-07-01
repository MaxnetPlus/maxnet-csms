import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, User } from 'lucide-react';

interface Props {
    token: string;
}

interface AcceptInvitationForm {
    name: string;
    username: string;
    password: string;
    password_confirmation: string;
    [key: string]: any;
}

export default function AcceptInvitation({ token }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        username: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/invitation/accept/${token}`);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Head title="Accept Invitation" />

            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <Mail className="mx-auto h-12 w-12 text-primary" />
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">Accept Invitation</h2>
                    <p className="mt-2 text-sm text-gray-600">You've been invited to join our system. Please complete your profile to get started.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Complete Your Profile
                        </CardTitle>
                        <CardDescription>Fill in your details to create your account and accept the invitation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username">Username (Optional)</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Enter a username"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                />
                                {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                                <p className="text-xs text-muted-foreground">Username can only contain letters, numbers, and underscores.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required
                                />
                                {errors.password_confirmation && <p className="text-sm text-destructive">{errors.password_confirmation}</p>}
                            </div>

                            <Button type="submit" disabled={processing} className="w-full">
                                {processing ? 'Creating Account...' : 'Accept Invitation & Create Account'}
                            </Button>
                        </form>

                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link href="/login" className="text-primary hover:text-primary/80">
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
