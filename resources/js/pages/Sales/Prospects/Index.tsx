import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SalesLayout from '@/layouts/sales-layout';
import { Link, router } from '@inertiajs/react';
import { Filter, MapPin, Plus, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProspectsIndexProps {
    prospects: {
        data: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    categories: Array<{
        id: number;
        name: string;
        points: number;
    }>;
    filters: {
        status?: string;
        search?: string;
        category_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function ProspectsIndex({ prospects, categories, filters }: ProspectsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [categoryId, setCategoryId] = useState(filters.category_id || 'all');

    // Default to today's date if no filters are provided
    const today = new Date().toISOString().split('T')[0];
    const [dateFrom, setDateFrom] = useState(filters.date_from || (!filters.date_from && !filters.date_to ? today : ''));
    const [dateTo, setDateTo] = useState(filters.date_to || (!filters.date_from && !filters.date_to ? today : ''));

    // Debounced search and filters
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(
                '/sales/prospects',
                {
                    search: search || undefined,
                    status: status !== 'all' ? status : undefined,
                    category_id: categoryId !== 'all' ? categoryId : undefined,
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                },
                { preserveState: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, status, categoryId, dateFrom, dateTo]);

    const getStatusBadge = (status: string) => {
        const variants = {
            new: 'default',
            contacted: 'secondary',
            qualified: 'outline',
            converted: 'success',
            rejected: 'destructive',
        } as const;

        return variants[status as keyof typeof variants] || 'default';
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            new: 'Baru',
            contacted: 'Dihubungi',
            qualified: 'Terkualifikasi',
            converted: 'Terkonversi',
            rejected: 'Ditolak',
        } as const;

        return labels[status as keyof typeof labels] || status;
    };

    return (
        <SalesLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/sales' },
                { title: 'Prospek', href: '/sales/prospects' },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Kelola Prospek</h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <p>Total {prospects.total} prospek</p>
                            {dateFrom && dateTo && dateFrom === dateTo && dateFrom === new Date().toISOString().split('T')[0] && (
                                <span className="rounded bg-blue-50 px-2 py-1 text-sm text-blue-600">• Hari ini</span>
                            )}
                            {dateFrom && dateTo && (dateFrom !== dateTo || dateFrom !== new Date().toISOString().split('T')[0]) && (
                                <span className="rounded bg-orange-50 px-2 py-1 text-sm text-orange-600">
                                    •{' '}
                                    {dateFrom === dateTo
                                        ? `Tanggal ${new Date(dateFrom).toLocaleDateString('id-ID')}`
                                        : `${new Date(dateFrom).toLocaleDateString('id-ID')} - ${new Date(dateTo).toLocaleDateString('id-ID')}`}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Show Today Button if not already showing today */}
                        {!(dateFrom && dateTo && dateFrom === dateTo && dateFrom === new Date().toISOString().split('T')[0]) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    setDateFrom(today);
                                    setDateTo(today);
                                }}
                                className="w-full sm:w-auto"
                            >
                                Tampilkan Hari Ini
                            </Button>
                        )}
                        <Button asChild className="w-full sm:w-auto">
                            <Link href="/sales/prospects/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Prospek
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filters - Mobile Optimized */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter & Pencarian
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Search */}
                            <div>
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama, email, nomor, atau alamat..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Filter Row 1: Status and Category */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Status Filter */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Status</label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="new">Baru</SelectItem>
                                            <SelectItem value="contacted">Dihubungi</SelectItem>
                                            <SelectItem value="qualified">Terkualifikasi</SelectItem>
                                            <SelectItem value="converted">Terkonversi</SelectItem>
                                            <SelectItem value="rejected">Ditolak</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Category Filter */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Kategori</label>
                                    <Select value={categoryId} onValueChange={setCategoryId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Kategori</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name} ({category.points} poin)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Filter Row 2: Date Range */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Tanggal Dari</label>
                                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Tanggal Sampai</label>
                                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                                </div>
                            </div>

                            {/* Clear Filters Button */}
                            {(search ||
                                status !== 'all' ||
                                categoryId !== 'all' ||
                                (dateFrom && dateTo && !(dateFrom === dateTo && dateFrom === new Date().toISOString().split('T')[0]))) && (
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            setSearch('');
                                            setStatus('all');
                                            setCategoryId('all');
                                            setDateFrom(today);
                                            setDateTo(today);
                                        }}
                                    >
                                        Reset ke Hari Ini
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSearch('');
                                            setStatus('all');
                                            setCategoryId('all');
                                            setDateFrom('');
                                            setDateTo('');
                                        }}
                                    >
                                        Hapus Semua Filter
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Prospects List - Mobile Cards */}
                <div className="space-y-4">
                    {prospects.data.length > 0 ? (
                        prospects.data.map((prospect: any) => (
                            <Card key={prospect.id} className="transition-shadow hover:shadow-md">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                                                <h3 className="truncate text-lg font-semibold">{prospect.customer_name}</h3>
                                                <Badge variant={getStatusBadge(prospect.status)}>{getStatusLabel(prospect.status)}</Badge>
                                            </div>

                                            <div className="space-y-1 text-sm text-muted-foreground">
                                                {prospect.customer_email && <p>📧 {prospect.customer_email}</p>}
                                                {prospect.customer_number && <p>📱 {prospect.customer_number}</p>}
                                                {prospect.category && (
                                                    <p>
                                                        🏷️ {prospect.category.name} ({prospect.category.points} poin)
                                                    </p>
                                                )}
                                                {prospect.address && <p className="truncate">📍 {prospect.address}</p>}
                                            </div>

                                            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>Dibuat: {new Date(prospect.created_at).toLocaleDateString('id-ID')}</span>
                                                {prospect.converted_at && (
                                                    <span>Konversi: {new Date(prospect.converted_at).toLocaleDateString('id-ID')}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/sales/prospects/${prospect.id}`}>Detail</Link>
                                            </Button>
                                            {prospect.latitude && prospect.longitude && (
                                                <Button variant="ghost" size="sm" className="text-primary">
                                                    <MapPin className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold">Belum Ada Prospek</h3>
                                <p className="mb-4 text-muted-foreground">
                                    {search || status !== 'all' || categoryId !== 'all' || dateFrom || dateTo
                                        ? 'Tidak ada prospek yang sesuai dengan filter.'
                                        : 'Mulai tambahkan prospek pertama Anda.'}
                                </p>
                                {!search && status === 'all' && categoryId === 'all' && !dateFrom && !dateTo && (
                                    <Button asChild>
                                        <Link href="/sales/prospects/create">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah Prospek
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Pagination - Mobile Friendly */}
                {prospects.last_page > 1 && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                    Halaman {prospects.current_page} dari {prospects.last_page}
                                </span>
                                <div className="flex gap-2">
                                    {prospects.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(`/sales/prospects?page=${prospects.current_page - 1}`, {
                                                    search: search || undefined,
                                                    status: status !== 'all' ? status : undefined,
                                                    category_id: categoryId !== 'all' ? categoryId : undefined,
                                                    date_from: dateFrom || undefined,
                                                    date_to: dateTo || undefined,
                                                })
                                            }
                                        >
                                            Sebelumnya
                                        </Button>
                                    )}
                                    {prospects.current_page < prospects.last_page && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(`/sales/prospects?page=${prospects.current_page + 1}`, {
                                                    search: search || undefined,
                                                    status: status !== 'all' ? status : undefined,
                                                    category_id: categoryId !== 'all' ? categoryId : undefined,
                                                    date_from: dateFrom || undefined,
                                                    date_to: dateTo || undefined,
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
        </SalesLayout>
    );
}
