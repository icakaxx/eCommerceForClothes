# Address Delivery & Econtomat Disabled - Summary

## ✅ What Was Implemented

### 1. **Address Delivery Fields Added**

Standard Bulgarian address fields have been added to the checkout form:

#### Required Fields:
- **Street** (Улица) - e.g., "ул. Васил Левски"
- **Street Number** (Номер) - e.g., "123"

#### Optional Fields:
- **Entrance** (Вход) - e.g., "A", "Б"
- **Floor** (Етаж) - e.g., "5"
- **Apartment** (Апартамент) - e.g., "12"

### 2. **Econtomat Option Disabled**

The "Econtomat" delivery option is now:
- ✅ Greyed out (disabled)
- ✅ Cannot be selected
- ✅ Shows with reduced opacity
- ✅ Cursor changes to "not-allowed"

### 3. **Conditional Display**

The address fields only appear when:
- User selects **"Адрес" (Address)** as delivery type
- Fields are hidden for "Офис" (Office) delivery

## 📁 Files Modified

### 1. `store/checkoutStore.ts`
Added address fields to the checkout form data:
```typescript
interface CheckoutFormData {
  // ... existing fields
  street?: string;
  streetNumber?: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
}
```

### 2. `lib/translations.ts`
Added translations for address fields:
- English: Street, Number, Entrance, Floor, Apartment, Address Details
- Bulgarian: Улица, Номер, Вход, Етаж, Апартамент, Адресни данни

### 3. `app/checkout/page.tsx`
- Added address input fields with proper layout
- Disabled Econtomat delivery option
- Added validation for required address fields
- Conditional rendering based on delivery type

### 4. `app/api/orders/route.ts`
Updated to store address fields in the database:
```typescript
deliverystreet: orderData.delivery.street || null,
deliverystreetnumber: orderData.delivery.streetNumber || null,
deliveryentrance: orderData.delivery.entrance || null,
deliveryfloor: orderData.delivery.floor || null,
deliveryapartment: orderData.delivery.apartment || null,
```

### 5. `orders_add_address_fields.sql` (NEW)
SQL migration to add address columns to the orders table.

## 🎨 UI Layout

### Address Fields Layout

```
┌─────────────────────────────────────────────────────┐
│ Адресни данни (Address Details)                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌──────────────────────────┐  ┌─────────────────┐ │
│ │ Улица *                  │  │ Номер *         │ │
│ │ ул. Васил Левски         │  │ 123             │ │
│ └──────────────────────────┘  └─────────────────┘ │
│                                                     │
│ ┌────────────┐  ┌────────────┐  ┌────────────────┐│
│ │ Вход       │  │ Етаж       │  │ Апартамент     ││
│ │ A          │  │ 5          │  │ 12             ││
│ └────────────┘  └────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Delivery Options Display

```
┌─────────────────────────────────────────────────────┐
│ ○ Офис (Office)                      - €4.50       │
│   [Enabled, clickable]                              │
├─────────────────────────────────────────────────────┤
│ ○ Адрес (Address)                    - €6.90       │
│   [Enabled, clickable]                              │
├─────────────────────────────────────────────────────┤
│ ○ Еконтомат (Econtomat)              - €3.20       │
│   [DISABLED, greyed out, not clickable]             │
└─────────────────────────────────────────────────────┘
```

## 🗄️ Database Schema

Run this SQL migration in Supabase:

```sql
-- Add address fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS deliverystreet TEXT,
ADD COLUMN IF NOT EXISTS deliverystreetnumber TEXT,
ADD COLUMN IF NOT EXISTS deliveryentrance TEXT,
ADD COLUMN IF NOT EXISTS deliveryfloor TEXT,
ADD COLUMN IF NOT EXISTS deliveryapartment TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_orders_deliverystreet ON orders(deliverystreet);
CREATE INDEX IF NOT EXISTS idx_orders_deliverytype ON orders(deliverytype);
```

## ✅ Validation

### Office Delivery:
- ✅ City must be selected
- ✅ Econt office must be selected

### Address Delivery:
- ✅ City must be selected
- ✅ Street must be filled (required)
- ✅ Street number must be filled (required)
- ⚪ Entrance is optional
- ⚪ Floor is optional
- ⚪ Apartment is optional

### Econtomat Delivery:
- ❌ Disabled - cannot be selected

## 🧪 Testing Checklist

- [ ] Select "Office" delivery - address fields should NOT appear
- [ ] Select "Address" delivery - address fields should appear
- [ ] Try to select "Econtomat" - should not be clickable
- [ ] Fill in street and number - form should validate
- [ ] Try to submit without street - should show error
- [ ] Try to submit without street number - should show error
- [ ] Submit with only required fields - should work
- [ ] Submit with all fields filled - should work
- [ ] Check database - address fields should be stored
- [ ] Check admin panel - address should be visible in orders

## 📊 Example Data

### Complete Address Example:
```json
{
  "street": "ул. Васил Левски",
  "streetNumber": "123",
  "entrance": "А",
  "floor": "5",
  "apartment": "12"
}
```

### Minimal Address Example:
```json
{
  "street": "бул. Витоша",
  "streetNumber": "45",
  "entrance": null,
  "floor": null,
  "apartment": null
}
```

## 🔄 Next Steps

1. **Run the database migration**:
   - Open Supabase SQL Editor
   - Run `orders_add_address_fields.sql`

2. **Test the checkout flow**:
   - Select "Address" delivery
   - Fill in address fields
   - Complete an order

3. **Verify in admin panel**:
   - Check that address fields are stored
   - Update admin panel to display address (if needed)

## 🎯 User Experience

### For Office Delivery:
1. Select "Офис"
2. Choose city (Econt cities only)
3. Select office
4. See office address and hours

### For Address Delivery:
1. Select "Адрес"
2. Choose city (all Bulgarian cities)
3. Fill in street and number (required)
4. Optionally fill entrance, floor, apartment
5. Complete order

### For Econtomat:
- Option is visible but disabled
- User cannot select it
- Shows greyed out appearance

---

**Status:** ✅ Complete and Ready to Use  
**Date:** December 18, 2024  
**Database Migration Required:** Yes (`orders_add_address_fields.sql`)

