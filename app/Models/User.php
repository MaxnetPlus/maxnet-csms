<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'email_verified_at',
        'sso_id',
        'photo_profile',
        'phone_number',
        'is_sso_user',
        'is_approved',
        'address',
        'department',
        'last_login',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_sso_user' => 'boolean',
            'is_approved' => 'boolean',
            'last_login' => 'datetime',
        ];
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * Check if the user is an SSO user.
     *
     * @return bool
     */
    public function isSSOUser(): bool
    {
        return (bool) $this->is_sso_user;
    }

    /**
     * Check if the user is approved.
     *
     * @return bool
     */
    public function isApproved(): bool
    {
        return (bool) $this->is_approved;
    }

    /**
     * Prospects yang ditangani oleh sales ini
     */
    public function prospects()
    {
        return $this->hasMany(Prospect::class, 'sales_id');
    }

    /**
     * Target sales untuk user ini
     */
    public function salesTargets()
    {
        return $this->hasMany(SalesTarget::class, 'sales_id');
    }

    /**
     * Poin sales untuk user ini
     */
    public function salesPoints()
    {
        return $this->hasMany(SalesPoint::class, 'sales_id');
    }

    /**
     * Get target sales yang sedang aktif
     */
    public function getCurrentTarget()
    {
        return SalesTarget::getCurrentTarget($this->id);
    }

    /**
     * Get total poin hari ini
     */
    public function getTodayPoints()
    {
        return $this->salesPoints()->today()->sum('points_earned');
    }

    /**
     * Get total poin bulan ini
     */
    public function getThisMonthPoints()
    {
        return $this->salesPoints()->thisMonth()->sum('points_earned');
    }

    /**
     * Get akumulasi poin terkini
     */
    public function getCurrentAccumulation()
    {
        return SalesPoint::getCurrentAccumulation($this->id);
    }

    /**
     * Check apakah user memiliki akses sales
     */
    public function hasSalesAccess(): bool
    {
        return $this->hasRole('sales');
    }
}
