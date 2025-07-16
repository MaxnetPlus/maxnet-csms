import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SalesLayout from '@/layouts/sales-layout';
import { Link, router } from '@inertiajs/react';
import { Calendar, CheckSquare, Mail, Phone, Search, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import ComplateModal from './ComplateModal';

interface FollowUpsIndexProps {
    followUps: {
        data: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        status?: string;
        priority?: string;
        search?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function FollowUpsIndex({ followUps, filters }: FollowUpsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [priority, setPriority] = useState(filters.priority || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(filters.date_to || new Date().toISOString().split('T')[0]);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFollowUp, setSelectedFollowUp] = useState<{ id: number; customerName: string } | null>(null);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(
                '/sales/follow-ups',
                {
                    search: search || undefined,
                    status: status !== 'all' ? status : undefined,
                    priority: priority !== 'all' ? priority : undefined,
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                },
                { preserveState: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, status, priority, dateFrom, dateTo]);

    const getStatusBadge = (status: string) => {
        const variants = {
            pending: 'default',
            in_progress: 'secondary',
            completed: 'success',
            cancelled: 'destructive',
        } as const;

        return variants[status as keyof typeof variants] || 'default';
    };

    const getPriorityBadge = (priority: string) => {
        const variants = {
            low: 'secondary',
            medium: 'default',
            high: 'destructive',
        } as const;

        return variants[priority as keyof typeof variants] || 'default';
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            pending: 'Pending',
            in_progress: 'Sedang Dikerjakan',
            completed: 'Selesai',
            cancelled: 'Dibatalkan',
        } as const;

        return labels[status as keyof typeof labels] || status;
    };

    const getPriorityLabel = (priority: string) => {
        const labels = {
            low: 'Rendah',
            medium: 'Sedang',
            high: 'Tinggi',
        } as const;

        return labels[priority as keyof typeof labels] || priority;
    };

    const handleComplete = (followUpId: number, customerName: string) => {
        setSelectedFollowUp({ id: followUpId, customerName });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedFollowUp(null);
    };

    return (
        <SalesLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/sales' },
                { title: 'Follow Up', href: '/sales/follow-ups' },
            ]}
        >
            <div className="space-y-4 md:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-bold md:text-2xl">Follow Up Customer</h1>
                        <p className="text-sm text-muted-foreground">
                            {dateFrom === dateTo && dateFrom === new Date().toISOString().split('T')[0]
                                ? `Follow up hari ini - Total ${followUps.total} follow up`
                                : `Total ${followUps.total} follow up yang ditugaskan`}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="border-0 shadow-sm md:border md:shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                            <Search className="h-4 w-4 md:h-5 md:w-5" />
                            Filter & Pencarian
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            {/* Quick Date Actions */}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={
                                        dateFrom === new Date().toISOString().split('T')[0] && dateTo === new Date().toISOString().split('T')[0]
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => {
                                        const today = new Date().toISOString().split('T')[0];
                                        setDateFrom(today);
                                        setDateTo(today);
                                    }}
                                    className="h-8 text-xs"
                                >
                                    Hari Ini
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const yesterday = new Date();
                                        yesterday.setDate(yesterday.getDate() - 1);
                                        const yesterdayStr = yesterday.toISOString().split('T')[0];
                                        setDateFrom(yesterdayStr);
                                        setDateTo(yesterdayStr);
                                    }}
                                    className="h-8 text-xs"
                                >
                                    Kemarin
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const today = new Date();
                                        const weekStart = new Date(today);
                                        weekStart.setDate(today.getDate() - today.getDay());
                                        setDateFrom(weekStart.toISOString().split('T')[0]);
                                        setDateTo(today.toISOString().split('T')[0]);
                                    }}
                                    className="h-8 text-xs"
                                >
                                    Minggu Ini
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const today = new Date();
                                        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                                        setDateFrom(monthStart.toISOString().split('T')[0]);
                                        setDateTo(today.toISOString().split('T')[0]);
                                    }}
                                    className="h-8 text-xs"
                                >
                                    Bulan Ini
                                </Button>
                            </div>

                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama customer..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-11 pl-10 md:h-10"
                                    />
                                </div>
                            </div>

                            {/* Date Filters */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Dari Tanggal</label>
                                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-11 md:h-10" />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Sampai Tanggal</label>
                                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-11 md:h-10" />
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Status</label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="h-11 md:h-10">
                                            <SelectValue placeholder="Semua Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
                                            <SelectItem value="completed">Selesai</SelectItem>
                                            <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Priority Filter */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Prioritas</label>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger className="h-11 md:h-10">
                                            <SelectValue placeholder="Semua Prioritas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Prioritas</SelectItem>
                                            <SelectItem value="low">Rendah</SelectItem>
                                            <SelectItem value="medium">Sedang</SelectItem>
                                            <SelectItem value="high">Tinggi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Follow Ups List */}
                <div className="space-y-3 md:space-y-4">
                    {followUps.data.length > 0 ? (
                        followUps.data.map((followUp: any) => (
                            <Card key={followUp.id} className="border-0 shadow-sm transition-shadow hover:shadow-md md:border md:shadow-none">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            {/* Header with customer name and badges */}
                                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground md:h-5 md:w-5" />
                                                    <h3 className="text-base font-semibold md:text-lg">
                                                        {followUp.customer?.customer_name || 'Customer Tidak Diketahui'}
                                                    </h3>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Badge variant={getStatusBadge(followUp.status)} className="text-xs">
                                                        {getStatusLabel(followUp.status)}
                                                    </Badge>
                                                    <Badge variant={getPriorityBadge(followUp.priority)} className="text-xs">
                                                        {getPriorityLabel(followUp.priority)}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className="mb-3">
                                                <p className="mb-1 text-xs font-medium text-muted-foreground md:text-sm">Deskripsi:</p>
                                                <p className="text-xs md:text-sm">{followUp.description || 'Tidak ada deskripsi'}</p>
                                            </div>

                                            {/* Customer contact info */}
                                            {followUp.customer && (
                                                <div className="mb-3 space-y-1 text-xs text-muted-foreground md:text-sm">
                                                    {followUp.customer.customer_email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-3 w-3 md:h-4 md:w-4" />
                                                            <span>{followUp.customer.customer_email}</span>
                                                        </div>
                                                    )}
                                                    {followUp.customer.customer_phone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4" />
                                                            <span>{followUp.customer.customer_phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Notes if any */}
                                            {followUp.notes && (
                                                <div className="mb-3">
                                                    <p className="mb-1 text-sm font-medium text-muted-foreground">Catatan:</p>
                                                    <p className="rounded bg-muted/50 p-2 text-sm">{followUp.notes}</p>
                                                </div>
                                            )}

                                            {/* Timestamps */}
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Dibuat: {new Date(followUp.created_at).toLocaleDateString('id-ID')}</span>
                                                </div>
                                                {followUp.completed_at && (
                                                    <div className="flex items-center gap-1">
                                                        <CheckSquare className="h-3 w-3" />
                                                        <span>Selesai: {new Date(followUp.completed_at).toLocaleDateString('id-ID')}</span>
                                                    </div>
                                                )}
                                                {followUp.creator && <span>Dibuat oleh: {followUp.creator.name}</span>}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex shrink-0 flex-col gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/sales/follow-ups/${followUp.id}`}>Detail</Link>
                                            </Button>
                                            {followUp.status !== 'completed' && followUp.status !== 'cancelled' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleComplete(followUp.id, followUp.customer?.customer_name || 'Customer Tidak Diketahui')
                                                    }
                                                    className="bg-primary hover:bg-primary/90"
                                                >
                                                    <CheckSquare className="mr-1 h-4 w-4" />
                                                    Selesai
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
                                <CheckSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold">Tidak Ada Follow Up</h3>
                                <p className="mb-4 text-muted-foreground">
                                    {search || status || priority
                                        ? 'Tidak ada follow up yang sesuai dengan filter.'
                                        : 'Anda tidak memiliki follow up yang ditugaskan saat ini.'}
                                </p>
                                {!search && !status && !priority && (
                                    <p className="text-sm text-muted-foreground">Follow up akan muncul ketika admin menugaskan kepada Anda.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Pagination */}
                {followUps.last_page > 1 && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                    Halaman {followUps.current_page} dari {followUps.last_page}
                                </span>
                                <div className="flex gap-2">
                                    {followUps.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(`/sales/follow-ups?page=${followUps.current_page - 1}`, {
                                                    search: search || undefined,
                                                    status: status !== 'all' ? status : undefined,
                                                    priority: priority !== 'all' ? priority : undefined,
                                                    date_from: dateFrom || undefined,
                                                    date_to: dateTo || undefined,
                                                })
                                            }
                                        >
                                            Sebelumnya
                                        </Button>
                                    )}
                                    {followUps.current_page < followUps.last_page && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(`/sales/follow-ups?page=${followUps.current_page + 1}`, {
                                                    search: search || undefined,
                                                    status: status !== 'all' ? status : undefined,
                                                    priority: priority !== 'all' ? priority : undefined,
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

            {/* Complete Modal */}
            {selectedFollowUp && (
                <ComplateModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    followUpId={selectedFollowUp.id}
                    customerName={selectedFollowUp.customerName}
                />
            )}
        </SalesLayout>
    );
}
