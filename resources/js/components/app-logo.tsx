interface AppLogoProps {
    className?: string;
    normalLogoClassName?: string;
    collapsedLogoClassName?: string;
}

export default function AppLogo({ className = '', normalLogoClassName = '', collapsedLogoClassName = '' }: AppLogoProps) {
    return (
        <div className={`flex w-full items-center justify-center ${className}`}>
            {/* Logo untuk tampilan expanded */}
            <img
                src="/assets/logo.png"
                alt="App Logo"
                className={`mx-auto h-8 w-auto flex-shrink-0 group-data-[collapsible=icon]:hidden ${normalLogoClassName}`}
            />
            {/* Logo untuk tampilan collapsed - fallback ke logo.png jika logo-collapsible.png tidak ada */}
            <img
                src="/assets/logo-collapsible.png"
                alt="App Logo"
                className={`mx-auto hidden h-8 w-8 flex-shrink-0 object-contain group-data-[collapsible=icon]:block ${collapsedLogoClassName}`}
                onError={(e) => {
                    // Fallback ke logo.png jika logo-collapsible.png tidak ditemukan
                    const target = e.target as HTMLImageElement;
                    target.src = '/assets/logo.png';
                }}
            />
        </div>
    );
}
