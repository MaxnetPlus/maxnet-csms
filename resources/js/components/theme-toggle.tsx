import { useAppearance, type Appearance } from '@/hooks/use-appearance';
import { Monitor, Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
    const { appearance: currentTheme, updateAppearance: handleThemeChange } = useAppearance();

    return (
        <div className="inline-flex w-full items-center rounded-lg border border-input bg-background p-0.5 group-data-[collapsible=icon]:hidden">
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
