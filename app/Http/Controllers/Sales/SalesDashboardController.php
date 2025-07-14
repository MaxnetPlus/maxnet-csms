<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Prospect;
use App\Models\SalesPoint;
use App\Models\SalesTarget;
use App\Models\CustomerFollowUp;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesDashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Get current target
        $currentTarget = SalesTarget::where('sales_id', $user->id)
            ->where('is_active', true)
            ->first();

        // Get today's stats
        $todayStats = $this->getTodayStats($user->id);

        // Get monthly stats
        $monthlyStats = $this->getMonthlyStats($user->id);

        // Get recent prospects
        $recentProspects = Prospect::where('sales_id', $user->id)
            ->with('category')
            ->latest()
            ->take(5)
            ->get();

        // Get pending follow ups
        $pendingFollowUps = CustomerFollowUp::where('assigned_to', $user->id)
            ->where('status', 'pending')
            ->with(['customer', 'subscription'])
            ->latest()
            ->take(5)
            ->get();

        // Get current accumulation
        $accumulation = SalesPoint::where('sales_id', $user->id)->sum('points_earned');

        return Inertia::render('Sales/Dashboard', [
            'currentTarget' => $currentTarget,
            'todayStats' => $todayStats,
            'monthlyStats' => $monthlyStats,
            'recentProspects' => $recentProspects,
            'pendingFollowUps' => $pendingFollowUps,
            'accumulation' => $accumulation,
        ]);
    }

    public function getStats()
    {
        $user = auth()->user();

        return response()->json([
            'today' => $this->getTodayStats($user->id),
            'monthly' => $this->getMonthlyStats($user->id),
            'accumulation' => SalesPoint::where('sales_id', $user->id)->sum('points_earned'),
        ]);
    }

    public function getTargetProgress()
    {
        $user = auth()->user();
        $currentTarget = SalesTarget::where('sales_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$currentTarget) {
            return response()->json([
                'daily_progress' => 0,
                'monthly_progress' => 0,
                'daily_target' => 0,
                'monthly_target' => 0,
            ]);
        }

        $todayPoints = SalesPoint::where('sales_id', $user->id)
            ->where('date', '>=', today()->startOfDay())
            ->where('date', '<=', today()->endOfDay())
            ->sum('points_earned');
        $monthlyPoints = SalesPoint::where('sales_id', $user->id)
            ->where('date', '>=', now()->startOfMonth())
            ->where('date', '<=', now()->endOfMonth())
            ->sum('points_earned');

        return response()->json([
            'daily_progress' => ($todayPoints / $currentTarget->daily_target) * 100,
            'monthly_progress' => ($monthlyPoints / $currentTarget->monthly_target) * 100,
            'daily_target' => $currentTarget->daily_target,
            'monthly_target' => $currentTarget->monthly_target,
            'today_points' => $todayPoints,
            'monthly_points' => $monthlyPoints,
        ]);
    }
    private function getTodayStats($salesId)
    {
        return [
            'prospects_count' => Prospect::where('sales_id', $salesId)
                ->where('created_at', '>=', today()->startOfDay())
                ->where('created_at', '<=', today()->endOfDay())
                ->count(),
            'points_earned' => SalesPoint::where('sales_id', $salesId)
                ->where('date', '>=', today()->startOfDay())
                ->where('date', '<=', today()->endOfDay())
                ->sum('points_earned'),
            'follow_ups_completed' => CustomerFollowUp::where('assigned_to', $salesId)
                ->where('completed_at', '>=', today()->startOfDay())
                ->where('completed_at', '<=', today()->endOfDay())
                ->count(),
        ];
    }

    private function getMonthlyStats($salesId)
    {
        return [
            'prospects_count' => Prospect::where('sales_id', $salesId)
                ->where('created_at', '>=', now()->startOfMonth())
                ->where('created_at', '<=', now()->endOfMonth())
                ->count(),
            'points_earned' => SalesPoint::where('sales_id', $salesId)
                ->where('date', '>=', now()->startOfMonth())
                ->where('date', '<=', now()->endOfMonth())
                ->sum('points_earned'),
            'follow_ups_completed' => CustomerFollowUp::where('assigned_to', $salesId)
                ->where('completed_at', '>=', now()->startOfMonth())
                ->where('completed_at', '<=', now()->endOfMonth())
                ->count(),
            'converted_prospects' => Prospect::where('sales_id', $salesId)
                ->where('status', 'converted')
                ->where('created_at', '>=', now()->startOfMonth())
                ->where('created_at', '<=', now()->endOfMonth())
                ->count(),
        ];
    }
}
