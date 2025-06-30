import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Database, FileText, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Database Import', href: '/admin/database-import' },
];

interface ImportResult {
    customers: {
        imported: number;
        skipped: number;
        total: number;
    };
    subscriptions: {
        imported: number;
        skipped: number;
        total: number;
    };
}

export default function DatabaseImportIndex() {
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [result, setResult] = useState<ImportResult | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        sql_file: null as File | null,
    });

    const handleFileSelect = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                // Validate file extension
                const fileExtension = file.name.split('.').pop()?.toLowerCase();
                if (fileExtension !== 'sql') {
                    alert('Please select a valid SQL file (.sql extension required)');
                    // Reset the input
                    event.target.value = '';
                    return;
                }

                // Validate file size (150MB = 157,286,400 bytes)
                if (file.size > 157286400) {
                    alert('File size must not exceed 150MB');
                    // Reset the input
                    event.target.value = '';
                    return;
                }

                setData('sql_file', file);
                setResult(null);
                setProgress(0);
                setProgressMessage('');
            }
        },
        [setData],
    );

    const handleUpload = useCallback(() => {
        if (!data.sql_file) return;

        setProgress(0);
        setProgressMessage('Starting import...');
        setResult(null);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 85) return prev;
                return prev + Math.random() * 5;
            });
        }, 300);

        post('/admin/database-import/upload', {
            onSuccess: (page: any) => {
                clearInterval(progressInterval);
                setProgress(100);
                setProgressMessage('Import completed successfully!');

                // Simulate result data - replace with actual response data
                setResult({
                    customers: {
                        imported: 150,
                        skipped: 5,
                        total: 155,
                    },
                    subscriptions: {
                        imported: 300,
                        skipped: 10,
                        total: 310,
                    },
                });
            },
            onError: () => {
                clearInterval(progressInterval);
                setProgress(0);
                setProgressMessage('Import failed');
            },
            onFinish: () => {
                clearInterval(progressInterval);
            },
        });
    }, [data.sql_file, post]);

    const handleReset = useCallback(() => {
        reset();
        setProgress(0);
        setProgressMessage('');
        setResult(null);

        // Reset file input
        const fileInput = document.getElementById('sql-file') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }, [reset]);

    // const handleReset = useCallback(() => {
    //     setSelectedFile(null);
    //     setUploading(false);
    //     setProgress(0);
    //     setProgressMessage('');
    //     setResult(null);
    //     setError(null);

    //     // Reset file input
    //     const fileInput = document.getElementById('sql-file') as HTMLInputElement;
    //     if (fileInput) {
    //         fileInput.value = '';
    //     }
    // }, []);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const navigateToReports = () => {
        // Navigate to reports page
        window.location.href = '/admin/reports';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Database Import" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Database Import</h1>
                    <p className="text-muted-foreground">Import customers and subscriptions from SQL file</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Upload SQL File
                            </CardTitle>
                            <CardDescription>Select a SQL file containing customers and subscriptions data (max 150MB)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="sql-file">SQL File</Label>
                                <Input id="sql-file" type="file" accept=".sql" onChange={handleFileSelect} disabled={processing} />
                                {data.sql_file && (
                                    <p className="text-sm text-muted-foreground">
                                        Selected: {data.sql_file.name} ({formatFileSize(data.sql_file.size)})
                                    </p>
                                )}
                            </div>

                            {errors.sql_file && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{errors.sql_file}</AlertDescription>
                                </Alert>
                            )}

                            {processing && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="w-full" />
                                    {progressMessage && <p className="text-sm text-muted-foreground">{progressMessage}</p>}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button onClick={handleUpload} disabled={!data.sql_file || processing} className="flex-1">
                                    <Database className="mr-2 h-4 w-4" />
                                    {processing ? 'Importing...' : 'Start Import'}
                                </Button>
                                {(data.sql_file || result) && (
                                    <Button variant="outline" onClick={handleReset} disabled={processing}>
                                        <X className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Import Guidelines
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="mb-2 font-medium">File Requirements</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• SQL file format (.sql)</li>
                                    <li>• Maximum file size: 150MB</li>
                                    <li>• Must contain INSERT statements</li>
                                    <li>• UTF-8 encoding recommended</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="mb-2 font-medium">Expected Tables</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>
                                        • <code>customers</code> - Customer master data
                                    </li>
                                    <li>
                                        • <code>subscriptions</code> - Subscription records
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="mb-2 font-medium">Import Process</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• Customers imported first</li>
                                    <li>• Subscriptions linked to customers</li>
                                    <li>• Duplicates will be updated</li>
                                    <li>• Invalid data will be skipped</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {result && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Import Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <h4 className="font-medium">Customers</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>Total records:</span>
                                            <span className="font-medium">{result.customers.total}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Successfully imported:</span>
                                            <span className="font-medium text-green-600">{result.customers.imported}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Skipped:</span>
                                            <span className="font-medium text-yellow-600">{result.customers.skipped}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium">Subscriptions</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>Total records:</span>
                                            <span className="font-medium">{result.subscriptions.total}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Successfully imported:</span>
                                            <span className="font-medium text-green-600">{result.subscriptions.imported}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Skipped:</span>
                                            <span className="font-medium text-yellow-600">{result.subscriptions.skipped}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-center">
                                <Button onClick={navigateToReports}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Reports
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
