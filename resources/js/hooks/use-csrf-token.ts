import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export function useCsrfToken() {
    const { props } = usePage<SharedData>();
    const csrfToken = props.csrf_token;

    useEffect(() => {
        // Update the meta tag with the current CSRF token
        const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
        if (metaTag && csrfToken) {
            metaTag.content = csrfToken;
        }
    }, [csrfToken]);

    return csrfToken;
}
