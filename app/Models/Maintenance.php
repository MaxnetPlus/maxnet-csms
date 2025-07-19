<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Maintenance extends Model
{
    protected $primaryKey = 'ticket_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'ticket_id',
        'subscription_id',
        'customer_id',
        'subject_problem',
        'customer_report',
        'technician_update_desc',
        'work_by',
        'open_by',
        'open_at',
        'closed_at',
        'created_by',
        'ticket_close_date',
        'status',
        'picture_from_customer',
        'picture_from_technician',
        'handle_by',
        'handle_by_team',
    ];

    protected $casts = [
        'open_at' => 'datetime',
        'closed_at' => 'datetime',
        'ticket_close_date' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class, 'subscription_id', 'subscription_id');
    }

    public function activeFollowUps()
    {
        return CustomerFollowUp::where('customer_id', $this->customer_id)
            ->whereIn('status', ['pending', 'in_progress'])
            ->orderBy('priority', 'desc');
    }

    public function followUps()
    {
        return CustomerFollowUp::where('customer_id', $this->customer_id);
    }
}
