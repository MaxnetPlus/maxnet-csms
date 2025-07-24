<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SalesPerformanceService;
use App\Exports\SalesPerformanceReportExport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class SalesPerformanceController extends Controller
{
    protected $salesPerformanceService;

    public function __construct(SalesPerformanceService $salesPerformanceService)
    {
        $this->salesPerformanceService = $salesPerformanceService;
    }

    /**
     * Display the sales performance report page.
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        // Get filters from request
        $filters = [
            'month' => $request->input('month', now()->month),
            'year' => $request->input('year', now()->year),
            'sales_id' => $request->input('sales_id', 'all'),
            'search' => $request->input('search', ''),
            'sort' => $request->input('sort', 'total_points'),
            'direction' => $request->input('direction', 'desc'),
        ];

        // Get paginated performance data
        $performanceData = $this->salesPerformanceService->getPerformanceReport($filters, 15);

        // Get statistics
        $stats = $this->salesPerformanceService->getPerformanceStats($filters);

        // Get sales users for filter dropdown
        $salesUsers = $this->salesPerformanceService->getSalesUsers();

        return Inertia::render('Admin/SalesPerformance/Index', [
            'performanceData' => $performanceData,
            'stats' => $stats,
            'salesUsers' => $salesUsers,
            'filters' => $filters,
            'monthNames' => [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
            ],
            'years' => range(2020, now()->year + 1),
        ]);
    }

    /**
     * Export sales performance report to Excel.
     *
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function export(Request $request)
    {
        // Get filters from request
        $filters = [
            'month' => $request->input('month', now()->month),
            'year' => $request->input('year', now()->year),
            'sales_id' => $request->input('sales_id', 'all'),
            'search' => $request->input('search', ''),
            'sort' => $request->input('sort', 'total_points'),
            'direction' => $request->input('direction', 'desc'),
        ];

        $monthName = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ][$filters['month']];

        $filename = "Laporan_Performa_Sales_{$monthName}_{$filters['year']}.xlsx";

        return Excel::download(new SalesPerformanceReportExport($filters), $filename);
    }
}
