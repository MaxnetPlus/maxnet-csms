<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prospect extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_id',
        'prospect_category_id',
        'customer_name',
        'customer_email',
        'customer_number',
        'address',
        'latitude',
        'longitude',
        'status',
        'notes',
        'converted_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'converted_at' => 'datetime',
    ];

    protected $appends = [
        'points',
    ];

    /**
     * Sales yang bertanggung jawab
     */
    public function sales(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_id');
    }

    /**
     * Kategori prospek
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProspectCategory::class, 'prospect_category_id');
    }

    /**
     * Poin yang didapat dari prospek ini
     */
    public function salesPoints(): HasMany
    {
        return $this->hasMany(SalesPoint::class);
    }

    /**
     * Scope untuk filter berdasarkan sales
     */
    public function scopeBySales($query, $salesId)
    {
        return $query->where('sales_id', $salesId);
    }

    /**
     * Scope untuk filter berdasarkan status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope untuk prospek hari ini
     */
    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    /**
     * Scope untuk prospek bulan ini
     */
    public function scopeThisMonth($query)
    {
        return $query->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year);
    }

    /**
     * Get points untuk prospek ini
     */
    public function getPointsAttribute()
    {
        return $this->category ? $this->category->points : 0;
    }
}
