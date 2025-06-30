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
        ]);

        try {
            $request->validate([
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

            $result = $this->importService->importFromSql($file);

            return response()->json([
                'success' => true,
                'message' => 'Database import completed successfully',
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
}
