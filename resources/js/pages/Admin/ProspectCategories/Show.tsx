import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Award, Calendar, CheckCircle, Edit, Eye, TrendingUp, Users, XCircle } from 'lucide-react';

interface ProspectCategory {
    id: number;
    name: string;
    description?: string;
    points: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    prospects_count: number;
    total_points_awarded: number;
    recent_prospects: Array<{
        id: number;
        customer_name: string;
        customer_number: string;
        status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
        points_earned: number;
        created_at: string;
        sales: {
            name: string;
            username: string;
        };
    }>;
}

interface ShowProspectCategoryProps {
    category: ProspectCategory;
}

export default function ShowProspectCategory({ category }: ShowProspectCategoryProps) {
    const toggleActiveStatus = () => {
        router.patch(`/admin/prospect-categories/${category.id}/toggle-status`, {
            is_active: !category.is_active,
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Disetujui
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Ditolak
                    </Badge>
                );
            default:
                return <Badge variant="secondary">Pending</Badge>;
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Prospect Categories', href: '/admin/prospect-categories' },
                { title: category.name, href: `/admin/prospect-categories/${category.id}` },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/prospect-categories">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">{category.name}</h1>
                            <p className="text-muted-foreground">Detail kategori prospek dan statistik penggunaan</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant={category.is_active ? 'secondary' : 'default'} onClick={toggleActiveStatus}>
                            {category.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                        <Button asChild>
                            <Link href={`/admin/prospect-categories/${category.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Kategori
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Category Information */}
                    <div className="space-y-6 lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5" />
                                    Informasi Kategori
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="mb-1 text-sm font-medium text-muted-foreground">Nama Kategori</p>
                                    <p className="text-lg font-semibold">{category.name}</p>
                                </div>

                                <div>
                                    <p className="mb-1 text-sm font-medium text-muted-foreground">Poin</p>
                                    <p className="text-2xl font-bold text-primary">{category.points} poin</p>
                                </div>

                                <div>
                                    <p className="mb-1 text-sm font-medium text-muted-foreground">Status</p>
                                    <Badge
                                        variant={category.is_active ? 'default' : 'secondary'}
                                        className={category.is_active ? 'bg-green-500' : ''}
                                    >
                                        {category.is_active ? 'Aktif' : 'Nonaktif'}
                                    </Badge>
                                </div>

                                {category.description && (
                                    <div>
                                        <p className="mb-1 text-sm font-medium text-muted-foreground">Deskripsi</p>
                                        <p className="text-sm">{category.description}</p>
                                    </div>
                                )}

                                <div>
                                    <p className="mb-1 text-sm font-medium text-muted-foreground">Dibuat</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-sm">
                                            {new Date(category.created_at).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Usage Statistics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Statistik Penggunaan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                                        <div className="text-2xl font-bold text-primary">{category.prospects_count}</div>
                                        <div className="text-xs text-muted-foreground">Total Prospek</div>
                                    </div>
                                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                                        <div className="text-2xl font-bold text-primary">{category.total_points_awarded}</div>
                                        <div className="text-xs text-muted-foreground">Total Poin Diberikan</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Rata-rata poin per prospek:</span>
                                        <span className="font-medium">
                                            {category.prospects_count > 0
                                                ? Math.round(category.total_points_awarded / category.prospects_count)
                                                : category.points}{' '}
                                            poin
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Efisiensi penggunaan:</span>
                                        <span className="font-medium">
                                            {category.prospects_count > 0
                                                ? Math.round((category.total_points_awarded / (category.prospects_count * category.points)) * 100)
                                                : 0}
                                            %
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Prospects */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Prospek Terbaru
                                </CardTitle>
                                <CardDescription>10 prospek terakhir yang menggunakan kategori ini</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {category.recent_prospects && category.recent_prospects.length > 0 ? (
                                    <div className="space-y-4">
                                        {category.recent_prospects.map((prospect) => (
                                            <div
                                                key={prospect.id}
                                                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="truncate font-semibold">{prospect.customer_name}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {prospect.customer_number} • Sales: {prospect.sales.name}
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
                                                    <div className="flex flex-col gap-1">
                                                        {getStatusBadge(prospect.status)}
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/admin/prospect-management/${prospect.id}`}>
                                                                <Eye className="mr-1 h-3 w-3" />
                                                                Detail
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {category.prospects_count > 10 && (
                                            <div className="pt-4 text-center">
                                                <Button variant="outline" asChild>
                                                    <Link href={`/admin/prospect-management?category_id=${category.id}`}>
                                                        Lihat Semua Prospek ({category.prospects_count})
                                                    </Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                        <h3 className="mb-2 text-lg font-semibold">Belum Ada Prospek</h3>
                                        <p className="text-muted-foreground">Kategori ini belum digunakan oleh prospek manapun.</p>
                                        {!category.is_active && (
                                            <p className="mt-2 text-sm text-amber-600">
                                                Kategori ini nonaktif dan tidak akan muncul dalam pilihan pembuatan prospek.
                                            </p>
                                        )}
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
