# Sidebar Configuration Guide

This guide explains how to easily add new sidebar groups and configure the collapsible behavior.

## Quick Start

To add a new sidebar group, simply edit `/resources/js/lib/sidebar-config.ts`:

### Adding a New Group

1. Open `sidebar-config.ts`
2. Add your new group to the `SIDEBAR_GROUPS` array:

```typescript
{
    title: 'Your New Group',
    collapsible: true,        // Can be collapsed/expanded
    defaultOpen: false,       // Start collapsed
    permission: 'admin',      // Optional: group-level permission
    items: [
        {
            title: 'New Feature',
            href: '/admin/new-feature',
            icon: YourIcon,
            permission: 'view-new-feature',
        },
        // Add more items...
    ],
}
```

### Group Configuration Options

- **title**: Display name of the group
- **collapsible**: Whether users can collapse/expand the group (default: true)
- **defaultOpen**: Whether the group starts expanded (default: true)
    - ⚠️ **Smart Auto-Open**: If `defaultOpen: false` but the current page is within this group, the group will automatically open
- **permission**: Optional group-level permission check
- **items**: Array of navigation items in the group

### Item Configuration Options

- **title**: Display name of the menu item
- **href**: URL path
- **icon**: Lucide React icon component
- **permission**: Optional permission required to see this item

## Examples

### Analytics Group (Collapsed by Default)

```typescript
{
    title: 'Analytics',
    collapsible: true,
    defaultOpen: false,
    items: [
        {
            title: 'Reports',
            href: '/admin/analytics/reports',
            icon: BarChart,
            permission: 'view-analytics',
        },
        {
            title: 'Performance',
            href: '/admin/analytics/performance',
            icon: Clock,
            permission: 'view-performance',
        },
    ],
}
```

### Non-Collapsible Group

```typescript
{
    title: 'Quick Actions',
    collapsible: false,  // Cannot be collapsed
    items: [
        {
            title: 'Emergency Stop',
            href: '/admin/emergency',
            icon: AlertTriangle,
            permission: 'emergency-actions',
        },
    ],
}
```

### Group with Permission Check

```typescript
{
    title: 'System Administration',
    collapsible: true,
    defaultOpen: false,
    permission: 'system-admin',  // Only admins see this group
    items: [
        {
            title: 'System Settings',
            href: '/admin/system/settings',
            icon: Settings,
            permission: 'manage-settings',
        },
    ],
}
```

## Features

✅ **Collapsible Groups**: Users can expand/collapse each group
✅ **Permission-Based**: Groups and items respect user permissions
✅ **Persistent State**: Group open/closed state is remembered during session
✅ **Smart Auto-Open**: Groups automatically open when containing the active page
✅ **Flexible Configuration**: Easy to add, remove, or modify groups
✅ **Type Safety**: Full TypeScript support with proper interfaces
✅ **Icon Support**: Uses Lucide React icons
✅ **Active States**: Automatic highlighting of current page

## File Structure

```
resources/js/
├── components/
│   ├── app-sidebar.tsx          # Main sidebar component
│   └── nav-main.tsx            # Navigation rendering logic
├── lib/
│   └── sidebar-config.ts       # ✨ Edit this file to add groups
└── types/
    └── index.d.ts             # TypeScript definitions
```

### Smart Auto-Open Behavior

The sidebar has intelligent behavior for collapsible groups:

1. **Default State**: Groups respect the `defaultOpen` setting when first loaded
2. **Active Page Detection**: If a user navigates to a page within a collapsed group, that group automatically opens
3. **User Control**: Users can still manually collapse/expand groups as needed
4. **Navigation Persistence**: When switching between pages in the same group, the group stays open

**Example Scenario:**

```typescript
{
    title: 'Subscription Map',
    defaultOpen: false,  // Starts collapsed
    items: [
        { title: 'Cancel Subscription', href: '/admin/cancel-subscription' },
        { title: 'Suspend Subscription', href: '/admin/suspend-subscription' },
    ],
}
```

- Initially: Group is collapsed (`defaultOpen: false`)
- User visits `/admin/cancel-subscription`: Group automatically opens
- User navigates to `/admin/suspend-subscription`: Group stays open
- User navigates to Dashboard: Group stays in its current state (open/closed)

## Tips

1. **Adding Icons**: Import new icons from `lucide-react` at the top of `sidebar-config.ts`
2. **Permissions**: Make sure permission strings match your backend permission system
3. **Order**: Groups appear in the order they're defined in the `SIDEBAR_GROUPS` array
4. **Testing**: Items without required permissions are automatically hidden

## Need More Customization?

If you need more advanced features, you can:

- Modify `nav-main.tsx` for custom rendering logic
- Extend the interfaces in `types/index.d.ts`
- Add custom styling in the component files
