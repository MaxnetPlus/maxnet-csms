import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Get stored theme or default to 'light'
        const stored = localStorage.getItem('theme') as Theme | null;
        const initialTheme = stored || 'light';
        setTheme(initialTheme);
        applyTheme(initialTheme);
        setMounted(true);

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);

        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, [theme]);

    const applyTheme = (newTheme: Theme) => {
        // Remove existing theme classes first
        document.documentElement.classList.remove('dark');

        if (newTheme === 'system') {
            localStorage.removeItem('theme');
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (systemDark) {
                document.documentElement.classList.add('dark');
            }
        } else {
            localStorage.setItem('theme', newTheme);
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            }
        }
    };

    const setThemeWithApply = (newTheme: Theme) => {
        setTheme(newTheme);
        applyTheme(newTheme);

        // Force update for system theme
        setTimeout(() => {
            if (newTheme === 'system') {
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.remove('dark');
                if (systemDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        }, 0);
    };

    return {
        theme,
        setTheme: setThemeWithApply,
        mounted,
    };
}
