import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Edit, Eye, Filter, Loader2, Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface User {
    id: number;
    name: string;
}

interface Customer {
    customer_id: string;
    customer_name: string;
    customer_email: string;
}

interface Subscription {
    subscription_id: string;
    subscription_description: string;
}

interface CustomerFollowUp {
    id: number;
    customer_id: string;
    subscription_id?: string;
    priority: string;
    status: string;
    description: string;
    notes?: string;
    resolution?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
    customer?: Customer;
    subscription?: Subscription;
    creator?: User;
    assignee?: User;
    is_overdue?: boolean;
}

interface TableColumn {
    header: string;
    className?: string;
    sortable?: boolean;
    render: (data: CustomerFollowUp) => React.ReactNode;
}

interface PaginationData {
    data: CustomerFollowUp[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface CustomerFollowUpListProps {
    initialFilters?: {
        search?: string;
        status?: string;
        priority?: string;
        assigned_to?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
        direction?: string;
    };
    users: User[];
}

const statusConfig = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
} as const;

const priorityConfig = {
    low: { label: 'Low', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
    medium: { label: 'Medium', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    high: { label: 'High', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
} as const;

export default function CustomerFollowUpList({ initialFilters = {}, users }: CustomerFollowUpListProps) {
    const [tableData, setTableData] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: initialFilters.search || '',
        status: initialFilters.status || 'all',
        priority: initialFilters.priority || 'all',
        assigned_to: initialFilters.assigned_to || 'all',
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
                const response = await fetch(`/admin/follow-ups/table-data`, {
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
        [perPage, lastFetchParams],
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
            priority: 'all',
            assigned_to: 'all',
            date_from: '',
            date_to: '',
            sort: 'created_at',
            direction: 'desc',
        };
        setFilters(clearedFilters);
        setCurrentPage(1);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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
            header: 'ID',
            className: 'min-w-[80px]',
            sortable: true,
            render: (data: CustomerFollowUp) => <div className="font-medium">#{data.id}</div>,
        },
        {
            header: 'Customer',
            className: 'min-w-[180px]',
            sortable: true,
            render: (data: CustomerFollowUp) => (
                <div>
                    <div className="font-medium">{data.customer?.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{data.customer?.customer_email}</div>
                    <div className="text-xs text-muted-foreground">ID: {data.customer_id}</div>
                </div>
            ),
        },
        {
            header: 'Subscription',
            className: 'min-w-[140px]',
            render: (data: CustomerFollowUp) => (
                <div>
                    {data.subscription_id ? (
                        <>
                            <div className="text-sm font-medium">{data.subscription_id}</div>
                            <div className="max-w-[120px] truncate text-xs text-muted-foreground" title={data.subscription?.subscription_description}>
                                {data.subscription?.subscription_description}
                            </div>
                        </>
                    ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                </div>
            ),
        },
        {
            header: 'Status',
            className: 'min-w-[100px]',
            sortable: true,
            render: (data: CustomerFollowUp) => {
                const config = statusConfig[data.status as keyof typeof statusConfig];
                return <Badge className={config?.className}>{config?.label}</Badge>;
            },
        },
        {
            header: 'Priority',
            className: 'min-w-[100px]',
            sortable: true,
            render: (data: CustomerFollowUp) => {
                const config = priorityConfig[data.priority as keyof typeof priorityConfig];
                return <Badge className={config?.className}>{config?.label}</Badge>;
            },
        },
        {
            header: 'Assigned To',
            className: 'min-w-[120px]',
            render: (data: CustomerFollowUp) => (
                <div className="text-sm">{data.assignee ? data.assignee.name : <span className="text-muted-foreground">Unassigned</span>}</div>
            ),
        },
        {
            header: 'Description',
            className: 'min-w-[200px]',
            render: (data: CustomerFollowUp) => (
                <div className="max-w-[200px] truncate text-sm" title={data.description}>
                    {data.description}
                </div>
            ),
        },
        {
            header: 'Created',
            className: 'min-w-[120px]',
            sortable: true,
            render: (data: CustomerFollowUp) => (
                <div className="text-sm">
                    {formatDate(data.created_at)}
                    {data.is_overdue && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            Overdue
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: 'Completed',
            className: 'min-w-[120px]',
            render: (data: CustomerFollowUp) => (
                <div className="text-sm">
                    {data.completed_at ? (
                        <div className="flex items-center gap-1 text-green-600">
                            <Clock className="h-3 w-3" />
                            {formatDate(data.completed_at)}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    )}
                </div>
            ),
        },
        {
            header: 'Actions',
            className: 'min-w-[120px]',
            render: (data: CustomerFollowUp) => (
                <div className="flex gap-2">
                    <Link href={`/admin/follow-ups/${data.id}`}>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={`/admin/follow-ups/${data.id}/edit`}>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
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
                            <CardTitle>Follow Up Management</CardTitle>
                            <CardDescription>Manage and track customer follow ups</CardDescription>
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
                                placeholder="Search by customer name, email, description..."
                                value={filters.search}
                                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" size="sm" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                        </Button>
                        {(filters.search ||
                            filters.status !== 'all' ||
                            filters.priority !== 'all' ||
                            filters.assigned_to !== 'all' ||
                            filters.date_from ||
                            filters.date_to) && (
                            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4" />
                                Clear
                            </Button>
                        )}
                    </form>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-5">
                            <div>
                                <label className="text-sm font-medium">Status</label>
                                <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Priority</label>
                                <Select value={filters.priority} onValueChange={(value) => setFilters((prev) => ({ ...prev, priority: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Priorities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Priorities</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Assigned To</label>
                                <Select
                                    value={filters.assigned_to}
                                    onValueChange={(value) => setFilters((prev) => ({ ...prev, assigned_to: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Date From</label>
                                <Input
                                    type="date"
                                    value={filters.date_from}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Date To</label>
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
                                                <div className="flex items-center gap-2">
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
        </div>
    );
}
