import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to combine class names with Tailwind CSS merge
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Mobile-specific utility classes
 */
export const mobileClasses = {
    // Button classes
    buttonMobile: 'h-11 text-sm md:h-10 md:text-base',
    buttonSmallMobile: 'h-9 text-xs md:h-8 md:text-sm',
    buttonLargeMobile: 'h-12 text-base md:h-11 md:text-lg',

    // Input classes
    inputMobile: 'h-11 text-sm md:h-10 md:text-base',
    selectMobile: 'h-11 text-sm md:h-10 md:text-base',

    // Card classes
    cardMobile: 'border-0 shadow-sm md:border md:shadow-none',
    cardPaddingMobile: 'p-4 md:p-6',
    cardHeaderMobile: 'pb-3 md:pb-4',

    // Typography classes
    headingMobile: 'text-lg font-semibold md:text-xl lg:text-2xl',
    subheadingMobile: 'text-base font-medium md:text-lg',
    bodyMobile: 'text-sm md:text-base',
    captionMobile: 'text-xs md:text-sm',

    // Layout classes
    spacingMobile: 'space-y-4 md:space-y-6',
    gapMobile: 'gap-3 md:gap-4',
    paddingMobile: 'p-4 md:p-6',
    marginMobile: 'm-4 md:m-6',

    // Grid classes
    gridMobile: 'grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3',
    gridTwoMobile: 'grid-cols-1 gap-3 md:grid-cols-2 md:gap-4',

    // Badge classes
    badgeMobile: 'text-xs px-2 py-1 md:text-sm md:px-3 md:py-1.5',

    // Icon classes
    iconMobile: 'h-4 w-4 md:h-5 md:w-5',
    iconSmallMobile: 'h-3 w-3 md:h-4 md:w-4',

    // Sticky classes
    stickyHeaderMobile:
        'sticky top-0 z-10 -mx-4 -mt-4 bg-background/95 backdrop-blur-sm border-b md:relative md:mx-0 md:mt-0 md:border-0 md:bg-transparent',
    stickyFooterMobile:
        'sticky bottom-0 -mx-4 -mb-4 bg-background/95 backdrop-blur-sm border-t p-4 md:relative md:mx-0 md:mb-0 md:border-0 md:bg-transparent md:p-0',
};

/**
 * Responsive breakpoint utilities
 */
export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
};

/**
 * Check if device is mobile based on screen width
 */
export function isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
}

/**
 * Check if device has touch capability
 */
export function isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get optimal touch target size
 */
export function getTouchTargetSize(): number {
    return isTouchDevice() ? 44 : 40; // 44px for touch, 40px for mouse
}

/**
 * Format mobile-friendly date
 */
export function formatMobileDate(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffTime = now.getTime() - d.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}

/**
 * Truncate text for mobile display
 */
export function truncateText(text: string, maxLength: number = 50): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Generate mobile-friendly colors
 */
export const mobileColors = {
    primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
    },
    success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
    },
    warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
    },
    error: {
        50: '#fef2f2',
        100: '#fee2e2',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
    },
};

/**
 * Mobile-specific animation utilities
 */
export const mobileAnimations = {
    fadeIn: 'animate-in fade-in-0 duration-300',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
    slideDown: 'animate-in slide-in-from-top-4 duration-300',
    scaleIn: 'animate-in zoom-in-95 duration-200',
    tap: 'active:scale-95 transition-transform duration-100',
};

/**
 * Haptic feedback utility (for supported devices)
 */
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (typeof window === 'undefined') return;

    // @ts-ignore - Haptic feedback is experimental
    if (window.navigator?.vibrate) {
        const patterns = {
            light: [10],
            medium: [50],
            heavy: [100],
        };
        window.navigator.vibrate(patterns[type]);
    }
}

/**
 * Safe area inset utilities
 */
export const safeAreaInsets = {
    top: 'pt-[env(safe-area-inset-top)]',
    bottom: 'pb-[env(safe-area-inset-bottom)]',
    left: 'pl-[env(safe-area-inset-left)]',
    right: 'pr-[env(safe-area-inset-right)]',
};
