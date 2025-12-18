# Customer Table Migration Guide

This guide explains how to migrate from storing customer data directly in the orders table to using a separate customers table.

## Overview

**Before:** Customer information (firstname, lastname, email, etc.) was stored directly in each order record.

**After:** Customer information is stored in a separate `customers` table, and orders reference customers via `customerid`.

## Benefits

- ✅ **Data Normalization**: Eliminates duplicate customer data
- ✅ **Better Analytics**: Easier to track customer behavior and lifetime value
- ✅ **Scalability**: More efficient queries and storage
- ✅ **Data Integrity**: Ensures consistent customer information across orders

## Migration Steps

### Step 1: Create Customers Table

Run the SQL script to create the customers table:

```bash
# In Supabase SQL Editor, run:
customers_schema.sql
```

This creates:
- `customers` table with proper indexes
- RLS policies for security
- Auto-update trigger for `updatedat` field

### Step 2: Migrate Existing Data

Run the migration script to extract customers from orders:

```bash
# In Supabase SQL Editor, run:
migrate_customers.sql
```

This will:
1. Extract unique customers from orders table
2. Insert them into customers table
3. Add `customerid` column to orders table
4. Link orders to customers via email matching
5. Create necessary indexes

### Step 3: Verify Migration

Check the verification queries at the end of `migrate_customers.sql`:

```sql
-- Check customers created
SELECT COUNT(*) as total_customers FROM public.customers;

-- Check orders with customerid
SELECT COUNT(*) as orders_with_customerid 
FROM public.orders 
WHERE customerid IS NOT NULL;

-- Check orders without customerid (should be 0)
SELECT COUNT(*) as orders_without_customerid 
FROM public.orders 
WHERE customerid IS NULL;
```

### Step 4: Update Application Code

The application code has been updated to:

#### Order Creation (`app/api/orders/route.ts`)
- Check if customer exists by email
- Create new customer if needed
- Use `customerid` in order records

#### Order Retrieval (`app/api/admin/orders/route.ts`)
- Join orders with customers table
- Map customer data to legacy fields for backward compatibility

#### Customer Management (`app/api/admin/customers/route.ts`)
- Fetch customers from customers table
- Calculate order statistics per customer

### Step 5: Test the System

1. **Create a new order** - Verify it creates/updates customer correctly
2. **View orders in admin** - Confirm customer data displays properly
3. **View customers page** - Check statistics are accurate
4. **Create order with existing customer** - Verify it reuses customer record

### Step 6: Finalize Migration (Optional)

After thorough testing, you can:

1. **Make customerid required:**
```sql
ALTER TABLE public.orders ALTER COLUMN customerid SET NOT NULL;
```

2. **Add foreign key constraint:**
```sql
ALTER TABLE public.orders 
ADD CONSTRAINT orders_customerid_fkey 
FOREIGN KEY (customerid) 
REFERENCES public.customers(customerid) 
ON DELETE RESTRICT;
```

3. **Drop old customer columns** (ONLY after extensive testing):
```sql
ALTER TABLE public.orders DROP COLUMN IF EXISTS customerfirstname;
ALTER TABLE public.orders DROP COLUMN IF EXISTS customerlastname;
ALTER TABLE public.orders DROP COLUMN IF EXISTS customeremail;
ALTER TABLE public.orders DROP COLUMN IF EXISTS customertelephone;
ALTER TABLE public.orders DROP COLUMN IF EXISTS customercountry;
ALTER TABLE public.orders DROP COLUMN IF EXISTS customercity;
```

## Database Schema

### Customers Table

```sql
CREATE TABLE public.customers (
    customerid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telephone TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Bulgaria',
    city TEXT NOT NULL,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Updated Orders Table

```sql
CREATE TABLE public.orders (
    orderid TEXT PRIMARY KEY,
    customerid UUID REFERENCES customers(customerid),
    deliverytype TEXT NOT NULL,
    deliverynotes TEXT,
    subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
    deliverycost NUMERIC NOT NULL CHECK (deliverycost >= 0),
    total NUMERIC NOT NULL CHECK (total >= 0),
    status TEXT NOT NULL DEFAULT 'pending',
    discountcode TEXT,
    discounttype TEXT,
    discountvalue NUMERIC,
    discountamount NUMERIC DEFAULT 0,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Backward Compatibility

The system maintains backward compatibility during migration:

- Old customer fields (`customerfirstname`, etc.) remain on orders table temporarily
- APIs return both new and legacy fields
- Frontend components work with either field structure

## Rollback Plan

If issues arise, you can rollback by:

1. Remove the `customerid` constraint
2. Continue using the old customer fields
3. Drop the customers table if no other data depends on it

## Support

For issues during migration:

1. Check Supabase logs for errors
2. Verify all SQL scripts ran successfully
3. Ensure application has proper database permissions
4. Test in a staging environment first

## Files Included

- `customers_schema.sql` - Creates customers table
- `migrate_customers.sql` - Migrates data from orders to customers
- `orders_schema_update.sql` - Updates orders table schema
- `CUSTOMERS_MIGRATION_README.md` - This file

## API Changes

### New Endpoints

- `GET /api/admin/customers` - Now fetches from customers table
- Customer statistics calculated by joining with orders

### Modified Endpoints

- `POST /api/orders` - Now creates/updates customer records
- `GET /api/admin/orders` - Joins with customers table for customer info

## Testing Checklist

- [ ] Customers table created successfully
- [ ] Existing orders migrated with customerid
- [ ] New orders create customer records
- [ ] Customer info displays in admin panel
- [ ] Order statistics show correctly
- [ ] Discount codes work with new structure
- [ ] No data loss during migration
- [ ] Performance acceptable with joins

