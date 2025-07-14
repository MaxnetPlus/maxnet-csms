import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, router } from '@inertiajs/react';
import { CheckCircle, ChevronLeft, ChevronRight, Eye, Filter, Search, Trash2, User, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
}

interface ProspectCategory {
    id: number;
    name: string;
    points: number;
}

interface Prospect {
    id: number;
    customer_name: string;
    customer_email: string;
    customer_number: string;
    address: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
    created_at: string;
    converted_at?: string;
    points?: number; // From the getPointsAttribute accessor
    sales: User;
    category: ProspectCategory;
}

interface TableColumn {
    header: string;
    className?: string;
    sortable?: boolean;
    render: (data: Prospect) => React.ReactNode;
}

interface PaginationData {
    data: Prospect[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface ProspectListProps {
    initialFilters?: {
        search?: string;
        status?: string;
        category_id?: string;
        sales_id?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
        direction?: string;
    };
    categories: ProspectCategory[];
    salesUsers: User[];
}

const statusConfig = {
    new: { label: 'New', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    contacted: { label: 'Contacted', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    qualified: { label: 'Qualified', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    converted: { label: 'Converted', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
} as const;

export default function ProspectList({ initialFilters = {}, categories, salesUsers }: ProspectListProps) {
    const [tableData, setTableData] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: initialFilters.search || '',
        status: initialFilters.status || 'all',
        category_id: initialFilters.category_id || 'all',
        sales_id: initialFilters.sales_id || 'all',
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
                const response = await fetch(`/admin/prospect-management/table-data`, {
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
            category_id: 'all',
            sales_id: 'all',
            date_from: '',
            date_to: '',
            sort: 'created_at',
            direction: 'desc',
        };
        setFilters(clearedFilters);
        setCurrentPage(1);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this prospect? This action cannot be undone.')) {
            return;
        }

        router.delete(`/admin/prospect-management/${id}`, {
            onSuccess: () => {
                // Refresh the table data
                fetchTableData(currentPage, filters, true);
            },
            onError: (errors) => {
                console.error('Error deleting prospect:', errors);
                alert('An error occurred while deleting the prospect.');
            },
        });
    };

    const handleStatusChange = (prospectId: number, newStatus: 'approved' | 'rejected') => {
        if (confirm(`Are you sure you want to ${newStatus === 'approved' ? 'approve' : 'reject'} this prospect?`)) {
            router.patch(
                `/admin/prospect-management/${prospectId}/status`,
                {
                    status: newStatus === 'approved' ? 'qualified' : 'rejected',
                },
                {
                    onSuccess: () => {
                        // Refresh the table data
                        fetchTableData(currentPage, filters, true);
                    },
                },
            );
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
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
            render: (data: Prospect) => <div className="font-medium">#{data.id}</div>,
        },
        {
            header: 'Customer',
            className: 'min-w-[200px]',
            sortable: true,
            render: (data: Prospect) => (
                <div>
                    <div className="font-medium">{data.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{data.customer_email}</div>
                    <div className="text-xs text-muted-foreground">📱 {data.customer_number}</div>
                </div>
            ),
        },
        {
            header: 'Address',
            className: 'min-w-[180px]',
            render: (data: Prospect) => (
                <div className="max-w-[180px] truncate text-sm" title={data.address}>
                    {data.address}
                    {data.latitude && data.longitude && (
                        <div className="text-xs text-muted-foreground">
                            📍 {Number(data.latitude).toFixed(6)}, {Number(data.longitude).toFixed(6)}
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: 'Sales',
            className: 'min-w-[120px]',
            sortable: true,
            render: (data: Prospect) => (
                <div>
                    <div className="font-medium">{data.sales.name}</div>
                    <div className="text-xs text-muted-foreground">@{data.sales.username}</div>
                </div>
            ),
        },
        {
            header: 'Category',
            className: 'min-w-[120px]',
            render: (data: Prospect) => (
                <div>
                    <Badge variant="outline">{data.category.name}</Badge>
                    <div className="mt-1 text-sm font-medium text-primary">+{data.points || data.category.points} points</div>
                </div>
            ),
        },
        {
            header: 'Status',
            className: 'min-w-[120px]',
            sortable: true,
            render: (data: Prospect) => {
                const config = statusConfig[data.status as keyof typeof statusConfig];
                return <Badge className={config?.className}>{config?.label}</Badge>;
            },
        },
        {
            header: 'Created',
            className: 'min-w-[140px]',
            sortable: true,
            render: (data: Prospect) => <div className="text-sm">{formatDate(data.created_at)}</div>,
        },
        {
            header: 'Converted',
            className: 'min-w-[140px]',
            render: (data: Prospect) => (
                <div className="text-sm">
                    {data.converted_at ? (
                        <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            {formatDate(data.converted_at)}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    )}
                </div>
            ),
        },
        {
            header: 'Actions',
            className: 'min-w-[200px]',
            render: (data: Prospect) => (
                <div className="flex gap-1">
                    <Link href={`/admin/prospect-management/${data.id}`}>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="View Details">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>

                    {data.status === 'new' && (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-green-600 hover:bg-green-50"
                                title="Approve Prospect"
                                onClick={() => handleStatusChange(data.id, 'approved')}
                            >
                                <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-red-600 hover:bg-red-50"
                                title="Reject Prospect"
                                onClick={() => handleStatusChange(data.id, 'rejected')}
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </>
                    )}

                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Delete Prospect"
                        onClick={() => handleDelete(data.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
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
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters & Search
                        </CardTitle>
                        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder="Search by customer name, email, phone, or address..."
                                value={filters.search}
                                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit" variant="outline" disabled={loading}>
                            Search
                        </Button>
                        <Button type="button" variant="outline" onClick={clearFilters} disabled={loading}>
                            Clear
                        </Button>
                    </form>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="qualified">Qualified</SelectItem>
                                    <SelectItem value="converted">Converted</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filters.category_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, category_id: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name} ({category.points} pts)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filters.sales_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, sales_id: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Sales" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sales</SelectItem>
                                    {salesUsers.map((user) => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={perPage.toString()} onValueChange={(value) => setPerPage(Number(value))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="15">15 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>Prospects {tableData && `(${tableData.from}-${tableData.to} of ${tableData.total})`}</CardTitle>
                        {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    {columns.map((column, index) => (
                                        <th key={index} className={`p-3 text-left text-sm font-medium ${column.className || ''}`}>
                                            {column.sortable ? (
                                                <button
                                                    onClick={() => handleSort(column.header.toLowerCase().replace(' ', '_'))}
                                                    className="flex items-center gap-1 hover:text-primary"
                                                    disabled={loading}
                                                >
                                                    {column.header}
                                                    <SortIcon field={column.header.toLowerCase().replace(' ', '_')} />
                                                </button>
                                            ) : (
                                                column.header
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableData?.data.map((prospect) => (
                                    <tr key={prospect.id} className="border-b hover:bg-muted/50">
                                        {columns.map((column, index) => (
                                            <td key={index} className={`p-3 ${column.className || ''}`}>
                                                {column.render(prospect)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {tableData?.data.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.length} className="p-8 text-center text-muted-foreground">
                                            No prospects found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
                        {Array.from({ length: Math.min(5, tableData.last_page) }, (_, i) => {
                            const pageNumber = Math.max(1, Math.min(tableData.last_page - 4, currentPage - 2)) + i;
                            if (pageNumber <= tableData.last_page) {
                                return (
                                    <Button
                                        key={pageNumber}
                                        variant={pageNumber === currentPage ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePageChange(pageNumber)}
                                        disabled={loading}
                                        className="h-8 w-8 p-0"
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
