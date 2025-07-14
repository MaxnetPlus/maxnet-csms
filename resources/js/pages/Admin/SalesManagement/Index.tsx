import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';
import { Award, Edit, Eye, Search, Target, Trash2, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SalesUser {
    id: number;
    name: string;
    email: string;
    username: string;
    phone_number?: string;
    department?: string;
    created_at: string;
    stats: {
        today_prospects: number;
        today_points: number;
        month_prospects: number;
        month_points: number;
        total_points: number;
        current_target: {
            daily_target: number;
            monthly_target: number;
        } | null;
    };
}

interface SalesManagementIndexProps {
    salesUsers: {
        data: SalesUser[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
    };
}

export default function SalesManagementIndex({ salesUsers, filters }: SalesManagementIndexProps) {
    const [search, setSearch] = useState(filters.search || '');

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get('/admin/sales-management', { search: search || undefined }, { preserveState: true, replace: true });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleDelete = (userId: number, userName: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus sales user "${userName}"?`)) {
            router.delete(`/admin/sales-management/${userId}`);
        }
    };

    const getDailyProgress = (stats: SalesUser['stats']) => {
        if (!stats.current_target) return 0;
        const todayPoints = Number(stats.today_points || 0);
        const dailyTarget = Number(stats.current_target.daily_target || 0);
        if (dailyTarget === 0) return 0;
        return (todayPoints / dailyTarget) * 100;
    };

    const getMonthlyProgress = (stats: SalesUser['stats']) => {
        if (!stats.current_target) return 0;
        const monthPoints = Number(stats.month_points || 0);
        const monthlyTarget = Number(stats.current_target.monthly_target || 0);
        if (monthlyTarget === 0) return 0;
        return (monthPoints / monthlyTarget) * 100;
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Sales Management', href: '/admin/sales-management' },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Sales Management</h1>
                        <p className="text-muted-foreground">Kelola target sales dan monitor performa</p>
                    </div>
                    <div className="text-sm text-muted-foreground">Gunakan User Management untuk menambah sales user baru</div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{salesUsers.total}</div>
                            <p className="text-xs text-muted-foreground">Sales aktif</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Prospek Hari Ini</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{salesUsers.data.reduce((sum, user) => sum + user.stats.today_prospects, 0)}</div>
                            <p className="text-xs text-muted-foreground">Total prospek</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Poin Hari Ini</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {salesUsers.data.reduce((sum, user) => sum + Number(user.stats.today_points || 0), 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">Total poin</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Poin Bulan Ini</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {salesUsers.data.reduce((sum, user) => sum + Number(user.stats.month_points || 0), 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">Total poin bulan ini</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Pencarian
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative max-w-md">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder="Cari nama, email, atau username..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Sales Users List */}
                <div className="space-y-4">
                    {salesUsers.data.length > 0 ? (
                        salesUsers.data.map((user) => (
                            <Card key={user.id} className="transition-shadow hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-3 flex items-center gap-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold">{user.name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        @{user.username} • {user.email}
                                                    </p>
                                                    {user.department && <p className="text-sm text-muted-foreground">{user.department}</p>}
                                                </div>
                                            </div>

                                            {/* Performance Stats */}
                                            <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                                                <div className="rounded-lg bg-muted/30 p-3 text-center">
                                                    <div className="text-lg font-bold text-primary">{Number(user.stats.today_prospects || 0)}</div>
                                                    <div className="text-xs text-muted-foreground">Prospek Hari Ini</div>
                                                </div>
                                                <div className="rounded-lg bg-muted/30 p-3 text-center">
                                                    <div className="text-lg font-bold text-primary">{Number(user.stats.today_points || 0)}</div>
                                                    <div className="text-xs text-muted-foreground">Poin Hari Ini</div>
                                                </div>
                                                <div className="rounded-lg bg-muted/30 p-3 text-center">
                                                    <div className="text-lg font-bold text-primary">{Number(user.stats.month_prospects || 0)}</div>
                                                    <div className="text-xs text-muted-foreground">Prospek Bulan Ini</div>
                                                </div>
                                                <div className="rounded-lg bg-muted/30 p-3 text-center">
                                                    <div className="text-lg font-bold text-primary">{Number(user.stats.total_points || 0)}</div>
                                                    <div className="text-xs text-muted-foreground">Total Poin</div>
                                                </div>
                                            </div>

                                            {/* Target Progress */}
                                            {user.stats.current_target && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span>Target Harian</span>
                                                        <span>
                                                            {Number(user.stats.today_points || 0)} /{' '}
                                                            {Number(user.stats.current_target.daily_target || 0)} poin
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-muted">
                                                        <div
                                                            className="h-2 rounded-full bg-primary transition-all"
                                                            style={{ width: `${Math.min(getDailyProgress(user.stats), 100)}%` }}
                                                        />
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between text-sm">
                                                        <span>Target Bulanan</span>
                                                        <span>
                                                            {Number(user.stats.month_points || 0)} /{' '}
                                                            {Number(user.stats.current_target.monthly_target || 0)} poin
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-muted">
                                                        <div
                                                            className="h-2 rounded-full bg-primary transition-all"
                                                            style={{ width: `${Math.min(getMonthlyProgress(user.stats), 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex shrink-0 flex-col gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/sales-management/${user.id}`}>
                                                    <Eye className="mr-1 h-4 w-4" />
                                                    Detail
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/sales-management/${user.id}/edit`}>
                                                    <Edit className="mr-1 h-4 w-4" />
                                                    Edit
                                                </Link>
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id, user.name)}>
                                                <Trash2 className="mr-1 h-4 w-4" />
                                                Hapus
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold">Belum Ada Sales User</h3>
                                <p className="mb-4 text-muted-foreground">
                                    {search
                                        ? 'Tidak ada sales user yang sesuai dengan pencarian.'
                                        : 'Buat sales user melalui User Management dan assign role "sales".'}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Pagination */}
                {salesUsers.last_page > 1 && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                    Halaman {salesUsers.current_page} dari {salesUsers.last_page}
                                </span>
                                <div className="flex gap-2">
                                    {salesUsers.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(`/admin/sales-management?page=${salesUsers.current_page - 1}`, {
                                                    search: search || undefined,
                                                })
                                            }
                                        >
                                            Sebelumnya
                                        </Button>
                                    )}
                                    {salesUsers.current_page < salesUsers.last_page && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(`/admin/sales-management?page=${salesUsers.current_page + 1}`, {
                                                    search: search || undefined,
                                                })
                                            }
                                        >
                                            Selanjutnya
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
