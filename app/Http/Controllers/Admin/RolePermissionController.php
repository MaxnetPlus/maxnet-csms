<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionController extends Controller
{
    // Middleware akan didefinisikan di route group

    public function index(): Response
    {
        $roles = Role::with('permissions')->get();
        $permissions = Permission::all();

        return Inertia::render('Admin/RolePermissions/Index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function storeRole(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,name'],
        ]);

        $role = Role::create(['name' => $validated['name']]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return redirect()->route('admin.roles-permissions.index')
            ->with('success', 'Role berhasil dibuat.');
    }

    public function updateRole(Request $request, Role $role): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name,' . $role->id],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,name'],
        ]);

        $role->update(['name' => $validated['name']]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        } else {
            $role->syncPermissions([]);
        }

        return redirect()->route('admin.roles-permissions.index')
            ->with('success', 'Role berhasil diupdate.');
    }

    public function destroyRole(Role $role): \Illuminate\Http\RedirectResponse
    {
        // Check if role is assigned to any users
        if ($role->users()->count() > 0) {
            return redirect()->route('admin.roles-permissions.index')
                ->with('error', 'Tidak dapat menghapus role yang masih digunakan oleh user.');
        }

        $role->delete();

        return redirect()->route('admin.roles-permissions.index')
            ->with('success', 'Role berhasil dihapus.');
    }

    public function storePermission(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name'],
        ]);

        Permission::create(['name' => $validated['name']]);

        return redirect()->route('admin.roles-permissions.index')
            ->with('success', 'Permission berhasil dibuat.');
    }

    public function updatePermission(Request $request, Permission $permission): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name,' . $permission->id],
        ]);

        $permission->update(['name' => $validated['name']]);

        return redirect()->route('admin.roles-permissions.index')
            ->with('success', 'Permission berhasil diupdate.');
    }

    public function destroyPermission(Permission $permission): \Illuminate\Http\RedirectResponse
    {
        // Check if permission is assigned to any roles or users
        if ($permission->roles()->count() > 0 || $permission->users()->count() > 0) {
            return redirect()->route('admin.roles-permissions.index')
                ->with('error', 'Tidak dapat menghapus permission yang masih digunakan.');
        }

        $permission->delete();

        return redirect()->route('admin.roles-permissions.index')
            ->with('success', 'Permission berhasil dihapus.');
    }
}
