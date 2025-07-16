import { Button } from '@/components/ui/button';
import { mobileClasses } from '@/lib/mobile-utils';
import { Link } from '@inertiajs/react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { type ReactNode } from 'react';

interface MobileHeaderProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    actions?: ReactNode;
    showBackButton?: boolean;
    className?: string;
}

export function MobileHeader({ title, subtitle, backHref, actions, showBackButton = true, className = '' }: MobileHeaderProps) {
    return (
        <div className={`${mobileClasses.stickyHeaderMobile} ${className}`}>
            <div className="flex items-center gap-3 px-4 py-3 md:px-0 md:py-0">
                {showBackButton && backHref && (
                    <Button variant="ghost" size="sm" asChild className="shrink-0">
                        <Link href={backHref}>
                            <ArrowLeft className={mobileClasses.iconMobile} />
                        </Link>
                    </Button>
                )}

                <div className="min-w-0 flex-1">
                    <h1 className={`${mobileClasses.headingMobile} truncate`}>{title}</h1>
                    {subtitle && <p className={`${mobileClasses.captionMobile} hidden text-muted-foreground md:block`}>{subtitle}</p>}
                </div>

                {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}

interface MobileActionButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'lg';
    className?: string;
}

export function MobileActionButton({ children, onClick, variant = 'outline', size = 'sm', className = '' }: MobileActionButtonProps) {
    const sizeClasses = {
        sm: mobileClasses.buttonSmallMobile,
        lg: mobileClasses.buttonLargeMobile,
    };

    return (
        <Button variant={variant} size={size} onClick={onClick} className={`${sizeClasses[size]} ${className}`}>
            {children}
        </Button>
    );
}

interface MobileMenuButtonProps {
    onClick?: () => void;
    className?: string;
}

export function MobileMenuButton({ onClick, className = '' }: MobileMenuButtonProps) {
    return (
        <Button variant="ghost" size="sm" onClick={onClick} className={`${mobileClasses.buttonSmallMobile} ${className}`}>
            <MoreVertical className={mobileClasses.iconSmallMobile} />
        </Button>
    );
}
