<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\CustomerFollowUp;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerFollowUpController extends Controller
{
    /**
     * Display follow ups assigned to current sales
     */
    public function index(Request $request)
    {
        $query = CustomerFollowUp::where('assigned_to', auth()->id())
            ->with(['customer', 'subscription', 'creator']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('customer', function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        $followUps = $query->latest()->paginate(10);

        return Inertia::render('Sales/FollowUps/Index', [
            'followUps' => $followUps,
            'filters' => $request->only(['status', 'priority', 'search']),
        ]);
    }

    /**
     * Display the specified follow up
     */
    public function show(CustomerFollowUp $followUp)
    {
        // Ensure sales can only view their assigned follow ups
        if ($followUp->assigned_to !== auth()->id()) {
            abort(403);
        }

        $followUp->load(['customer', 'subscription', 'creator']);

        return Inertia::render('Sales/FollowUps/Show', [
            'followUp' => $followUp,
        ]);
    }

    /**
     * Complete a follow up
     */
    public function complete(Request $request, CustomerFollowUp $followUp)
    {
        // Ensure sales can only complete their assigned follow ups
        if ($followUp->assigned_to !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'resolution' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $followUp->update([
            'status' => 'completed',
            'resolution' => $validated['resolution'],
            'notes' => $validated['notes'] ?? $followUp->notes,
            'completed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Follow up berhasil diselesaikan!',
            'followUp' => $followUp->fresh(),
        ]);
    }

    /**
     * Update notes for a follow up
     */
    public function updateNotes(Request $request, CustomerFollowUp $followUp)
    {
        // Ensure sales can only update their assigned follow ups
        if ($followUp->assigned_to !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'notes' => 'required|string',
        ]);

        $followUp->update([
            'notes' => $validated['notes'],
        ]);

        return response()->json([
            'message' => 'Catatan berhasil diperbarui!',
            'followUp' => $followUp->fresh(),
        ]);
    }
}
