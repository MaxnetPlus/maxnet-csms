import { useSidebar } from '@/components/ui/sidebar';
import { useAppearance, type Appearance } from '@/hooks/use-appearance';
import { Monitor, Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
    const { appearance: currentTheme, updateAppearance: handleThemeChange } = useAppearance();
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    if (isCollapsed) {
        // Icon-only version for collapsed sidebar
        return (
            <div className="collapsed-theme flex flex-col items-center justify-center">
                {(['light', 'dark', 'system'] as Appearance[]).map((theme) => (
                    <button
                        key={theme}
                        onClick={() => handleThemeChange(theme)}
                        className={`mb-1 inline-flex h-8 w-8 min-w-0 items-center justify-center rounded-md transition-all focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${
                            currentTheme === theme
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                        title={`Switch to ${theme} mode`}
                    >
                        {theme === 'light' && <Sun className="h-4 w-4 flex-shrink-0" />}
                        {theme === 'dark' && <Moon className="h-4 w-4 flex-shrink-0" />}
                        {theme === 'system' && <Monitor className="h-4 w-4 flex-shrink-0" />}
                    </button>
                ))}
            </div>
        );
    }

    // Normal version for expanded sidebar
    return (
        <div className="inline-flex w-full items-center rounded-lg border border-input bg-background p-0.5">
            {(['light', 'dark', 'system'] as Appearance[]).map((theme) => (
                <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`inline-flex min-w-0 flex-1 items-center justify-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${
                        currentTheme === theme ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted hover:text-muted-foreground'
                    }`}
                    title={`Switch to ${theme} mode`}
                >
                    {theme === 'light' && <Sun className="h-3 w-3 flex-shrink-0" />}
                    {theme === 'dark' && <Moon className="h-3 w-3 flex-shrink-0" />}
                    {theme === 'system' && <Monitor className="h-3 w-3 flex-shrink-0" />}
                    <span className="ml-1 truncate text-[10px]">{theme === 'system' ? 'Sys' : theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                </button>
            ))}
        </div>
    );
}
