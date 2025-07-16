import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import SalesLayout from '@/layouts/sales-layout';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, MapPin, RotateCcw, Save, Target } from 'lucide-react';
import { useState } from 'react';

interface EditProspectProps {
    prospect: {
        id: number;
        prospect_category_id: number;
        customer_name: string;
        customer_email?: string;
        customer_number?: string;
        address?: string;
        sales_location?: string;
        latitude?: number;
        longitude?: number;
        status: string;
        notes?: string;
    };
    categories: any[];
}

export default function EditProspect({ prospect, categories }: EditProspectProps) {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
        prospect.latitude && prospect.longitude ? { lat: prospect.latitude, lng: prospect.longitude } : null,
    );
    const [locationError, setLocationError] = useState<string>('');
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [salesLocation, setSalesLocation] = useState<string>(prospect.sales_location || '');

    const { data, setData, put, processing, errors } = useForm({
        prospect_category_id: prospect.prospect_category_id.toString(),
        customer_name: prospect.customer_name,
        customer_email: prospect.customer_email || '',
        customer_number: prospect.customer_number || '',
        address: prospect.address || '',
        sales_location: prospect.sales_location || '',
        latitude: prospect.latitude ? prospect.latitude.toString() : '',
        longitude: prospect.longitude ? prospect.longitude.toString() : '',
        status: prospect.status,
        notes: prospect.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/sales/prospects/${prospect.id}`);
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation tidak didukung oleh browser ini.');
            return;
        }

        setLoadingLocation(true);
        setLocationError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });

                // Get address from coordinates using reverse geocoding
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const addressData = await response.json();
                    const address = addressData.display_name || `${latitude}, ${longitude}`;
                    setSalesLocation(address);

                    setData((prevData) => ({
                        ...prevData,
                        latitude: latitude.toString(),
                        longitude: longitude.toString(),
                        sales_location: address,
                    }));
                } catch (error) {
                    console.error('Error getting address:', error);
                    const fallbackAddress = `${latitude}, ${longitude}`;
                    setSalesLocation(fallbackAddress);

                    setData((prevData) => ({
                        ...prevData,
                        latitude: latitude.toString(),
                        longitude: longitude.toString(),
                        sales_location: fallbackAddress,
                    }));
                }

                setLoadingLocation(false);
            },
            (error) => {
                setLoadingLocation(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setLocationError('Izin lokasi ditolak. Silakan aktifkan GPS dan izin lokasi.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setLocationError('Informasi lokasi tidak tersedia.');
                        break;
                    case error.TIMEOUT:
                        setLocationError('Permintaan lokasi timeout.');
                        break;
                    default:
                        setLocationError('Terjadi kesalahan saat mengambil lokasi.');
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            },
        );
    };

    const refreshLocation = () => {
        getCurrentLocation();
    };

    return (
        <SalesLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/sales' },
                { title: 'Prospek', href: '/sales/prospects' },
                { title: prospect.customer_name, href: `/sales/prospects/${prospect.id}` },
                { title: 'Edit', href: `/sales/prospects/${prospect.id}/edit` },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/sales/prospects/${prospect.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Edit Prospek</h1>
                        <p className="text-muted-foreground">Edit data prospek: {prospect.customer_name}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Kategori Prospek
                            </CardTitle>
                            <CardDescription>Pilih kategori sesuai dengan jenis customer</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="prospect_category_id">Kategori *</Label>
                                    <Select value={data.prospect_category_id} onValueChange={(value) => setData('prospect_category_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih kategori prospek" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories && categories.length > 0 ? (
                                                categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id.toString()}>
                                                        <div className="flex w-full items-center justify-between">
                                                            <span>{category.name}</span>
                                                            <Badge variant="secondary" className="ml-2">
                                                                {category.points} poin
                                                            </Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-categories" disabled>
                                                    Tidak ada kategori tersedia
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.prospect_category_id && <p className="mt-1 text-sm text-destructive">{errors.prospect_category_id}</p>}
                                </div>

                                {/* Show selected category info */}
                                {data.prospect_category_id && (
                                    <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
                                        {(() => {
                                            const selectedCategory = categories.find((c) => c.id.toString() === data.prospect_category_id);
                                            return selectedCategory ? (
                                                <div>
                                                    <p className="font-medium text-primary">{selectedCategory.name}</p>
                                                    <p className="text-sm text-primary/80">
                                                        Poin yang didapat: <span className="font-medium">{selectedCategory.points}</span>
                                                    </p>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Customer</CardTitle>
                            <CardDescription>Data kontak dan informasi customer</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="customer_name">Nama Customer *</Label>
                                <Input
                                    id="customer_name"
                                    type="text"
                                    value={data.customer_name}
                                    onChange={(e) => setData('customer_name', e.target.value)}
                                    placeholder="Masukkan nama lengkap customer"
                                />
                                {errors.customer_name && <p className="mt-1 text-sm text-destructive">{errors.customer_name}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="customer_email">Email</Label>
                                    <Input
                                        id="customer_email"
                                        type="email"
                                        value={data.customer_email}
                                        onChange={(e) => setData('customer_email', e.target.value)}
                                        placeholder="customer@email.com"
                                    />
                                    {errors.customer_email && <p className="mt-1 text-sm text-destructive">{errors.customer_email}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="customer_number">Nomor Telepon</Label>
                                    <Input
                                        id="customer_number"
                                        type="tel"
                                        value={data.customer_number}
                                        onChange={(e) => setData('customer_number', e.target.value)}
                                        placeholder="08xxxxxxxxxx"
                                    />
                                    {errors.customer_number && <p className="mt-1 text-sm text-destructive">{errors.customer_number}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="address">Alamat</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Alamat lengkap customer"
                                    rows={3}
                                />
                                {errors.address && <p className="mt-1 text-sm text-destructive">{errors.address}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Update */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Status Prospek</CardTitle>
                            <CardDescription>Update status prospek sesuai dengan progress</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div>
                                <Label htmlFor="status">Status *</Label>
                                <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">Baru</SelectItem>
                                        <SelectItem value="contacted">Dihubungi</SelectItem>
                                        <SelectItem value="qualified">Terkualifikasi</SelectItem>
                                        <SelectItem value="converted">Terkonversi</SelectItem>
                                        <SelectItem value="rejected">Ditolak</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="mt-1 text-sm text-destructive">{errors.status}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Lokasi Sales & Koordinat
                            </CardTitle>
                            <CardDescription>Update lokasi sales dan koordinat</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={getCurrentLocation}
                                    disabled={loadingLocation}
                                    className="flex items-center gap-2"
                                >
                                    {loadingLocation ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                            <span>Mengambil lokasi...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MapPin className="h-4 w-4" />
                                            <span>Ambil Lokasi Saat Ini</span>
                                        </>
                                    )}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={refreshLocation}
                                    disabled={loadingLocation}
                                    className="flex items-center gap-2"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    <span>Refresh Lokasi</span>
                                </Button>
                            </div>

                            {locationError && (
                                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                                    {locationError}
                                </div>
                            )}

                            {/* Show current location */}
                            {salesLocation && (
                                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                                    <p className="font-medium">Lokasi Sales:</p>
                                    <p>{salesLocation}</p>
                                </div>
                            )}

                            {location && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                                    <p className="font-medium">Koordinat:</p>
                                    <p>Latitude: {location.lat}</p>
                                    <p>Longitude: {location.lng}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="latitude">Latitude</Label>
                                    <Input
                                        id="latitude"
                                        type="number"
                                        step="any"
                                        value={data.latitude}
                                        onChange={(e) => setData('latitude', e.target.value)}
                                        placeholder="Contoh: -6.2088"
                                    />
                                    {errors.latitude && <p className="mt-1 text-sm text-destructive">{errors.latitude}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="longitude">Longitude</Label>
                                    <Input
                                        id="longitude"
                                        type="number"
                                        step="any"
                                        value={data.longitude}
                                        onChange={(e) => setData('longitude', e.target.value)}
                                        placeholder="Contoh: 106.8456"
                                    />
                                    {errors.longitude && <p className="mt-1 text-sm text-destructive">{errors.longitude}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Catatan</CardTitle>
                            <CardDescription>Informasi tambahan tentang prospek ini</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Catatan tambahan tentang prospek, kebutuhan, atau informasi penting lainnya..."
                                rows={4}
                            />
                            {errors.notes && <p className="mt-1 text-sm text-destructive">{errors.notes}</p>}
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Button type="submit" disabled={processing} className="flex-1 sm:flex-none">
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                        <Button variant="outline" asChild className="flex-1 sm:flex-none">
                            <Link href={`/sales/prospects/${prospect.id}`}>Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </SalesLayout>
    );
}
