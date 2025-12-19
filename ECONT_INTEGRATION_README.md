# Econt Office Integration

This document explains how to integrate Econt office data into the checkout process.

## Overview

The checkout page now supports selecting Econt offices based on the selected city. When a user chooses "Office" as the delivery type, they can select from available Econt offices in their city and see the office address and working hours.

## Files Modified

1. **`types/econt.ts`** - TypeScript interfaces for Econt office data
2. **`store/checkoutStore.ts`** - Added `econtOfficeId` field to checkout form data
3. **`lib/translations.ts`** - Added translations for Econt office selection
4. **`app/checkout/page.tsx`** - Integrated Econt office selection UI
5. **`public/data/econt-offices.json`** - JSON file containing office data
6. **`scripts/convert-econt-offices.js`** - Script to convert Excel to JSON

## Setup Instructions

### Step 1: Convert Excel to JSON

The `ECONT_offices.xls` file needs to be converted to JSON format for use in the application.

1. Install the required package:
```bash
npm install xlsx
```

2. Run the conversion script:
```bash
node scripts/convert-econt-offices.js
```

This will:
- Read the Excel file
- Extract office data (city, name, address, working hours)
- Structure it by city
- Save to `public/data/econt-offices.json`

### Step 2: Verify the Data

Check the generated `public/data/econt-offices.json` file:

```json
{
  "lastUpdated": "2024-01-01T00:00:00.000Z",
  "totalCities": 50,
  "totalOffices": 200,
  "cities": ["София", "Пловдив", "Варна", ...],
  "officesByCity": {
    "София": [
      {
        "id": "econt-sofia-1",
        "name": "Офис София - Централен",
        "address": "бул. Цариградско шосе 115",
        "workingHours": "Понеделник - Петък: 9:00 - 18:00",
        "city": "София"
      }
    ]
  }
}
```

### Step 3: Adjust the Conversion Script (if needed)

The conversion script tries to detect column names automatically. If your Excel file has different column names, update the script:

```javascript
// In scripts/convert-econt-offices.js
const city = row['град'] || row['City'] || row['YOUR_COLUMN_NAME'];
const officeName = row['офис'] || row['Office'] || row['YOUR_COLUMN_NAME'];
const address = row['адрес'] || row['Address'] || row['YOUR_COLUMN_NAME'];
const workingHours = row['работно време'] || row['Working Hours'] || row['YOUR_COLUMN_NAME'];
```

Common column names in Bulgarian:
- **City**: `град`, `Град`, `ГРАД`
- **Office**: `офис`, `Офис`, `ОФИС`, `име на офис`
- **Address**: `адрес`, `Адрес`, `АДРЕС`
- **Working Hours**: `работно време`, `Работно време`, `РАБОТНО ВРЕМЕ`

### Step 4: Test the Integration

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the checkout page
3. Select "Office" as delivery type
4. Choose a city from the dropdown (should show Econt cities)
5. Select an office
6. Verify that the address and working hours are displayed

## Features

### Dynamic City List

When "Office" delivery is selected:
- The city dropdown shows only cities that have Econt offices
- Cities are sorted alphabetically in Bulgarian

When other delivery types are selected:
- The city dropdown shows all Bulgarian cities (from the original list)

### Office Selection

- Only appears when "Office" delivery type is selected
- Shows offices available in the selected city
- Displays office name in the dropdown

### Office Details Display

When an office is selected, a blue info box appears showing:
- **Office Address**: Full street address
- **Working Hours**: Operating hours (e.g., "Понеделник - Петък: 9:00 - 18:00")

### Validation

- Office selection is required when "Office" delivery type is chosen
- If a city has no Econt offices, a warning message is displayed
- Office selection resets when:
  - Delivery type changes
  - City changes

## Data Structure

### EcontOffice Interface

```typescript
interface EcontOffice {
  id: string;              // Unique identifier
  name: string;            // Office name
  address: string;         // Full address
  workingHours: string;    // Operating hours
  city: string;            // City name
}
```

### EcontOfficesData Interface

```typescript
interface EcontOfficesData {
  lastUpdated: string;                          // ISO timestamp
  totalCities: number;                          // Total number of cities
  totalOffices: number;                         // Total number of offices
  cities: string[];                             // Array of city names
  officesByCity: Record<string, EcontOffice[]>; // Offices grouped by city
}
```

## Translations

All UI text is translated in both English and Bulgarian:

| Key | English | Bulgarian |
|-----|---------|-----------|
| `selectEcontOffice` | Select Econt Office | Изберете офис на Еконт |
| `econtOffice` | Econt Office | Офис на Еконт |
| `officeAddress` | Address | Адрес |
| `workingHours` | Working Hours | Работно време |
| `noOfficesInCity` | No Econt offices found in selected city | Няма намерени офиси на Еконт в избрания град |

## Updating Office Data

To update the office data:

1. Get the latest `ECONT_offices.xls` file from Econt
2. Replace the existing file in the project root
3. Run the conversion script again:
```bash
node scripts/convert-econt-offices.js
```
4. Commit the updated `public/data/econt-offices.json` file

## Troubleshooting

### Issue: No offices showing up

**Solution**: 
- Check that `public/data/econt-offices.json` exists
- Verify the JSON structure is correct
- Check browser console for fetch errors

### Issue: Excel conversion fails

**Solution**:
- Ensure `xlsx` package is installed: `npm install xlsx`
- Check that `ECONT_offices.xls` is in the project root
- Verify the Excel file is not corrupted
- Check the column names match those in the script

### Issue: Wrong columns being read

**Solution**:
- Open the Excel file and note the exact column names
- Update the conversion script with the correct column names
- Re-run the conversion

### Issue: Working hours not displaying

**Solution**:
- Check that the Excel file has a working hours column
- Verify the column name in the conversion script
- If the column doesn't exist, offices will show default text: "Моля, свържете се за работно време"

## API Integration (Future)

Currently, the office data is loaded from a static JSON file. For real-time updates, you could:

1. Create an API endpoint to fetch Econt offices
2. Cache the data with a TTL (e.g., 24 hours)
3. Update the `loadEcontOffices` function to call the API

Example:
```typescript
const loadEcontOffices = async () => {
  try {
    const response = await fetch('/api/econt/offices');
    const data: EcontOfficesData = await response.json();
    setEcontOffices(data);
  } catch (error) {
    console.error('Failed to load Econt offices:', error);
  }
};
```

## Notes

- The sample `public/data/econt-offices.json` contains only 5 cities and 15 offices for demonstration
- After running the conversion script, it will contain all offices from your Excel file
- Office IDs are automatically generated in the format: `econt-{city}-{number}`
- Cities are sorted alphabetically using Bulgarian locale (`bg`)

