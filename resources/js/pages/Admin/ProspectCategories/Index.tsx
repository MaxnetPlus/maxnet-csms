import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';
import { Award, Edit, Eye, Plus, Search, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProspectCategory {
    id: number;
    name: string;
    description?: string;
    points: number;
    is_active: boolean;
    created_at: string;
    prospects_count: number;
    total_points_awarded: number;
}

interface ProspectCategoriesIndexProps {
    categories: {
        data: ProspectCategory[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
    };
    stats: {
        total_categories: number;
        active_categories: number;
        total_points_available: number;
        total_points_awarded: number;
    };
}

export default function ProspectCategoriesIndex({ categories, filters, stats }: ProspectCategoriesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get('/admin/prospect-categories', { search: search || undefined }, { preserveState: true, replace: true });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleDelete = (categoryId: number, categoryName: string) => {
        if (
            confirm(
                `Apakah Anda yakin ingin menghapus kategori "${categoryName}"?\n\nHati-hati: Semua prospek yang menggunakan kategori ini akan terpengaruh.`,
            )
        ) {
            router.delete(`/admin/prospect-categories/${categoryId}`);
        }
    };

    const toggleActiveStatus = (categoryId: number, currentStatus: boolean) => {
        router.patch(`/admin/prospect-categories/${categoryId}/toggle-status`, {
            is_active: !currentStatus,
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Prospect Categories', href: '/admin/prospect-categories' },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Prospect Categories</h1>
                        <p className="text-muted-foreground">Kelola kategori prospek dan sistem poin</p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/prospect-categories/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Kategori
                        </Link>
                    </Button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Kategori</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_categories}</div>
                            <p className="text-xs text-muted-foreground">{stats.active_categories} aktif</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Poin Tersedia</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_points_available}</div>
                            <p className="text-xs text-muted-foreground">Dari semua kategori aktif</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Poin Telah Diberikan</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.total_points_awarded}</div>
                            <p className="text-xs text-muted-foreground">Total poin yang telah diperoleh</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rata-rata Poin</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_categories > 0 ? Math.round(stats.total_points_available / stats.total_categories) : 0}
                            </div>
                            <p className="text-xs text-muted-foreground">Per kategori</p>
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
                                placeholder="Cari nama atau deskripsi kategori..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Categories List */}
                <div className="space-y-4">
                    {categories.data.length > 0 ? (
                        categories.data.map((category) => (
                            <Card key={category.id} className="transition-shadow hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-3 flex items-center gap-3">
                                                <h3 className="text-lg font-semibold">{category.name}</h3>
                                                <div className="flex gap-2">
                                                    <Badge
                                                        variant={category.is_active ? 'default' : 'secondary'}
                                                        className={category.is_active ? 'bg-green-500' : ''}
                                                    >
                                                        {category.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </Badge>
                                                    <Badge variant="outline">{category.points} poin</Badge>
                                                </div>
                                            </div>

                                            {category.description && (
                                                <p className="mb-4 line-clamp-2 text-muted-foreground">{category.description}</p>
                                            )}

                                            {/* Statistics */}
                                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                                                <div className="rounded-lg bg-muted/30 p-3 text-center">
                                                    <div className="text-lg font-bold text-primary">{category.prospects_count}</div>
                                                    <div className="text-xs text-muted-foreground">Prospek Menggunakan</div>
                                                </div>
                                                <div className="rounded-lg bg-muted/30 p-3 text-center">
                                                    <div className="text-lg font-bold text-primary">{category.total_points_awarded}</div>
                                                    <div className="text-xs text-muted-foreground">Total Poin Diberikan</div>
                                                </div>
                                                <div className="rounded-lg bg-muted/30 p-3 text-center">
                                                    <div className="text-lg font-bold text-primary">
                                                        {category.prospects_count > 0
                                                            ? Math.round(category.total_points_awarded / category.prospects_count)
                                                            : category.points}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">Rata-rata Poin</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 text-xs text-muted-foreground">
                                                Dibuat:{' '}
                                                {new Date(category.created_at).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex shrink-0 flex-col gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/prospect-categories/${category.id}`}>
                                                    <Eye className="mr-1 h-4 w-4" />
                                                    Detail
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/prospect-categories/${category.id}/edit`}>
                                                    <Edit className="mr-1 h-4 w-4" />
                                                    Edit
                                                </Link>
                                            </Button>
                                            <Button
                                                variant={category.is_active ? 'secondary' : 'default'}
                                                size="sm"
                                                onClick={() => toggleActiveStatus(category.id, category.is_active)}
                                            >
                                                {category.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(category.id, category.name)}
                                                disabled={category.prospects_count > 0}
                                            >
                                                <Trash2 className="mr-1 h-4 w-4" />
                                                Hapus
                                            </Button>
                                        </div>
                                    </div>

                                    {category.prospects_count > 0 && (
                                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                            <p className="text-sm text-amber-800">
                                                <Users className="mr-1 inline h-4 w-4" />
                                                Kategori ini digunakan oleh {category.prospects_count} prospek dan tidak dapat dihapus.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold">Belum Ada Kategori</h3>
                                <p className="mb-4 text-muted-foreground">
                                    {search ? 'Tidak ada kategori yang sesuai dengan pencarian.' : 'Mulai dengan membuat kategori prospek pertama.'}
                                </p>
                                {!search && (
                                    <Button asChild>
                                        <Link href="/admin/prospect-categories/create">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah Kategori
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Pagination */}
                {categories.last_page > 1 && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                    Halaman {categories.current_page} dari {categories.last_page}
                                </span>
                                <div className="flex gap-2">
                                    {categories.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(`/admin/prospect-categories?page=${categories.current_page - 1}`, {
                                                    search: search || undefined,
                                                })
                                            }
                                        >
                                            Sebelumnya
                                        </Button>
                                    )}
                                    {categories.current_page < categories.last_page && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(`/admin/prospect-categories?page=${categories.current_page + 1}`, {
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
