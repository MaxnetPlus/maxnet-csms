<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesPoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_id',
        'prospect_id',
        'points_earned',
        'accumulated_points',
        'date',
        'type',
        'description',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    /**
     * Sales yang memiliki poin ini
     */
    public function sales(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_id');
    }

    /**
     * Prospek yang menghasilkan poin ini
     */
    public function prospect(): BelongsTo
    {
        return $this->belongsTo(Prospect::class);
    }

    /**
     * Scope untuk filter berdasarkan sales
     */
    public function scopeBySales($query, $salesId)
    {
        return $query->where('sales_id', $salesId);
    }

    /**
     * Scope untuk filter berdasarkan tanggal
     */
    public function scopeByDate($query, $date)
    {
        return $query->whereDate('date', $date);
    }

    /**
     * Scope untuk poin hari ini
     */
    public function scopeToday($query)
    {
        return $query->whereDate('date', today());
    }

    /**
     * Scope untuk poin bulan ini
     */
    public function scopeThisMonth($query)
    {
        return $query->whereMonth('date', now()->month)
                    ->whereYear('date', now()->year);
    }

    /**
     * Hitung total poin untuk sales dalam periode tertentu
     */
    public static function getTotalPoints($salesId, $startDate = null, $endDate = null)
    {
        $query = static::bySales($salesId);
        
        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }
        
        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }
        
        return $query->sum('points_earned');
    }

    /**
     * Hitung akumulasi poin terkini untuk sales
     */
    public static function getCurrentAccumulation($salesId)
    {
        return static::bySales($salesId)
                    ->latest('date')
                    ->value('accumulated_points') ?? 0;
    }
}
