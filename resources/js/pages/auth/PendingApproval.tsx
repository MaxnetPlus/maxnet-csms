import { Head } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';

import TextLink from '@/components/text-link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

interface PendingApprovalProps {
    email: string;
}

export default function PendingApproval({ email }: PendingApprovalProps) {
    return (
        <AuthLayout title="Account Pending Approval" description="Your account is waiting for administrator approval">
            <Head title="Account Pending Approval" />

            <div className="flex flex-col space-y-6 text-center">
                {/* Title */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">Account Pending Approval</h1>
                    <p className="text-muted-foreground">Your account is waiting for administrator approval</p>
                </div>

                {/* Alert */}
                <Alert variant="warning" className="mx-auto text-left">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="font-medium">Account Pending Approval</AlertTitle>
                    <AlertDescription className="mt-2">
                        Your SSO account with email <strong className="font-medium">{email}</strong> has been registered but is waiting for
                        administrator approval.
                        <br />
                        <br />
                        Please contact the administrator for assistance.
                    </AlertDescription>
                </Alert>

                {/* Button */}
                <div className="mt-6 flex justify-center">
                    <Button variant="default" asChild className="w-full">
                        <TextLink href={route('login')}>Return to Login</TextLink>
                    </Button>
                </div>
            </div>
        </AuthLayout>
    );
}
