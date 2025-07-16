## 📋 **Sales Management Logic Documentation**

### **🎯 Sales Target System Explanation**

#### **Field Meanings:**

1. **`is_active`**:
    - `true` = Target sedang berlaku/aktif untuk sales user
    - `false` = Target sudah tidak berlaku (replaced oleh target baru)
    - **Hanya ada 1 target aktif per sales user**

2. **`effective_from`**:
    - Tanggal mulai target berlaku
    - Biasanya diset hari ini ketika target dibuat/diubah

3. **`effective_to`**:
    - Tanggal target berakhir (nullable)
    - `null` = target masih berlaku (open-ended)
    - Diisi ketika target diganti dengan yang baru

#### **How It Works:**

**Creating New Target (via Edit):**

```php
// 1. Deactivate current target
$currentTarget->update([
    'is_active' => false,
    'effective_to' => now()  // Close the period
]);

// 2. Create new active target
SalesTarget::create([
    'is_active' => true,
    'effective_from' => now(),
    'effective_to' => null   // Open-ended
]);
```

**Target History Example:**

```
Sales User: John Doe
Target 1: Daily 50, Monthly 1500, Active: false, From: 2025-07-01, To: 2025-07-14
Target 2: Daily 100, Monthly 2000, Active: true, From: 2025-07-14, To: null
```

### **🔄 Workflow Changes Made:**

#### **1. Removed Sales Create/Store** ✅

- Sales users dibuat via User Management
- Assign role "sales"
- Target dibuat/diubah via Sales Management Edit

#### **2. Fixed Edit Logic** ✅

- Load current active target untuk form
- Create new target hanya jika values berubah
- Proper target history tracking

#### **3. Fixed Show Page** ✅

- Load all required stats
- Format data untuk frontend compatibility
- Handle missing relationships gracefully

#### **4. Simplified Routes** ✅

- Hapus create/store routes
- Focus pada index, show, edit, update, destroy

### **📊 Data Flow:**

1. **Index**: List semua sales users dengan current targets dan stats
2. **Show**: Detail sales user dengan performance metrics
3. **Edit**: Update user info + target (creates new target record if changed)
4. **Delete**: Soft constraint - tidak bisa hapus jika ada prospects

### **🎨 Frontend Updates:**

- **Index**: Hapus "Tambah Sales User" button, tambah info
- **Empty State**: Guide user ke User Management
- **Edit Form**: Pre-populate dengan current target values
- **Show Page**: Compatible data structure untuk stats

### **✅ Benefits:**

1. **Clean Separation**: User management vs Target management
2. **History Tracking**: Keep record of all target changes
3. **Data Integrity**: One active target per user
4. **Flexibility**: Easy to extend with date-based target queries
