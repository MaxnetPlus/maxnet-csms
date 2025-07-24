import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router } from '@inertiajs/react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';

interface SalesPerformanceData {
    sales_id: number;
    sales_name: string;
    sales_email: string;
    total_points: number;
    total_prospects: number;
    total_converted: number;
    monthly_target: number;
    achievement_percentage: number;
}

interface PaginatedPerformanceData {
    data: SalesPerformanceData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Filters {
    month: number;
    year: number;
    sales_id: string;
    search: string;
    sort: string;
    direction: string;
}

interface Props {
    data: PaginatedPerformanceData;
    filters: Filters;
    onFilterChange: (key: keyof Filters, value: string | number) => void;
}

export default function SalesPerformanceTable({ data, filters, onFilterChange }: Props) {
    const handleSort = (column: string) => {
        const direction = filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc';
        onFilterChange('sort', column);
        onFilterChange('direction', direction);
    };

    const handlePageChange = (page: number) => {
        const params = { ...filters, page: page.toString() } as Record<string, any>;
        router.get(route('admin.sales-performance.index'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getSortIcon = (column: string) => {
        if (filters.sort !== column) return null;
        return filters.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    };

    const getAchievementBadge = (percentage: number) => {
        if (percentage >= 100) {
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{percentage}%</Badge>;
        } else if (percentage >= 75) {
            return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{percentage}%</Badge>;
        } else if (percentage >= 50) {
            return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{percentage}%</Badge>;
        } else {
            return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{percentage}%</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Button variant="ghost" className="h-auto p-0 font-medium" onClick={() => handleSort('sales_name')}>
                                    Nama Sales
                                    {getSortIcon('sales_name')}
                                </Button>
                            </TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-center">
                                <Button variant="ghost" className="h-auto p-0 font-medium" onClick={() => handleSort('total_points')}>
                                    Total Poin
                                    {getSortIcon('total_points')}
                                </Button>
                            </TableHead>
                            <TableHead className="text-center">
                                <Button variant="ghost" className="h-auto p-0 font-medium" onClick={() => handleSort('total_prospects')}>
                                    Total Prospek
                                    {getSortIcon('total_prospects')}
                                </Button>
                            </TableHead>
                            <TableHead className="text-center">
                                <Button variant="ghost" className="h-auto p-0 font-medium" onClick={() => handleSort('total_converted')}>
                                    Prospek Terkonversi
                                    {getSortIcon('total_converted')}
                                </Button>
                            </TableHead>
                            <TableHead className="text-center">
                                <Button variant="ghost" className="h-auto p-0 font-medium" onClick={() => handleSort('monthly_target')}>
                                    Target Bulanan
                                    {getSortIcon('monthly_target')}
                                </Button>
                            </TableHead>
                            <TableHead className="text-center">
                                <Button variant="ghost" className="h-auto p-0 font-medium" onClick={() => handleSort('achievement_percentage')}>
                                    Pencapaian
                                    {getSortIcon('achievement_percentage')}
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Tidak ada data ditemukan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.data.map((item) => (
                                <TableRow key={item.sales_id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{item.sales_name}</div>
                                            <div className="text-sm text-muted-foreground">ID: {item.sales_id}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{item.sales_email}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="font-medium">{item.total_points.toLocaleString()}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="font-medium">{item.total_prospects.toLocaleString()}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="font-medium">{item.total_converted.toLocaleString()}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="font-medium">{item.monthly_target.toLocaleString()}</div>
                                    </TableCell>
                                    <TableCell className="text-center">{getAchievementBadge(item.achievement_percentage)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Menampilkan {data.from} hingga {data.to} dari {data.total} hasil
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handlePageChange(data.current_page - 1)} disabled={data.current_page <= 1}>
                            <ChevronLeft className="h-4 w-4" />
                            Sebelumnya
                        </Button>

                        {/* Page numbers */}
                        <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, data.last_page) }, (_, i) => {
                                let page;
                                if (data.last_page <= 5) {
                                    page = i + 1;
                                } else if (data.current_page <= 3) {
                                    page = i + 1;
                                } else if (data.current_page >= data.last_page - 2) {
                                    page = data.last_page - 4 + i;
                                } else {
                                    page = data.current_page - 2 + i;
                                }

                                return (
                                    <Button
                                        key={page}
                                        variant={data.current_page === page ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePageChange(page)}
                                        className="h-8 w-8 p-0"
                                    >
                                        {page}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(data.current_page + 1)}
                            disabled={data.current_page >= data.last_page}
                        >
                            Selanjutnya
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
