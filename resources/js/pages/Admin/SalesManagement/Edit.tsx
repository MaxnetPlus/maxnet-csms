import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Target, User } from 'lucide-react';
import { FormEventHandler } from 'react';

interface SalesUser {
    id: number;
    name: string;
    email: string;
    username: string;
    phone_number?: string;
    department?: string;
    notes?: string;
    current_target?: {
        daily_target: number;
        monthly_target: number;
    };
}

interface EditSalesUserProps {
    salesUser: SalesUser;
}

export default function EditSalesUser({ salesUser }: EditSalesUserProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: salesUser.name || '',
        email: salesUser.email || '',
        username: salesUser.username || '',
        phone_number: salesUser.phone_number || '',
        department: salesUser.department || '',
        notes: salesUser.notes || '',
        daily_target: salesUser.current_target?.daily_target || 100,
        monthly_target: salesUser.current_target?.monthly_target || 2000,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/admin/sales-management/${salesUser.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Sales Management', href: '/admin/sales-management' },
                { title: `Edit ${salesUser.name}`, href: `/admin/sales-management/${salesUser.id}/edit` },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/sales-management">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Edit Sales User</h1>
                        <p className="text-muted-foreground">Ubah informasi dan target untuk {salesUser.name}</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* User Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informasi Pengguna
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Nama Lengkap <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="Contoh: John Doe"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className={errors.name ? 'border-destructive' : ''}
                                        />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="username">
                                            Username <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="Contoh: johndoe"
                                            value={data.username}
                                            onChange={(e) => setData('username', e.target.value)}
                                            className={errors.username ? 'border-destructive' : ''}
                                        />
                                        {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Contoh: john@example.com"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={errors.email ? 'border-destructive' : ''}
                                    />
                                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone_number">Nomor Telepon</Label>
                                        <Input
                                            id="phone_number"
                                            type="tel"
                                            placeholder="Contoh: +62812345678"
                                            value={data.phone_number}
                                            onChange={(e) => setData('phone_number', e.target.value)}
                                            className={errors.phone_number ? 'border-destructive' : ''}
                                        />
                                        {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="department">Departemen</Label>
                                        <Input
                                            id="department"
                                            type="text"
                                            placeholder="Contoh: Sales Jakarta"
                                            value={data.department}
                                            onChange={(e) => setData('department', e.target.value)}
                                            className={errors.department ? 'border-destructive' : ''}
                                        />
                                        {errors.department && <p className="text-sm text-destructive">{errors.department}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Catatan</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Catatan tambahan untuk sales user ini..."
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className={errors.notes ? 'border-destructive' : ''}
                                        rows={3}
                                    />
                                    {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sales Targets */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Target Penjualan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="daily_target">
                                        Target Harian (poin) <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="daily_target"
                                        type="number"
                                        min="1"
                                        placeholder="100"
                                        value={data.daily_target}
                                        onChange={(e) => setData('daily_target', parseInt(e.target.value) || 0)}
                                        className={errors.daily_target ? 'border-destructive' : ''}
                                    />
                                    {errors.daily_target && <p className="text-sm text-destructive">{errors.daily_target}</p>}
                                    <p className="text-sm text-muted-foreground">Target poin yang harus dicapai setiap hari</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="monthly_target">
                                        Target Bulanan (poin) <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="monthly_target"
                                        type="number"
                                        min="1"
                                        placeholder="2000"
                                        value={data.monthly_target}
                                        onChange={(e) => setData('monthly_target', parseInt(e.target.value) || 0)}
                                        className={errors.monthly_target ? 'border-destructive' : ''}
                                    />
                                    {errors.monthly_target && <p className="text-sm text-destructive">{errors.monthly_target}</p>}
                                    <p className="text-sm text-muted-foreground">Target poin yang harus dicapai setiap bulan</p>
                                </div>

                                {/* Target Summary */}
                                <div className="space-y-2 rounded-lg bg-muted/30 p-4">
                                    <h4 className="text-sm font-semibold">Ringkasan Target</h4>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Target Harian:</span>
                                            <span className="font-medium">{data.daily_target} poin/hari</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Target Bulanan:</span>
                                            <span className="font-medium">{data.monthly_target} poin/bulan</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-1">
                                            <span>Estimasi Bulanan (30 hari):</span>
                                            <span className="font-medium">{data.daily_target * 30} poin</span>
                                        </div>
                                    </div>
                                    {data.monthly_target !== data.daily_target * 30 && (
                                        <p className="text-xs text-amber-600">⚠️ Target bulanan tidak sesuai dengan target harian × 30 hari</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Form Actions */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex flex-col justify-end gap-4 sm:flex-row">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/admin/sales-management">Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
