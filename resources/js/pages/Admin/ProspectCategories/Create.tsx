import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Award, Plus } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function CreateProspectCategory() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        points: 50,
        is_active: 1,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/prospect-categories');
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Prospect Categories', href: '/admin/prospect-categories' },
                { title: 'Tambah Kategori', href: '/admin/prospect-categories/create' },
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
                        <h1 className="text-3xl font-bold">Tambah Kategori Prospek</h1>
                        <p className="text-muted-foreground">Buat kategori baru untuk mengklasifikasi prospek dan mengatur sistem poin</p>
                    </div>
                </div>

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
                                    <Plus className="mr-2 h-4 w-4" />
                                    {processing ? 'Membuat...' : 'Buat Kategori'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
