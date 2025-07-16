import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import SalesLayout from '@/layouts/sales-layout';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckSquare, Edit, FileText, Mail, MapPin, Phone, Star, Target, User } from 'lucide-react';
import { useState } from 'react';

interface ProspectShowProps {
    prospect: {
        id: number;
        customer_name: string;
        customer_email?: string;
        customer_number?: string;
        address?: string;
        sales_location?: string;
        latitude?: number;
        longitude?: number;
        status: string;
        notes?: string;
        converted_at?: string;
        created_at: string;
        updated_at: string;
        category: {
            id: number;
            name: string;
            points: number;
            description?: string;
        };
        sales: {
            id: number;
            name: string;
            email: string;
        };
        salesPoints: Array<{
            id: number;
            points_earned: number;
            date: string;
            type: string;
            description: string;
        }>;
    };
}

export default function ProspectShow({ prospect }: ProspectShowProps) {
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleStatusUpdate = async (newStatus: string) => {
        setIsUpdatingStatus(true);

        try {
            const response = await fetch(`/sales/prospects/${prospect.id}/update-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    status: newStatus,
                    notes: `Status diubah menjadi ${getStatusLabel(newStatus)}`,
                }),
            });

            if (response.ok) {
                router.reload();
            } else {
                alert('Terjadi kesalahan saat mengubah status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Terjadi kesalahan saat mengubah status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleConvert = async () => {
        if (!confirm('Apakah Anda yakin ingin mengkonversi prospek ini menjadi customer?')) {
            return;
        }

        setIsUpdatingStatus(true);

        try {
            const response = await fetch(`/sales/prospects/${prospect.id}/convert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                router.reload();
            } else {
                alert('Terjadi kesalahan saat mengkonversi prospek');
            }
        } catch (error) {
            console.error('Error converting prospect:', error);
            alert('Terjadi kesalahan saat mengkonversi prospek');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const totalPointsEarned = prospect.salesPoints ? prospect.salesPoints.reduce((sum, point) => sum + point.points_earned, 0) : 0;

    return (
        <SalesLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/sales' },
                { title: 'Prospek', href: '/sales/prospects' },
                { title: 'Detail Prospek', href: `/sales/prospects/${prospect.id}` },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/sales/prospects">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">Detail Prospek</h1>
                        <p className="text-muted-foreground">Prospek: {prospect.customer_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadge(prospect.status)}>{getStatusLabel(prospect.status)}</Badge>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/sales/prospects/${prospect.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column - Prospect Details */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Customer Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informasi Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Nama Customer</label>
                                    <p className="mt-1 text-lg font-medium">{prospect.customer_name}</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {prospect.customer_email && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                                            <div className="mt-1 flex items-center gap-2 text-sm">
                                                <Mail className="h-4 w-4" />
                                                <a href={`mailto:${prospect.customer_email}`} className="text-blue-600 hover:underline">
                                                    {prospect.customer_email}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {prospect.customer_number && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Nomor Telepon</label>
                                            <div className="mt-1 flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4" />
                                                <a href={`tel:${prospect.customer_number}`} className="text-blue-600 hover:underline">
                                                    {prospect.customer_number}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {prospect.address && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Alamat</label>
                                        <div className="mt-1 flex items-start gap-2 text-sm">
                                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                            <span>{prospect.address}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Location & Sales Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Lokasi & Sales
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {prospect.sales_location && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Lokasi Sales</label>
                                        <p className="mt-1 text-sm">{prospect.sales_location}</p>
                                    </div>
                                )}

                                {prospect.latitude && prospect.longitude && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Koordinat</label>
                                        <p className="mt-1 font-mono text-sm">
                                            {prospect.latitude}, {prospect.longitude}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => {
                                                const url = `https://www.google.com/maps?q=${prospect.latitude},${prospect.longitude}`;
                                                window.open(url, '_blank');
                                            }}
                                        >
                                            Lihat di Google Maps
                                        </Button>
                                    </div>
                                )}

                                <Separator />

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Dibuat oleh</label>
                                    <div className="mt-1 flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4" />
                                        <span>{prospect.sales.name}</span>
                                        <span className="text-muted-foreground">({prospect.sales.email})</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Category & Points */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Kategori & Poin
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Kategori</label>
                                    <p className="mt-1 text-sm font-medium">{prospect.category.name}</p>
                                    {prospect.category.description && (
                                        <p className="mt-1 text-sm text-muted-foreground">{prospect.category.description}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Poin Kategori</label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Star className="h-4 w-4 text-yellow-500" />
                                            <span className="font-medium">{prospect.category.points} poin</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Total Poin Earned</label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Star className="h-4 w-4 text-green-500" />
                                            <span className="font-medium">{totalPointsEarned} poin</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        {prospect.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Catatan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{prospect.notes}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Points History */}
                        {prospect.salesPoints && prospect.salesPoints.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Star className="h-5 w-5" />
                                        Riwayat Poin
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {prospect.salesPoints.map((point) => (
                                            <div key={point.id} className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{point.description}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(point.date).toLocaleDateString('id-ID')} • {point.type}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Star className="h-4 w-4 text-yellow-500" />
                                                    <span className="font-medium">+{point.points_earned}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Status & Actions */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckSquare className="h-5 w-5" />
                                    Status Prospek
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <Badge variant={getStatusBadge(prospect.status)} className="px-4 py-2 text-sm">
                                        {getStatusLabel(prospect.status)}
                                    </Badge>
                                </div>

                                <Separator />

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Dibuat:</span>
                                        <span>{new Date(prospect.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Diupdate:</span>
                                        <span>{new Date(prospect.updated_at).toLocaleDateString('id-ID')}</span>
                                    </div>

                                    {prospect.converted_at && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Konversi:</span>
                                            <span>{new Date(prospect.converted_at).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        {/* <Card>
                            <CardHeader>
                                <CardTitle>Aksi Cepat</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {prospect.status === 'new' && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        disabled={isUpdatingStatus}
                                        onClick={() => handleStatusUpdate('contacted')}
                                    >
                                        Tandai Sudah Dihubungi
                                    </Button>
                                )}

                                {prospect.status === 'contacted' && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        disabled={isUpdatingStatus}
                                        onClick={() => handleStatusUpdate('qualified')}
                                    >
                                        Tandai Terkualifikasi
                                    </Button>
                                )}

                                {['new', 'contacted', 'qualified'].includes(prospect.status) && (
                                    <Button className="w-full bg-green-600 hover:bg-green-700" disabled={isUpdatingStatus} onClick={handleConvert}>
                                        <CheckSquare className="mr-2 h-4 w-4" />
                                        Konversi ke Customer
                                    </Button>
                                )}

                                {prospect.status !== 'rejected' && prospect.status !== 'converted' && (
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        disabled={isUpdatingStatus}
                                        onClick={() => handleStatusUpdate('rejected')}
                                    >
                                        Tolak Prospek
                                    </Button>
                                )}

                                <Separator />

                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="/sales/prospects">Kembali ke Daftar</Link>
                                </Button>
                            </CardContent>
                        </Card> */}
                    </div>
                </div>
            </div>
        </SalesLayout>
    );
}
