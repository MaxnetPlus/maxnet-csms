import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SalesLayout from '@/layouts/sales-layout';
import { Link, router } from '@inertiajs/react';
import { Calendar, CheckSquare, Mail, Phone, Search, User } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    };
}

export default function FollowUpsIndex({ followUps, filters }: FollowUpsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [priority, setPriority] = useState(filters.priority || 'all');

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(
                '/sales/follow-ups',
                {
                    search: search || undefined,
                    status: status !== 'all' ? status : undefined,
                    priority: priority !== 'all' ? priority : undefined,
                },
                { preserveState: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, status, priority]);

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

    const handleComplete = async (followUpId: number) => {
        // This would open a modal or redirect to complete page
        router.visit(`/sales/follow-ups/${followUpId}`);
    };

    return (
        <SalesLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/sales' },
                { title: 'Follow Up', href: '/sales/follow-ups' },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Follow Up Customer</h1>
                        <p className="text-muted-foreground">Total {followUps.total} follow up yang ditugaskan</p>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Filter & Pencarian
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 lg:flex-row">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama customer..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="w-full lg:w-48">
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
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
                            <div className="w-full lg:w-48">
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger>
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
                    </CardContent>
                </Card>

                {/* Follow Ups List */}
                <div className="space-y-4">
                    {followUps.data.length > 0 ? (
                        followUps.data.map((followUp: any) => (
                            <Card key={followUp.id} className="transition-shadow hover:shadow-md">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            {/* Header with customer name and badges */}
                                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-5 w-5 text-muted-foreground" />
                                                    <h3 className="text-lg font-semibold">
                                                        {followUp.customer?.customer_name || 'Customer Tidak Diketahui'}
                                                    </h3>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Badge variant={getStatusBadge(followUp.status)}>{getStatusLabel(followUp.status)}</Badge>
                                                    <Badge variant={getPriorityBadge(followUp.priority)}>{getPriorityLabel(followUp.priority)}</Badge>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className="mb-3">
                                                <p className="mb-1 text-sm font-medium text-muted-foreground">Deskripsi:</p>
                                                <p className="text-sm">{followUp.description || 'Tidak ada deskripsi'}</p>
                                            </div>

                                            {/* Customer contact info */}
                                            {followUp.customer && (
                                                <div className="mb-3 space-y-1 text-sm text-muted-foreground">
                                                    {followUp.customer.customer_email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-4 w-4" />
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
                                                    onClick={() => handleComplete(followUp.id)}
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
                                                    status: status || undefined,
                                                    priority: priority || undefined,
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
                                                    status: status || undefined,
                                                    priority: priority || undefined,
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
