import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye, Filter, Loader2, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface Customer {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
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
        status: initialFilters.status || '',
        group: initialFilters.group || '',
        date_from: initialFilters.date_from || '',
        date_to: initialFilters.date_to || '',
        sort: initialFilters.sort || 'created_at',
        direction: initialFilters.direction || 'desc',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [showFilters, setShowFilters] = useState(false);
    const [lastFetchParams, setLastFetchParams] = useState<string>('');

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
            const requestKey = JSON.stringify({ page, currentFilters, perPage });

            // Skip if we just made the same request (unless forced)
            if (!force && requestKey === lastFetchParams) {
                return;
            }

            setLoading(true);
            try {
                const response = await fetch('/admin/subscriptions/table-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        page,
                        per_page: perPage,
                        ...currentFilters,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setTableData(data);
                    setLastFetchParams(requestKey);

                    // Update current page to match the response
                    if (data.current_page !== currentPage) {
                        setCurrentPage(data.current_page);
                    }
                }
            } catch (error) {
                console.error('Error fetching table data:', error);
            } finally {
                setLoading(false);
            }
        },
        [perPage, lastFetchParams, currentPage], // Added currentPage to dependencies
    );

    const debouncedFetchTableData = useCallback(
        debounce((page: number, currentFilters: any) => {
            fetchTableData(page, currentFilters, true);
        }, 300),
        [], // Remove dependency to prevent recreating debounced function
    );

    // Effect for initial load only
    useEffect(() => {
        fetchTableData(1, filters, true);
        setCurrentPage(1);
    }, []); // Only run on mount

    // Effect for per page changes - reset to page 1
    useEffect(() => {
        if (tableData) {
            // Only run if we already have data (not on initial load)
            fetchTableData(1, filters, true);
            setCurrentPage(1);
        }
    }, [perPage]);

    // Effect for filter changes - reset to page 1
    useEffect(() => {
        // Only trigger if filters actually changed from initial values
        const filtersChanged =
            filters.search !== initialFilters.search ||
            filters.status !== initialFilters.status ||
            filters.group !== initialFilters.group ||
            filters.date_from !== initialFilters.date_from ||
            filters.date_to !== initialFilters.date_to ||
            filters.sort !== initialFilters.sort ||
            filters.direction !== initialFilters.direction;

        if (filtersChanged && tableData) {
            // Only run if we already have data
            debouncedFetchTableData(1, filters);
            setCurrentPage(1);
        }
    }, [filters]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Force immediate search without debounce
        fetchTableData(1, filters, true);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= (tableData?.last_page || 1) && newPage !== currentPage) {
            setCurrentPage(newPage);
            fetchTableData(newPage, filters, true); // Use newPage, not currentPage
        }
    };

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        const newFilters = { ...filters, sort: field, direction: newDirection };
        setFilters(newFilters);
        // Don't call fetchTableData here, let useEffect handle it
        setCurrentPage(1);
    };

    const clearFilters = () => {
        const clearedFilters = {
            search: '',
            status: '',
            group: '',
            date_from: '',
            date_to: '',
            sort: 'created_at',
            direction: 'desc',
        };
        setFilters(clearedFilters);
        // Don't call fetchTableData here, let useEffect handle it
        setCurrentPage(1);
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
        if (filters.sort !== field) return <span className="h-4 w-4" />;
        return filters.direction === 'asc' ? <span className="text-xs">↑</span> : <span className="text-xs">↓</span>;
    };

    const columns: TableColumn[] = [
        {
            header: 'Subscription ID',
            className: 'min-w-[140px]',
            sortable: true,
            render: (data: Subscription) => (
                <div>
                    <p className="font-medium">{data.subscription_id}</p>
                    <p className="text-sm text-muted-foreground">Service: {data.serv_id}</p>
                </div>
            ),
        },
        {
            header: 'Customer',
            className: 'min-w-[180px]',
            sortable: true,
            render: (data: Subscription) => (
                <div>
                    <p className="font-medium">{data.customer?.customer_name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{data.customer_id}</p>
                    <p className="text-xs text-muted-foreground">{data.customer?.customer_phone}</p>
                </div>
            ),
        },
        {
            header: 'Address',
            className: 'min-w-[200px]',
            render: (data: Subscription) => (
                <div className="max-w-[200px]">
                    <p className="truncate text-sm" title={data.subscription_address}>
                        {data.subscription_address || 'N/A'}
                    </p>
                </div>
            ),
        },
        {
            header: 'Status',
            className: 'min-w-[100px]',
            sortable: true,
            render: (data: Subscription) => {
                const config = statusConfig[data.subscription_status as keyof typeof statusConfig];
                return <Badge className={cn('text-xs', config?.className)}>{config?.label || data.subscription_status}</Badge>;
            },
        },
        {
            header: 'Group',
            className: 'min-w-[80px]',
            sortable: true,
            render: (data: Subscription) => <span className="text-sm">{data.group || 'N/A'}</span>,
        },
        // add subscription_description
        {
            header: 'Description',
            className: 'min-w-[200px]',
            render: (data: Subscription) => (
                <div className="max-w-[200px]">
                    <p className="truncate text-sm" title={data.subscription_description || 'No description'}>
                        {data.subscription_description || 'No description'}
                    </p>
                </div>
            ),
        },

        {
            header: 'Start Date',
            className: 'min-w-[120px]',
            sortable: true,
            render: (data: Subscription) => (
                <span className="text-sm">{data.subscription_start_date ? formatDate(data.subscription_start_date) : 'N/A'}</span>
            ),
        },
        // add updated at
        {
            header: 'Updated At',
            className: 'min-w-[120px]',
            sortable: true,
            render: (data: Subscription) => <span className="text-sm">{data.updated_at ? formatDate(data.updated_at) : 'N/A'}</span>,
        },

        {
            header: 'Actions',
            className: 'min-w-[100px]',
            render: (data: Subscription) => (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/subscriptions/${data.subscription_id}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Subscriptions Data
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </CardTitle>
                        <CardDescription>{tableData && `Showing ${tableData.from}-${tableData.to} of ${tableData.total} records`}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="mr-2 h-4 w-4" />
                        {showFilters ? 'Hide' : 'Show'} Filters
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Search and Filters */}
                <div className="mb-6 space-y-4">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by ID, Service ID, Address, Customer Name..."
                                value={filters.search}
                                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                        {(filters.search || filters.status || filters.group || filters.date_from || filters.date_to) && (
                            <Button type="button" variant="outline" onClick={clearFilters}>
                                <X className="mr-2 h-4 w-4" />
                                Clear
                            </Button>
                        )}
                    </form>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium">Status</label>
                                <Select
                                    value={filters.status || 'all'}
                                    onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value === 'all' ? '' : value }))}
                                >
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
                                <label className="mb-2 block text-sm font-medium">Group</label>
                                <Select
                                    value={filters.group || 'all'}
                                    onValueChange={(value) => setFilters((prev) => ({ ...prev, group: value === 'all' ? '' : value }))}
                                >
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
                                <label className="mb-2 block text-sm font-medium">Date From</label>
                                <Input
                                    type="date"
                                    value={filters.date_from}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">Date To</label>
                                <Input
                                    type="date"
                                    value={filters.date_to}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Per page selector */}
                <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm">Show</span>
                    <select
                        value={perPage}
                        onChange={(e) => {
                            const newPerPage = Number(e.target.value);
                            setPerPage(newPerPage);
                            // Don't call fetchTableData here, let useEffect handle it
                        }}
                        className="rounded border px-2 py-1 text-sm dark:bg-muted dark:text-muted-foreground"
                    >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span className="text-sm">entries</span>
                </div>

                {/* Table */}
                <div className="space-y-4">
                    {!tableData ? (
                        <div className="py-8 text-center">
                            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
                            <p className="text-muted-foreground">Loading data...</p>
                        </div>
                    ) : tableData.data.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-muted-foreground">No subscriptions found matching your criteria.</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-full overflow-x-auto">
                                <div className="rounded-md">
                                    <table className="w-full min-w-[1200px] border-collapse">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                {columns.map((column, index) => (
                                                    <th
                                                        key={index}
                                                        className={cn(
                                                            `border-b px-4 py-3 text-left text-sm font-medium ${column.className || ''}`,
                                                            column.sortable && 'cursor-pointer hover:bg-muted/80',
                                                        )}
                                                        onClick={() =>
                                                            column.sortable && handleSort(column.header.toLowerCase().replace(/\s+/g, '_'))
                                                        }
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {column.header}
                                                            {column.sortable && <SortIcon field={column.header.toLowerCase().replace(/\s+/g, '_')} />}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableData.data.map((item, index) => (
                                                <tr key={item.subscription_id} className="border-b hover:bg-muted/50">
                                                    {columns.map((column, colIndex) => (
                                                        <td key={colIndex} className={`px-4 py-3 text-sm ${column.className || ''}`}>
                                                            {column.render(item)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination */}
                            {tableData.last_page > 1 && (
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {tableData.from} to {tableData.to} of {tableData.total} results
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage <= 1 || loading}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, tableData.last_page) }, (_, i) => {
                                                let pageNum;
                                                if (tableData.last_page <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= tableData.last_page - 2) {
                                                    pageNum = tableData.last_page - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }

                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={currentPage === pageNum ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handlePageChange(pageNum)}
                                                        disabled={loading}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
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
                                </div>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
