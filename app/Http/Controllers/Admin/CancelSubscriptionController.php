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
        // Only get basic statistics and initial center coordinates for map
        $stats = $this->getCancelSubscriptionStats();

        // Get center coordinates for initial map view (limit to 100 for performance)
        $initialMapData = $this->getInitialMapData($request);

        // Get paginated list for table view
        $customers = $this->getPaginatedCustomers($request);

        return Inertia::render('Admin/CancelSubscription/Index', [
            'customers' => $customers,
            'mapData' => $initialMapData, // Only initial/center data
            'stats' => $stats,
            'filters' => $request->only(['search']),
        ]);
    }
    private function getCancelSubscriptionStats(): array
    {
        $totalCanceled = Subscription::where('subscription_status', 'CANCELED')->count();

        $withCoordinates = Subscription::where('subscription_status', 'CANCELED')
            ->where('subscription_maps', '!=', '-')
            ->whereNotNull('subscription_maps')
            ->where('subscription_maps', '!=', '')
            ->count();

        $withoutCoordinates = $totalCanceled - $withCoordinates;

        return [
            'total_canceled' => $totalCanceled,
            'with_coordinates' => $withCoordinates,
            'without_coordinates' => $withoutCoordinates,
        ];
    }

    /**
     * Get initial map data (limited for performance)
     */
    private function getInitialMapData(Request $request): array
    {
        $query = Subscription::select([
            'subscription_id', 'customer_id', 'subscription_maps',
            'subscription_address', 'subscription_description', 'serv_id', 'created_at', 'dismantle_at'
        ])
            ->with(['customer:customer_id,customer_name,customer_phone,customer_email'])
            ->where('subscription_status', 'CANCELED')
            ->where('subscription_maps', '!=', '-')
            ->whereNotNull('subscription_maps')
            ->where('subscription_maps', '!=', '');

        // Apply search filter if provided
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->whereHas('customer', function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_id', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        // Limit initial data for performance
        $subscriptions = $query->get();

        return $this->formatMapData($subscriptions);
    }

    /**
     * Get paginated customers for table view
     */
    private function getPaginatedCustomers(Request $request)
    {
        $query = Customer::select(['customer_id', 'customer_name', 'customer_email', 'customer_phone'])
            ->with(['subscriptions' => function ($query) {
                $query->select(['subscription_id', 'customer_id', 'subscription_status', 'created_at'])
                    ->limit(5); // Limit subscriptions per customer
            }])
            ->whereHas('subscriptions', function ($query) {
                $query->where('subscription_status', 'CANCELED');
            });

        // Apply search filter
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        return $query->paginate(20); // Paginate for better performance
    }

    /**
     * Format subscription data for map display
     */
    private function formatMapData($subscriptions): array
    {
        $mapData = [];

        foreach ($subscriptions as $subscription) {
            $coords = $this->parseCoordinates($subscription->subscription_maps);
            if ($coords && $subscription->customer) {
                $mapData[] = [
                    'id' => $subscription->subscription_id,
                    'customer_id' => $subscription->customer->customer_id,
                    'customer_name' => $subscription->customer->customer_name,
                    'customer_phone' => $subscription->customer->customer_phone,
                    'customer_email' => $subscription->customer->customer_email,
                    'subscription_id' => $subscription->subscription_id,
                    'subscription_address' => $subscription->subscription_address,
                    'subscription_description' => $subscription->subscription_description,
                    'lng' => $coords['lng'],
                    'subscription_status' => 'CANCELED',
                    'serv_id' => $subscription->serv_id,
                    'lat' => $coords['lat'],
                    'coordinates' => $subscription->subscription_maps,
                    'created_at' => $subscription->created_at ? $subscription->created_at->format('Y-m-d H:i') : null,
                    'dismantle_at' => $subscription->dismantle_at ? $subscription->dismantle_at->format('Y-m-d H:i') : null,
                ];
            }
        }

        return $mapData;
    }

    /**
     * API endpoint for map data with bounds filtering (optimized)
     */
    public function mapData(Request $request)
    {
        $bounds = $request->input('bounds');
        $all = $request->input('all', false); // Flag untuk mengambil semua data
        $limit = $request->input('limit', 1000); // Default limit yang lebih tinggi

        // Base query with only necessary fields for performance
        $query = Subscription::select([
            'subscription_id', 'customer_id', 'subscription_maps',
            'subscription_address', 'subscription_description', 'serv_id', 'created_at', 'dismantle_at'
        ])
            ->with(['customer:customer_id,customer_name,customer_phone,customer_email'])
            ->where('subscription_status', 'CANCELED')
            ->where('subscription_maps', '!=', '-')
            ->whereNotNull('subscription_maps')
            ->where('subscription_maps', '!=', '');

        // Apply search filter if provided
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->whereHas('customer', function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_id', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%");
            })
                ->orWhere('subscription_id', 'like', "%{$search}%")
                ->orWhere('serv_id', 'like', "%{$search}%")
                ->orWhere('subscription_description', 'like', "%{$search}%");
        }

        // Apply geographical filtering with database optimization
        if ($bounds && $this->isValidBounds($bounds)) {
            // Add raw SQL for better performance on coordinate filtering
            $query->whereRaw("
                CASE 
                    WHEN subscription_maps REGEXP '^-?[0-9]+\.?[0-9]*,-?[0-9]+\.?[0-9]*$' THEN
                        CAST(SUBSTRING_INDEX(subscription_maps, ',', 1) AS DECIMAL(10,8)) BETWEEN ? AND ?
                        AND CAST(SUBSTRING_INDEX(subscription_maps, ',', -1) AS DECIMAL(11,8)) BETWEEN ? AND ?
                    ELSE FALSE
                END
            ", [
                $bounds['south'], $bounds['north'],
                $bounds['west'], $bounds['east']
            ]);
        }

        // Apply limit based on request
        if ($all !== 'true') {
            $query->limit((int) $limit);
        }

        // Add ordering for consistent results
        $query->orderBy('created_at', 'desc');

        $subscriptions = $query->get();
        $mapData = [];

        foreach ($subscriptions as $subscription) {
            $coords = $this->parseCoordinates($subscription->subscription_maps);
            if ($coords && $subscription->customer) {
                $mapData[] = [
                    'id' => $subscription->subscription_id,
                    'customer_id' => $subscription->customer->customer_id,
                    'customer_name' => $subscription->customer->customer_name,
                    'customer_phone' => $subscription->customer->customer_phone,
                    'customer_email' => $subscription->customer->customer_email,
                    'subscription_id' => $subscription->subscription_id,
                    'subscription_address' => $subscription->subscription_address,
                    'subscription_description' => $subscription->subscription_description,
                    'subscription_status' => 'CANCELED',
                    'serv_id' => $subscription->serv_id,
                    'lat' => $coords['lat'],
                    'lng' => $coords['lng'],
                    'coordinates' => $subscription->subscription_maps,
                    'created_at' => $subscription->created_at ? $subscription->created_at->format('Y-m-d H:i') : null,
                    'dismantle_at' => $subscription->dismantle_at ? $subscription->dismantle_at->format('Y-m-d H:i') : null,
                ];
            }
        }

        return response()->json([
            'data' => $mapData,
            'count' => count($mapData),
            'total_in_db' => $this->getTotalCanceledWithCoordinates(),
            'limited' => $all !== 'true' && count($mapData) >= $limit,
            'bounds_applied' => $bounds && $this->isValidBounds($bounds)
        ]);
    }

    /**
     * Get paginated table data for canceled subscriptions
     */
    public function tableData(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search', '');
        $bounds = $request->input('bounds');

        $query = Subscription::select([
            'subscription_id', 'customer_id', 'subscription_maps',
            'subscription_address', 'subscription_description', 'subscription_status',
            'serv_id', 'created_at', 'dismantle_at', 'updated_at'
        ])
            ->with(['customer:customer_id,customer_name,customer_phone,customer_email'])
            ->where('subscription_status', 'CANCELED')
            ->orderBy('updated_at', 'desc');

        // Apply search filter
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('subscription_id', 'like', "%{$search}%")
                    ->orWhere('serv_id', 'like', "%{$search}%")
                    ->orWhere('subscription_address', 'like', "%{$search}%")
                    ->orWhere('subscription_description', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('customer_name', 'like', "%{$search}%")
                            ->orWhere('customer_id', 'like', "%{$search}%")
                            ->orWhere('customer_email', 'like', "%{$search}%")
                            ->orWhere('customer_phone', 'like', "%{$search}%");
                    });
            });
        }

        // Apply bounds filter if provided (only show data within map bounds)
        if ($bounds && $this->isValidBounds($bounds)) {
            $filteredIds = $this->getSubscriptionIdsInBounds($bounds);
            if (!empty($filteredIds)) {
                $query->whereIn('subscription_id', $filteredIds);
            } else {
                // No subscriptions in bounds, return empty result
                return response()->json([
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => $perPage,
                    'total' => 0,
                    'from' => 0,
                    'to' => 0,
                ]);
            }
        }

        $paginated = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Format the data
        $formattedData = $paginated->through(function ($subscription) {
            $coords = $this->parseCoordinates($subscription->subscription_maps ?? '');


            return [
                'id' => $subscription->subscription_id,
                'customer_id' => $subscription->customer ? $subscription->customer->customer_id : 'N/A',
                'customer_name' => $subscription->customer ? $subscription->customer->customer_name : 'N/A',
                'customer_phone' => $subscription->customer ? $subscription->customer->customer_phone : 'N/A',
                'customer_email' => $subscription->customer ? $subscription->customer->customer_email : 'N/A',
                'subscription_id' => $subscription->subscription_id,
                'subscription_address' => $subscription->subscription_address ?? 'N/A',
                'subscription_description' => $subscription->subscription_description ?? 'N/A',
                'subscription_status' => $subscription->subscription_status,
                'serv_id' => $subscription->serv_id,
                'coordinates' => $subscription->subscription_maps ?? 'N/A',
                'lat' => $coords ? $coords['lat'] : null,
                'lng' => $coords ? $coords['lng'] : null,
                'created_at' => $subscription->created_at ? $subscription->created_at->format('Y-m-d H:i') : null,
                'updated_at' => $subscription->updated_at ? $subscription->updated_at->format('Y-m-d H:i') : null,
                'dismantle_at' => $subscription->dismantle_at ? $subscription->dismantle_at->format('Y-m-d H:i') : null,
            ];
        });

        // dd($formattedData);

        return response()->json($formattedData);
    }

    /**
     * Get subscription IDs that fall within the given bounds
     */
    private function getSubscriptionIdsInBounds(array $bounds): array
    {
        $subscriptions = Subscription::select(['subscription_id', 'subscription_maps'])
            ->where('subscription_status', 'CANCELED')
            ->where('subscription_maps', '!=', '-')
            ->whereNotNull('subscription_maps')
            ->where('subscription_maps', '!=', '')
            ->get();

        $idsInBounds = [];
        foreach ($subscriptions as $subscription) {
            $coords = $this->parseCoordinates($subscription->subscription_maps);
            if ($coords) {
                $lat = $coords['lat'];
                $lng = $coords['lng'];

                if (
                    $lat >= $bounds['south'] && $lat <= $bounds['north'] &&
                    $lng >= $bounds['west'] && $lng <= $bounds['east']
                ) {
                    $idsInBounds[] = $subscription->subscription_id;
                }
            }
        }

        return $idsInBounds;
    }

    /**
     * Get clustered data for map view (for better performance with many markers)
     */
    public function clusteredData(Request $request)
    {
        $zoom = $request->input('zoom', 10);
        $bounds = $request->input('bounds');

        // Determine cluster size based on zoom level
        $clusterSize = $this->getClusterSize($zoom);

        $query = Subscription::select([
            'subscription_id', 'customer_id', 'subscription_maps',
            'subscription_address', 'subscription_description', 'serv_id'
        ])
            ->with(['customer:customer_id,customer_name'])
            ->where('subscription_status', 'CANCELED')
            ->where('subscription_maps', '!=', '-')
            ->whereNotNull('subscription_maps')
            ->where('subscription_maps', '!=', '');

        $subscriptions = $query->limit(500)->get();
        $clusters = [];

        foreach ($subscriptions as $subscription) {
            $coords = $this->parseCoordinates($subscription->subscription_maps);
            if ($coords && $subscription->customer) {
                // Filter by bounds if provided
                if ($bounds && $this->isValidBounds($bounds)) {
                    $lat = $coords['lat'];
                    $lng = $coords['lng'];

                    if (
                        $lat < $bounds['south'] || $lat > $bounds['north'] ||
                        $lng < $bounds['west'] || $lng > $bounds['east']
                    ) {
                        continue;
                    }
                }

                // Create cluster key based on rounded coordinates
                $clusterLat = round($coords['lat'] / $clusterSize) * $clusterSize;
                $clusterLng = round($coords['lng'] / $clusterSize) * $clusterSize;
                $clusterKey = $clusterLat . ',' . $clusterLng;

                if (!isset($clusters[$clusterKey])) {
                    $clusters[$clusterKey] = [
                        'lat' => $clusterLat,
                        'lng' => $clusterLng,
                        'count' => 0,
                        'items' => []
                    ];
                }

                $clusters[$clusterKey]['count']++;

                // Only store up to 5 items for popup display
                if (count($clusters[$clusterKey]['items'] ?? []) < 5) {
                    $clusters[$clusterKey]['items'][] = [
                        'customer_name' => $subscription->customer->customer_name,
                        'subscription_id' => $subscription->subscription_id,
                        'subscription_address' => $subscription->subscription_address,
                    ];
                }
            }
        }

        return response()->json([
            'data' => array_values($clusters),
            'zoom' => $zoom,
            'cluster_size' => $clusterSize
        ]);
    }

    /**
     * Get optimized clustered map data for better performance with thousands of records
     */
    public function clusteredMapData(Request $request)
    {
        $bounds = $request->input('bounds');
        $zoom = $request->input('zoom', 10);
        $search = $request->input('search');

        // Determine cluster precision based on zoom level
        $precision = $this->getClusterPrecision($zoom);

        $query = Subscription::select([
            'subscription_id', 'customer_id', 'subscription_maps',
            'subscription_address', 'subscription_description', 'serv_id'
        ])
            ->with(['customer:customer_id,customer_name,customer_phone,customer_email'])
            ->where('subscription_status', 'CANCELED')
            ->where('subscription_maps', '!=', '-')
            ->whereNotNull('subscription_maps')
            ->where('subscription_maps', '!=', '');

        // Apply search filter
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('customer', function ($customerQuery) use ($search) {
                    $customerQuery->where('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_id', 'like', "%{$search}%")
                        ->orWhere('customer_email', 'like', "%{$search}%")
                        ->orWhere('customer_phone', 'like', "%{$search}%");
                })
                    ->orWhere('subscription_id', 'like', "%{$search}%")
                    ->orWhere('serv_id', 'like', "%{$search}%");
            });
        }

        // Apply geographical filtering at database level
        if ($bounds && $this->isValidBounds($bounds)) {
            $query->whereRaw("
                CASE 
                    WHEN subscription_maps REGEXP '^-?[0-9]+\.?[0-9]*,-?[0-9]+\.?[0-9]*$' THEN
                        CAST(SUBSTRING_INDEX(subscription_maps, ',', 1) AS DECIMAL(10,8)) BETWEEN ? AND ?
                        AND CAST(SUBSTRING_INDEX(subscription_maps, ',', -1) AS DECIMAL(11,8)) BETWEEN ? AND ?
                    ELSE FALSE
                END
            ", [
                $bounds['south'], $bounds['north'],
                $bounds['west'], $bounds['east']
            ]);
        }

        $subscriptions = $query->get();
        $clusters = [];

        foreach ($subscriptions as $subscription) {
            $coords = $this->parseCoordinates($subscription->subscription_maps);
            if ($coords && $subscription->customer) {
                // Create cluster key based on precision
                $clusterLat = round($coords['lat'] * $precision) / $precision;
                $clusterLng = round($coords['lng'] * $precision) / $precision;
                $clusterKey = $clusterLat . ',' . $clusterLng;

                if (!isset($clusters[$clusterKey])) {
                    $clusters[$clusterKey] = [
                        'id' => $clusterKey,
                        'lat' => $clusterLat,
                        'lng' => $clusterLng,
                        'count' => 0,
                        'items' => []
                    ];
                }

                $clusters[$clusterKey]['count']++;

                // Store only sample items to avoid memory issues
                if (count($clusters[$clusterKey]['items'] ?? []) < 5) {
                    $clusters[$clusterKey]['items'][] = [
                        'id' => $subscription->subscription_id,
                        'customer_name' => $subscription->customer->customer_name,
                        'serv_id' => $subscription->serv_id,
                        'address' => $subscription->subscription_address
                    ];
                }
            }
        }

        return response()->json([
            'clusters' => array_values($clusters),
            'total_points' => count($subscriptions),
            'cluster_count' => count($clusters),
            'zoom' => $zoom,
            'precision' => $precision
        ]);
    }

    /**
     * Export canceled subscriptions data
     */
    public function export(Request $request)
    {
        $format = $request->input('format', 'csv');
        $bounds = $request->input('bounds');
        $search = $request->input('search');

        $query = Subscription::select([
            'subscription_id', 'customer_id', 'subscription_maps',
            'subscription_address', 'subscription_description', 'subscription_status',
            'serv_id', 'created_at', 'dismantle_at'
        ])
            ->with(['customer'])
            ->where('subscription_status', 'CANCELED');

        // Apply search filter
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('subscription_id', 'like', "%{$search}%")
                    ->orWhere('serv_id', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('customer_name', 'like', "%{$search}%")
                            ->orWhere('customer_id', 'like', "%{$search}%");
                    });
            });
        }

        // Apply bounds filter if provided
        if ($bounds && $this->isValidBounds($bounds)) {
            $filteredIds = $this->getSubscriptionIdsInBounds($bounds);
            if (!empty($filteredIds)) {
                $query->whereIn('subscription_id', $filteredIds);
            }
        }

        $subscriptions = $query->get();

        if ($format === 'csv') {
            $filename = 'canceled_subscriptions_' . date('Y-m-d_H-i-s') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];

            $callback = function () use ($subscriptions) {
                $file = fopen('php://output', 'w');

                // CSV headers
                fputcsv($file, [
                    'Subscription ID', 'Customer ID', 'Customer Name', 'Customer Phone',
                    'Customer Email', 'Service ID', 'Address', 'Description',
                    'Coordinates', 'Created At', 'Dismantled At'
                ]);

                foreach ($subscriptions as $subscription) {
                    fputcsv($file, [
                        $subscription->subscription_id,
                        $subscription->customer ? $subscription->customer->customer_id : '',
                        $subscription->customer ? $subscription->customer->customer_name : '',
                        $subscription->customer ? $subscription->customer->customer_phone : '',
                        $subscription->customer ? $subscription->customer->customer_email : '',
                        $subscription->serv_id,
                        $subscription->subscription_address ?? '',
                        $subscription->subscription_description ?? '',
                        $subscription->subscription_maps ?? '',
                        $subscription->created_at ? $subscription->created_at->format('Y-m-d H:i:s') : '',
                        $subscription->dismantle_at ? $subscription->dismantle_at->format('Y-m-d H:i:s') : '',
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        }

        // Default to JSON if format not supported
        return response()->json($subscriptions);
    }

    /**
     * Validate if bounds array is valid
     */
    private function isValidBounds(?array $bounds): bool
    {
        if (!$bounds) {
            return false;
        }

        return isset($bounds['north'], $bounds['south'], $bounds['east'], $bounds['west']) &&
            is_numeric($bounds['north']) && is_numeric($bounds['south']) &&
            is_numeric($bounds['east']) && is_numeric($bounds['west']);
    }

    /**
     * Get cluster size based on zoom level
     */
    private function getClusterSize(int $zoom): float
    {
        // Higher zoom = smaller clusters
        if ($zoom >= 15) return 0.001;
        if ($zoom >= 13) return 0.005;
        if ($zoom >= 11) return 0.01;
        if ($zoom >= 9) return 0.02;
        if ($zoom >= 7) return 0.05;
        return 0.1;
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

    /**
     * Get total count of canceled subscriptions with coordinates
     */
    private function getTotalCanceledWithCoordinates(): int
    {
        return Subscription::where('subscription_status', 'CANCELED')
            ->where('subscription_maps', '!=', '-')
            ->whereNotNull('subscription_maps')
            ->where('subscription_maps', '!=', '')
            ->count();
    }

    /**
     * Get cluster precision based on zoom level
     */
    private function getClusterPrecision(int $zoom): int
    {
        // Higher zoom = higher precision (smaller clusters)
        if ($zoom >= 16) return 10000;   // Very detailed
        if ($zoom >= 14) return 1000;    // Detailed
        if ($zoom >= 12) return 100;     // Medium
        if ($zoom >= 10) return 10;      // Coarse
        if ($zoom >= 8) return 1;        // Very coarse
        return 0.1;                      // Extremely coarse
    }
}
