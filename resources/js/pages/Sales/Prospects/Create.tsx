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
            <div className="space-y-4 md:space-y-6">
                {/* Mobile Header */}
                <div className="sticky top-0 z-10 -mx-4 -mt-4 border-b bg-background/95 backdrop-blur-sm md:relative md:mx-0 md:mt-0 md:border-0 md:bg-transparent">
                    <div className="flex items-center gap-3 px-4 py-3 md:px-0 md:py-0">
                        <Button variant="ghost" size="sm" asChild className="shrink-0">
                            <Link href="/sales/prospects">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-lg font-semibold md:text-2xl">Tambah Prospek Baru</h1>
                            <p className="hidden text-sm text-muted-foreground md:block">Inputkan data prospek customer untuk mendapat poin</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                    {/* Category Selection */}
                    <Card className="border-0 shadow-sm md:border md:shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                <Target className="h-4 w-4 md:h-5 md:w-5" />
                                Kategori Prospek
                            </CardTitle>
                            <CardDescription className="text-sm">Pilih kategori sesuai dengan jenis customer</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="prospect_category_id" className="text-sm font-medium">
                                    Kategori *
                                </Label>
                                <Select value={data.prospect_category_id} onValueChange={(value) => setData('prospect_category_id', value)}>
                                    <SelectTrigger className="h-11 md:h-10">
                                        <SelectValue placeholder="Pilih kategori prospek" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories && categories.length > 0 ? (
                                            categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    <div className="flex w-full items-center justify-between">
                                                        <span className="text-sm">{category.name}</span>
                                                        <Badge variant="secondary" className="ml-2 text-xs">
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
                                {errors.prospect_category_id && <p className="text-xs text-destructive">{errors.prospect_category_id}</p>}
                            </div>

                            {/* Show selected category info */}
                            {data.prospect_category_id && (
                                <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
                                    {(() => {
                                        const selectedCategory = categories.find((c) => c.id.toString() === data.prospect_category_id);
                                        return selectedCategory ? (
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-primary">{selectedCategory.name}</p>
                                                <p className="text-xs text-muted-foreground">{selectedCategory.description}</p>
                                                <p className="text-xs font-medium">Poin yang didapat: {selectedCategory.points}</p>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Customer Information */}
                    <Card className="border-0 shadow-sm md:border md:shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base md:text-lg">Informasi Customer</CardTitle>
                            <CardDescription className="text-sm">Data kontak dan informasi customer</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer_name" className="text-sm font-medium">
                                    Nama Customer *
                                </Label>
                                <Input
                                    id="customer_name"
                                    type="text"
                                    value={data.customer_name}
                                    onChange={(e) => setData('customer_name', e.target.value)}
                                    placeholder="Masukkan nama lengkap customer"
                                    className="h-11 md:h-10"
                                />
                                {errors.customer_name && <p className="text-xs text-destructive">{errors.customer_name}</p>}
                            </div>

                            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                                <div className="space-y-2">
                                    <Label htmlFor="customer_email" className="text-sm font-medium">
                                        Email
                                    </Label>
                                    <Input
                                        id="customer_email"
                                        type="email"
                                        value={data.customer_email}
                                        onChange={(e) => setData('customer_email', e.target.value)}
                                        placeholder="customer@email.com"
                                        className="h-11 md:h-10"
                                    />
                                    {errors.customer_email && <p className="text-xs text-destructive">{errors.customer_email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="customer_number" className="text-sm font-medium">
                                        Nomor Telepon
                                    </Label>
                                    <Input
                                        id="customer_number"
                                        type="tel"
                                        value={data.customer_number}
                                        onChange={(e) => setData('customer_number', e.target.value)}
                                        placeholder="08xxxxxxxxxx"
                                        className="h-11 md:h-10"
                                    />
                                    {errors.customer_number && <p className="text-xs text-destructive">{errors.customer_number}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-sm font-medium">
                                    Alamat
                                </Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Alamat lengkap customer"
                                    rows={3}
                                    className="resize-none"
                                />
                                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location */}
                    <Card className="border-0 shadow-sm md:border md:shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                                Lokasi Sales & Koordinat
                            </CardTitle>
                            <CardDescription className="text-sm">Ambil lokasi sales saat ini dan koordinat untuk pemetaan</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={getCurrentLocation}
                                    disabled={loadingLocation}
                                    className="h-11 w-full sm:w-auto md:h-10"
                                >
                                    <MapPin className="mr-2 h-4 w-4" />
                                    {loadingLocation ? 'Mengambil Lokasi...' : 'Ambil Lokasi'}
                                </Button>

                                {location && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={refreshLocation}
                                        disabled={loadingLocation}
                                        className="h-11 w-full sm:w-auto md:h-10"
                                    >
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Refresh Lokasi
                                    </Button>
                                )}
                            </div>

                            {locationError && (
                                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                                    <p className="text-xs text-destructive">{locationError}</p>
                                </div>
                            )}

                            {/* Sales Location Display */}
                            {salesLocation && (
                                <div className="space-y-2">
                                    <Label htmlFor="sales_location" className="text-sm font-medium">
                                        Lokasi Sales Saat Ini
                                    </Label>
                                    <Textarea
                                        id="sales_location"
                                        value={data.sales_location}
                                        onChange={(e) => setData('sales_location', e.target.value)}
                                        placeholder="Lokasi sales akan terisi otomatis..."
                                        rows={3}
                                        className="resize-none"
                                    />
                                    {errors.sales_location && <p className="text-xs text-destructive">{errors.sales_location}</p>}
                                </div>
                            )}

                            {location && (
                                <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
                                    <p className="text-xs font-medium text-primary">Koordinat Berhasil Diambil</p>
                                    <p className="text-xs text-muted-foreground">
                                        Latitude: {location.lat.toFixed(6)}, Longitude: {location.lng.toFixed(6)}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                                <div className="space-y-2">
                                    <Label htmlFor="latitude" className="text-sm font-medium">
                                        Latitude
                                    </Label>
                                    <Input
                                        id="latitude"
                                        type="number"
                                        step="any"
                                        value={data.latitude}
                                        onChange={(e) => setData('latitude', e.target.value)}
                                        placeholder="-6.200000"
                                        className="h-11 md:h-10"
                                    />
                                    {errors.latitude && <p className="text-xs text-destructive">{errors.latitude}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="longitude" className="text-sm font-medium">
                                        Longitude
                                    </Label>
                                    <Input
                                        id="longitude"
                                        type="number"
                                        step="any"
                                        value={data.longitude}
                                        onChange={(e) => setData('longitude', e.target.value)}
                                        placeholder="106.816666"
                                        className="h-11 md:h-10"
                                    />
                                    {errors.longitude && <p className="text-xs text-destructive">{errors.longitude}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card className="border-0 shadow-sm md:border md:shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base md:text-lg">Catatan</CardTitle>
                            <CardDescription className="text-sm">Informasi tambahan tentang prospek ini</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Catatan tambahan tentang prospek, kebutuhan, atau informasi penting lainnya..."
                                    rows={4}
                                    className="resize-none"
                                />
                                {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit - Sticky Bottom on Mobile */}
                    <div className="sticky bottom-0 -mx-4 -mb-4 border-t bg-background/95 p-4 backdrop-blur-sm md:relative md:mx-0 md:mb-0 md:border-0 md:bg-transparent md:p-0">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button type="submit" disabled={processing} className="h-11 flex-1 sm:flex-none md:h-10">
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Prospek'}
                            </Button>
                            <Button variant="outline" asChild className="h-11 flex-1 sm:flex-none md:h-10">
                                <Link href="/sales/prospects">Batal</Link>
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </SalesLayout>
    );
}
