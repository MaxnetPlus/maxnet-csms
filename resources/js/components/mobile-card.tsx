import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mobileClasses } from '@/lib/mobile-utils';
import { type ReactNode } from 'react';

interface MobileCardProps {
    children: ReactNode;
    className?: string;
    padding?: 'sm' | 'md' | 'lg';
    hover?: boolean;
}

export function MobileCard({ children, className = '', padding = 'md', hover = false }: MobileCardProps) {
    const paddingClasses = {
        sm: 'p-3 md:p-4',
        md: 'p-4 md:p-6',
        lg: 'p-6 md:p-8',
    };

    const hoverClasses = hover ? 'transition-shadow hover:shadow-md md:hover:shadow-lg' : '';

    return (
        <Card className={`${mobileClasses.cardMobile} ${hoverClasses} ${className}`}>
            <CardContent className={paddingClasses[padding]}>{children}</CardContent>
        </Card>
    );
}

interface MobileCardWithHeaderProps {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    headerAction?: ReactNode;
    icon?: ReactNode;
}

export function MobileCardWithHeader({ title, description, children, className = '', headerAction, icon }: MobileCardWithHeaderProps) {
    return (
        <Card className={`${mobileClasses.cardMobile} ${className}`}>
            <CardHeader className={mobileClasses.cardHeaderMobile}>
                <div className="flex items-start justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        {icon}
                        <div className="min-w-0 flex-1">
                            <CardTitle className={mobileClasses.subheadingMobile}>{title}</CardTitle>
                            {description && <CardDescription className={mobileClasses.captionMobile}>{description}</CardDescription>}
                        </div>
                    </div>
                    {headerAction && <div className="shrink-0">{headerAction}</div>}
                </div>
            </CardHeader>
            <CardContent className={mobileClasses.cardPaddingMobile}>{children}</CardContent>
        </Card>
    );
}

interface MobileListItemProps {
    title: string;
    subtitle?: string;
    description?: string;
    badge?: ReactNode;
    actions?: ReactNode;
    avatar?: ReactNode;
    onClick?: () => void;
    className?: string;
}

export function MobileListItem({ title, subtitle, description, badge, actions, avatar, onClick, className = '' }: MobileListItemProps) {
    const Wrapper = onClick ? 'button' : 'div';

    return (
        <Wrapper
            onClick={onClick}
            className={` ${mobileClasses.cardMobile} ${onClick ? 'cursor-pointer transition-transform active:scale-[0.98]' : ''} ${className} `}
        >
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {avatar && <div className="shrink-0">{avatar}</div>}

                    <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <h3 className={`${mobileClasses.bodyMobile} truncate font-medium`}>{title}</h3>
                                {subtitle && <p className={`${mobileClasses.captionMobile} text-muted-foreground`}>{subtitle}</p>}
                            </div>
                            {badge && <div className="shrink-0">{badge}</div>}
                        </div>

                        {description && <p className={`${mobileClasses.captionMobile} line-clamp-2 text-muted-foreground`}>{description}</p>}
                    </div>

                    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
                </div>
            </CardContent>
        </Wrapper>
    );
}

interface MobileStatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    className?: string;
}

export function MobileStatsCard({ title, value, subtitle, icon, trend, trendValue, className = '' }: MobileStatsCardProps) {
    const trendColors = {
        up: 'text-green-600',
        down: 'text-red-600',
        neutral: 'text-gray-600',
    };

    return (
        <Card className={`${mobileClasses.cardMobile} ${className}`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                        <p className={`${mobileClasses.captionMobile} font-medium text-muted-foreground`}>{title}</p>
                        <p className={`${mobileClasses.headingMobile} font-bold text-primary`}>{value}</p>
                        {subtitle && <p className={`${mobileClasses.captionMobile} text-muted-foreground`}>{subtitle}</p>}
                        {trend && trendValue && <p className={`${mobileClasses.captionMobile} ${trendColors[trend]} font-medium`}>{trendValue}</p>}
                    </div>
                    {icon && <div className="shrink-0 text-muted-foreground">{icon}</div>}
                </div>
            </CardContent>
        </Card>
    );
}
