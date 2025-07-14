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
    filters: {
        status?: string;
        search?: string;
    };
}

export default function ProspectsIndex({ prospects, filters }: ProspectsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(
                '/sales/prospects',
                { search: search || undefined, status: status !== 'all' ? status : undefined },
                { preserveState: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, status]);

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
                        <p className="text-muted-foreground">Total {prospects.total} prospek</p>
                    </div>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/sales/prospects/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Prospek
                        </Link>
                    </Button>
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
                        <div className="flex flex-col gap-4 sm:flex-row">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama, email, atau nomor..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="w-full sm:w-48">
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
                                    {search || status ? 'Tidak ada prospek yang sesuai dengan filter.' : 'Mulai tambahkan prospek pertama Anda.'}
                                </p>
                                {!search && !status && (
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
