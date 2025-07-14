import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle, X, XCircle, AlertTriangle, Info } from 'lucide-react';

export interface NotificationProps {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onClose: () => void;
    autoHide?: boolean;
    duration?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

const notificationVariants = {
    success: {
        icon: CheckCircle,
        alertVariant: 'default' as const,
        className: 'border-l-green-500 bg-green-50 text-green-900 dark:bg-green-950/90 dark:text-green-100 dark:border-l-green-400',
        iconClassName: 'text-green-600 dark:text-green-400',
    },
    error: {
        icon: XCircle,
        alertVariant: 'destructive' as const,
        className: 'border-l-red-500 bg-red-50 text-red-900 dark:bg-red-950/90 dark:text-red-100 dark:border-l-red-400',
        iconClassName: 'text-red-600 dark:text-red-400',
    },
    warning: {
        icon: AlertTriangle,
        alertVariant: 'default' as const,
        className: 'border-l-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/90 dark:text-yellow-100 dark:border-l-yellow-400',
        iconClassName: 'text-yellow-600 dark:text-yellow-400',
    },
    info: {
        icon: Info,
        alertVariant: 'default' as const,
        className: 'border-l-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/90 dark:text-blue-100 dark:border-l-blue-400',
        iconClassName: 'text-blue-600 dark:text-blue-400',
    },
};

const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
};

export function Notification({
    show,
    type,
    title,
    message,
    onClose,
    autoHide = true,
    duration = 5000,
    position = 'top-right',
}: NotificationProps) {
    const [mounted, setMounted] = React.useState(false);
    const [visible, setVisible] = React.useState(false);

    const variant = notificationVariants[type];
    const IconComponent = variant.icon;

    // Handle mounting and visibility with better timing
    React.useEffect(() => {
        if (show) {
            setMounted(true);
            // Use a slightly longer delay to ensure smooth animation
            const timer = setTimeout(() => setVisible(true), 50);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
            // Wait for animation to complete before unmounting
            const timer = setTimeout(() => setMounted(false), 320);
            return () => clearTimeout(timer);
        }
    }, [show]);

    // Auto hide functionality
    React.useEffect(() => {
        if (show && autoHide) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, autoHide, duration, onClose]);

    if (!mounted) return null;

    return (
        <div
            className={cn(
                'fixed z-50 w-full max-w-sm transition-all duration-300 ease-out',
                'sm:max-w-md', // Responsive width
                positionClasses[position],
                // Mobile positioning adjustments
                position.includes('right') && 'right-2 sm:right-4',
                position.includes('left') && 'left-2 sm:left-4',
                position.includes('top') && 'top-2 sm:top-4',
                position.includes('bottom') && 'bottom-2 sm:bottom-4'
            )}
            style={{
                transform: visible 
                    ? 'translate3d(0, 0, 0) scale(1)' 
                    : position.includes('right') 
                        ? 'translate3d(100%, 0, 0) scale(0.95)'
                        : position.includes('left')
                            ? 'translate3d(-100%, 0, 0) scale(0.95)'
                            : position.includes('top')
                                ? 'translate3d(0, -100%, 0) scale(0.95)'
                                : 'translate3d(0, 100%, 0) scale(0.95)',
                opacity: visible ? 1 : 0,
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d',
                transition: 'transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 300ms ease-out',
            }}
        >
            <Alert
                variant={variant.alertVariant}
                className={cn(
                    'border-l-4 shadow-lg backdrop-blur-sm',
                    'transition-all duration-200 ease-in-out',
                    variant.className,
                    // Mobile responsive padding
                    'p-3 sm:p-4',
                    // Hover effects
                    'hover:shadow-xl',
                    // Dark mode improvements
                    'dark:shadow-2xl dark:shadow-black/20'
                )}
            >
                <IconComponent className={cn('h-4 w-4 flex-shrink-0', variant.iconClassName)} />
                <div className="flex items-start justify-between gap-2 w-full">
                    <div className="flex-1 min-w-0">
                        <AlertTitle className={cn(
                            'font-semibold leading-tight',
                            'text-sm sm:text-base', // Responsive font size
                            'line-clamp-2' // Prevent title overflow
                        )}>
                            {title}
                        </AlertTitle>
                        <AlertDescription className={cn(
                            'mt-1 leading-relaxed',
                            'text-xs sm:text-sm', // Responsive font size
                            'line-clamp-3' // Prevent message overflow
                        )}>
                            {message}
                        </AlertDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            'h-6 w-6 p-0 flex-shrink-0',
                            'hover:bg-black/5 dark:hover:bg-white/5',
                            'transition-colors duration-200',
                            'rounded-full'
                        )}
                        onClick={onClose}
                        aria-label="Close notification"
                    >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                </div>
            </Alert>
        </div>
    );
}

// Hook for managing notifications
export function useNotification() {
    const [notification, setNotification] = React.useState<{
        show: boolean;
        type: NotificationProps['type'];
        title: string;
        message: string;
    }>({
        show: false,
        type: 'info',
        title: '',
        message: '',
    });

    const showNotification = React.useCallback((
        type: NotificationProps['type'],
        title: string,
        message: string
    ) => {
        setNotification({
            show: true,
            type,
            title,
            message,
        });
    }, []);

    const hideNotification = React.useCallback(() => {
        setNotification(prev => ({ ...prev, show: false }));
    }, []);

    return {
        notification,
        showNotification,
        hideNotification,
    };
}

// Predefined notification functions for common use cases
export const notificationHelpers = {
    success: (title: string, message: string, showFn: (type: NotificationProps['type'], title: string, message: string) => void) => {
        showFn('success', title, message);
    },
    error: (title: string, message: string, showFn: (type: NotificationProps['type'], title: string, message: string) => void) => {
        showFn('error', title, message);
    },
    warning: (title: string, message: string, showFn: (type: NotificationProps['type'], title: string, message: string) => void) => {
        showFn('warning', title, message);
    },
    info: (title: string, message: string, showFn: (type: NotificationProps['type'], title: string, message: string) => void) => {
        showFn('info', title, message);
    },
};
