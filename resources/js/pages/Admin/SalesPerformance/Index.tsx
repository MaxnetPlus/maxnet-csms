import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Download, RotateCcw, Search, Target, TrendingUp, Trophy, Users } from 'lucide-react';
import React, { useState } from 'react';
import SalesPerformanceTable from './SalesPerformanceTable';

interface User {
    id: number;
    name: string;
    role: any;
    roles?: Array<{
        id: number;
        name: string;
        guard_name: string;
    }>;
}

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

interface Stats {
    total_points: number;
    total_converted: number;
    total_sales: number;
    total_target: number;
    achievement_percentage: number;
}

interface SalesUser {
    id: number;
    name: string;
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
    auth: {
        user: User;
    };
    performanceData: PaginatedPerformanceData;
    stats: Stats;
    salesUsers: SalesUser[];
    filters: Filters;
    monthNames: Record<number, string>;
    years: number[];
}

export default function Index({ auth, performanceData, stats, salesUsers, filters, monthNames, years }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (key: keyof Filters, value: string | number) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);

        // Apply filters immediately
        router.get(route('admin.sales-performance.index'), newFilters as Record<string, any>, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.sales-performance.index'), localFilters as Record<string, any>, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        const defaultFilters = {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            sales_id: 'all',
            search: '',
            sort: 'total_points',
            direction: 'desc',
        };
        setLocalFilters(defaultFilters);
        router.get(route('admin.sales-performance.index'), defaultFilters as Record<string, any>);
    };

    const handleExport = () => {
        const exportParams = Object.entries(localFilters)
            .map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`)
            .join('&');
        const exportUrl = route('admin.sales-performance.export') + '?' + exportParams;
        window.open(exportUrl, '_blank');
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: ' Dashboard', href: '/dashboard' },
                { title: 'Laporan Performa Sales', href: '/admin/sales-performance' },
            ]}
        >
            <Head title="Laporan Performa Sales" />

            <div className="mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Sales Performance Report</h1>
                        <p className="text-muted-foreground">Monitor and analyze your sales team's performance</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleExport} variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export Excel
                        </Button>
                    </div>
                </div>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Poin</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_points.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                {monthNames[filters.month]} {filters.year}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Prospek Terkonversi</CardTitle>
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_converted.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Total konversi bulan ini</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_sales}</div>
                            <p className="text-xs text-muted-foreground">Tim sales aktif</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pencapaian Target</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.achievement_percentage}%</div>
                            <p className="text-xs text-muted-foreground">Dari target {stats.total_target.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Filter & Pencarian</CardTitle>
                        <CardDescription>Filter laporan berdasarkan periode dan kriteria tertentu</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bulan</label>
                                <Select value={localFilters.month.toString()} onValueChange={(value) => handleFilterChange('month', parseInt(value))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(monthNames).map(([key, name]) => (
                                            <SelectItem key={key} value={key}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tahun</label>
                                <Select value={localFilters.year.toString()} onValueChange={(value) => handleFilterChange('year', parseInt(value))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Sales</label>
                                <Select value={localFilters.sales_id} onValueChange={(value) => handleFilterChange('sales_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Sales</SelectItem>
                                        {salesUsers.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Pencarian</label>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <div className="relative flex-1">
                                        <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari nama sales..."
                                            value={localFilters.search}
                                            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                                            className="w-auto pl-9"
                                        />
                                    </div>
                                    <div className="z-100 mt-2 flex gap-2 sm:mt-0">
                                        <Button type="submit" size="sm">
                                            <Search className="mr-2 h-4 w-4" />
                                            Cari
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-end gap-2"></div>
                        </form>
                    </CardContent>
                </Card>

                {/* Performance Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Data Performa Sales</CardTitle>
                        <CardDescription>
                            Menampilkan {performanceData.from}-{performanceData.to} dari {performanceData.total} data
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SalesPerformanceTable data={performanceData} filters={localFilters} onFilterChange={handleFilterChange} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
