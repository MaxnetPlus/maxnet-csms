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
            <div className="space-y-4 md:space-y-6">
                {/* Welcome Section - Mobile Optimized */}
                <div className="rounded-lg border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 md:p-6">
                    <h1 className="mb-2 text-xl font-bold text-foreground md:text-2xl">Selamat Datang, Sales! 👋</h1>
                    <p className="text-sm text-muted-foreground md:text-base">Pantau performa dan target harian Anda. Tetap semangat mencapai target!</p>
                </div>

                {/* Quick Stats - Mobile Grid */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                    <Card className="border-0 shadow-sm md:border md:shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium md:text-sm">Hari Ini</CardTitle>
                            <Users className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-primary md:text-2xl">{todayStats.prospects_count}</div>
                            <p className="text-xs text-muted-foreground">Prospek</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm md:border md:shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium md:text-sm">Poin Hari Ini</CardTitle>
                            <Trophy className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-primary md:text-2xl">{todayStats.points_earned}</div>
                            <p className="text-xs text-muted-foreground">Poin</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm md:border md:shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium md:text-sm">Bulan Ini</CardTitle>
                            <TrendingUp className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-primary md:text-2xl">{monthlyStats.prospects_count}</div>
                            <p className="text-xs text-muted-foreground">Prospek</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm md:border md:shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium md:text-sm">Akumulasi</CardTitle>
                            <BarChart3 className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-primary md:text-2xl">{accumulation}</div>
                            <p className="text-xs text-muted-foreground">Total Poin</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Target Progress */}
                {currentTarget && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Card className="border-0 shadow-sm md:border md:shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                    <Target className="h-4 w-4 md:h-5 md:w-5" />
                                    Target Harian
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {todayStats.points_earned} / {currentTarget.daily_target} poin
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Progress value={Math.min(dailyProgress, 100)} className="w-full" />
                                <p className="mt-2 text-xs text-muted-foreground md:text-sm">
                                    {dailyProgress >= 100
                                        ? 'Target tercapai! 🎉'
                                        : `${Math.max(0, currentTarget.daily_target - todayStats.points_earned)} poin lagi`}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm md:border md:shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                    <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                                    Target Bulanan
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {monthlyStats.points_earned} / {currentTarget.monthly_target} poin
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Progress value={Math.min(monthlyProgress, 100)} className="w-full" />
                                <p className="mt-2 text-xs text-muted-foreground md:text-sm">{monthlyProgress.toFixed(1)}% tercapai</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Quick Actions - Mobile Friendly */}
                <Card className="border-0 shadow-sm md:border md:shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base md:text-lg">Aksi Cepat</CardTitle>
                        <CardDescription className="text-sm">Kelola prospek dan follow-up dengan mudah</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Button asChild className="h-11 justify-start md:h-12">
                                <Link href="/sales/prospects/create">
                                    <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                                    <span className="text-sm md:text-base">Tambah Prospek</span>
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="h-11 justify-start md:h-12">
                                <Link href="/sales/prospects">
                                    <MapPin className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                                    <span className="text-sm md:text-base">Lihat Prospek</span>
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="h-11 justify-start md:h-12">
                                <Link href="/sales/follow-ups">
                                    <CheckSquare className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                                    <span className="text-sm md:text-base">Follow Up</span>
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activities */}
                <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
                    {/* Recent Prospects */}
                    <Card className="border-0 shadow-sm md:border md:shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between text-base md:text-lg">
                                <span>Prospek Terbaru</span>
                                <Link href="/sales/prospects" className="text-xs text-primary hover:underline md:text-sm">
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
                                                <p className="truncate text-sm font-medium md:text-base">{prospect.customer_name}</p>
                                                <p className="text-xs text-muted-foreground md:text-sm">{prospect.category?.name}</p>
                                            </div>
                                            <Badge
                                                variant={
                                                    prospect.status === 'new' ? 'default' : prospect.status === 'converted' ? 'success' : 'secondary'
                                                }
                                                className="text-xs"
                                            >
                                                {prospect.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-4 text-center text-sm text-muted-foreground">Belum ada prospek hari ini</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pending Follow Ups */}
                    <Card className="border-0 shadow-sm md:border md:shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between text-base md:text-lg">
                                <span>Follow Up Pending</span>
                                <Link href="/sales/follow-ups" className="text-xs text-primary hover:underline md:text-sm">
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
                                                <p className="truncate text-sm font-medium md:text-base">{followUp.customer?.customer_name}</p>
                                                <p className="text-xs text-muted-foreground md:text-sm">{followUp.description}</p>
                                            </div>
                                            <Badge
                                                variant={
                                                    followUp.priority === 'high'
                                                        ? 'destructive'
                                                        : followUp.priority === 'medium'
                                                          ? 'default'
                                                          : 'secondary'
                                                }
                                                className="text-xs"
                                            >
                                                {followUp.priority}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-4 text-center text-sm text-muted-foreground">Tidak ada follow up pending</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </SalesLayout>
    );
}
