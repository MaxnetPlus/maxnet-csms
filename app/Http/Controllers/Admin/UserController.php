<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        $roles = Role::all();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
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
}
