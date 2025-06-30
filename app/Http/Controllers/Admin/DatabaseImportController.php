<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DatabaseImportService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
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

    public function upload(Request $request): \Illuminate\Http\RedirectResponse
    {
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

        try {
            /** @var UploadedFile $file */
            $file = $request->file('sql_file');

            $result = $this->importService->importFromSql($file);

            return redirect()->route('admin.database-import.index')
                ->with('success', 'Database import completed successfully')
                ->with('import_result', $result);
        } catch (\Exception $e) {
            return redirect()->route('admin.database-import.index')
                ->withErrors(['sql_file' => 'Import failed: ' . $e->getMessage()]);
        }
    }
}
