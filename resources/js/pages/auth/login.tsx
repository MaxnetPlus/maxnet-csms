import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    login: string;
    password: string;
    remember: boolean;
};

type SSOLoginForm = {
    usernameOrEmail: string;
    password: string;
};

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
}

export default function Login({ status, canResetPassword = true }: LoginProps) {
    const [activeTab, setActiveTab] = useState<string>('standard');

    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        login: '',
        password: '',
        remember: false,
    });

    const ssoForm = useForm<SSOLoginForm>({
        usernameOrEmail: '',
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        console.log('Login route:', route('login'));
        console.log('Form data:', data);

        post(route('login'), {
            onFinish: () => reset('password'),
            onError: (errors) => {
                console.error('Login errors:', errors);
            },
            onSuccess: () => {
                console.log('Login successful');
            },
        });
    };

    const submitSSO: FormEventHandler = (e) => {
        e.preventDefault();

        console.log('SSO Login route:', route('sso.login'));
        console.log('SSO Form data:', ssoForm.data);

        ssoForm.post(route('sso.login'), {
            onFinish: () => ssoForm.reset('password'),
            onError: (errors) => {
                console.error('SSO Login errors:', errors);
            },
            onSuccess: () => {
                console.log('SSO Login successful');
            },
        });
    };

    return (
        <AuthLayout title="" description="Enter your credentials to log in">
            <Head title="Log in" />

            <Tabs defaultValue="standard" className="w-full" onValueChange={setActiveTab} value={activeTab}>
                <TabsList className="mb-6 grid w-full grid-cols-2">
                    <TabsTrigger value="standard">Standard Login</TabsTrigger>
                    <TabsTrigger value="sso">MaxNet SSO</TabsTrigger>
                </TabsList>

                <TabsContent value="standard">
                    <form className="flex flex-col gap-6" onSubmit={submit}>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="login">Email or Username</Label>
                                <Input
                                    id="login"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="username"
                                    value={data.login}
                                    onChange={(e) => setData('login', e.target.value)}
                                    placeholder="Email or Username"
                                />
                                <InputError message={errors.login} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        checked={data.remember}
                                        onClick={() => setData('remember', !data.remember)}
                                        tabIndex={3}
                                    />
                                    <Label htmlFor="remember">Remember me</Label>
                                </div>
                                {canResetPassword && (
                                    <TextLink href={route('password.request')} className="text-sm" tabIndex={5}>
                                        Forgot password?
                                    </TextLink>
                                )}
                            </div>

                            <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Log in
                            </Button>

                            {(errors as any).throttle && (
                                <div className="rounded-md bg-red-50 p-3 text-center">
                                    <div className="text-sm text-red-800">{(errors as any).throttle}</div>
                                </div>
                            )}

                            {/* General error handler for network issues */}
                            {Object.keys(errors).length > 0 && !errors.login && !errors.password && !(errors as any).throttle && (
                                <div className="rounded-md bg-red-50 p-3 text-center">
                                    <div className="text-sm text-red-800">Network error. Please check your connection and try again.</div>
                                </div>
                            )}
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="sso">
                    <form className="flex flex-col gap-6" onSubmit={submitSSO}>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="usernameOrEmail">Username or Email</Label>
                                <Input
                                    id="usernameOrEmail"
                                    type="text"
                                    required
                                    autoFocus={activeTab === 'sso'}
                                    tabIndex={1}
                                    autoComplete="username"
                                    value={ssoForm.data.usernameOrEmail}
                                    onChange={(e) => ssoForm.setData('usernameOrEmail', e.target.value)}
                                    placeholder="MaxNet Username or Email"
                                />
                                <InputError message={ssoForm.errors.usernameOrEmail} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="ssoPassword">Password</Label>
                                </div>
                                <Input
                                    id="ssoPassword"
                                    type="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    value={ssoForm.data.password}
                                    onChange={(e) => ssoForm.setData('password', e.target.value)}
                                    placeholder="MaxNet Password"
                                />
                                <InputError message={ssoForm.errors.password} />
                            </div>

                            <Button type="submit" className="mt-4 w-full" tabIndex={3} disabled={ssoForm.processing}>
                                {ssoForm.processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Log in with MaxNet SSO
                            </Button>

                            <div className="text-center text-sm text-muted-foreground">
                                Note: New SSO users require admin approval before they can access the system.
                            </div>

                            {/* SSO error handler */}
                            {Object.keys(ssoForm.errors).length > 0 && (
                                <div className="rounded-md bg-red-50 p-4 text-center">
                                    <div className="flex items-center justify-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="mr-2 h-5 w-5 text-red-400"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <div className="text-sm font-medium text-red-800">
                                            {ssoForm.errors.usernameOrEmail ||
                                                ssoForm.errors.password ||
                                                'An error occurred during SSO login. Please try again.'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </TabsContent>
            </Tabs>

            {status && <div className="mt-6 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
