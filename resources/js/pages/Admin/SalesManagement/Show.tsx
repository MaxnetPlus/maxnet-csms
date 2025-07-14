import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Award, Building2, Calendar, Edit, Mail, MapPin, Phone, Target, TrendingUp, User } from 'lucide-react';

interface SalesUser {
    id: number;
    name: string;
    email: string;
    username: string;
    phone_number?: string;
    department?: string;
    notes?: string;
    created_at: string;
    stats: {
        today_prospects: number;
        today_points: number;
        week_prospects: number;
        week_points: number;
        month_prospects: number;
        month_points: number;
        total_prospects: number;
        total_points: number;
        current_target: {
            daily_target: number;
            monthly_target: number;
        } | null;
    };
    recent_prospects: Array<{
        id: number;
        name: string;
        phone: string;
        address: string;
        points_earned: number;
        created_at: string;
        status: 'pending' | 'approved' | 'rejected';
    }>;
}

interface ShowSalesUserProps {
    salesUser: SalesUser;
}

export default function ShowSalesUser({ salesUser }: ShowSalesUserProps) {
    const getDailyProgress = () => {
        if (!salesUser.stats.current_target) return 0;
        return (salesUser.stats.today_points / salesUser.stats.current_target.daily_target) * 100;
    };

    const getMonthlyProgress = () => {
        if (!salesUser.stats.current_target) return 0;
        return (salesUser.stats.month_points / salesUser.stats.current_target.monthly_target) * 100;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge variant="default" className="bg-green-500">
                        Disetujui
                    </Badge>
                );
            case 'rejected':
                return <Badge variant="destructive">Ditolak</Badge>;
            default:
                return <Badge variant="secondary">Pending</Badge>;
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Sales Management', href: '/admin/sales-management' },
                { title: salesUser.name, href: `/admin/sales-management/${salesUser.id}` },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/sales-management">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">{salesUser.name}</h1>
                            <p className="text-muted-foreground">Detail dan performa sales user</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href={`/admin/sales-management/${salesUser.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Sales User
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* User Information */}
                    <div className="space-y-6 lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informasi Pengguna
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Username</p>
                                            <p className="font-medium">@{salesUser.username}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Email</p>
                                            <p className="font-medium">{salesUser.email}</p>
                                        </div>
                                    </div>

                                    {salesUser.phone_number && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Telepon</p>
                                                <p className="font-medium">{salesUser.phone_number}</p>
                                            </div>
                                        </div>
                                    )}

                                    {salesUser.department && (
                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Departemen</p>
                                                <p className="font-medium">{salesUser.department}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Bergabung</p>
                                            <p className="font-medium">
                                                {new Date(salesUser.created_at).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {salesUser.notes && (
                                    <div className="border-t pt-4">
                                        <p className="mb-2 text-sm text-muted-foreground">Catatan</p>
                                        <p className="text-sm">{salesUser.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Current Targets */}
                        {salesUser.stats.current_target && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        Target Saat Ini
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-medium">Target Harian</span>
                                            <span className="text-sm text-muted-foreground">
                                                {salesUser.stats.today_points} / {salesUser.stats.current_target.daily_target}
                                            </span>
                                        </div>
                                        <Progress value={getDailyProgress()} className="h-2" />
                                        <p className="mt-1 text-xs text-muted-foreground">{getDailyProgress().toFixed(1)}% tercapai</p>
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-medium">Target Bulanan</span>
                                            <span className="text-sm text-muted-foreground">
                                                {salesUser.stats.month_points} / {salesUser.stats.current_target.monthly_target}
                                            </span>
                                        </div>
                                        <Progress value={getMonthlyProgress()} className="h-2" />
                                        <p className="mt-1 text-xs text-muted-foreground">{getMonthlyProgress().toFixed(1)}% tercapai</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Performance Stats */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-primary">{salesUser.stats.today_prospects}</div>
                                    <p className="text-sm text-muted-foreground">Prospek Hari Ini</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-primary">{salesUser.stats.today_points}</div>
                                    <p className="text-sm text-muted-foreground">Poin Hari Ini</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-primary">{salesUser.stats.month_prospects}</div>
                                    <p className="text-sm text-muted-foreground">Prospek Bulan Ini</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-primary">{salesUser.stats.total_points}</div>
                                    <p className="text-sm text-muted-foreground">Total Poin</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Weekly and Total Stats */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Performa Minggu Ini
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Prospek</span>
                                            <span className="text-lg font-bold">{salesUser.stats.week_prospects}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Poin</span>
                                            <span className="text-lg font-bold">{salesUser.stats.week_points}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="h-5 w-5" />
                                        Total Keseluruhan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Total Prospek</span>
                                            <span className="text-lg font-bold">{salesUser.stats.total_prospects}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Total Poin</span>
                                            <span className="text-lg font-bold">{salesUser.stats.total_points}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Prospects */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Prospek Terbaru
                                </CardTitle>
                                <CardDescription>10 prospek terakhir yang dibuat</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {salesUser.recent_prospects.length > 0 ? (
                                    <div className="space-y-4">
                                        {salesUser.recent_prospects.map((prospect) => (
                                            <div key={prospect.id} className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="truncate font-semibold">{prospect.name}</h4>
                                                    <p className="truncate text-sm text-muted-foreground">
                                                        {prospect.phone} • {prospect.address}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(prospect.created_at).toLocaleDateString('id-ID')}
                                                    </p>
                                                </div>
                                                <div className="ml-4 flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="font-semibold">+{prospect.points_earned}</div>
                                                        <div className="text-xs text-muted-foreground">poin</div>
                                                    </div>
                                                    {getStatusBadge(prospect.status)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                        <h3 className="mb-2 text-lg font-semibold">Belum Ada Prospek</h3>
                                        <p className="text-muted-foreground">Sales user ini belum membuat prospek apapun.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
