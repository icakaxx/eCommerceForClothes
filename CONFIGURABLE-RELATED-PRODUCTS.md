# Configurable Related Products Feature

## ✅ Implementation Complete

The "You might like" section is now **fully configurable** through the admin panel instead of being automatic.

## 🗄️ Database Setup

### Step 1: Run the Migration
Execute the migration file in your Supabase SQL Editor:

```sql
-- File: migration-add-related-products.sql
```

This creates the `related_products` table with:
- Many-to-many relationship between products
- Display order support
- Foreign key constraints with cascade delete
- Prevents self-referencing
- Indexed for performance

## 📋 How to Configure Related Products

### In the Admin Panel:

1. **Go to Admin → Products**
2. **Click "Edit" on any existing product**
3. **Scroll down** to the "Related Products (You might like)" section
4. **Select products** by checking the boxes next to the products you want to display
5. **Click "Save"**

### Features:
- ✅ See product thumbnails, names, and prices
- ✅ Multi-select with checkboxes
- ✅ Scrollable list for many products
- ✅ Shows selected count
- ✅ Real-time updates
- ✅ Only available for existing products (not during creation)

## 🎯 How It Works

### Admin Side:
1. Admin selects which products to show as related
2. Selection is saved to `related_products` table
3. Display order is automatically managed

### Customer Side:
1. Product detail page fetches configured related products
2. Shows only manually selected products
3. Displays in a beautiful grid at the bottom
4. No products shown if none configured

## 📁 Files Created/Modified

### New Files:
1. **`migration-add-related-products.sql`** - Database schema
2. **`app/api/products/[id]/related/route.ts`** - API endpoints

### Modified Files:
1. **`components/EditProductModal.tsx`**
   - Added related products state management
   - Added UI section for product selection
   - Integrated save functionality

2. **`components/ProductView.tsx`**
   - Changed from automatic to configured fetching
   - Now calls `/api/products/[id]/related` endpoint

3. **`app/api/products/route.ts`**
   - Added `limit` and `excludeId` parameters (still useful for other purposes)
   - Added `subtitle` field support

## 🔌 API Endpoints

### GET `/api/products/[id]/related`
**Purpose**: Fetch configured related products for a product

**Response**:
```json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "productid": "uuid",
      "brand": "Nike",
      "model": "Air Max",
      "price": 129.99,
      "images": ["https://..."],
      ...
    }
  ]
}
```

### PUT `/api/products/[id]/related`
**Purpose**: Update related products configuration

**Request Body**:
```json
{
  "relatedProductIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Related products updated successfully"
}
```

## 🎨 UI Design

The admin interface includes:
- **Product Grid**: Scrollable list with checkboxes
- **Product Cards**: Show image, name, and price
- **Selection Counter**: Shows how many products selected
- **Visual Feedback**: Selected products highlighted
- **Empty State**: Message when no products available
- **Loading State**: Spinner while fetching data

## 🔒 Business Rules

1. **Maximum**: No hard limit (but recommend 4-6 for UX)
2. **Minimum**: 0 (section won't show if none configured)
3. **Self-reference**: Prevented by database constraint
4. **Deleted Products**: Automatically removed (cascade delete)
5. **New Products**: Can only configure after initial creation

## 💡 Usage Example

### Scenario: Cross-selling shoes with accessories

1. Edit a Nike shoe product
2. In related products section, select:
   - Nike socks
   - Shoe cleaner
   - Insoles
   - Another Nike shoe model
3. Save the product
4. Customers viewing the Nike shoe will now see these 4 products in "You might like"

## 🚀 Benefits Over Automatic System

1. **Full Control**: Choose exactly which products to promote
2. **Strategic**: Cross-sell accessories with main products
3. **Merchandising**: Highlight new arrivals or clearance items
4. **Flexible**: Different recommendations per product
5. **No Code**: No hardcoded logic or category restrictions

## 🧪 Testing

1. **Add the migration** (run `migration-add-related-products.sql`)
2. **Create/Edit a product** in admin
3. **Select related products** from the list
4. **Save** the product
5. **View the product page** on the store
6. **Scroll down** to see "You might like" section
7. **Verify** the selected products appear

## 📊 Database Schema

```sql
Table: related_products
├── relatedproductid (PK, UUID)
├── productid (FK → products.productid)
├── relatedproductid_ref (FK → products.productid)
├── displayorder (INTEGER, default 0)
└── createdat (TIMESTAMP)

Constraints:
- UNIQUE(productid, relatedproductid_ref)
- CHECK(productid != relatedproductid_ref)
- ON DELETE CASCADE
```

## 🔄 Future Enhancements

Possible additions:
- Drag-and-drop reordering
- Bulk operations (copy related products between similar items)
- Analytics (track which related products get clicked)
- AI suggestions based on purchase history
- Maximum limit enforcement in UI
- Related product groups/templates

---

**All features are now ready to use!** 🎉

No more hardcoded strings or automatic category matching. You have full control over your product recommendations!



