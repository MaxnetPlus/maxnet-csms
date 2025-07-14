import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import SalesLayout from '@/layouts/sales-layout';
import { Link } from '@inertiajs/react';
import { BarChart3, CheckSquare, MapPin, Plus, Target, TrendingUp, Trophy, Users } from 'lucide-react';

interface DashboardProps {
    currentTarget: any;
    todayStats: {
        prospects_count: number;
        points_earned: number;
        follow_ups_completed: number;
    };
    monthlyStats: {
        prospects_count: number;
        points_earned: number;
        follow_ups_completed: number;
        converted_prospects: number;
    };
    recentProspects: any[];
    pendingFollowUps: any[];
    accumulation: number;
}

export default function SalesDashboard({ currentTarget, todayStats, monthlyStats, recentProspects, pendingFollowUps, accumulation }: DashboardProps) {
    const dailyProgress = currentTarget ? (todayStats.points_earned / currentTarget.daily_target) * 100 : 0;
    const monthlyProgress = currentTarget ? (monthlyStats.points_earned / currentTarget.monthly_target) * 100 : 0;

    return (
        <SalesLayout breadcrumbs={[{ title: 'Dashboard', href: '/sales' }]}>
            <div className="space-y-6">
                {/* Welcome Section - Mobile Optimized */}
                <div className="rounded-lg border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
                    <h1 className="mb-2 text-2xl font-bold text-foreground">Selamat Datang, Sales! 👋</h1>
                    <p className="text-muted-foreground">Pantau performa dan target harian Anda. Tetap semangat mencapai target!</p>
                </div>

                {/* Quick Stats - Mobile Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{todayStats.prospects_count}</div>
                            <p className="text-xs text-muted-foreground">Prospek</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Poin Hari Ini</CardTitle>
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{todayStats.points_earned}</div>
                            <p className="text-xs text-muted-foreground">Poin</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{monthlyStats.prospects_count}</div>
                            <p className="text-xs text-muted-foreground">Prospek</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Akumulasi</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{accumulation}</div>
                            <p className="text-xs text-muted-foreground">Total Poin</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Target Progress */}
                {currentTarget && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Target Harian
                                </CardTitle>
                                <CardDescription>
                                    {todayStats.points_earned} / {currentTarget.daily_target} poin
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Progress value={Math.min(dailyProgress, 100)} className="w-full" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {dailyProgress >= 100
                                        ? 'Target tercapai! 🎉'
                                        : `${Math.max(0, currentTarget.daily_target - todayStats.points_earned)} poin lagi`}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Target Bulanan
                                </CardTitle>
                                <CardDescription>
                                    {monthlyStats.points_earned} / {currentTarget.monthly_target} poin
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Progress value={Math.min(monthlyProgress, 100)} className="w-full" />
                                <p className="mt-2 text-sm text-muted-foreground">{monthlyProgress.toFixed(1)}% tercapai</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Quick Actions - Mobile Friendly */}
                <Card>
                    <CardHeader>
                        <CardTitle>Aksi Cepat</CardTitle>
                        <CardDescription>Kelola prospek dan follow-up dengan mudah</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Button asChild className="h-12 justify-start">
                                <Link href="/sales/prospects/create">
                                    <Plus className="mr-2 h-5 w-5" />
                                    Tambah Prospek
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="h-12 justify-start">
                                <Link href="/sales/prospects">
                                    <MapPin className="mr-2 h-5 w-5" />
                                    Lihat Prospek
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="h-12 justify-start">
                                <Link href="/sales/follow-ups">
                                    <CheckSquare className="mr-2 h-5 w-5" />
                                    Follow Up
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activities */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Recent Prospects */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Prospek Terbaru</span>
                                <Link href="/sales/prospects" className="text-sm text-primary hover:underline">
                                    Lihat Semua
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentProspects.length > 0 ? (
                                <div className="space-y-3">
                                    {recentProspects.map((prospect: any) => (
                                        <div key={prospect.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium">{prospect.customer_name}</p>
                                                <p className="text-sm text-muted-foreground">{prospect.category?.name}</p>
                                            </div>
                                            <Badge
                                                variant={
                                                    prospect.status === 'new' ? 'default' : prospect.status === 'converted' ? 'success' : 'secondary'
                                                }
                                            >
                                                {prospect.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-4 text-center text-muted-foreground">Belum ada prospek hari ini</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pending Follow Ups */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Follow Up Pending</span>
                                <Link href="/sales/follow-ups" className="text-sm text-primary hover:underline">
                                    Lihat Semua
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pendingFollowUps.length > 0 ? (
                                <div className="space-y-3">
                                    {pendingFollowUps.map((followUp: any) => (
                                        <div key={followUp.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium">{followUp.customer?.customer_name}</p>
                                                <p className="text-sm text-muted-foreground">{followUp.description}</p>
                                            </div>
                                            <Badge
                                                variant={
                                                    followUp.priority === 'high'
                                                        ? 'destructive'
                                                        : followUp.priority === 'medium'
                                                          ? 'default'
                                                          : 'secondary'
                                                }
                                            >
                                                {followUp.priority}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-4 text-center text-muted-foreground">Tidak ada follow up pending</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </SalesLayout>
    );
}
