import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Database, FileText, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Database Import', href: '/admin/database-import' },
];

interface ImportResult {
    progress_id?: string;
    customers: {
        imported: number;
        skipped: number;
        total: number;
        skipped_records?: SkippedRecord[];
        has_more_skipped?: boolean;
    };
    subscriptions: {
        imported: number;
        skipped: number;
        total: number;
        skipped_records?: SkippedRecord[];
        has_more_skipped?: boolean;
    };
}

interface SkippedRecord {
    subscription_id?: string;
    customer_id: string;
    customer_name?: string;
    reason: string;
    details: string;
}

interface ProgressData {
    percentage: number;
    message: string;
    updated_at: string;
}

export default function DatabaseImportIndex() {
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [result, setResult] = useState<ImportResult | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progressId, setProgressId] = useState<string | null>(null);
    const [detailedLogs, setDetailedLogs] = useState<string[]>([]);
    const [showSkippedDetails, setShowSkippedDetails] = useState<'customers' | 'subscriptions' | null>(null);
    const [loadingSkipped, setLoadingSkipped] = useState(false);
    const [allSkippedRecords, setAllSkippedRecords] = useState<{
        customers: SkippedRecord[];
        subscriptions: SkippedRecord[];
    }>({ customers: [], subscriptions: [] });

    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Helper function to get or refresh CSRF token
    const getCsrfToken = async (): Promise<string> => {
        let token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

        if (!token) {
            // Try to refresh the page's CSRF token by making a simple request
            try {
                const response = await fetch('/admin/database-import', {
                    method: 'GET',
                    headers: {
                        Accept: 'text/html',
                    },
                });

                if (response.ok) {
                    const html = await response.text();
                    const match = html.match(/<meta name="csrf-token" content="([^"]+)"/);
                    if (match) {
                        token = match[1];
                        // Update the meta tag for future use
                        const metaTag = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
                        if (metaTag) {
                            metaTag.content = token;
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to refresh CSRF token:', e);
            }
        }

        if (!token) {
            throw new Error('CSRF token not found. Please refresh the page and try again.');
        }

        return token;
    };

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            // Validate file extension
            const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
            if (fileExtension !== 'sql') {
                alert('Please select a valid SQL file (.sql extension required)');
                // Reset the input
                event.target.value = '';
                return;
            }

            // Validate file size (150MB = 157,286,400 bytes)
            if (selectedFile.size > 157286400) {
                alert('File size must not exceed 150MB');
                // Reset the input
                event.target.value = '';
                return;
            }

            setFile(selectedFile);
            setResult(null);
            setProgress(0);
            setProgressMessage('');
            setError(null);
            setDetailedLogs([]);
        }
    }, []);

    const fetchSkippedRecords = useCallback(
        async (progressId: string, type: 'customers' | 'subscriptions') => {
            try {
                setLoadingSkipped(true);
                const csrfToken = await getCsrfToken();

                const response = await fetch('/admin/database-import/skipped-records', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        progress_id: progressId,
                        type: type,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch skipped records');
                }

                const data = await response.json();
                if (data.success) {
                    setAllSkippedRecords((prev) => ({
                        ...prev,
                        [type]: data.data || [],
                    }));
                }
            } catch (error) {
                console.error('Error fetching skipped records:', error);
            } finally {
                setLoadingSkipped(false);
            }
        },
        [getCsrfToken],
    );

    const trackProgress = useCallback(
        async (progressId: string) => {
            try {
                const csrfToken = await getCsrfToken();

                const response = await fetch('/admin/database-import/progress', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        progress_id: progressId,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch progress');
                }

                const progressData: ProgressData = await response.json();
                setProgress(progressData.percentage);
                setProgressMessage(progressData.message);

                // Add to detailed logs if it's a new message
                setDetailedLogs((prev) => {
                    const lastLog = prev[prev.length - 1];
                    const newMessage = `${new Date().toLocaleTimeString()}: ${progressData.message}`;
                    if (!lastLog || !lastLog.includes(progressData.message)) {
                        return [...prev, newMessage];
                    }
                    return prev;
                });

                // Continue tracking if not complete and not failed
                if (progressData.percentage >= 0 && progressData.percentage < 100) {
                    setTimeout(() => trackProgress(progressId), 500);
                }
            } catch (error) {
                console.error('Progress tracking error:', error);
            }
        },
        [getCsrfToken],
    );

    const handleUpload = useCallback(async () => {
        if (!file) return;

        setUploading(true);
        setProgress(0);
        setProgressMessage('Starting import...');
        setResult(null);
        setError(null);
        setDetailedLogs(['Import started...']);

        try {
            const formData = new FormData();
            formData.append('sql_file', file);

            const csrfToken = await getCsrfToken();

            const response = await fetch('/admin/database-import/upload', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: formData,
            });

            // Clone the response so we can read it multiple times if needed
            const responseClone = response.clone();

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                // If JSON parsing fails, get the text response from the clone
                const textResponse = await responseClone.text();
                console.error('Failed to parse JSON response:', textResponse);

                // Handle specific error cases
                if (response.status === 419) {
                    throw new Error('Session expired. Please refresh the page and try again.');
                } else if (response.status === 403) {
                    throw new Error('Access denied. You may not have permission to import databases.');
                } else if (response.status === 422) {
                    throw new Error('Validation failed. Please check your file and try again.');
                } else {
                    throw new Error(
                        `Server returned invalid JSON response. Status: ${response.status}. Please check the server logs for more details.`,
                    );
                }
            }

            if (response.ok && data.success) {
                setResult(data.data);
                setProgress(100);
                setProgressMessage('Import completed successfully!');
                setDetailedLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: Import completed successfully!`]);

                // Start tracking progress if we have a progress_id
                if (data.data.progress_id) {
                    setProgressId(data.data.progress_id);
                    trackProgress(data.data.progress_id);
                }
            } else {
                throw new Error(data.message || 'Import failed');
            }
        } catch (error: any) {
            const errorMessage = error.message || 'Import failed';
            setError(errorMessage);
            setProgress(0);
            setProgressMessage('Import failed');
            setDetailedLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: Error - ${errorMessage}`]);
        } finally {
            setUploading(false);
        }
    }, [file, trackProgress]);

    const handleReset = useCallback(() => {
        setFile(null);
        setUploading(false);
        setProgress(0);
        setProgressMessage('');
        setResult(null);
        setError(null);
        setProgressId(null);
        setDetailedLogs([]);
        setShowSkippedDetails(null);
        setAllSkippedRecords({ customers: [], subscriptions: [] });

        // Clear any running progress interval
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }

        // Reset file input
        const fileInput = document.getElementById('sql-file') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }, []);

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
                                <Input id="sql-file" type="file" accept=".sql" onChange={handleFileSelect} disabled={uploading} />
                                {file && (
                                    <p className="text-sm text-muted-foreground">
                                        Selected: {file.name} ({formatFileSize(file.size)})
                                    </p>
                                )}
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {uploading && (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">Import Progress</span>
                                        <span className="font-medium">{progress}%</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Progress
                                            value={progress}
                                            className={`h-3 w-full ${
                                                progress < 0
                                                    ? 'bg-red-100'
                                                    : progress < 40
                                                      ? 'bg-blue-100'
                                                      : progress < 70
                                                        ? 'bg-green-100'
                                                        : progress < 100
                                                          ? 'bg-purple-100'
                                                          : 'bg-emerald-100'
                                            }`}
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span className={progress >= 10 ? 'text-green-600' : ''}>Parse File</span>
                                            <span className={progress >= 40 ? 'text-green-600' : ''}>Import Customers</span>
                                            <span className={progress >= 70 ? 'text-green-600' : ''}>Import Subscriptions</span>
                                            <span className={progress >= 100 ? 'text-green-600' : ''}>Complete</span>
                                        </div>
                                    </div>
                                    {progressMessage && (
                                        <div className="flex items-center gap-2 rounded bg-blue-50 p-2 text-sm">
                                            <Clock className="h-4 w-4 flex-shrink-0 text-blue-600" />
                                            <span className="text-blue-800">{progressMessage}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {detailedLogs.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm font-medium">
                                        <Clock className="h-4 w-4" />
                                        Import Activity Log
                                    </Label>
                                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border bg-muted/30 p-3">
                                        {detailedLogs.map((log, index) => (
                                            <div key={index} className="flex items-start gap-2 text-xs">
                                                <span className="flex-shrink-0 font-mono text-blue-600">{log.split(': ')[0]}:</span>
                                                <span className="text-muted-foreground">{log.split(': ').slice(1).join(': ')}</span>
                                            </div>
                                        ))}
                                        {/* Auto-scroll to bottom */}
                                        <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button onClick={handleUpload} disabled={!file || uploading} className="flex-1">
                                    <Database className="mr-2 h-4 w-4" />
                                    {uploading ? 'Importing...' : 'Start Import'}
                                </Button>
                                {(file || result) && (
                                    <Button variant="outline" onClick={handleReset} disabled={uploading}>
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
                            <CardDescription>Import completed at {new Date().toLocaleString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-5 w-5 text-blue-600" />
                                        <h4 className="font-medium">Customers</h4>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Total records found:</span>
                                            <span className="font-medium">{result.customers.total}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Successfully imported:</span>
                                            <span className="font-medium text-green-600">{result.customers.imported}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Skipped/Failed:</span>
                                            <span className="font-medium text-yellow-600">{result.customers.skipped}</span>
                                        </div>
                                        <div className="mt-2 border-t pt-2">
                                            <div className="flex justify-between">
                                                <span className="font-medium">Success Rate:</span>
                                                <span className="font-medium text-blue-600">
                                                    {result.customers.total > 0
                                                        ? Math.round((result.customers.imported / result.customers.total) * 100)
                                                        : 0}
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-purple-600" />
                                        <h4 className="font-medium">Subscriptions</h4>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Total records found:</span>
                                            <span className="font-medium">{result.subscriptions.total}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Successfully imported:</span>
                                            <span className="font-medium text-green-600">{result.subscriptions.imported}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Skipped/Failed:</span>
                                            <span className="font-medium text-yellow-600">{result.subscriptions.skipped}</span>
                                        </div>
                                        <div className="mt-2 border-t pt-2">
                                            <div className="flex justify-between">
                                                <span className="font-medium">Success Rate:</span>
                                                <span className="font-medium text-blue-600">
                                                    {result.subscriptions.total > 0
                                                        ? Math.round((result.subscriptions.imported / result.subscriptions.total) * 100)
                                                        : 0}
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(result.customers.skipped > 0 || result.subscriptions.skipped > 0) && (
                                <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
                                        <div className="flex-1">
                                            <h5 className="font-medium text-yellow-800">Some records were skipped</h5>
                                            <p className="mt-1 text-sm text-yellow-700">Records may have been skipped due to:</p>
                                            <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                                                <li>• Invalid customer references</li>
                                                <li>• Data validation errors</li>
                                                <li>• Database constraint violations</li>
                                                <li>• Duplicate IDs</li>
                                            </ul>
                                            <div className="mt-4 flex gap-2">
                                                {result.customers.skipped > 0 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setShowSkippedDetails('customers');
                                                            if (progressId && allSkippedRecords.customers.length === 0) {
                                                                fetchSkippedRecords(progressId, 'customers');
                                                            }
                                                        }}
                                                        disabled={loadingSkipped}
                                                        className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                                                    >
                                                        View Skipped Customers ({result.customers.skipped})
                                                    </Button>
                                                )}
                                                {result.subscriptions.skipped > 0 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setShowSkippedDetails('subscriptions');
                                                            if (progressId && allSkippedRecords.subscriptions.length === 0) {
                                                                fetchSkippedRecords(progressId, 'subscriptions');
                                                            }
                                                        }}
                                                        disabled={loadingSkipped}
                                                        className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                                                    >
                                                        View Skipped Subscriptions ({result.subscriptions.skipped})
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-center gap-3">
                                <Button onClick={navigateToReports}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Reports
                                </Button>
                                <Button variant="outline" onClick={() => window.location.reload()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import Another File
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Skipped Records Details Modal */}
                {showSkippedDetails && (
                    <Card className="mt-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    Skipped {showSkippedDetails === 'customers' ? 'Customers' : 'Subscriptions'} Details
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => setShowSkippedDetails(null)} className="h-8 w-8 p-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>Details of records that were skipped during import with reasons</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingSkipped ? (
                                <div className="flex items-center justify-center p-8">
                                    <div className="text-sm text-muted-foreground">Loading skipped records...</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-sm text-muted-foreground">
                                        Showing skipped {showSkippedDetails} records ({allSkippedRecords[showSkippedDetails].length} of{' '}
                                        {result?.[showSkippedDetails]?.skipped || 0} total)
                                    </div>
                                    {allSkippedRecords[showSkippedDetails].length > 0 ? (
                                        <div className="max-h-96 space-y-3 overflow-y-auto">
                                            {allSkippedRecords[showSkippedDetails].map((record, index) => (
                                                <div key={index} className="rounded-lg border border-red-200 bg-red-50 p-3">
                                                    <div className="mb-2 flex items-start justify-between">
                                                        <div className="font-medium text-red-800">
                                                            {showSkippedDetails === 'customers' ? (
                                                                <>Customer: {record.customer_name || record.customer_id}</>
                                                            ) : (
                                                                <>Subscription: {record.subscription_id}</>
                                                            )}
                                                        </div>
                                                        <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">{record.reason}</span>
                                                    </div>
                                                    <div className="text-sm text-red-700">
                                                        <div>
                                                            <strong>Customer ID:</strong> {record.customer_id}
                                                        </div>
                                                        {record.subscription_id && (
                                                            <div>
                                                                <strong>Subscription ID:</strong> {record.subscription_id}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <strong>Details:</strong> {record.details}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No detailed records available for skipped {showSkippedDetails}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
