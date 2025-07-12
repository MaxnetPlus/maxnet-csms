<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use HasFactory;

    // Primary key custom
    protected $primaryKey   = 'subscription_id';
    public    $incrementing = false;
    protected $keyType      = 'string';

    protected $fillable = [
        'subscription_id',
        'subscription_password',
        'customer_id',
        'serv_id',
        'group',
        'created_by',
        'subscription_start_date',
        'subscription_billing_cycle',
        'subscription_price',
        'subscription_address',
        'subscription_status',
        'subscription_maps',
        'subscription_home_photo',
        'subscription_form_scan',
        'subscription_description',
        'cpe_type',
        'cpe_serial',
        'cpe_picture',
        'cpe_site',
        'cpe_mac',
        'is_cpe_rent',
        'dismantle_at',
        'suspend_at',
        'installed_by',
        'subscription_test_result',
        'odp_distance',
        'approved_at',
        'installed_at',
        'index_month',
        'attenuation_photo',
        'ip_address',
        'handle_by',
    ];

    protected $casts = [
        'is_cpe_rent'      => 'boolean',
        'dismantle_at'     => 'datetime',
        'suspend_at'       => 'datetime',
        'approved_at'      => 'datetime',
        'installed_at'     => 'datetime',
        'index_month'      => 'integer',
    ];

    /**
     * Customer pemilik subscription ini
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }

    /**
     * Follow ups untuk subscription ini
     */
    public function followUps(): HasMany
    {
        return $this->hasMany(CustomerFollowUp::class, 'subscription_id', 'subscription_id');
    }

    /**
     * Follow ups yang masih aktif (pending/in progress)
     */
    public function activeFollowUps(): HasMany
    {
        return $this->hasMany(CustomerFollowUp::class, 'subscription_id', 'subscription_id')
            ->whereIn('status', ['pending', 'in_progress']);
    }

    /**
     * Check if subscription has active follow ups
     */
    public function getHasActiveFollowUpsAttribute(): bool
    {
        return $this->activeFollowUps()->exists();
    }
}
