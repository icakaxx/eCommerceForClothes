# 🚀 Econt Integration - Quick Start

## Step 1: Install Required Package

Open your terminal in the project directory and run:

```bash
npm install xlsx
```

## Step 2: Convert Excel to JSON

Make sure `ECONT_offices.xls` is in your project root, then run:

```bash
npm run convert-econt
```

**Expected output:**
```
📖 Reading Excel file...
✅ Found 13117 rows
✅ Processed 13000+ offices

🎉 Conversion complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total cities: 250+
🏢 Total offices: 13000+
📁 Output file: public/data/econt-offices.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 3: Update Database

Go to your Supabase SQL Editor and run this:

```sql
-- Add Econt office field to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS econtoffice TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_orders_econtoffice ON orders(econtoffice);
```

## Step 4: Restart Dev Server

```bash
npm run dev
```

## Step 5: Test It Out!

1. Open http://localhost:3000
2. Add items to cart
3. Go to checkout
4. Select "Office" as delivery type
5. Choose a city (you'll see only cities with Econt offices)
6. Select an office
7. You should see the office address and working hours appear!

---

## ✅ That's It!

The Econt office integration is now fully functional.

For more details, see:
- **`ECONT_SUMMARY.md`** - Complete overview
- **`ECONT_SETUP_GUIDE.md`** - Detailed setup instructions
- **`ECONT_INTEGRATION_README.md`** - Technical documentation

---

## 🐛 Problems?

### "Cannot find module 'xlsx'"
Run: `npm install xlsx`

### "ECONT_offices.xls not found"
Make sure the Excel file is in the project root (same folder as package.json)

### No offices showing in checkout
1. Check that `public/data/econt-offices.json` exists
2. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console for errors

### Database error when placing order
Make sure you ran the SQL migration in Step 3

---

**Need help?** Check the detailed documentation files mentioned above.

