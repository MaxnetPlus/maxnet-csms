interface AppLogoProps {
    className?: string;
    normalLogoClassName?: string;
    collapsedLogoClassName?: string;
}

export default function AppLogo({ className = '', normalLogoClassName = '', collapsedLogoClassName = '' }: AppLogoProps) {
    return (
        <div className={`flex w-full items-center justify-center ${className}`}>
            <img
                src="/assets/logo.png"
                alt="App Logo"
                className={`mx-auto h-8 w-auto flex-shrink-0 group-data-[collapsible=icon]:hidden ${normalLogoClassName}`}
            />
            <img
                src="/assets/logo-collapsible.png"
                alt="App Logo"
                className={`mx-auto hidden h-8 w-auto flex-shrink-0 group-data-[collapsible=icon]:block ${collapsedLogoClassName}`}
            />
        </div>
    );
}
