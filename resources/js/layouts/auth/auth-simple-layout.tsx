import AppLogo from '@/components/app-logo';
import CsrfProvider from '@/components/csrf-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <CsrfProvider>
            <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
                {/* Theme Toggle - positioned at top right */}
                <div className="fixed top-4 right-4 z-50">
                    <div className="w-48">
                        <ThemeToggle />
                    </div>
                </div>

                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                                <AppLogo normalLogoClassName="h-16" />
                                <span className="sr-only">{title}</span>
                            </Link>

                            <div className="space-y-2 text-center">
                                <h1 className="text-xl font-medium">{title}</h1>
                                <p className="text-center text-sm text-muted-foreground">{description}</p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </CsrfProvider>
    );
}
