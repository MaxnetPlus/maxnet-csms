<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(): Response
    {
        // Redirect sales users to their dashboard
        /** @var User $user */
        $user = auth()->user();
        if ($user && $user->hasSalesAccess() && !$user->hasRole('admin')) {
            return redirect()->route('sales.dashboard');
        }

        $stats = $this->getStats();
        $recentImports = $this->getRecentImports();
        $subscriptionsByStatus = $this->getSubscriptionsByStatus();
        $monthlyGrowth = $this->getMonthlyGrowth();

        return Inertia::render('Admin/Reports/Index', [
            'stats' => $stats,
            'recentImports' => $recentImports,
            'subscriptionsByStatus' => $subscriptionsByStatus,
            'monthlyGrowth' => $monthlyGrowth,
        ]);
    }

    public function export(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $type = $request->get('type', 'customers');

        $filename = $type . '_export_' . now()->format('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return response()->stream(function () use ($type) {
            $file = fopen('php://output', 'w');

            if ($type === 'customers') {
                $this->exportCustomers($file);
            } elseif ($type === 'subscriptions') {
                $this->exportSubscriptions($file);
            }

            fclose($file);
        }, 200, $headers);
    }

    private function getStats(): array
    {
        return [
            'total_customers' => Customer::count(),
            'total_subscriptions' => Subscription::count(),
            'active_subscriptions' => Subscription::where('subscription_status', 'active')->count(),
            'inactive_subscriptions' => Subscription::where('subscription_status', 'inactive')->count(),
            'customers_with_subscriptions' => Customer::has('subscriptions')->count(),
            'customers_without_subscriptions' => Customer::doesntHave('subscriptions')->count(),
        ];
    }

    private function getRecentImports(): array
    {
        // This would be from an imports log table if you have one
        // For now, we'll return recent created records
        return [
            'recent_customers' => Customer::orderBy('created_at', 'desc')->limit(5)->get(),
            'recent_subscriptions' => Subscription::with('customer')->orderBy('created_at', 'desc')->limit(5)->get(),
        ];
    }

    private function getSubscriptionsByStatus(): array
    {
        return Subscription::selectRaw('subscription_status, COUNT(*) as count')
            ->groupBy('subscription_status')
            ->pluck('count', 'subscription_status')
            ->toArray();
    }

    private function getMonthlyGrowth(): array
    {
        $monthlyCustomers = Customer::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month')
            ->toArray();

        $monthlySubscriptions = Subscription::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month')
            ->toArray();

        return [
            'customers' => $monthlyCustomers,
            'subscriptions' => $monthlySubscriptions,
        ];
    }

    private function exportCustomers($file): void
    {
        // Write CSV header
        fputcsv($file, [
            'Customer ID',
            'Name',
            'Email',
            'Phone',
            'Address',
            'KTP No',
            'Referral Source',
            'Created At',
            'Total Subscriptions'
        ]);

        // Write data in chunks
        Customer::with('subscriptions')->chunk(1000, function ($customers) use ($file) {
            foreach ($customers as $customer) {
                fputcsv($file, [
                    $customer->customer_id,
                    $customer->customer_name,
                    $customer->customer_email,
                    $customer->customer_phone,
                    $customer->customer_address,
                    $customer->customer_ktp_no,
                    $customer->referral_source,
                    $customer->created_at->format('Y-m-d H:i:s'),
                    $customer->subscriptions->count(),
                ]);
            }
        });
    }

    private function exportSubscriptions($file): void
    {
        // Write CSV header
        fputcsv($file, [
            'Subscription ID',
            'Customer ID',
            'Customer Name',
            'Service ID',
            'Group',
            'Status',
            'Price',
            'Billing Cycle',
            'Start Date',
            'Address',
            'Created By',
            'Installed By',
            'Created At'
        ]);

        // Write data in chunks
        Subscription::with('customer')->chunk(1000, function ($subscriptions) use ($file) {
            foreach ($subscriptions as $subscription) {
                fputcsv($file, [
                    $subscription->subscription_id,
                    $subscription->customer_id,
                    $subscription->customer?->customer_name,
                    $subscription->serv_id,
                    $subscription->group,
                    $subscription->subscription_status,
                    $subscription->subscription_price,
                    $subscription->subscription_billing_cycle,
                    $subscription->subscription_start_date,
                    $subscription->subscription_address,
                    $subscription->created_by,
                    $subscription->installed_by,
                    $subscription->created_at->format('Y-m-d H:i:s'),
                ]);
            }
        });
    }
}
