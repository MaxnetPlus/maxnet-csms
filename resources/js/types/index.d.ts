import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User & {
        permissions?: string[];
        roles?: string[];
    };
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    username?: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles?: Role[];
    permissions?: Permission[];
    [key: string]: unknown; // This allows for additional properties...
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    permissions?: Permission[];
}

export interface Permission {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    roles?: Role[];
}

export interface Customer {
    customer_id: string;
    customer_password?: string;
    customer_name: string;
    referral_source?: string;
    customer_email?: string;
    customer_address?: string;
    customer_phone: string;
    customer_ktp_no?: string;
    customer_ktp_picture?: string;
    password_reset?: string;
    created_at: string;
    updated_at: string;
    subscriptions?: Subscription[];
}

export interface Subscription {
    subscription_id: string;
    subscription_password: string;
    customer_id: string;
    serv_id: string;
    group: string;
    created_by: string;
    subscription_start_date?: string;
    subscription_billing_cycle?: string;
    subscription_price?: string;
    subscription_address?: string;
    subscription_status?: string;
    subscription_maps?: string;
    subscription_home_photo?: string;
    subscription_form_scan?: string;
    subscription_description?: string;
    cpe_type?: string;
    cpe_serial?: string;
    cpe_picture?: string;
    cpe_site?: string;
    cpe_mac?: string;
    is_cpe_rent?: boolean;
    dismantle_at?: string;
    suspend_at?: string;
    installed_by?: string;
    subscription_test_result?: string;
    odp_distance?: string;
    approved_at?: string;
    installed_at?: string;
    index_month?: number;
    attenuation_photo?: string;
    ip_address?: string;
    handle_by?: string;
    created_at: string;
    updated_at: string;
    customer?: Customer;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}
