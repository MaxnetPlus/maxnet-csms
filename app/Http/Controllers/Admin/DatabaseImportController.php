<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DatabaseImportService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class DatabaseImportController extends Controller
{
    public function __construct(
        private DatabaseImportService $importService
    ) {
    }

    public function index(): Response
    {
        return Inertia::render('Admin/DatabaseImport/Index');
    }

    public function upload(Request $request): \Illuminate\Http\JsonResponse
    {
        // Add permission debugging
        Log::info('Database import upload started', [
            'user_id' => auth()->id(),
            'has_file' => $request->hasFile('sql_file'),
            'import_type' => $request->input('import_type'),
        ]);

        try {
            $request->validate([
                'import_type' => [
                    'required',
                    'string',
                    'in:customers_subscriptions,maintenances'
                ],
                'sql_file' => [
                    'required',
                    'file',
                    'max:153600', // 150MB in KB
                    function ($attribute, $value, $fail) {
                        // Check file extension
                        $extension = strtolower($value->getClientOriginalExtension());
                        if ($extension !== 'sql') {
                            $fail('The sql file must have .sql extension.');
                        }

                        // Additional check for file content (optional - check if it starts with SQL keywords)
                        $content = file_get_contents($value->getRealPath());
                        if ($content && strlen($content) > 10) {
                            $firstLines = substr($content, 0, 1000);
                            $sqlKeywords = ['INSERT', 'CREATE', 'DROP', 'ALTER', 'SELECT', 'UPDATE', 'DELETE', '--', '/*'];
                            $hasSqlContent = false;

                            foreach ($sqlKeywords as $keyword) {
                                if (stripos($firstLines, $keyword) !== false) {
                                    $hasSqlContent = true;
                                    break;
                                }
                            }

                            if (!$hasSqlContent) {
                                $fail('The file does not appear to contain valid SQL content.');
                            }
                        }
                    },
                ],
            ], [
                'import_type.required' => 'Please select an import type.',
                'import_type.in' => 'Invalid import type selected.',
                'sql_file.required' => 'Please select a SQL file to upload.',
                'sql_file.file' => 'The uploaded file is not valid.',
                'sql_file.max' => 'The sql file must not be larger than 150MB.',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed: ' . implode(', ', collect($e->errors())->flatten()->toArray()),
                'errors' => $e->errors(),
            ], 422);
        }

        try {
            /** @var UploadedFile $file */
            $file = $request->file('sql_file');
            $importType = $request->input('import_type');

            // Start the import process asynchronously
            $result = $this->importService->startAsyncImport($file, $importType);

            return response()->json([
                'success' => true,
                'message' => 'Database import started successfully',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            Log::error('Database import failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
                'error_details' => [
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine(),
                    'type' => get_class($e),
                ],
            ], 422);
        }
    }

    public function progress(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'progress_id' => 'required|string',
        ]);

        $progress = $this->importService->getProgress($request->progress_id);

        return response()->json($progress);
    }

    public function getSkippedRecords(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'progress_id' => 'required|string',
            'type' => 'required|in:customers,subscriptions,maintenances'
        ]);

        $skippedRecords = $this->importService->getSkippedRecords($request->progress_id, $request->type);

        return response()->json([
            'success' => true,
            'data' => $skippedRecords
        ]);
    }

    public function getResults(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'progress_id' => 'required|string',
        ]);

        Log::info('Getting import results for progress ID: ' . $request->progress_id, [
            'controller' => 'DatabaseImportController',
            'method' => 'getResults',
            'timestamp' => now()->toISOString(),
        ]);

        $results = $this->importService->getResults($request->progress_id);

        if ($results) {
            Log::info('Results found for progress ID: ' . $request->progress_id, [
                'controller' => 'DatabaseImportController',
                'method' => 'getResults',
                'customers' => [
                    'total' => $results['customers']['total'] ?? 'unknown',
                    'imported' => $results['customers']['imported'] ?? 'unknown',
                    'skipped' => $results['customers']['skipped'] ?? 'unknown',
                ],
                'subscriptions' => [
                    'total' => $results['subscriptions']['total'] ?? 'unknown',
                    'imported' => $results['subscriptions']['imported'] ?? 'unknown',
                    'skipped' => $results['subscriptions']['skipped'] ?? 'unknown',
                ]
            ]);
            return response()->json([
                'success' => true,
                'data' => $results
            ]);
        }

        Log::warning('No results found for progress ID: ' . $request->progress_id, [
            'controller' => 'DatabaseImportController',
            'method' => 'getResults',
            'timestamp' => now()->toISOString(),
        ]);

        // Create a fallback response with placeholder data
        // This ensures the UI can still display the results card
        $placeholderResults = [
            'progress_id' => $request->progress_id,
            'customers' => [
                'imported' => 0,
                'skipped' => 0,
                'total' => 0,
            ],
            'subscriptions' => [
                'imported' => 0,
                'skipped' => 0,
                'total' => 0,
            ],
            'is_fallback' => true,
        ];

        // Return a success response with placeholder data instead of 404
        // This prevents the UI from showing an error message
        return response()->json([
            'success' => true,
            'data' => $placeholderResults,
            'message' => 'Using fallback results as actual results were not found in cache'
        ]);
    }
}
