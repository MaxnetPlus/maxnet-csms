import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Eye, Filter, Loader2, Plus, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

// Format date helper function
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

interface FollowUp {
    id: number;
    priority: string;
    status: string;
}

interface Maintenance {
    ticket_id: string;
    subscription_id: string | null;
    customer_id: string;
    subject_problem: string;
    customer_report: string;
    technician_update_desc: string;
    status: string;
    work_by: string;
    created_by: string;
    ticket_close_date: string | null;
    created_at: string;
    updated_at: string;
    customer: {
        customer_id: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
    };
    subscription: {
        subscription_id: string;
        subscription_description: string;
    } | null;
    active_follow_ups?: FollowUp[];
    has_active_follow_ups?: boolean;
}

interface PaginationData {
    data: Maintenance[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface TableColumn {
    header: string;
    className?: string;
    sortable?: boolean;
    render: (data: Maintenance) => React.ReactNode;
}

interface MaintenanceListProps {
    initialFilters?: {
        search?: string;
        status?: string;
        subject_problem?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
        direction?: string;
    };
    subjectProblems: string[];
}

const statusConfig = {
    Open: { label: 'Open', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    Closed: { label: 'Closed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    'In Progress': { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
} as const;

export default function MaintenanceList({ initialFilters = {}, subjectProblems }: MaintenanceListProps) {
    const [tableData, setTableData] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: initialFilters.search || '',
        status: initialFilters.status || 'all',
        subject_problem: initialFilters.subject_problem || 'all',
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
    const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
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
            timeoutId = setTimeout(() => {
                func.apply(null, args);
            }, delay);
        };
    };

    const fetchTableData = useCallback(
        async (page = 1, currentFilters = filters, force = false) => {
            const queryParams = new URLSearchParams();
            queryParams.append('page', page.toString());
            queryParams.append('per_page', perPage.toString());

            Object.entries(currentFilters).forEach(([key, value]) => {
                if (value && value !== 'all') {
                    queryParams.append(key, String(value));
                }
            });

            const queryString = queryParams.toString();

            // Don't refetch if nothing changed and not forced
            if (queryString === lastFetchParams && !force) {
                return;
            }

            setLoading(true);
            setLastFetchParams(queryString);
            setCurrentPage(page);

            try {
                const response = await fetch(`/admin/maintenances/table-data`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify(Object.fromEntries(queryParams)),
                });

                if (response.ok) {
                    const data = await response.json();
                    setTableData(data);
                } else {
                    console.error('Failed to fetch maintenance data');
                }
            } catch (error) {
                console.error('Error fetching maintenance data:', error);
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
            subject_problem: 'all',
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
    const handleCreateFollowUp = (maintenance: Maintenance) => {
        setSelectedMaintenance(maintenance);
        setFollowUpForm({
            priority: 'medium',
            description: '',
            notes: '',
        });
        setShowFollowUpModal(true);
    };

    const handleSubmitFollowUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaintenance || !followUpForm.description) {
            return;
        }

        setSubmittingFollowUp(true);

        try {
            const response = await fetch(route('admin.maintenances.create-follow-up', selectedMaintenance.ticket_id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    customer_id: selectedMaintenance.customer_id,
                    priority: followUpForm.priority,
                    description: followUpForm.description,
                    assigned_to: 'unassigned', // Default to unassigned
                    notes: followUpForm.notes || null,
                }),
            });

            if (response.ok) {
                setShowFollowUpModal(false);
                setSelectedMaintenance(null);
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

    const formatDate = (date: string) => {
        try {
            return new Date(date).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (error) {
            return '-';
        }
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (filters.sort !== field) {
            return <span className="text-gray-400">↕</span>;
        }
        return filters.direction === 'asc' ? <span>↑</span> : <span>↓</span>;
    };

    const truncateText = (text: string | null, maxLength: number = 50) => {
        if (!text) return '-';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    const columns: TableColumn[] = [
        {
            header: 'Ticket ID',
            className: 'min-w-[140px]',
            sortable: true,
            render: (data: Maintenance) => (
                <div>
                    <div className="font-medium">{data.ticket_id}</div>
                    {data.subscription_id && <div className="text-xs text-muted-foreground">Sub: {data.subscription_id}</div>}
                </div>
            ),
        },
        {
            header: 'Customer',
            className: 'min-w-[180px]',
            sortable: true,
            render: (data: Maintenance) => (
                <div>
                    <div className="font-medium">{data.customer?.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{data.customer?.customer_email}</div>
                    <div className="text-xs text-muted-foreground">{data.customer?.customer_phone}</div>
                </div>
            ),
        },
        {
            header: 'Subscription ID',
            className: 'min-w-[140px]',
            render: (data: Maintenance) => (
                <div className="max-w-[140px] truncate" title={data.subscription?.subscription_description || '-'}>
                    {data.subscription?.subscription_id || '-'}
                </div>
            ),
        },
        {
            header: 'Subject',
            className: 'min-w-[180px]',
            sortable: true,
            render: (data: Maintenance) => (
                <div className="max-w-[180px] truncate" title={data.subject_problem}>
                    {data.subject_problem}
                </div>
            ),
        },
        {
            header: 'Report',
            className: 'min-w-[200px]',
            render: (data: Maintenance) => (
                <div className="max-w-[200px] truncate" title={data.customer_report}>
                    {truncateText(data.customer_report, 50)}
                </div>
            ),
        },

        {
            header: 'Technician Update',
            className: 'min-w-[200px]',
            render: (data: Maintenance) => (
                <div className="max-w-[200px] truncate" title={data.technician_update_desc}>
                    {truncateText(data.technician_update_desc, 50)}
                </div>
            ),
        },

        {
            header: 'Status',
            className: 'min-w-[100px]',
            sortable: true,
            render: (data: Maintenance) => {
                const config = statusConfig[data.status as keyof typeof statusConfig];
                return <Badge className={config?.className || 'bg-gray-100 text-gray-800'}>{config?.label || data.status}</Badge>;
            },
        },
        // {
        //     header: 'Work By',
        //     className: 'min-w-[120px]',
        //     render: (data: Maintenance) => <span>{data.work_by || '-'}</span>,
        // },
        {
            header: 'Follow Up',
            className: 'min-w-[120px]',
            render: (data: Maintenance) => (
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
            header: 'Created At',
            className: 'min-w-[120px]',
            sortable: true,
            render: (data: Maintenance) => <div className="text-sm">{formatDate(data.created_at)}</div>,
        },
        {
            header: 'Updated At',
            className: 'min-w-[120px]',
            sortable: true,
            render: (data: Maintenance) => <div className="text-sm">{formatDate(data.updated_at)}</div>,
        },
        {
            header: 'Actions',
            className: 'min-w-[100px]',
            render: (data: Maintenance) => (
                <div className="flex gap-2">
                    <a href={route('admin.maintenances.show', data.ticket_id)}>
                        <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </a>
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
                            <CardTitle>Maintenance Management</CardTitle>
                            <CardDescription>Manage and track maintenance tickets</CardDescription>
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
                                placeholder="Search by ticket ID, customer name, email or subject..."
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
                            filters.subject_problem !== 'all' ||
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
                        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-4">
                            <div>
                                <label className="text-sm font-medium">Status</label>
                                <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="Open">Open</SelectItem>
                                        <SelectItem value="Closed">Closed</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Subject Problem</label>
                                <Select
                                    value={filters.subject_problem}
                                    onValueChange={(value) => setFilters((prev) => ({ ...prev, subject_problem: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Problems" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Problems</SelectItem>
                                        {subjectProblems.map((subject) => (
                                            <SelectItem key={subject} value={subject}>
                                                {subject}
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
                        <CardTitle>Add Follow Up</CardTitle>
                        <CardDescription>Create a follow up for {selectedMaintenance?.customer?.customer_name}</CardDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitFollowUp} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Priority</label>
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
                            <label className="text-sm font-medium">Description *</label>
                            <Textarea
                                value={followUpForm.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setFollowUpForm((prev) => ({ ...prev, description: e.target.value }))
                                }
                                placeholder="Describe the follow up requirement..."
                                className="min-h-[100px]"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notes</label>
                            <Textarea
                                value={followUpForm.notes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setFollowUpForm((prev) => ({ ...prev, notes: e.target.value }))
                                }
                                placeholder="Any additional notes..."
                                className="min-h-[80px]"
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
