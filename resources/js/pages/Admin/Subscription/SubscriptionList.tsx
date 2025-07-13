import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye, Filter, Loader2, Plus, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface Customer {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
}

interface FollowUp {
    id: number;
    priority: string;
    status: string;
}

interface Subscription {
    subscription_description: string;
    subscription_id: string;
    customer_id: string;
    serv_id: string;
    group: string;
    subscription_address: string;
    subscription_status: string;
    subscription_price: number;
    subscription_start_date: string;
    created_at: string;
    updated_at: string;
    dismantle_at?: string;
    suspend_at?: string;
    customer?: Customer;
    active_follow_ups?: FollowUp[];
    has_active_follow_ups?: boolean;
}

interface TableColumn {
    header: string;
    className?: string;
    sortable?: boolean;
    render: (data: Subscription) => React.ReactNode;
}

interface PaginationData {
    data: Subscription[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface SubscriptionListProps {
    initialFilters?: {
        search?: string;
        status?: string;
        group?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
        direction?: string;
    };
    groups: string[];
}

const statusConfig = {
    ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    CANCELED: { label: 'Canceled', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    SUSPEND: { label: 'Suspended', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    DISMANTLE: { label: 'Dismantled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
} as const;

export default function SubscriptionList({ initialFilters = {}, groups }: SubscriptionListProps) {
    const [tableData, setTableData] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: initialFilters.search || '',
        status: initialFilters.status || 'all',
        group: initialFilters.group || 'all',
        date_from: initialFilters.date_from || '',
        date_to: initialFilters.date_to || '',
        sort: initialFilters.sort || 'created_at',
        direction: initialFilters.direction || 'desc',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [showFilters, setShowFilters] = useState(false);
    const [lastFetchParams, setLastFetchParams] = useState<string>('');

    // Follow up modal states
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [followUpForm, setFollowUpForm] = useState({
        priority: 'medium',
        description: '',
        notes: '',
    });
    const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

    // Debounced search function
    const debounce = (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    const fetchTableData = useCallback(
        async (page = 1, currentFilters = filters, force = false) => {
            // Create a unique key for this request to prevent duplicate fetches
            const requestData = {
                page: page,
                per_page: perPage,
                ...currentFilters,
            };

            const fetchKey = JSON.stringify(requestData);

            // Skip if same request was just made (unless forced)
            if (!force && fetchKey === lastFetchParams) {
                return;
            }

            setLoading(true);
            setLastFetchParams(fetchKey);

            try {
                const response = await fetch(`/admin/subscriptions/table-data`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify(requestData),
                });
                const data = await response.json();
                setTableData(data);
                setCurrentPage(data.current_page);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        },
        [perPage, lastFetchParams, currentPage],
    );

    const debouncedFetchTableData = useCallback(
        debounce((page: number, currentFilters: any) => {
            fetchTableData(page, currentFilters, true);
        }, 300),
        [],
    );

    // Effect for initial load only
    useEffect(() => {
        fetchTableData(1, filters, true);
    }, []); // Only run on mount

    // Effect for per page changes - reset to page 1
    useEffect(() => {
        if (tableData) {
            fetchTableData(1, filters, true);
        }
    }, [perPage]);

    // Effect for filter changes - reset to page 1
    useEffect(() => {
        if (tableData) {
            debouncedFetchTableData(1, filters);
        }
    }, [filters]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // The effect will handle the actual search
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= (tableData?.last_page || 1)) {
            fetchTableData(newPage, filters, true);
        }
    };

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        setFilters((prev) => ({
            ...prev,
            sort: field,
            direction: newDirection,
        }));
    };

    const clearFilters = () => {
        const clearedFilters = {
            search: '',
            status: 'all',
            group: 'all',
            date_from: '',
            date_to: '',
            sort: 'created_at',
            direction: 'desc',
        };
        setFilters(clearedFilters);
        // Don't call fetchTableData here, let useEffect handle it
        setCurrentPage(1);
    };

    // Follow up functions
    const handleCreateFollowUp = (subscription: Subscription) => {
        setSelectedSubscription(subscription);
        setFollowUpForm({
            priority: 'medium',
            description: '',
            notes: '',
        });
        setShowFollowUpModal(true);
    };

    const handleSubmitFollowUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubscription || !followUpForm.description) {
            return;
        }

        setSubmittingFollowUp(true);

        try {
            const response = await fetch('/admin/follow-ups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    customer_id: selectedSubscription.customer_id,
                    subscription_id: selectedSubscription.subscription_id,
                    priority: followUpForm.priority,
                    description: followUpForm.description,
                    assigned_to: 'unassigned', // Default to unassigned
                    notes: followUpForm.notes || null,
                }),
            });

            if (response.ok) {
                setShowFollowUpModal(false);
                setSelectedSubscription(null);
                setFollowUpForm({
                    priority: 'medium',
                    description: '',
                    notes: '',
                });
                // Refresh the table data
                fetchTableData(currentPage, filters, true);
            } else {
                console.error('Failed to create follow up');
            }
        } catch (error) {
            console.error('Error creating follow up:', error);
        } finally {
            setSubmittingFollowUp(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (filters.sort !== field) {
            return <span className="text-gray-400">↕</span>;
        }
        return filters.direction === 'asc' ? <span>↑</span> : <span>↓</span>;
    };

    const columns: TableColumn[] = [
        {
            header: 'Subscription ID',
            className: 'min-w-[140px]',
            sortable: true,
            render: (data: Subscription) => (
                <div>
                    <div className="font-medium">{data.subscription_id}</div>
                    <div className="text-xs text-muted-foreground">{data.serv_id}</div>
                </div>
            ),
        },
        {
            header: 'Customer',
            className: 'min-w-[180px]',
            sortable: true,
            render: (data: Subscription) => (
                <div>
                    <div className="font-medium">{data.customer?.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{data.customer?.customer_email}</div>
                    <div className="text-xs text-muted-foreground">ID: {data.customer_id}</div>
                </div>
            ),
        },
        {
            header: 'Address',
            className: 'min-w-[200px]',
            render: (data: Subscription) => (
                <div className="max-w-[200px] truncate" title={data.subscription_address}>
                    {data.subscription_address}
                </div>
            ),
        },
        {
            header: 'Status',
            className: 'min-w-[100px]',
            sortable: true,
            render: (data: Subscription) => {
                const config = statusConfig[data.subscription_status as keyof typeof statusConfig];
                return <Badge className={config?.className || 'bg-gray-100 text-gray-800'}>{config?.label || data.subscription_status}</Badge>;
            },
        },
        {
            header: 'Group',
            className: 'min-w-[80px]',
            sortable: true,
            render: (data: Subscription) => <span className="font-mono text-sm">{data.group}</span>,
        },
        {
            header: 'Description',
            className: 'min-w-[200px]',
            render: (data: Subscription) => (
                <div className="max-w-[200px] truncate" title={data.subscription_description}>
                    {data.subscription_description}
                </div>
            ),
        },
        {
            header: 'Follow Up',
            className: 'min-w-[120px]',
            render: (data: Subscription) => (
                <div className="space-y-1">
                    {data.has_active_follow_ups ? (
                        <div className="space-y-1">
                            {data.active_follow_ups?.slice(0, 2).map((followUp) => (
                                <div key={followUp.id} className="text-xs">
                                    <Badge variant="outline" className="text-xs">
                                        {followUp.priority}
                                    </Badge>
                                    <span className="ml-1 text-muted-foreground">({followUp.status})</span>
                                </div>
                            ))}
                            {(data.active_follow_ups?.length || 0) > 2 && (
                                <div className="text-xs text-muted-foreground">+{(data.active_follow_ups?.length || 0) - 2} more</div>
                            )}
                        </div>
                    ) : (
                        <Button size="sm" variant="default" onClick={() => handleCreateFollowUp(data)} className="text-xs">
                            <Plus className="mr-1 h-3 w-3" />
                            Add Follow Up
                        </Button>
                    )}
                </div>
            ),
        },

        {
            header: 'Start Date',
            className: 'min-w-[120px]',
            sortable: true,
            render: (data: Subscription) => <div className="text-sm">{formatDate(data.subscription_start_date)}</div>,
        },
        {
            header: 'Updated At',
            className: 'min-w-[120px]',
            sortable: true,
            render: (data: Subscription) => <div className="text-sm">{formatDate(data.updated_at)}</div>,
        },

        {
            header: 'Actions',
            className: 'min-w-[100px]',
            render: (data: Subscription) => (
                <div className="flex gap-2">
                    <Link href={`/admin/subscriptions/${data.subscription_id}`}>
                        <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            {/* Search and Filter Bar */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Subscription Management</CardTitle>
                            <CardDescription>Manage and track subscription data</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn('gap-2', showFilters && 'bg-muted')}
                            >
                                <Filter className="h-4 w-4" />
                                Filters
                            </Button>
                        </div>
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by subscription ID, customer name, email, or address..."
                                value={filters.search}
                                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" size="sm" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                        </Button>
                        {(filters.search || filters.status !== 'all' || filters.group !== 'all' || filters.date_from || filters.date_to) && (
                            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4" />
                                Clear
                            </Button>
                        )}
                    </form>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-4">
                            <div>
                                <label className="text-sm font-medium">Status</label>
                                <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="CANCELED">Canceled</SelectItem>
                                        <SelectItem value="SUSPEND">Suspended</SelectItem>
                                        <SelectItem value="DISMANTLE">Dismantled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Group</label>
                                <Select value={filters.group} onValueChange={(value) => setFilters((prev) => ({ ...prev, group: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Groups" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Groups</SelectItem>
                                        {groups.map((group) => (
                                            <SelectItem key={group} value={group}>
                                                {group}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Start Date From</label>
                                <Input
                                    type="date"
                                    value={filters.date_from}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Start Date To</label>
                                <Input
                                    type="date"
                                    value={filters.date_to}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}
                </CardHeader>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                                Showing {tableData?.from || 0} to {tableData?.to || 0} of {tableData?.total || 0} entries
                            </span>
                            <Select value={perPage.toString()} onValueChange={(value) => setPerPage(parseInt(value))}>
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative">
                        {loading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        {columns.map((column, index) => (
                                            <th
                                                key={index}
                                                className={cn(
                                                    'p-3 text-left font-medium',
                                                    column.className,
                                                    column.sortable && 'cursor-pointer hover:bg-muted/50',
                                                )}
                                                onClick={() => column.sortable && handleSort(column.header.toLowerCase().replace(' ', '_'))}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {column.header}
                                                    {column.sortable && <SortIcon field={column.header.toLowerCase().replace(' ', '_')} />}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData?.data.map((item, index) => (
                                        <tr key={index} className="border-b hover:bg-muted/50">
                                            {columns.map((column, colIndex) => (
                                                <td key={colIndex} className={cn('p-3', column.className)}>
                                                    {column.render(item)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {tableData && tableData.last_page > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || loading}>
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex gap-1">
                        {[...Array(Math.min(5, tableData.last_page))].map((_, i) => {
                            const pageNumber = Math.max(1, Math.min(tableData.last_page - 4, Math.max(1, currentPage - 2))) + i;
                            if (pageNumber <= tableData.last_page) {
                                return (
                                    <Button
                                        key={pageNumber}
                                        variant={currentPage === pageNumber ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePageChange(pageNumber)}
                                        disabled={loading}
                                        className="min-w-[40px]"
                                    >
                                        {pageNumber}
                                    </Button>
                                );
                            }
                            return null;
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= tableData.last_page || loading}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Follow Up Modal */}
            <Dialog open={showFollowUpModal} onOpenChange={setShowFollowUpModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Follow Up</DialogTitle>
                        <DialogDescription>Create a follow up for {selectedSubscription?.customer?.customer_name}</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitFollowUp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={followUpForm.priority}
                                onValueChange={(value) => setFollowUpForm((prev) => ({ ...prev, priority: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                value={followUpForm.description}
                                onChange={(e) => setFollowUpForm((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe the follow up requirement..."
                                rows={3}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={followUpForm.notes}
                                onChange={(e) => setFollowUpForm((prev) => ({ ...prev, notes: e.target.value }))}
                                placeholder="Any additional notes..."
                                rows={2}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowFollowUpModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submittingFollowUp || !followUpForm.description}>
                                {submittingFollowUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Create Follow Up
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
