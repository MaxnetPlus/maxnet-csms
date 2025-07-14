import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Award, Calendar, CheckCircle, Clock, MapIcon, MapPin, Phone, StickyNote, User, XCircle } from 'lucide-react';

interface Prospect {
    id: number;
    customer_name: string;
    customer_email: string;
    customer_number: string;
    address: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
    points?: number; // From the getPointsAttribute accessor
    created_at: string;
    updated_at: string;
    sales: {
        id: number;
        name: string;
        username: string;
        email: string;
    };
    category: {
        id: number;
        name: string;
        points: number;
        description?: string;
    };
}

interface ShowProspectProps {
    prospect: Prospect;
}

export default function ShowProspect({ prospect }: ShowProspectProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new':
                return (
                    <Badge variant="secondary">
                        <Clock className="mr-2 h-4 w-4" />
                        Baru
                    </Badge>
                );
            case 'contacted':
                return (
                    <Badge variant="outline">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Dihubungi
                    </Badge>
                );
            case 'qualified':
                return (
                    <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Terkualifikasi
                    </Badge>
                );
            case 'converted':
                return (
                    <Badge variant="default" className="bg-blue-500">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Terkonversi
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Ditolak
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary">
                        <Clock className="mr-2 h-4 w-4" />
                        Pending
                    </Badge>
                );
        }
    };

    const handleStatusChange = (newStatus: 'approved' | 'rejected') => {
        if (confirm(`Apakah Anda yakin ingin ${newStatus === 'approved' ? 'menyetujui' : 'menolak'} prospek ini?`)) {
            router.patch(`/admin/prospect-management/${prospect.id}/status`, {
                status: newStatus === 'approved' ? 'qualified' : 'rejected',
            });
        }
    };

    const openInMaps = () => {
        if (prospect.latitude && prospect.longitude) {
            const url = `https://www.google.com/maps?q=${prospect.latitude},${prospect.longitude}`;
            window.open(url, '_blank');
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Prospect Management', href: '/admin/prospect-management' },
                { title: prospect.customer_name, href: `/admin/prospect-management/${prospect.id}` },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/prospect-management">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">{prospect.customer_name}</h1>
                            <p className="text-muted-foreground">Detail prospek dan informasi terkait</p>
                        </div>
                    </div>

                    {/* Status Actions */}
                    {prospect.status === 'new' && (
                        <div className="flex gap-2">
                            <Button variant="default" className="bg-green-500 hover:bg-green-600" onClick={() => handleStatusChange('approved')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Setujui
                            </Button>
                            <Button variant="destructive" onClick={() => handleStatusChange('rejected')}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Tolak
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Prospect Information */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informasi Prospek
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="mb-1 text-sm font-medium text-muted-foreground">Nama Lengkap</p>
                                            <p className="text-lg font-semibold">{prospect.customer_name}</p>
                                        </div>

                                        <div>
                                            <p className="mb-1 text-sm font-medium text-muted-foreground">Nomor Telepon</p>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <p className="font-medium">{prospect.customer_number}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="mb-1 text-sm font-medium text-muted-foreground">Status</p>
                                            <div className="flex items-center">{getStatusBadge(prospect.status)}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="mb-1 text-sm font-medium text-muted-foreground">Kategori</p>
                                            <Badge variant="outline" className="text-base">
                                                {prospect.category.name}
                                            </Badge>
                                        </div>

                                        <div>
                                            <p className="mb-1 text-sm font-medium text-muted-foreground">Poin Diperoleh</p>
                                            <div className="flex items-center gap-2">
                                                <Award className="h-5 w-5 text-yellow-500" />
                                                <p className="text-xl font-bold text-primary">+{prospect.points || prospect.category.points} poin</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="mb-1 text-sm font-medium text-muted-foreground">Tanggal Dibuat</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <p className="font-medium">
                                                    {new Date(prospect.created_at).toLocaleDateString('id-ID', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Address & Location */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Alamat & Lokasi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="mb-2 text-sm font-medium text-muted-foreground">Alamat Lengkap</p>
                                    <p className="text-base">{prospect.address}</p>
                                </div>

                                {prospect.latitude && prospect.longitude && (
                                    <div>
                                        <p className="mb-2 text-sm font-medium text-muted-foreground">Koordinat GPS</p>
                                        <div className="flex items-center justify-between">
                                            <p className="font-mono text-sm">
                                                {prospect.latitude && prospect.longitude
                                                    ? `${Number(prospect.latitude).toFixed(6)}, ${Number(prospect.longitude).toFixed(6)}`
                                                    : 'Tidak tersedia'}
                                            </p>
                                            <Button variant="outline" size="sm" onClick={openInMaps}>
                                                <MapIcon className="mr-2 h-4 w-4" />
                                                Buka di Maps
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        {prospect.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <StickyNote className="h-5 w-5" />
                                        Catatan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-base whitespace-pre-wrap">{prospect.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Sales Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Sales Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="mb-1 text-sm font-medium text-muted-foreground">Nama Sales</p>
                                    <p className="font-semibold">{prospect.sales.name}</p>
                                </div>

                                <div>
                                    <p className="mb-1 text-sm font-medium text-muted-foreground">Username</p>
                                    <p className="font-medium">@{prospect.sales.username}</p>
                                </div>

                                <div>
                                    <p className="mb-1 text-sm font-medium text-muted-foreground">Email</p>
                                    <p className="font-medium">{prospect.sales.email}</p>
                                </div>

                                <Button variant="outline" size="sm" asChild className="w-full">
                                    <Link href={`/admin/sales-management/${prospect.sales.id}`}>Lihat Detail Sales</Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Category Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5" />
                                    Kategori Prospek
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="mb-1 text-sm font-medium text-muted-foreground">Nama Kategori</p>
                                    <p className="font-semibold">{prospect.category.name}</p>
                                </div>

                                <div>
                                    <p className="mb-1 text-sm font-medium text-muted-foreground">Poin Kategori</p>
                                    <p className="text-lg font-bold text-primary">{prospect.category.points} poin</p>
                                </div>

                                {prospect.category.description && (
                                    <div>
                                        <p className="mb-1 text-sm font-medium text-muted-foreground">Deskripsi</p>
                                        <p className="text-sm">{prospect.category.description}</p>
                                    </div>
                                )}

                                <Button variant="outline" size="sm" asChild className="w-full">
                                    <Link href={`/admin/prospect-categories/${prospect.category.id}`}>Lihat Detail Kategori</Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-2 h-2 w-2 rounded-full bg-primary"></div>
                                    <div>
                                        <p className="text-sm font-medium">Prospek dibuat</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(prospect.created_at).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {prospect.updated_at !== prospect.created_at && (
                                    <div className="flex items-start gap-3">
                                        <div className="mt-2 h-2 w-2 rounded-full bg-muted-foreground"></div>
                                        <div>
                                            <p className="text-sm font-medium">Terakhir diperbarui</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(prospect.updated_at).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
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
