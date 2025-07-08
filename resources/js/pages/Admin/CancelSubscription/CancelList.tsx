import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Loader2, MapPin, Search } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface MapDataPoint {
    id: string;
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    subscription_id: string;
    subscription_address: string;
    subscription_description: string;
    subscription_status: string;
    serv_id: string;
    lat: number | null;
    lng: number | null;
    coordinates: string;
    created_at: string;
    updated_at: string;
    dismantle_at: string | null;
}

interface TableColumn {
    header: string;
    className?: string;
    render: (data: MapDataPoint) => React.ReactNode;
}

interface PaginationData {
    data: MapDataPoint[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface CancelListProps {
    initialSearch?: string;
    mapBounds?: {
        north: number;
        south: number;
        east: number;
        west: number;
    } | null;
    onLocationClick?: (lat: number, lng: number, data: MapDataPoint) => void;
}

export default function CancelList({ initialSearch = '', mapBounds, onLocationClick }: CancelListProps) {
    const [tableData, setTableData] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(initialSearch);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
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
        async (page = 1, searchTerm = '', bounds: any = null, force = false) => {
            // Create a unique key for this request to prevent duplicate fetches
            const requestKey = JSON.stringify({ page, searchTerm, bounds, perPage });

            // Skip if we just made the same request (unless forced)
            if (!force && requestKey === lastFetchParams) {
                return;
            }

            setLoading(true);
            try {
                const response = await fetch('/admin/cancel-subscription/table-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        page,
                        per_page: perPage,
                        search: searchTerm,
                        bounds: bounds,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setTableData(data);
                    setLastFetchParams(requestKey);
                }
            } catch (error) {
                console.error('Error fetching table data:', error);
            } finally {
                setLoading(false);
            }
        },
        [perPage],
    );

    const debouncedFetchTableData = useCallback(
        debounce((page: number, searchTerm: string, bounds: any) => {
            fetchTableData(page, searchTerm, bounds, true);
        }, 300),
        [fetchTableData],
    );

    // Effect for initial load and when dependencies change
    useEffect(() => {
        fetchTableData(1, search, mapBounds, true);
        setCurrentPage(1);
    }, [mapBounds, perPage]); // Removed fetchTableData from dependencies to prevent loops

    // Effect for search changes
    useEffect(() => {
        if (search !== initialSearch) {
            debouncedFetchTableData(1, search, mapBounds);
            setCurrentPage(1);
        }
    }, [search, mapBounds, debouncedFetchTableData, initialSearch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTableData(1, search, mapBounds, true);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= (tableData?.last_page || 1) && newPage !== currentPage) {
            setCurrentPage(newPage);
            fetchTableData(newPage, search, mapBounds, true);
        }
    };

    const handleLocationClick = (data: MapDataPoint) => {
        if (data.lat && data.lng && onLocationClick) {
            onLocationClick(data.lat, data.lng, data);
        }
    };

    const columns: TableColumn[] = [
        {
            header: 'Customer',
            className: 'min-w-[180px]',
            render: (data: MapDataPoint) => (
                <div>
                    <p className="font-medium">{data.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{data.customer_id}</p>
                </div>
            ),
        },
        {
            header: 'Contact',
            className: 'min-w-[160px]',
            render: (data: MapDataPoint) => (
                <div>
                    <p className="text-sm">{data.customer_phone}</p>
                    <p className="text-sm text-muted-foreground">{data.customer_email || 'N/A'}</p>
                </div>
            ),
        },
        {
            header: 'Subscription',
            className: 'min-w-[140px]',
            render: (data: MapDataPoint) => (
                <div>
                    <p className="font-medium">{data.subscription_id}</p>
                    <p className="text-sm text-muted-foreground">Service: {data.serv_id}</p>
                </div>
            ),
        },
        {
            header: 'Description',
            className: 'min-w-[200px]',
            render: (data: MapDataPoint) => (
                <div className="max-w-[200px]">
                    <p className="truncate text-sm" title={data.subscription_description}>
                        {data.subscription_description || 'N/A'}
                    </p>
                </div>
            ),
        },
        {
            header: 'Status',
            className: 'min-w-[100px]',
            render: (data: MapDataPoint) => <Badge variant="destructive">{data.subscription_status}</Badge>,
        },
        {
            header: 'Location',
            className: 'min-w-[200px]',
            render: (data: MapDataPoint) => (
                <div>
                    <p className="font-mono text-sm">{data.coordinates}</p>
                    <p className="max-w-[180px] truncate text-xs text-muted-foreground" title={data.subscription_address}>
                        {data.subscription_address || 'N/A'}
                    </p>
                </div>
            ),
        },
        // {
        //     header: 'Date',
        //     className: 'min-w-[160px]',
        //     render: (data: MapDataPoint) => (
        //         <div>
        //             <p className="text-sm">Created: {data.created_at}</p>
        //             {data.dismantle_at && <p className="text-sm text-red-600">Dismantled: {data.dismantle_at}</p>}
        //         </div>
        //     ),
        // },
        {
            header: 'Updated At',
            className: 'min-w-[160px]',
            render: (data: MapDataPoint) => (
                <div>
                    <p className="text-sm">Updated At: {data.updated_at}</p>
                </div>
            ),
        },
        {
            header: 'Actions',
            className: 'min-w-[140px]',
            render: (data: MapDataPoint) => (
                <Button variant="outline" size="sm" onClick={() => handleLocationClick(data)} disabled={!data.lat || !data.lng}>
                    <MapPin className="mr-1 h-4 w-4" />
                    {data.lat && data.lng ? 'View on Map' : 'No Location'}
                </Button>
            ),
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Canceled Subscriptions Data
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardTitle>
                <CardDescription>
                    Detailed view of canceled subscriptions
                    {mapBounds && ' (filtered by map view)'}
                    {tableData && ` - Showing ${tableData.from}-${tableData.to} of ${tableData.total} records`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Search */}
                <form onSubmit={handleSearch} className="mb-4 flex gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by customer name, ID, subscription, service, description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Search
                    </Button>
                    {search && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setSearch('');
                                fetchTableData(1, '', mapBounds);
                                setCurrentPage(1);
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </form>

                {/* Per page selector */}
                <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm">Show</span>
                    <select
                        value={perPage}
                        onChange={(e) => {
                            const newPerPage = Number(e.target.value);
                            setPerPage(newPerPage);
                            setCurrentPage(1);
                            // Force immediate fetch with new per_page value
                            fetchTableData(1, search, mapBounds, true);
                        }}
                        className="rounded border px-2 py-1 text-sm dark:bg-muted dark:text-muted-foreground"
                    >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
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
                            <p className="text-muted-foreground">
                                {search || mapBounds ? 'No canceled subscriptions found matching your criteria.' : 'No canceled subscriptions found.'}
                            </p>
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
                                                        className={`border-b px-4 py-3 text-left text-sm font-medium ${column.className || ''}`}
                                                    >
                                                        {column.header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableData.data.map((item, index) => (
                                                <tr key={item.id} className="border-b hover:bg-muted/50">
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
