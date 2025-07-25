import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Notification, useNotification } from '@/components/ui/notification';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { CheckCircle, ChevronLeft, ChevronRight, Eye, Filter, Loader2, PhoneCall, Repeat, Search, Trash2, User, X, XCircle } from 'lucide-react';
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
    sales_location?: string;
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
    new: { label: 'New', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    contacted: { label: 'Contacted', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    qualified: { label: 'Qualified', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    converted: { label: 'Converted', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
} as const;

export default function ProspectList({ initialFilters = {}, categories, salesUsers }: ProspectListProps) {
    // Get first and last day of current month in YYYY-MM-DD format
    const getMonthRange = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const toDateString = (date: Date) => date.toISOString().split('T')[0];
        return {
            firstDay: toDateString(firstDay),
            lastDay: toDateString(lastDay),
        };
    };

    console.log('categories', categories);

    const [tableData, setTableData] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const { notification, showNotification, hideNotification } = useNotification();
    const monthRange = getMonthRange();
    const [filters, setFilters] = useState({
        search: initialFilters.search || '',
        status: initialFilters.status || 'all',
        category_id: initialFilters.category_id || 'all',
        sales_id: initialFilters.sales_id || 'all',
        date_from: initialFilters.date_from || monthRange.firstDay,
        date_to: initialFilters.date_to || monthRange.lastDay,
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
                // Get CSRF token from meta tag
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

                const response = await fetch(route('admin.prospect-management.table-data'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify(requestData),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                setTableData(data);
                setCurrentPage(data.current_page);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                showNotification('error', 'Data Fetch Error', 'Failed to load prospect data. Please try again.');
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
        // Get first and last day of current month for default date fields
        const monthRange = getMonthRange();
        const clearedFilters = {
            search: '',
            status: 'all',
            category_id: 'all',
            sales_id: 'all',
            date_from: monthRange.firstDay,
            date_to: monthRange.lastDay,
            sort: 'created_at',
            direction: 'desc',
        };
        setFilters(clearedFilters);
        setCurrentPage(1);

        // Force refresh of data
        fetchTableData(1, clearedFilters, true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this prospect? This action cannot be undone.')) {
            return;
        }

        router.delete(route('admin.prospect-management.destroy', id), {
            onSuccess: () => {
                // Refresh the table data
                fetchTableData(currentPage, filters, true);
                showNotification('success', 'Prospect Deleted', 'The prospect has been successfully deleted.');
            },
            onError: (errors) => {
                console.error('Error deleting prospect:', errors);
                showNotification('error', 'Delete Failed', 'An error occurred while deleting the prospect.');
            },
        });
    };

    const handleStatusChange = (prospectId: number, newStatus: 'approved' | 'rejected' | 'contacted' | 'converted') => {
        let confirmMessage = '';
        let statusValue: 'qualified' | 'rejected' | 'contacted' | 'converted';
        if (newStatus === 'approved') {
            confirmMessage = 'Are you sure you want to approve this prospect?';
            statusValue = 'qualified';
        } else if (newStatus === 'rejected') {
            confirmMessage = 'Are you sure you want to reject this prospect?';
            statusValue = 'rejected';
        } else if (newStatus === 'contacted') {
            confirmMessage = 'Are you sure you want to mark this prospect as contacted?';
            statusValue = 'contacted';
        } else if (newStatus === 'converted') {
            confirmMessage = 'Are you sure you want to convert this prospect?';
            statusValue = 'converted';
        } else {
            return;
        }

        if (confirm(confirmMessage)) {
            router.patch(
                route('admin.prospect-management.update-status', prospectId),
                {
                    status: statusValue,
                },
                {
                    onSuccess: () => {
                        // Refresh the table data
                        fetchTableData(currentPage, filters, true);
                        showNotification('success', 'Status Updated', `Prospect has been ${statusValue} successfully.`);
                    },
                    onError: (errors) => {
                        console.error('Error updating status:', errors);
                        showNotification('error', 'Update Failed', 'An error occurred while updating the prospect status.');
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
                <div className="max-w-[180px] space-y-1 text-sm">
                    {data.address && (
                        <div className="truncate" title={data.address}>
                            👤 {data.address}
                        </div>
                    )}
                    {data.sales_location && (
                        <div className="truncate text-muted-foreground" title={data.sales_location}>
                            👨‍💼 {data.sales_location}
                        </div>
                    )}
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
        // {
        //     header: 'Converted',
        //     className: 'min-w-[140px]',
        //     render: (data: Prospect) => (
        //         <div className="text-sm">
        //             {data.converted_at ? (
        //                 <div className="flex items-center gap-1 text-green-600">
        //                     <CheckCircle className="h-3 w-3" />
        //                     {formatDate(data.converted_at)}
        //                 </div>
        //             ) : (
        //                 <span className="text-muted-foreground">-</span>
        //             )}
        //         </div>
        //     ),
        // },
        // notes
        {
            header: 'Notes',
            className: 'min-w-[200px]',
            render: (data: Prospect) => (
                <div className="max-w-[200px] text-sm text-muted-foreground">
                    {data.notes ? data.notes : <span className="italic">No notes</span>}
                </div>
            ),
        },

        {
            header: 'Actions',
            className: 'min-w-[200px]',
            render: (data: Prospect) => (
                <div className="flex gap-1">
                    <Link href={route('admin.prospect-management.show', data.id)}>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="View Details">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>

                    {data.status === 'new' && (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-blue-600 hover:bg-green-50"
                                title="Approve Prospect"
                                onClick={() => handleStatusChange(data.id, 'approved')}
                            >
                                <CheckCircle className="h-4 w-4" />
                            </Button>
                            {/* dihubungi */}
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-yellow-600 hover:bg-yellow-50"
                                title="Contact Prospect"
                                onClick={() => handleStatusChange(data.id, 'contacted')}
                            >
                                <PhoneCall className="h-4 w-4" />
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
                    {data.status === 'contacted' && (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-blue-600 hover:bg-green-50"
                                title="Approve Prospect"
                                onClick={() => handleStatusChange(data.id, 'approved')}
                            >
                                <CheckCircle className="h-4 w-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-green-600 hover:bg-green-50"
                                title="Mark as Converted"
                                onClick={() => handleStatusChange(data.id, 'converted')}
                            >
                                <Repeat className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {data.status === 'qualified' && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-green-600 hover:bg-green-50"
                            title="Mark as Converted"
                            onClick={() => handleStatusChange(data.id, 'converted')}
                        >
                            <Repeat className="h-4 w-4" />
                        </Button>
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
            {/* Notification Component */}
            <Notification
                show={notification.show}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onClose={hideNotification}
                autoHide={true}
                duration={5000}
                position="top-right"
            />

            {/* Status Guide */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">Petunjuk Status</CardTitle>
                    <CardDescription>Panduan status dan aksi yang tersedia untuk setiap prospek</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                        {/* New Status */}
                        <div className="flex items-center space-x-2">
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">New</Badge>
                            <div className="text-sm">
                                <div className="font-medium">Baru</div>
                                <div className="text-xs text-muted-foreground">Prospek baru yang belum ditindaklanjuti</div>
                            </div>
                        </div>

                        {/* Contacted Status */}
                        <div className="flex items-center space-x-2">
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Contacted</Badge>
                            <div className="text-sm">
                                <div className="font-medium">Dihubungi</div>
                                <div className="text-xs text-muted-foreground">Prospek telah dihubungi tim sales</div>
                            </div>
                        </div>

                        {/* Qualified Status */}
                        <div className="flex items-center space-x-2">
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Qualified</Badge>
                            <div className="text-sm">
                                <div className="font-medium">Terkualifikasi</div>
                                <div className="text-xs text-muted-foreground">Prospek yang layak untuk dikonversi</div>
                            </div>
                        </div>

                        {/* Converted Status */}
                        <div className="flex items-center space-x-2">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Converted</Badge>
                            <div className="text-sm">
                                <div className="font-medium">Terkonversi</div>
                                <div className="text-xs text-muted-foreground">Prospek berhasil menjadi customer</div>
                            </div>
                        </div>

                        {/* Rejected Status */}
                        <div className="flex items-center space-x-2">
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Rejected</Badge>
                            <div className="text-sm">
                                <div className="font-medium">Ditolak</div>
                                <div className="text-xs text-muted-foreground">Prospek ditolak atau tidak berminat</div>
                            </div>
                        </div>
                    </div>

                    {/* Action Icons Guide */}
                    <div className="mt-6 border-t pt-4">
                        <h4 className="mb-3 font-medium">Aksi yang Tersedia:</h4>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline" className="pointer-events-none h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">Lihat Detail</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline" className="pointer-events-none h-8 px-2 text-blue-600">
                                    <CheckCircle className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">Setujui Prospek (New → Qualified)</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline" className="pointer-events-none h-8 px-2 text-yellow-600">
                                    <PhoneCall className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">Hubungi Prospek</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline" className="pointer-events-none h-8 px-2 text-green-600">
                                    <Repeat className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">Konversi ke Customer</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline" className="pointer-events-none h-8 px-2 text-red-600">
                                    <XCircle className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">Tolak Prospek</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline" className="pointer-events-none h-8 w-8 p-0 text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">Hapus Prospek</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Search and Filter Bar */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Prospect Management</CardTitle>
                            <CardDescription>Manage and track customer prospects</CardDescription>
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
                                placeholder="Search by customer name, email, phone, or address..."
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
                            filters.category_id !== 'all' ||
                            filters.sales_id !== 'all' ||
                            filters.date_from ||
                            filters.date_to) && (
                            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4" />
                                Clear
                            </Button>
                        )}
                    </form>
                </CardHeader>
                <CardContent className="space-y-4">
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
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="contacted">Contacted</SelectItem>
                                        <SelectItem value="qualified">Qualified</SelectItem>
                                        <SelectItem value="converted">Converted</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Category</label>
                                <Select
                                    value={filters.category_id}
                                    onValueChange={(value) => setFilters((prev) => ({ ...prev, category_id: value }))}
                                >
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
                            </div>

                            <div>
                                <label className="text-sm font-medium">Sales Person</label>
                                <Select value={filters.sales_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, sales_id: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Sales" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sales</SelectItem>
                                        {salesUsers.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <span>{user.name}</span>
                                                </div>
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
                </CardContent>
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
                        <div className="flex items-center gap-3">
                            <Link href={route('admin.prospect-management.export')} className="inline-flex items-center">
                                <Button variant="outline" size="sm" className="gap-1">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        className="bi bi-file-earmark-excel"
                                        viewBox="0 0 16 16"
                                    >
                                        <path d="M5.884 6.68a.5.5 0 1 0-.768.64L7.349 10l-2.233 2.68a.5.5 0 0 0 .768.64L8 10.781l2.116 2.54a.5.5 0 0 0 .768-.641L8.651 10l2.233-2.68a.5.5 0 0 0-.768-.64L8 9.219l-2.116-2.54z" />
                                        <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
                                    </svg>
                                    Export CSV
                                </Button>
                            </Link>
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
                                    {tableData?.data.map((prospect) => (
                                        <tr key={prospect.id} className="border-b hover:bg-muted/50">
                                            {columns.map((column, index) => (
                                                <td key={index} className={cn('p-3', column.className)}>
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
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {tableData && tableData.last_page > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-4 text-card-foreground shadow">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{tableData.from}</span> to{' '}
                        <span className="font-medium text-foreground">{tableData.to}</span> of{' '}
                        <span className="font-medium text-foreground">{tableData.total}</span> prospects
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || loading}>
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Previous
                        </Button>

                        {/* Page Numbers */}
                        <div className="hidden gap-1 sm:flex">
                            {(() => {
                                // Create an array of page numbers to show
                                const pages = [];
                                let startPage = Math.max(1, currentPage - 2);
                                let endPage = Math.min(startPage + 4, tableData.last_page);

                                if (endPage - startPage < 4) {
                                    startPage = Math.max(1, endPage - 4);
                                }

                                // Always show first page
                                if (startPage > 1) {
                                    pages.push(
                                        <Button
                                            key={1}
                                            variant={1 === currentPage ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handlePageChange(1)}
                                            disabled={loading}
                                            className="h-8 w-8 p-0"
                                        >
                                            1
                                        </Button>,
                                    );

                                    // Add ellipsis if there's a gap
                                    if (startPage > 2) {
                                        pages.push(
                                            <Button key="ellipsis1" variant="outline" size="sm" disabled className="h-8 w-8 p-0">
                                                ...
                                            </Button>,
                                        );
                                    }
                                }

                                // Add page numbers
                                for (let i = startPage; i <= endPage; i++) {
                                    pages.push(
                                        <Button
                                            key={i}
                                            variant={i === currentPage ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handlePageChange(i)}
                                            disabled={loading}
                                            className="h-8 w-8 p-0"
                                        >
                                            {i}
                                        </Button>,
                                    );
                                }

                                // Always show last page
                                if (endPage < tableData.last_page) {
                                    // Add ellipsis if there's a gap
                                    if (endPage < tableData.last_page - 1) {
                                        pages.push(
                                            <Button key="ellipsis2" variant="outline" size="sm" disabled className="h-8 w-8 p-0">
                                                ...
                                            </Button>,
                                        );
                                    }

                                    pages.push(
                                        <Button
                                            key={tableData.last_page}
                                            variant={tableData.last_page === currentPage ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handlePageChange(tableData.last_page)}
                                            disabled={loading}
                                            className="h-8 w-8 p-0"
                                        >
                                            {tableData.last_page}
                                        </Button>,
                                    );
                                }

                                return pages;
                            })()}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= tableData.last_page || loading}
                        >
                            Next
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
