<?php

namespace App\Services;

use App\Models\SalesPoint;
use App\Models\SalesTarget;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;
use Carbon\Carbon;

class SalesPerformanceService
{
    /**
     * Get paginated sales performance report data with filters.
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getPerformanceReport(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->buildPerformanceQuery($filters);

        // Get total count for pagination
        $total = $query->count();

        // Apply pagination
        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $offset = ($currentPage - 1) * $perPage;

        $results = $query->offset($offset)->limit($perPage)->get();

        // Calculate achievement percentage for each record
        $results = $results->map(function ($item) {
            $item->achievement_percentage = $item->monthly_target > 0
                ? round(($item->total_points / $item->monthly_target) * 100, 2)
                : 0;
            return $item;
        });

        return new LengthAwarePaginator($results, $total, $perPage, $currentPage, [
            'path' => LengthAwarePaginator::resolveCurrentPath(),
        ]);
    }

    /**
     * Get all sales performance report data for exporting.
     *
     * @param array $filters
     * @return \Illuminate\Support\Collection
     */
    public function getPerformanceReportForExport(array $filters = []): \Illuminate\Support\Collection
    {
        $results = $this->buildPerformanceQuery($filters)->get();

        // Calculate achievement percentage for each record
        return $results->map(function ($item) {
            $item->achievement_percentage = $item->monthly_target > 0
                ? round(($item->total_points / $item->monthly_target) * 100, 2)
                : 0;
            return $item;
        });
    }

    /**
     * Builds the base query for sales performance report.
     *
     * @param array $filters
     * @return \Illuminate\Database\Query\Builder
     */
    private function buildPerformanceQuery(array $filters)
    {
        $month = $filters['month'] ?? now()->month;
        $year = $filters['year'] ?? now()->year;

        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        // Subquery untuk menghitung total poin per sales dalam rentang waktu
        $pointsSubquery = DB::table('sales_points')
            ->select('sales_id', DB::raw('COUNT(id) as total_prospects'), DB::raw('SUM(1) as total_points'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('sales_id');

        // Subquery untuk menghitung jumlah prospek yang dikonversi per sales
        $prospectsSubquery = DB::table('prospects')
            ->select('sales_id', DB::raw('COUNT(id) as total_converted'))
            ->where('status', 'converted')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('sales_id');

        // Subquery untuk mendapatkan target bulanan yang efektif
        $targetsSubquery = DB::table('sales_targets')
            ->select('sales_id', 'monthly_target')
            ->where('is_active', true)
            ->where('effective_from', '<=', $endDate)
            ->where(function ($q) use ($startDate) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $startDate);
            });

        $query = DB::table('users')
            ->join('model_has_roles', 'users.id', '=', 'model_has_roles.model_id')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('roles.name', 'sales')
            ->select(
                'users.id as sales_id',
                'users.name as sales_name',
                'users.email as sales_email',
                DB::raw('COALESCE(points.total_points, 0) as total_points'),
                DB::raw('COALESCE(points.total_prospects, 0) as total_prospects'),
                DB::raw('COALESCE(prospects.total_converted, 0) as total_converted'),
                DB::raw('COALESCE(targets.monthly_target, 0) as monthly_target')
            )
            ->leftJoinSub($pointsSubquery, 'points', function ($join) {
                $join->on('users.id', '=', 'points.sales_id');
            })
            ->leftJoinSub($prospectsSubquery, 'prospects', function ($join) {
                $join->on('users.id', '=', 'prospects.sales_id');
            })
            ->leftJoinSub($targetsSubquery, 'targets', function ($join) {
                $join->on('users.id', '=', 'targets.sales_id');
            })
            ->groupBy('users.id', 'users.name', 'users.email', 'points.total_points', 'points.total_prospects', 'prospects.total_converted', 'targets.monthly_target');

        // Filter by sales user
        if (!empty($filters['sales_id']) && $filters['sales_id'] !== 'all') {
            $query->where('users.id', $filters['sales_id']);
        }

        // Search by name
        if (!empty($filters['search'])) {
            $query->where('users.name', 'like', '%' . $filters['search'] . '%');
        }

        // Sorting
        $sortField = $filters['sort'] ?? 'total_points';
        $sortDirection = $filters['direction'] ?? 'desc';
        $query->orderBy($sortField, $sortDirection);

        return $query;
    }

    /**
     * Get overall statistics for the given period.
     *
     * @param array $filters
     * @return array
     */
    public function getPerformanceStats(array $filters = []): array
    {
        $month = $filters['month'] ?? now()->month;
        $year = $filters['year'] ?? now()->year;

        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $totalPoints = DB::table('sales_points')->whereBetween('created_at', [$startDate, $endDate])->count();
        $totalConverted = DB::table('prospects')->where('status', 'converted')->whereBetween('created_at', [$startDate, $endDate])->count();
        $totalSales = User::role('sales')->count();
        $totalTarget = DB::table('sales_targets')->where('is_active', true)->sum('monthly_target');

        return [
            'total_points' => $totalPoints,
            'total_converted' => $totalConverted,
            'total_sales' => $totalSales,
            'total_target' => $totalTarget,
            'achievement_percentage' => $totalTarget > 0 ? round(($totalPoints / $totalTarget) * 100, 2) : 0,
        ];
    }

    /**
     * Get sales performance data for a specific sales user.
     *
     * @param int $salesId
     * @param string|null $startDate
     * @param string|null $endDate
     * @return array
     */
    public function getSalesPerformanceData(int $salesId, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = SalesPoint::where('sales_id', $salesId);

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        $points = $query->get();

        $totalPoints = $points->count();
        $accumulatedPoints = SalesPoint::getCurrentAccumulation($salesId);

        return [
            'total_points' => $totalPoints,
            'accumulated_points' => $accumulatedPoints,
            'points_details' => $points,
        ];
    }

    /**
     * Get sales targets for a specific sales user.
     *
     * @param int $salesId
     * @return SalesTarget|null
     */
    public function getCurrentSalesTarget(int $salesId): ?SalesTarget
    {
        return SalesTarget::getCurrentTarget($salesId);
    }

    /**
     * Get performance summary for all sales users.
     *
     * @return array
     */
    public function getPerformanceSummary(): array
    {
        return DB::table('sales_points')
            ->select('sales_id', DB::raw('COUNT(id) as total_points'))
            ->groupBy('sales_id')
            ->get()
            ->toArray();
    }

    /**
     * Get list of sales users for filter dropdown.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getSalesUsers(): \Illuminate\Support\Collection
    {
        return User::role('sales')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();
    }
}
