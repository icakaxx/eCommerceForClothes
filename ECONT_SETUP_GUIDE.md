# Quick Setup Guide - Econt Office Integration

## Prerequisites

Make sure you have the `ECONT_offices.xls` file in your project root directory.

## Step-by-Step Setup

### 1. Install Required Package

```bash
npm install xlsx
```

### 2. Run the Conversion Script

```bash
node scripts/convert-econt-offices.js
```

**Expected Output:**
```
📖 Reading Excel file...
✅ Found 13117 rows
📋 Available columns: [...]
✅ Processed 13000+ offices
⚠️  Skipped X rows

🎉 Conversion complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total cities: 250+
🏢 Total offices: 13000+
📁 Output file: public/data/econt-offices.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Top 5 cities by office count:
   София: 150 offices
   Пловдив: 80 offices
   ...
```

### 3. Verify the Output

Check that `public/data/econt-offices.json` was created:

```bash
# Windows
dir public\data\econt-offices.json

# Mac/Linux
ls -lh public/data/econt-offices.json
```

### 4. Test the Integration

1. Start your development server:
```bash
npm run dev
```

2. Open your browser and navigate to the checkout page

3. Test the flow:
   - Add items to cart
   - Go to checkout
   - Select "Office" as delivery type
   - Choose a city (should show Econt cities with offices)
   - Select an office from the dropdown
   - Verify that address and working hours appear below

## Troubleshooting

### Issue: "ECONT_offices.xls not found"

**Solution:** Make sure the Excel file is in the project root:
```
eCommerceForClothes/
├── ECONT_offices.xls  ← Should be here
├── package.json
├── scripts/
│   └── convert-econt-offices.js
└── ...
```

### Issue: "Cannot find module 'xlsx'"

**Solution:** Install the package:
```bash
npm install xlsx
```

### Issue: No offices showing in dropdown

**Possible causes:**
1. Conversion script didn't run successfully
2. JSON file is empty or malformed
3. Browser cache issue

**Solutions:**
1. Re-run the conversion script
2. Check `public/data/econt-offices.json` exists and has data
3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser console for errors

### Issue: Wrong data in offices

**Solution:** The script tries to auto-detect column names. If it's reading wrong columns:

1. Open `ECONT_offices.xls` in Excel
2. Note the exact column headers
3. Edit `scripts/convert-econt-offices.js` and add your column names:

```javascript
const cityKeys = ['град', 'Град', 'YOUR_CITY_COLUMN_NAME'];
const officeKeys = ['офис', 'Офис', 'YOUR_OFFICE_COLUMN_NAME'];
const addressKeys = ['адрес', 'Адрес', 'YOUR_ADDRESS_COLUMN_NAME'];
const workingHoursKeys = ['работно време', 'Работно време', 'YOUR_HOURS_COLUMN_NAME'];
```

4. Re-run the conversion script

## What Was Changed

### New Files
- ✅ `types/econt.ts` - TypeScript interfaces
- ✅ `scripts/convert-econt-offices.js` - Conversion script
- ✅ `public/data/econt-offices.json` - Office data (generated)
- ✅ `ECONT_INTEGRATION_README.md` - Detailed documentation
- ✅ `ECONT_SETUP_GUIDE.md` - This file

### Modified Files
- ✅ `store/checkoutStore.ts` - Added `econtOfficeId` field
- ✅ `lib/translations.ts` - Added Econt-related translations
- ✅ `app/checkout/page.tsx` - Added office selection UI

### Features Added
- ✅ Dynamic city list based on Econt office availability
- ✅ Office selection dropdown
- ✅ Display office address and working hours
- ✅ Automatic reset when city/delivery type changes
- ✅ Validation for required office selection
- ✅ Full Bulgarian translation support

## Next Steps

After successful setup:

1. **Test thoroughly** - Try different cities and offices
2. **Update regularly** - When Econt updates their office list, just:
   - Replace `ECONT_offices.xls`
   - Run `node scripts/convert-econt-offices.js`
   - Restart your dev server

3. **Consider API integration** - For production, you might want to:
   - Fetch office data from Econt's API (if available)
   - Cache the data server-side
   - Update periodically via cron job

## Support

If you encounter any issues:

1. Check the console output from the conversion script
2. Verify the Excel file structure
3. Check browser console for errors
4. Review `ECONT_INTEGRATION_README.md` for detailed documentation

---

**Last Updated:** December 2024

