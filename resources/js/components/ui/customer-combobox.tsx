import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Customer {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    subscriptions?: Subscription[];
}

interface Subscription {
    subscription_id: string;
    customer_id: string;
    subscription_description: string;
    subscription_status: string;
}

interface CustomerComboboxProps {
    value: string;
    onValueChange: (value: string) => void;
    onSubscriptionChange?: (subscriptionId: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function CustomerCombobox({
    value,
    onValueChange,
    onSubscriptionChange,
    disabled = false,
    placeholder = "Select customer...",
}: CustomerComboboxProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showSubscriptions, setShowSubscriptions] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Search customers
    const searchCustomers = async (search: string) => {
        if (search.length < 3) {
            setCustomers([]);
            return;
        }

        setLoading(true);
        try {
            console.log('Searching for:', search);
            const url = new URL(route('admin.follow-ups.search-customers'));
            url.searchParams.append('search', search);
            console.log('Request URL:', url.toString());
            
            const response = await fetch(url.toString());
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            setCustomers(data);
        } catch (error) {
            console.error('Error searching customers:', error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchCustomers(searchTerm);
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchTerm]);

    // Debug: Log customers data
    useEffect(() => {
        console.log('Customers data:', customers);
        console.log('Search term:', searchTerm);
        console.log('Loading:', loading);
    }, [customers, searchTerm, loading]);

    // Handle customer selection
    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        
        if (customer.subscriptions && customer.subscriptions.length > 1) {
            // Show subscription selection if multiple subscriptions
            setShowSubscriptions(true);
        } else if (customer.subscriptions && customer.subscriptions.length === 1) {
            // Auto-select single subscription
            onValueChange(customer.customer_id);
            onSubscriptionChange?.(customer.subscriptions[0].subscription_id);
            setOpen(false);
        } else {
            // No subscriptions
            onValueChange(customer.customer_id);
            onSubscriptionChange?.('');
            setOpen(false);
        }
    };

    // Handle subscription selection
    const handleSubscriptionSelect = (subscriptionId: string) => {
        if (selectedCustomer) {
            onValueChange(selectedCustomer.customer_id);
            onSubscriptionChange?.(subscriptionId);
            setOpen(false);
            setShowSubscriptions(false);
        }
    };

    // Get selected customer name for display
    const getSelectedCustomerName = () => {
        if (!value) return placeholder;
        const customer = customers.find(c => c.customer_id === value);
        return customer ? `${customer.customer_name} (${customer.customer_id})` : value;
    };

    return (
        <div 
            className="relative w-full"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => e.preventDefault()}
        >
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={disabled}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(!open);
                }}
            >
                <span className="truncate">{getSelectedCustomerName()}</span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            
            {open && (
                <div className="absolute top-full left-0 z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg">
                    {!showSubscriptions ? (
                        // Customer search and selection  
                        <div className="p-2">
                            <div className="relative mb-2">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search customers (min. 3 characters)..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }
                                    }}
                                    className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground placeholder-muted-foreground"
                                    autoFocus
                                />
                            </div>
                            
                            <div className="max-h-[200px] overflow-y-auto">
                                {loading ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        Searching...
                                    </div>
                                ) : searchTerm.length > 0 && searchTerm.length < 3 ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        Type at least 3 characters to search
                                    </div>
                                ) : searchTerm.length >= 3 && customers.length === 0 ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        No customers found.
                                    </div>
                                ) : customers.length > 0 ? (
                                    <div className="space-y-1">
                                        {customers.map((customer) => (
                                            <div
                                                key={customer.customer_id}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleCustomerSelect(customer);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors border",
                                                    value === customer.customer_id
                                                        ? "bg-purple-50 dark:bg-purple-900 border-purple"
                                                        : "hover:bg-purple-100 dark:hover:bg-purple-800 border-transparent"
                                                )}
                                            >
                                                <Check
                                                    className={cn(
                                                        "h-4 w-4 text-primary",
                                                        value === customer.customer_id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm text-foreground">{customer.customer_name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {customer.customer_id} • {customer.customer_email}
                                                    </div>
                                                    {customer.subscriptions && customer.subscriptions.length > 0 && (
                                                        <div className="text-xs text-primary mt-1">
                                                            {customer.subscriptions.length} subscription(s)
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        Start typing to search customers...
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Subscription selection
                        <div className="space-y-2 p-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-foreground">Select Subscription</h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowSubscriptions(false);
                                    }}
                                >
                                    Back
                                </Button>
                            </div>
                            
                            {selectedCustomer && (
                                <div className="text-sm text-muted-foreground mb-2">
                                    Customer: {selectedCustomer.customer_name}
                                </div>
                            )}
                            
                            <div className="max-h-[200px] overflow-y-auto space-y-1">
                                {/* Option for no subscription */}
                                <div
                                    className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSubscriptionSelect('');
                                    }}
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-foreground">No Subscription</div>
                                        <div className="text-xs text-muted-foreground">
                                            Create follow-up without specific subscription
                                        </div>
                                    </div>
                                </div>
                                
                                {selectedCustomer?.subscriptions?.map((subscription) => (
                                    <div
                                        key={subscription.subscription_id}
                                        className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSubscriptionSelect(subscription.subscription_id);
                                        }}
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-foreground">{subscription.subscription_id}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {subscription.subscription_description}
                                            </div>
                                            <div className={cn(
                                                "text-xs px-1.5 py-0.5 rounded-full inline-block mt-1",
                                                subscription.subscription_status === 'active' 
                                                    ? "bg-success text-green-800 dark:bg-success dark:text-green-400" 
                                                    : "bg-muted text-muted-foreground"
                                            )}>
                                                {subscription.subscription_status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* Overlay to close dropdown when clicking outside */}
            {open && (
                <div 
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpen(false);
                    }}
                />
            )}
        </div>
    );
}
