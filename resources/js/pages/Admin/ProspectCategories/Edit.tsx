import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Award, Save } from 'lucide-react';
import { FormEventHandler } from 'react';

interface ProspectCategory {
    id: number;
    name: string;
    description?: string;
    points: number;
    is_active: boolean;
    prospects_count: number;
}

interface EditProspectCategoryProps {
    category: ProspectCategory;
}

export default function EditProspectCategory({ category }: EditProspectCategoryProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: category.name || '',
        description: category.description || '',
        points: category.points || 50,
        is_active: category.is_active ? 1 : 0,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/admin/prospect-categories/${category.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Prospect Categories', href: '/admin/prospect-categories' },
                { title: `Edit ${category.name}`, href: `/admin/prospect-categories/${category.id}/edit` },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/prospect-categories">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Edit Kategori Prospek</h1>
                        <p className="text-muted-foreground">Ubah informasi kategori {category.name}</p>
                    </div>
                </div>

                {/* Warning if category is being used */}
                {category.prospects_count > 0 && (
                    <Card className="border-amber-200 bg-amber-50">
                        <CardContent className="p-4">
                            <p className="text-amber-800">
                                ⚠️ <strong>Perhatian:</strong> Kategori ini sedang digunakan oleh {category.prospects_count} prospek. Perubahan yang
                                Anda buat akan mempengaruhi semua prospek yang menggunakan kategori ini.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5" />
                                Informasi Kategori
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Nama Kategori <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="Contoh: Prospek Rumahan"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className={errors.name ? 'border-destructive' : ''}
                                        />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                        <p className="text-sm text-muted-foreground">Nama yang mudah diingat untuk kategori ini</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="points">
                                            Jumlah Poin <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="points"
                                            type="number"
                                            min="1"
                                            max="1000"
                                            placeholder="50"
                                            value={data.points}
                                            onChange={(e) => setData('points', parseInt(e.target.value) || 0)}
                                            className={errors.points ? 'border-destructive' : ''}
                                        />
                                        {errors.points && <p className="text-sm text-destructive">{errors.points}</p>}
                                        <p className="text-sm text-muted-foreground">
                                            Poin yang akan diberikan untuk setiap prospek dengan kategori ini
                                        </p>
                                        {category.prospects_count > 0 && data.points !== category.points && (
                                            <p className="text-sm text-amber-600">
                                                ⚠️ Mengubah poin akan mempengaruhi {category.prospects_count} prospek yang sudah ada
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={!!data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked ? 1 : 0)}
                                        />
                                        <Label htmlFor="is_active" className="text-sm font-medium">
                                            Kategori aktif
                                        </Label>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Kategori nonaktif tidak akan muncul dalam pilihan saat membuat prospek baru
                                    </p>
                                    {category.prospects_count > 0 && !data.is_active && category.is_active && (
                                        <p className="text-sm text-amber-600">
                                            ⚠️ Menonaktifkan kategori yang sedang digunakan akan menyembunyikannya dari pilihan baru
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Deskripsi</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Jelaskan jenis prospek yang cocok untuk kategori ini..."
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className={errors.description ? 'border-destructive' : ''}
                                            rows={6}
                                        />
                                        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                                        <p className="text-sm text-muted-foreground">Deskripsi opsional untuk membantu sales memahami kategori ini</p>
                                    </div>

                                    {/* Preview */}
                                    <div className="rounded-lg bg-muted/30 p-4">
                                        <h4 className="mb-2 text-sm font-semibold">Preview Kategori</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{data.name || 'Nama Kategori'}</span>
                                                <span className="text-sm text-muted-foreground">• {data.points} poin</span>
                                                <span
                                                    className={`rounded px-2 py-1 text-xs ${
                                                        data.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {data.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>
                                            {data.description && <p className="text-sm text-muted-foreground">{data.description}</p>}
                                        </div>
                                    </div>

                                    {/* Current Usage Stats */}
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <h4 className="mb-2 text-sm font-semibold text-blue-800">Statistik Penggunaan</h4>
                                        <div className="space-y-1 text-sm text-blue-700">
                                            <div className="flex justify-between">
                                                <span>Prospek menggunakan:</span>
                                                <span className="font-medium">{category.prospects_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Status saat ini:</span>
                                                <span className="font-medium">{category.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex flex-col justify-end gap-4 sm:flex-row">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/admin/prospect-categories">Batal</Link>
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
