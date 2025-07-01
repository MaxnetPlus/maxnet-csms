<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CancelSubscriptionController extends Controller
{
    /**
     * Display canceled subscriptions with map view
     */
    public function index(Request $request): Response
    {
        // Get all customers with canceled subscriptions and valid coordinates
        $query = Customer::with(['subscriptions' => function ($query) {
            $query->where('subscription_status', 'cancel')
                  ->where('subscription_maps', '!=', '-')
                  ->whereNotNull('subscription_maps')
                  ->where('subscription_maps', '!=', '');
        }])->whereHas('subscriptions', function ($query) {
            $query->where('subscription_status', 'cancel')
                  ->where('subscription_maps', '!=', '-')
                  ->whereNotNull('subscription_maps')
                  ->where('subscription_maps', '!=', '');
        });

        // Apply filters if provided
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_id', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        $customers = $query->get();

        // Prepare map data with coordinates
        $mapData = [];
        foreach ($customers as $customer) {
            foreach ($customer->subscriptions as $subscription) {
                $coords = $this->parseCoordinates($subscription->subscription_maps);
                if ($coords) {
                    $mapData[] = [
                        'id' => $subscription->subscription_id,
                        'customer_id' => $customer->customer_id,
                        'customer_name' => $customer->customer_name,
                        'customer_phone' => $customer->customer_phone,
                        'customer_email' => $customer->customer_email,
                        'subscription_id' => $subscription->subscription_id,
                        'subscription_address' => $subscription->subscription_address,
                        'subscription_status' => $subscription->subscription_status,
                        'serv_id' => $subscription->serv_id,
                        'lat' => $coords['lat'],
                        'lng' => $coords['lng'],
                        'coordinates' => $subscription->subscription_maps,
                        'created_at' => $subscription->created_at->format('Y-m-d H:i'),
                        'dismantle_at' => $subscription->dismantle_at ? $subscription->dismantle_at->format('Y-m-d H:i') : null,
                    ];
                }
            }
        }

        // Statistics
        $stats = [
            'total_canceled' => count($mapData),
            'with_coordinates' => count($mapData),
            'without_coordinates' => Subscription::where('subscription_status', 'cancel')
                ->where(function ($query) {
                    $query->where('subscription_maps', '=', '-')
                          ->orWhereNull('subscription_maps')
                          ->orWhere('subscription_maps', '=', '');
                })->count(),
        ];

        return Inertia::render('Admin/CancelSubscription/Index', [
            'customers' => $customers,
            'mapData' => $mapData,
            'stats' => $stats,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * API endpoint for map data with bounds filtering
     */
    public function mapData(Request $request)
    {
        $bounds = $request->input('bounds');
        
        $query = Customer::with(['subscriptions' => function ($query) {
            $query->where('subscription_status', 'cancel')
                  ->where('subscription_maps', '!=', '-')
                  ->whereNotNull('subscription_maps')
                  ->where('subscription_maps', '!=', '');
        }])->whereHas('subscriptions', function ($query) {
            $query->where('subscription_status', 'cancel')
                  ->where('subscription_maps', '!=', '-')
                  ->whereNotNull('subscription_maps')
                  ->where('subscription_maps', '!=', '');
        });

        $customers = $query->get();
        $mapData = [];

        foreach ($customers as $customer) {
            foreach ($customer->subscriptions as $subscription) {
                $coords = $this->parseCoordinates($subscription->subscription_maps);
                if ($coords) {
                    // Filter by bounds if provided
                    if ($bounds) {
                        $lat = $coords['lat'];
                        $lng = $coords['lng'];
                        
                        if ($lat < $bounds['south'] || $lat > $bounds['north'] ||
                            $lng < $bounds['west'] || $lng > $bounds['east']) {
                            continue;
                        }
                    }

                    $mapData[] = [
                        'id' => $subscription->subscription_id,
                        'customer_id' => $customer->customer_id,
                        'customer_name' => $customer->customer_name,
                        'customer_phone' => $customer->customer_phone,
                        'customer_email' => $customer->customer_email,
                        'subscription_id' => $subscription->subscription_id,
                        'subscription_address' => $subscription->subscription_address,
                        'subscription_status' => $subscription->subscription_status,
                        'serv_id' => $subscription->serv_id,
                        'lat' => $coords['lat'],
                        'lng' => $coords['lng'],
                        'coordinates' => $subscription->subscription_maps,
                        'created_at' => $subscription->created_at->format('Y-m-d H:i'),
                        'dismantle_at' => $subscription->dismantle_at ? $subscription->dismantle_at->format('Y-m-d H:i') : null,
                    ];
                }
            }
        }

        return response()->json($mapData);
    }

    /**
     * Parse coordinates from subscription_maps field
     * Expected formats: "lat,lng" or "latitude,longitude"
     */
    private function parseCoordinates($coordinateString): ?array
    {
        if (empty($coordinateString) || $coordinateString === '-') {
            return null;
        }

        // Clean and split coordinates
        $coords = explode(',', trim($coordinateString));
        
        if (count($coords) !== 2) {
            return null;
        }

        $lat = trim($coords[0]);
        $lng = trim($coords[1]);

        // Validate if they are valid numbers
        if (!is_numeric($lat) || !is_numeric($lng)) {
            return null;
        }

        $latitude = (float) $lat;
        $longitude = (float) $lng;

        // Basic validation for reasonable coordinate ranges
        if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
            return null;
        }

        return [
            'lat' => $latitude,
            'lng' => $longitude,
        ];
    }
}
