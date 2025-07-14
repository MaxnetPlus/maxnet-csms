<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Prospect;
use App\Models\ProspectCategory;
use App\Models\SalesPoint;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProspectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Prospect::where('sales_id', auth()->id())
            ->with(['category', 'sales']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%")
                    ->orWhere('customer_number', 'like', "%{$search}%");
            });
        }

        $prospects = $query->latest()->paginate(10);

        return Inertia::render('Sales/Prospects/Index', [
            'prospects' => $prospects,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $categories = ProspectCategory::active()->get();

        return Inertia::render('Sales/Prospects/Create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'prospect_category_id' => 'required|exists:prospect_categories,id',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_number' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'notes' => 'nullable|string',
        ]);

        $validated['sales_id'] = auth()->id();

        $prospect = Prospect::create($validated);

        // Award points to sales
        $this->awardPoints($prospect);

        return redirect()->route('sales.prospects.index')
            ->with('success', 'Prospek berhasil ditambahkan!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Prospect $prospect)
    {
        // Ensure sales can only view their own prospects
        if ($prospect->sales_id !== auth()->id()) {
            abort(403);
        }

        $prospect->load(['category', 'sales', 'salesPoints']);

        return Inertia::render('Sales/Prospects/Show', [
            'prospect' => $prospect,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Prospect $prospect)
    {
        // Ensure sales can only edit their own prospects
        if ($prospect->sales_id !== auth()->id()) {
            abort(403);
        }

        $categories = ProspectCategory::active()->get();

        return Inertia::render('Sales/Prospects/Edit', [
            'prospect' => $prospect,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Prospect $prospect)
    {
        // Ensure sales can only update their own prospects
        if ($prospect->sales_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'prospect_category_id' => 'required|exists:prospect_categories,id',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_number' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'notes' => 'nullable|string',
            'status' => 'required|in:new,contacted,qualified,converted,rejected',
        ]);

        $prospect->update($validated);

        return redirect()->route('sales.prospects.index')
            ->with('success', 'Prospek berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Prospect $prospect)
    {
        // Ensure sales can only delete their own prospects
        if ($prospect->sales_id !== auth()->id()) {
            abort(403);
        }

        $prospect->delete();

        return redirect()->route('sales.prospects.index')
            ->with('success', 'Prospek berhasil dihapus!');
    }

    /**
     * Update prospect status
     */
    public function updateStatus(Request $request, Prospect $prospect)
    {
        // Ensure sales can only update their own prospects
        if ($prospect->sales_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'required|in:new,contacted,qualified,converted,rejected',
            'notes' => 'nullable|string',
        ]);

        if ($validated['status'] === 'converted') {
            $validated['converted_at'] = now();
        }

        $prospect->update($validated);

        return response()->json([
            'message' => 'Status prospek berhasil diperbarui!',
            'prospect' => $prospect->fresh(),
        ]);
    }

    /**
     * Convert prospect to customer
     */
    public function convert(Prospect $prospect)
    {
        // Ensure sales can only convert their own prospects
        if ($prospect->sales_id !== auth()->id()) {
            abort(403);
        }

        $prospect->update([
            'status' => 'converted',
            'converted_at' => now(),
        ]);

        // Award bonus points for conversion
        $this->awardBonusPoints($prospect);

        return response()->json([
            'message' => 'Prospek berhasil dikonversi menjadi customer!',
            'prospect' => $prospect->fresh(),
        ]);
    }

    /**
     * Get nearby prospects (for map view)
     */
    public function getNearbyProspects(Request $request)
    {
        $latitude = $request->latitude;
        $longitude = $request->longitude;
        $radius = $request->radius ?? 5; // km

        if (!$latitude || !$longitude) {
            return response()->json([]);
        }

        // Simple distance calculation using Haversine formula
        $prospects = Prospect::where('sales_id', auth()->id())
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get()
            ->filter(function ($prospect) use ($latitude, $longitude, $radius) {
                $distance = $this->calculateDistance(
                    $latitude,
                    $longitude,
                    $prospect->latitude,
                    $prospect->longitude
                );
                return $distance <= $radius;
            });

        return response()->json($prospects->load('category'));
    }

    /**
     * Award points to sales for new prospect
     */
    private function awardPoints(Prospect $prospect)
    {
        $category = $prospect->category;
        $points = $category ? $category->points : 1;

        SalesPoint::create([
            'sales_id' => $prospect->sales_id,
            'prospect_id' => $prospect->id,
            'points_earned' => $points,
            'date' => today(),
            'type' => 'daily',
            'description' => "Poin dari prospek: {$prospect->customer_name} (Kategori: {$category->name})",
        ]);

        $this->updateAccumulation($prospect->sales_id);
    }

    /**
     * Award bonus points for conversion
     */
    private function awardBonusPoints(Prospect $prospect)
    {
        $bonusPoints = 2; // Bonus points for conversion

        SalesPoint::create([
            'sales_id' => $prospect->sales_id,
            'prospect_id' => $prospect->id,
            'points_earned' => $bonusPoints,
            'date' => today(),
            'type' => 'bonus',
            'description' => "Bonus konversi prospek: {$prospect->customer_name}",
        ]);

        $this->updateAccumulation($prospect->sales_id);
    }

    /**
     * Update accumulated points for sales
     */
    private function updateAccumulation($salesId)
    {
        $totalPoints = SalesPoint::bySales($salesId)->sum('points_earned');

        // Update the latest record with current accumulation
        $latestPoint = SalesPoint::bySales($salesId)->latest()->first();
        if ($latestPoint) {
            $latestPoint->update(['accumulated_points' => $totalPoints]);
        }
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
