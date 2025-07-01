<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Invitation;
use App\Mail\InvitationMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserController extends Controller
{
    // Middleware akan didefinisikan di route group

    public function index(Request $request): Response
    {
        $users = User::with(['roles', 'permissions'])
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($request->role, function ($query, $role) {
                $query->whereHas('roles', function ($q) use ($role) {
                    $q->where('name', $role);
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        // Get pending invitations
        $invitations = Invitation::with('inviter')
            ->where('accepted_at', null)
            ->where('expires_at', '>', now())
            ->orderBy('created_at', 'desc')
            ->get();

        $roles = Role::all();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'invitations' => $invitations,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function show(User $user): Response
    {
        $user->load(['roles', 'permissions']);

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
        ]);
    }

    public function create(): Response
    {
        $roles = Role::all();
        $permissions = Permission::all();

        return Inertia::render('Admin/Users/Create', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z0-9_]+$/', 'unique:users'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'roles' => ['array'],
            'roles.*' => ['exists:roles,name'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,name'],
        ], [
            'username.regex' => 'The username may only contain letters, numbers, and underscores.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'] ?? null,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        if (isset($validated['roles'])) {
            $user->assignRole($validated['roles']);
        }

        if (isset($validated['permissions'])) {
            $user->givePermissionTo($validated['permissions']);
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'User berhasil dibuat.');
    }

    public function edit(User $user): Response
    {
        $user->load(['roles', 'permissions']);
        $roles = Role::all();
        $permissions = Permission::all();

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function update(Request $request, User $user): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z0-9_]+$/', Rule::unique('users')->ignore($user->id)],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'roles' => ['array'],
            'roles.*' => ['exists:roles,name'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,name'],
        ], [
            'username.regex' => 'The username may only contain letters, numbers, and underscores.',
        ]);

        $user->update([
            'name' => $validated['name'],
            'username' => $validated['username'] ?? $user->username,
            'email' => $validated['email'],
            'password' => $validated['password'] ? Hash::make($validated['password']) : $user->password,
        ]);

        // Sync roles
        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        } else {
            $user->syncRoles([]);
        }

        // Sync permissions
        if (isset($validated['permissions'])) {
            $user->syncPermissions($validated['permissions']);
        } else {
            $user->syncPermissions([]);
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'User berhasil diupdate.');
    }

    public function destroy(User $user): \Illuminate\Http\RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return redirect()->route('admin.users.index')
                ->with('error', 'Tidak dapat menghapus akun sendiri.');
        }

        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'User berhasil dihapus.');
    }

    public function invite(): Response
    {
        $roles = Role::all();

        return Inertia::render('Admin/Users/InviteUser', [
            'roles' => $roles,
        ]);
    }

    public function sendInvitation(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        // Check if invitation already exists for this email
        $existingInvitation = Invitation::where('email', $validated['email'])
            ->where('accepted_at', null)
            ->where('expires_at', '>', now())
            ->first();

        if ($existingInvitation) {
            return redirect()->back()
                ->with('error', 'An active invitation already exists for this email.');
        }

        // Create invitation
        $invitation = Invitation::create([
            'email' => $validated['email'],
            'token' => Str::random(32),
            'role' => $validated['role'],
            'invited_by' => auth()->id(),
            'expires_at' => now()->addDays(7), // Invitation expires in 7 days
        ]);

        // Send email invitation
        Mail::to($invitation->email)->send(new InvitationMail($invitation));

        return redirect()->route('admin.users.index')
            ->with('success', 'Invitation sent successfully to ' . $validated['email']);
    }

    public function acceptInvitation(Request $request, string $token): \Illuminate\Http\RedirectResponse
    {
        $invitation = Invitation::where('token', $token)
            ->where('accepted_at', null)
            ->where('expires_at', '>', now())
            ->firstOrFail();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z0-9_]+$/', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'username.regex' => 'The username may only contain letters, numbers, and underscores.',
        ]);

        // Create user
        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'] ?? null,
            'email' => $invitation->email,
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        // Ensure email is verified (alternative approach)
        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        // Assign role
        $user->assignRole($invitation->role);

        // Mark invitation as accepted
        $invitation->update(['accepted_at' => now()]);

        return redirect()->route('login')
            ->with('success', 'Account created successfully! You can now login.');
    }

    public function destroyInvitation(Invitation $invitation): \Illuminate\Http\RedirectResponse
    {
        $invitation->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'Invitation cancelled successfully.');
    }

    public function resendInvitation(Invitation $invitation): \Illuminate\Http\RedirectResponse
    {
        // Update expiration time
        $invitation->update([
            'expires_at' => now()->addDays(7),
        ]);

        // Resend email invitation
        Mail::to($invitation->email)->send(new InvitationMail($invitation));

        return redirect()->route('admin.users.index')
            ->with('success', 'Invitation resent successfully to ' . $invitation->email);
    }

    public function invitationHistory(Request $request): Response
    {
        $invitations = Invitation::with('inviter')
            ->when($request->search, function ($query, $search) {
                $query->where('email', 'like', "%{$search}%")
                    ->orWhereHas('inviter', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            })
            ->when($request->status, function ($query, $status) {
                if ($status === 'pending') {
                    $query->whereNull('accepted_at')
                        ->where('expires_at', '>', now());
                } elseif ($status === 'accepted') {
                    $query->whereNotNull('accepted_at');
                } elseif ($status === 'expired') {
                    $query->whereNull('accepted_at')
                        ->where('expires_at', '<=', now());
                }
            })
            ->when($request->role, function ($query, $role) {
                $query->where('role', $role);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $roles = Role::all();

        return Inertia::render('Admin/Users/InvitationHistory', [
            'invitations' => $invitations,
            'roles' => $roles,
            'filters' => $request->only(['search', 'status', 'role']),
        ]);
    }

    public function bulkDeleteInvitations(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'invitation_ids' => ['required', 'array'],
            'invitation_ids.*' => ['exists:invitations,id'],
        ]);

        Invitation::whereIn('id', $validated['invitation_ids'])->delete();

        return redirect()->route('admin.users.invitation-history')
            ->with('success', count($validated['invitation_ids']) . ' invitations deleted successfully.');
    }

    public function bulkResendInvitations(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'invitation_ids' => ['required', 'array'],
            'invitation_ids.*' => ['exists:invitations,id'],
        ]);

        $invitations = Invitation::whereIn('id', $validated['invitation_ids'])
            ->whereNull('accepted_at')
            ->get();

        foreach ($invitations as $invitation) {
            // Update expiration time and resend
            $invitation->update(['expires_at' => now()->addDays(7)]);
            Mail::to($invitation->email)->send(new InvitationMail($invitation));
        }

        return redirect()->route('admin.users.invitation-history')
            ->with('success', $invitations->count() . ' invitations resent successfully.');
    }
}
