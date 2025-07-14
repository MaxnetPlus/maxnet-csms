import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Notification, useNotification } from '@/components/ui/notification';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Edit, Eye, Filter, Loader2, Search, Trash2, UserPlus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface User {
    id: number;
    name: string;
    roles?: Array<{
        id: number;
        name: string;
        guard_name: string;
    }>;
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
    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Filter to only show sales users
    const salesUsers = users.filter((user) => {
        if (!user.roles || user.roles.length === 0) return false;
        return user.roles.some((role) => {
            const roleName = role.name.toLowerCase();
            return roleName.includes('sales') || roleName.includes('sale');
        });
    });

    const [tableData, setTableData] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: initialFilters.search || '',
        status: initialFilters.status || 'all',
        priority: initialFilters.priority || 'all',
        assigned_to: initialFilters.assigned_to || 'all',
        date_from: initialFilters.date_from || getTodayDate(),
        date_to: initialFilters.date_to || getTodayDate(),
        sort: initialFilters.sort || 'created_at',
        direction: initialFilters.direction || 'desc',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [showFilters, setShowFilters] = useState(false);
    const [lastFetchParams, setLastFetchParams] = useState<string>('');

    // Assign modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedFollowUp, setSelectedFollowUp] = useState<CustomerFollowUp | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string>('unassigned');
    const [assignLoading, setAssignLoading] = useState(false);

    // Use the notification hook
    const { notification, showNotification, hideNotification } = useNotification();

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
            date_from: getTodayDate(),
            date_to: getTodayDate(),
            sort: 'created_at',
            direction: 'desc',
        };
        setFilters(clearedFilters);
        setCurrentPage(1);
    };

    const handleAssign = (followUp: CustomerFollowUp) => {
        setSelectedFollowUp(followUp);
        setSelectedUserId(followUp.assignee?.id.toString() || 'unassigned');
        setShowAssignModal(true);
    };

    const handleAssignSubmit = async () => {
        if (!selectedFollowUp) return;

        setAssignLoading(true);

        try {
            const response = await fetch(`/admin/follow-ups/${selectedFollowUp.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    customer_id: selectedFollowUp.customer_id,
                    subscription_id: selectedFollowUp.subscription_id || '',
                    priority: selectedFollowUp.priority,
                    status: selectedFollowUp.status,
                    description: selectedFollowUp.description,
                    notes: selectedFollowUp.notes || '',
                    resolution: selectedFollowUp.resolution || '',
                    assigned_to: selectedUserId === 'unassigned' ? '' : selectedUserId,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                setShowAssignModal(false);
                setSelectedFollowUp(null);
                setSelectedUserId('unassigned');
                // Refresh the table data
                fetchTableData(currentPage, filters, true);

                // Show success notification
                const assignedUserName =
                    selectedUserId === 'unassigned' ? 'Unassigned' : salesUsers.find((user) => user.id.toString() === selectedUserId)?.name || 'User';

                showNotification(
                    'success',
                    'Assignment Successful!',
                    `Follow up #${selectedFollowUp.id} has been successfully assigned to ${assignedUserName}.`,
                );
            } else {
                const errorText = await response.text();
                console.error('Failed to assign user:', response.status, errorText);
                showNotification('error', 'Assignment Failed', 'An error occurred while assigning the user. Please try again.');
            }
        } catch (error) {
            console.error('Error assigning user:', error);
            showNotification(
                'error',
                'Network Error',
                'A network error occurred while assigning the user. Please check your connection and try again.',
            );
        } finally {
            setAssignLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this follow up? This action cannot be undone.')) {
            return;
        }

        router.delete(route('admin.follow-ups.destroy', id), {
            onSuccess: () => {
                // Refresh the table data
                fetchTableData(currentPage, filters, true);

                // Show success notification
                showNotification('success', 'Follow Up Deleted', `Follow up #${id} has been successfully deleted.`);
            },
            onError: (errors) => {
                console.error('Error deleting follow up:', errors);
                showNotification('error', 'Delete Failed', 'An error occurred while deleting the follow up. Please try again.');
            },
        });
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
            header: 'Notes',
            className: 'min-w-[200px]',
            render: (data: CustomerFollowUp) => (
                <div className="max-w-[200px] truncate text-sm" title={data.notes}>
                    {data.notes || <span className="text-muted-foreground">No notes</span>}
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
            className: 'min-w-[200px]',
            render: (data: CustomerFollowUp) => (
                <div className="flex gap-2">
                    <Link href={`/admin/follow-ups/${data.id}`}>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="View Details">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        title="Quick Assign"
                        onClick={() => handleAssign(data)}
                    >
                        <UserPlus className="h-4 w-4" />
                    </Button>
                    <Link href={`/admin/follow-ups/${data.id}/edit`}>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Edit Follow Up">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Delete Follow Up"
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
                                <label className="text-sm font-medium">Assigned To (Sales)</label>
                                <Select
                                    value={filters.assigned_to}
                                    onValueChange={(value) => setFilters((prev) => ({ ...prev, assigned_to: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Sales Users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sales Users</SelectItem>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {salesUsers.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <span>{user.name}</span>
                                                    {user.roles && user.roles.length > 0 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            ({user.roles.map((role) => role.name).join(', ')})
                                                        </span>
                                                    )}
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

            {/* Assign Modal */}
            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader className="pb-4">
                        <DialogTitle className="text-lg font-semibold">Quick Assign Follow Up</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Assign follow up #{selectedFollowUp?.id} to a sales user for efficient task management
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Follow Up Details Card */}
                        {selectedFollowUp && (
                            <div className="rounded-lg border bg-card p-4">
                                <h4 className="mb-3 text-sm font-semibold text-foreground">Follow Up Details</h4>
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Customer:</span>
                                        <span className="text-sm font-medium">{selectedFollowUp.customer?.customer_name}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Customer ID:</span>
                                        <span className="font-mono text-sm">{selectedFollowUp.customer_id}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Priority:</span>
                                        <Badge className={priorityConfig[selectedFollowUp.priority as keyof typeof priorityConfig]?.className}>
                                            {priorityConfig[selectedFollowUp.priority as keyof typeof priorityConfig]?.label}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Status:</span>
                                        <Badge className={statusConfig[selectedFollowUp.status as keyof typeof statusConfig]?.className}>
                                            {statusConfig[selectedFollowUp.status as keyof typeof statusConfig]?.label}
                                        </Badge>
                                    </div>

                                    {selectedFollowUp.description && (
                                        <div className="border-t pt-2">
                                            <span className="mb-1 block text-sm text-muted-foreground">Description:</span>
                                            <p className="rounded bg-muted/50 p-2 text-sm text-wrap text-foreground">
                                                {selectedFollowUp.description}
                                            </p>
                                        </div>
                                    )}

                                    {selectedFollowUp.assignee && (
                                        <div className="flex items-center justify-between border-t pt-2">
                                            <span className="text-sm text-muted-foreground">Currently Assigned:</span>
                                            <span className="text-sm font-medium text-blue-600">{selectedFollowUp.assignee.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Assignment Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Assign to Sales User</label>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a sales user..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned" className="text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <X className="h-4 w-4" />
                                            Unassign (No user)
                                        </div>
                                    </SelectItem>
                                    {salesUsers.length > 0 ? (
                                        salesUsers.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <UserPlus className="h-4 w-4" />
                                                    <div>
                                                        <div className="font-medium">{user.name}</div>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no-sales" disabled className="text-muted-foreground">
                                            No sales users available
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            {salesUsers.length === 0 && (
                                <p className="rounded bg-amber-50 p-2 text-xs text-amber-600">
                                    ⚠️ No users with sales roles found. Please ensure users have proper role assignments.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex justify-end gap-3 border-t pt-6">
                        <Button variant="outline" onClick={() => setShowAssignModal(false)} disabled={assignLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleAssignSubmit} disabled={assignLoading || salesUsers.length === 0} className="min-w-[100px]">
                            {assignLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Assign
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
