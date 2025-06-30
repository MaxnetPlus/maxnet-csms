<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    // Primary key custom
    protected $primaryKey   = 'customer_id';
    public    $incrementing = false;
    protected $keyType      = 'string';

    protected $fillable = [
        'customer_id',
        'customer_password',
        'customer_name',
        'referral_source',
        'customer_email',
        'customer_address',
        'customer_phone',
        'customer_ktp_no',
        'customer_ktp_picture',
        'password_reset',
    ];

    /**
     * Subscriptions milik customer ini
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'customer_id', 'customer_id');
    }
}
// Compare this snippet from app/Models/Subscription.php: