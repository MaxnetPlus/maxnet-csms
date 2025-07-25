import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Notification, useNotification } from '@/components/ui/notification';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    Calendar,
    CheckCircle,
    Clock,
    Edit,
    MapIcon,
    MapPin,
    Phone,
    PhoneCall,
    Repeat,
    StickyNote,
    User,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

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
    sales_location?: string; // New field for sales location
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
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const { notification, showNotification, hideNotification } = useNotification();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new':
                return (
                    <Badge className="bg-purple-100 px-4 py-2 text-base font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        Baru
                    </Badge>
                );
            case 'contacted':
                return (
                    <Badge className="bg-yellow-100 px-4 py-2 text-base font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        Dihubungi
                    </Badge>
                );
            case 'qualified':
                return (
                    <Badge className="bg-blue-100 px-4 py-2 text-base font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        Terkualifikasi
                    </Badge>
                );
            case 'converted':
                return (
                    <Badge className="bg-green-100 px-4 py-2 text-base font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                        Terkonversi
                    </Badge>
                );
            case 'rejected':
                return <Badge className="bg-red-100 px-4 py-2 text-base font-medium text-red-800 dark:bg-red-900 dark:text-red-300">Ditolak</Badge>;
            default:
                return (
                    <Badge className="bg-purple-100 px-4 py-2 text-base font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        Pending
                    </Badge>
                );
        }
    };

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case 'new':
                return {
                    text: 'Baru',
                    icon: <Clock className="h-5 w-5" />,
                    color: 'text-purple-800',
                    bgColor: 'bg-purple-100',
                };
            case 'contacted':
                return {
                    text: 'Dihubungi',
                    icon: <PhoneCall className="h-5 w-5" />,
                    color: 'text-yellow-800',
                    bgColor: 'bg-yellow-100',
                };
            case 'qualified':
                return {
                    text: 'Terkualifikasi',
                    icon: <CheckCircle className="h-5 w-5" />,
                    color: 'text-blue-800',
                    bgColor: 'bg-blue-100',
                };
            case 'converted':
                return {
                    text: 'Terkonversi',
                    icon: <Repeat className="h-5 w-5" />,
                    color: 'text-green-800',
                    bgColor: 'bg-green-100',
                };
            case 'rejected':
                return {
                    text: 'Ditolak',
                    icon: <XCircle className="h-5 w-5" />,
                    color: 'text-red-800',
                    bgColor: 'bg-red-100',
                };
            default:
                return {
                    text: 'Pending',
                    icon: <Clock className="h-5 w-5" />,
                    color: 'text-purple-800',
                    bgColor: 'bg-purple-100',
                };
        }
    };

    const handleStatusChange = (newStatus: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected') => {
        const statusLabels = {
            new: 'Baru',
            contacted: 'Dihubungi',
            qualified: 'Terkualifikasi',
            converted: 'Terkonversi',
            rejected: 'Ditolak',
        };

        if (confirm(`Apakah Anda yakin ingin mengubah status prospek menjadi "${statusLabels[newStatus]}"?`)) {
            setIsUpdatingStatus(true);

            router.patch(
                `/admin/prospect-management/${prospect.id}/status`,
                {
                    status: newStatus,
                },
                {
                    onSuccess: () => {
                        setIsUpdatingStatus(false);
                        showNotification('success', 'Status Berhasil Diubah', `Status prospek berhasil diubah menjadi "${statusLabels[newStatus]}"`);
                    },
                    onError: (errors) => {
                        setIsUpdatingStatus(false);
                        console.error('Error updating status:', errors);
                        showNotification('error', 'Gagal Mengubah Status', 'Terjadi kesalahan saat mengubah status prospek');
                    },
                },
            );
        }
    };

    const handleQuickStatusChange = (newStatus: 'qualified' | 'rejected') => {
        const statusLabels = {
            qualified: 'Terkualifikasi',
            rejected: 'Ditolak',
        };
        const action = newStatus === 'qualified' ? 'menyetujui' : 'menolak';

        if (confirm(`Apakah Anda yakin ingin ${action} prospek ini?`)) {
            setIsUpdatingStatus(true);

            router.patch(
                `/admin/prospect-management/${prospect.id}/status`,
                {
                    status: newStatus,
                },
                {
                    onSuccess: () => {
                        setIsUpdatingStatus(false);
                        showNotification(
                            'success',
                            'Status Berhasil Diubah',
                            `Prospek berhasil ${action === 'menyetujui' ? 'disetujui' : 'ditolak'}`,
                        );
                    },
                    onError: (errors) => {
                        setIsUpdatingStatus(false);
                        console.error('Error updating status:', errors);
                        showNotification('error', 'Gagal Mengubah Status', 'Terjadi kesalahan saat mengubah status prospek');
                    },
                },
            );
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

                    {/* Status Actions - Mobile Responsive */}
                    {/* <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                        {prospect.status === 'new' && (
                            <>
                                <Button
                                    variant="default"
                                    className="flex-1 bg-green-500 hover:bg-green-600 sm:flex-none"
                                    onClick={() => handleQuickStatusChange('qualified')}
                                    disabled={isUpdatingStatus}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {isUpdatingStatus ? 'Memproses...' : 'Setujui'}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleQuickStatusChange('rejected')}
                                    disabled={isUpdatingStatus}
                                    className="flex-1 sm:flex-none"
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    {isUpdatingStatus ? 'Memproses...' : 'Tolak'}
                                </Button>
                            </>
                        )}
                        {prospect.status !== 'new' && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Status dapat diubah di panel samping</span>
                            </div>
                        )}
                    </div> */}
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
                                    <p className="mb-2 text-sm font-medium text-muted-foreground">Alamat Lengkap Customer</p>
                                    <p className="text-base">{prospect.address}</p>
                                </div>
                                <div>
                                    <p className="mb-2 text-sm font-medium text-muted-foreground">Lokasi Sales</p>
                                    <p className="text-base">{prospect.sales_location ? prospect.sales_location : 'Lokasi tidak tersedia'}</p>
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

                        {/* Status Management */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Edit className="h-5 w-5" />
                                    Kelola Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="mb-3 text-sm font-medium text-muted-foreground">Status Saat Ini</p>
                                    <div className="flex items-center justify-center rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                                        <div className="flex items-center gap-3">
                                            <div className={`rounded-full p-2 ${getStatusDisplay(prospect.status).bgColor}`}>
                                                <div className={getStatusDisplay(prospect.status).color}>
                                                    {getStatusDisplay(prospect.status).icon}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold">{getStatusDisplay(prospect.status).text}</p>
                                                <p className="text-sm text-muted-foreground">Status prospek saat ini</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-sm font-medium text-muted-foreground">Ubah Status</p>
                                    <Select
                                        value={prospect.status}
                                        onValueChange={(value) =>
                                            handleStatusChange(value as 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected')
                                        }
                                        disabled={isUpdatingStatus}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih status baru" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    <span>Baru</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="contacted">
                                                <div className="flex items-center gap-2">
                                                    <PhoneCall className="h-4 w-4" />
                                                    <span>Dihubungi</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="qualified">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4" />
                                                    <span>Terkualifikasi</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="converted">
                                                <div className="flex items-center gap-2">
                                                    <Repeat className="h-4 w-4" />
                                                    <span>Terkonversi</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="rejected">
                                                <div className="flex items-center gap-2">
                                                    <XCircle className="h-4 w-4" />
                                                    <span>Ditolak</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Quick Action Buttons */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Aksi Cepat</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {prospect.status === 'new' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleStatusChange('contacted')}
                                                className="bg-yellow-50 text-xs text-yellow-700 hover:bg-yellow-100"
                                            >
                                                <PhoneCall className="mr-1 h-3 w-3" />
                                                Dihubungi
                                            </Button>
                                        )}

                                        {['new', 'contacted'].includes(prospect.status) && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleStatusChange('qualified')}
                                                disabled={isUpdatingStatus}
                                                className="bg-blue-50 text-xs text-blue-700 hover:bg-blue-100"
                                            >
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Setujui
                                            </Button>
                                        )}

                                        {['new', 'contacted', 'qualified'].includes(prospect.status) && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleStatusChange('converted')}
                                                disabled={isUpdatingStatus}
                                                className="bg-green-50 text-xs text-green-700 hover:bg-green-100"
                                            >
                                                <Repeat className="mr-1 h-3 w-3" />
                                                Konversi
                                            </Button>
                                        )}

                                        {!['rejected', 'converted'].includes(prospect.status) && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleStatusChange('rejected')}
                                                disabled={isUpdatingStatus}
                                                className="bg-red-50 text-xs text-red-700 hover:bg-red-100"
                                            >
                                                <XCircle className="mr-1 h-3 w-3" />
                                                Tolak
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {isUpdatingStatus && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        <span>Memperbarui status...</span>
                                    </div>
                                )}

                                {/* Status Information */}
                                <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm">
                                    <p className="mb-2 font-medium text-blue-900">Informasi Status:</p>
                                    <ul className="space-y-1 text-xs text-blue-800">
                                        <li>
                                            <strong>Baru:</strong> Prospek baru dibuat
                                        </li>
                                        <li>
                                            <strong>Dihubungi:</strong> Sales sudah menghubungi
                                        </li>
                                        <li>
                                            <strong>Terkualifikasi:</strong> Prospek memenuhi kriteria
                                        </li>
                                        <li>
                                            <strong>Terkonversi:</strong> Menjadi customer
                                        </li>
                                        <li>
                                            <strong>Ditolak:</strong> Prospek tidak sesuai
                                        </li>
                                    </ul>
                                </div>
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

            {/* Notification */}
            <Notification
                show={notification.show}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onClose={hideNotification}
                autoHide={true}
                duration={5000}
                position="top-right"
            />
        </AppLayout>
    );
}
