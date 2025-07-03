import { useCsrfToken } from '@/hooks/use-csrf-token';
import { PropsWithChildren } from 'react';

export default function CsrfProvider({ children }: PropsWithChildren) {
    useCsrfToken(); // This will keep the CSRF token updated

    return <>{children}</>;
}
