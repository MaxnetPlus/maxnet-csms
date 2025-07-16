import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import SalesLayout from '@/layouts/sales-layout';
import { Link } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Calendar, CheckSquare, Clock, FileText, Mail, MapPin, Phone, User } from 'lucide-react';

interface FollowUpShowProps {
    followUp: {
        id: number;
        status: string;
        priority: string;
        description: string;
        notes?: string;
        resolution?: string;
        created_at: string;
        completed_at?: string;
        customer: {
            customer_id: string;
            customer_name: string;
            customer_email?: string;
            customer_number?: string;
            address?: string;
        };
        subscription?: {
            subscription_id: string;
            package_name: string;
            monthly_fee: number;
            status: string;
        };
        creator: {
            name: string;
            email: string;
        };
    };
}

export default function FollowUpShow({ followUp }: FollowUpShowProps) {
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateShort = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <SalesLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/sales' },
                { title: 'Follow Up', href: '/sales/follow-ups' },
                { title: 'Detail Follow Up', href: `/sales/follow-ups/${followUp.id}` },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/sales/follow-ups">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold sm:text-2xl">Detail Follow Up</h1>
                            <p className="text-sm text-muted-foreground sm:text-base">Follow up untuk {followUp.customer.customer_name}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getStatusBadge(followUp.status)} className="text-xs">
                            {getStatusLabel(followUp.status)}
                        </Badge>
                        <Badge variant={getPriorityBadge(followUp.priority)} className="text-xs">
                            {getPriorityLabel(followUp.priority)}
                        </Badge>
                    </div>
                </div>

                {/* Mobile Status Card - Show on small screens */}
                <Card className="block lg:hidden">
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status</span>
                                <Badge variant={getStatusBadge(followUp.status)} className="text-xs">
                                    {getStatusLabel(followUp.status)}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Prioritas</span>
                                <Badge variant={getPriorityBadge(followUp.priority)} className="text-xs">
                                    {getPriorityLabel(followUp.priority)}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Dibuat</span>
                                <span className="text-sm">{formatDateShort(followUp.created_at)}</span>
                            </div>
                            {followUp.completed_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Selesai</span>
                                    <span className="text-sm">{formatDateShort(followUp.completed_at)}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column - Follow Up Details */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Follow Up Information */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="h-5 w-5" />
                                    Informasi Follow Up
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Deskripsi</label>
                                    <p className="mt-1 text-sm leading-relaxed">{followUp.description}</p>
                                </div>

                                {followUp.notes && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Catatan</label>
                                        <p className="mt-1 text-sm leading-relaxed">{followUp.notes}</p>
                                    </div>
                                )}

                                {followUp.resolution && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Resolusi</label>
                                        <p className="mt-1 text-sm leading-relaxed">{followUp.resolution}</p>
                                    </div>
                                )}

                                <Separator />

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Dibuat</label>
                                        <div className="mt-1 flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="break-all">{formatDate(followUp.created_at)}</span>
                                        </div>
                                    </div>

                                    {followUp.completed_at && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Selesai</label>
                                            <div className="mt-1 flex items-center gap-2 text-sm">
                                                <CheckSquare className="h-4 w-4 text-green-600" />
                                                <span className="break-all">{formatDate(followUp.completed_at)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Dibuat oleh</label>
                                    <div className="mt-1 flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="break-all">{followUp.creator.name}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer Information */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <User className="h-5 w-5" />
                                    Informasi Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">ID Customer</label>
                                    <p className="mt-1 font-mono text-sm break-all">{followUp.customer.customer_id}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Nama</label>
                                    <p className="mt-1 text-sm font-medium break-words">{followUp.customer.customer_name}</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {followUp.customer.customer_email && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                                            <div className="mt-1 flex items-start gap-2 text-sm">
                                                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                <a
                                                    href={`mailto:${followUp.customer.customer_email}`}
                                                    className="break-all text-blue-600 hover:underline"
                                                >
                                                    {followUp.customer.customer_email}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {followUp.customer.customer_number && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Nomor Telepon</label>
                                            <div className="mt-1 flex items-start gap-2 text-sm">
                                                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                <a
                                                    href={`tel:${followUp.customer.customer_number}`}
                                                    className="break-all text-blue-600 hover:underline"
                                                >
                                                    {followUp.customer.customer_number}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {followUp.customer.address && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Alamat</label>
                                        <div className="mt-1 flex items-start gap-2 text-sm">
                                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                            <span className="break-words">{followUp.customer.address}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Subscription Information */}
                        {followUp.subscription && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <AlertCircle className="h-5 w-5" />
                                        Informasi Subscription
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">ID Subscription</label>
                                        <p className="mt-1 font-mono text-sm break-all">{followUp.subscription.subscription_id}</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Paket</label>
                                            <p className="mt-1 text-sm font-medium break-words">{followUp.subscription.package_name}</p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Tarif Bulanan</label>
                                            <p className="mt-1 text-sm font-medium">{formatCurrency(followUp.subscription.monthly_fee)}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                                        <div className="mt-1">
                                            <Badge variant={followUp.subscription.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                                {followUp.subscription.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Status & Actions */}
                    <div className="space-y-6">
                        {/* Status Card - Hidden on mobile, shown on desktop */}
                        <Card className="hidden lg:block">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Clock className="h-5 w-5" />
                                    Status Follow Up
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <Badge variant={getStatusBadge(followUp.status)} className="px-4 py-2 text-sm">
                                        {getStatusLabel(followUp.status)}
                                    </Badge>
                                </div>

                                <div className="text-center">
                                    <Badge variant={getPriorityBadge(followUp.priority)} className="px-4 py-2 text-sm">
                                        Prioritas {getPriorityLabel(followUp.priority)}
                                    </Badge>
                                </div>

                                <Separator />

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Dibuat:</span>
                                        <span className="break-all">{formatDateShort(followUp.created_at)}</span>
                                    </div>

                                    {followUp.completed_at && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Selesai:</span>
                                            <span className="break-all">{formatDateShort(followUp.completed_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Aksi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href="/sales/follow-ups">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Kembali ke Daftar
                                    </Link>
                                </Button>

                                {followUp.status !== 'completed' && (
                                    <Button
                                        className="w-full justify-start bg-green-600 hover:bg-green-700"
                                        onClick={() => {
                                            // This would typically open a modal or navigate to complete action
                                            // For now, we'll just show an alert
                                            alert('Fitur complete akan diimplementasikan via modal dari halaman index');
                                        }}
                                    >
                                        <CheckSquare className="mr-2 h-4 w-4" />
                                        Selesaikan Follow Up
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </SalesLayout>
    );
}
