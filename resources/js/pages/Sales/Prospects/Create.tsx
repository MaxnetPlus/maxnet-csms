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

interface CreateProspectProps {
    categories: any[];
}

export default function CreateProspect({ categories }: CreateProspectProps) {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string>('');
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [salesLocation, setSalesLocation] = useState<string>('');

    const { data, setData, post, processing, errors } = useForm({
        prospect_category_id: '',
        customer_name: '',
        customer_email: '',
        customer_number: '',
        address: '',
        sales_location: '',
        latitude: '',
        longitude: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/sales/prospects');
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
                { title: 'Tambah Prospek', href: '/sales/prospects/create' },
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
                    <div>
                        <h1 className="text-2xl font-bold">Tambah Prospek Baru</h1>
                        <p className="text-muted-foreground">Inputkan data prospek customer untuk mendapat poin</p>
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
                                                    <p className="text-sm text-muted-foreground">{selectedCategory.description}</p>
                                                    <p className="mt-1 text-sm font-medium">Poin yang didapat: {selectedCategory.points}</p>
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

                    {/* Location */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Lokasi Sales & Koordinat
                            </CardTitle>
                            <CardDescription>Ambil lokasi sales saat ini dan koordinat untuk pemetaan</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={getCurrentLocation}
                                    disabled={loadingLocation}
                                    className="w-full sm:w-auto"
                                >
                                    <MapPin className="mr-2 h-4 w-4" />
                                    {loadingLocation ? 'Mengambil Lokasi...' : 'Ambil Lokasi Saat Ini'}
                                </Button>

                                {location && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={refreshLocation}
                                        disabled={loadingLocation}
                                        className="w-full sm:w-auto"
                                    >
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Refresh Lokasi
                                    </Button>
                                )}
                            </div>

                            {locationError && (
                                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                                    <p className="text-sm text-destructive">{locationError}</p>
                                </div>
                            )}

                            {/* Sales Location Display */}
                            {salesLocation && (
                                <div>
                                    <Label htmlFor="sales_location">Lokasi Sales Saat Ini</Label>
                                    <Textarea
                                        id="sales_location"
                                        value={data.sales_location}
                                        onChange={(e) => setData('sales_location', e.target.value)}
                                        placeholder="Lokasi sales akan terisi otomatis..."
                                        rows={3}
                                        className="mt-1"
                                    />
                                    {errors.sales_location && <p className="mt-1 text-sm text-destructive">{errors.sales_location}</p>}
                                </div>
                            )}

                            {location && (
                                <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
                                    <p className="mb-1 text-sm font-medium text-primary">Koordinat Berhasil Diambil</p>
                                    <p className="text-sm text-muted-foreground">
                                        Latitude: {location.lat.toFixed(6)}, Longitude: {location.lng.toFixed(6)}
                                    </p>
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
                                        placeholder="-6.200000"
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
                                        placeholder="106.816666"
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
                            {processing ? 'Menyimpan...' : 'Simpan Prospek'}
                        </Button>
                        <Button variant="outline" asChild className="flex-1 sm:flex-none">
                            <Link href="/sales/prospects">Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </SalesLayout>
    );
}
