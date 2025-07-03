import { router } from '@inertiajs/react';

// Setup CSRF token for all Inertia requests
function getCsrfToken(): string | null {
    const token = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    return token ? token.content : null;
}

// Set the CSRF token for all Inertia requests
router.on('before', (event) => {
    if (event.detail.visit.method !== 'get') {
        const token = getCsrfToken();
        if (token) {
            event.detail.visit.headers = {
                ...event.detail.visit.headers,
                'X-CSRF-TOKEN': token,
            };
        } else {
            console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
        }
    }
});

// Update CSRF token after successful requests
router.on('success', (event) => {
    // If the response includes a new CSRF token, update the meta tag
    const props = event.detail.page.props as Record<string, any>;
    if (props.csrf_token && typeof props.csrf_token === 'string') {
        const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
        if (metaTag) {
            metaTag.content = props.csrf_token;
        }
    }
});
