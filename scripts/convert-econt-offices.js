/**
 * Script to convert ECONT_offices.xls to JSON format
 * 
 * Install required package: npm install xlsx
 * 
 * Run: node scripts/convert-econt-offices.js
 * 
 * This script will automatically detect column names and extract:
 * - City (град/City)
 * - Office Name (офис/Office/име)
 * - Address (адрес/Address)
 * - Working Hours (работно време/Working Hours)
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Helper function to find column value by multiple possible keys
function findValue(row, possibleKeys) {
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return null;
}

// Helper function to normalize city names (remove extra spaces, fix encoding)
function normalizeCity(city) {
  if (!city) return null;
  return String(city)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\u0400-\u04FF\w\s-]/g, ''); // Keep Cyrillic, alphanumeric, spaces, hyphens
}

// Helper function to extract base city name (before any location descriptors)
function getBaseCityName(fullCityName) {
  if (!fullCityName) return null;
  
  // Common location descriptors in Bulgarian
  const descriptors = [
    'Автогара', 'Орела', 'Запад', 'Изток', 'Север', 'Юг', 'Център', 'Центъра',
    'Главна улица', 'Пазара', 'Стадиона', 'АБВ', 'Еконт Експрес',
    'Левски', 'Горски Техникум', 'Еленово', 'Кончето', 'Струмско',
    'Братя Миладинови', 'Въстаническа', 'Дебелянов-Славейков', 'Долно Езерово',
    'Зорница', 'Изгрев', 'Лазур', 'Меден рудник', 'Патриарх Евтимий',
    'ПЗ Север', 'Роял', 'РЦ', 'Сарафово', 'Славейков', 'Фердинандова',
    'Западна промишлена зона', 'Аспарухово', 'Бенковски', 'Възраждане',
    'ЖП Гара', 'Младост', 'Транспортна', 'Изгрев Транспортна'
  ];
  
  const normalized = normalizeCity(fullCityName);
  
  // Try to match and remove descriptors
  for (const descriptor of descriptors) {
    // Match descriptor at the end, optionally preceded by a dash or space
    const pattern = new RegExp(`[\\s-]+${descriptor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (pattern.test(normalized)) {
      const baseName = normalized.replace(pattern, '').trim();
      if (baseName.length > 2) {
        return baseName;
      }
    }
  }
  
  return normalized;
}

// Read the Excel file
const excelPath = path.join(__dirname, '../ECONT_offices.xls');

if (!fs.existsSync(excelPath)) {
  console.error('❌ Error: ECONT_offices.xls not found in project root');
  console.log('Please place the Excel file in:', path.dirname(excelPath));
  process.exit(1);
}

console.log('📖 Reading Excel file...');
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

console.log(`✅ Found ${data.length} rows`);
console.log('📋 Available columns:', Object.keys(data[0] || {}));
console.log('📄 Sample row:', data[0]);

// Possible column names for each field
const cityKeys = ['град', 'Град', 'ГРАД', 'City', 'city', 'CITY', 'Населено място'];
const officeKeys = ['офис', 'Офис', 'ОФИС', 'Office', 'office', 'OFFICE', 'Име на офис', 'име'];
const addressKeys = ['адрес', 'Адрес', 'АДРЕС', 'Address', 'address', 'ADDRESS', 'Адрес на офис'];
const workingHoursKeys = ['работно време', 'Работно време', 'РАБОТНО ВРЕМЕ', 'Working Hours', 'working hours', 'Работни часове', 'График'];

// Structure the data by city
const officesByCity = {};
let skippedRows = 0;
let processedRows = 0;
let currentCity = null;

console.log('\n🔍 Analyzing Excel structure...');
console.log('💡 This may take a moment...\n');

data.forEach((row, index) => {
  try {
    // Get the first two columns
    const col1 = row['ЕКОНТ ОФИСИ'] || row[Object.keys(row)[0]];
    const col2 = row['__EMPTY'] || row[Object.keys(row)[1]];

    // Skip header rows
    if (!col1 || col1 === 'НАСЕЛЕНО МЯСТО') {
      skippedRows++;
      return;
    }

    const col1Str = String(col1).trim();
    let col2Str = col2 ? String(col2).trim() : '';

    // Check if this is a city header row (col1 has content, col2 is empty or header-like)
    if (col1Str && (!col2Str || col2Str.includes('ID / ИД') || col2Str.length < 5)) {
      // This is definitely a city name
      const potentialCity = normalizeCity(col1Str);
      if (potentialCity && potentialCity.length > 2 && !potentialCity.match(/^\d+$/)) {
        currentCity = potentialCity;
        if (!officesByCity[currentCity]) {
          officesByCity[currentCity] = [];
          if (Object.keys(officesByCity).length <= 10) {
            console.log(`📍 Found city: ${currentCity}`);
          }
        }
        skippedRows++;
        return;
      }
    }

    // If we have office data in col2
    if (col2Str && col2Str.length > 10) {
      // Extract city from the address if it contains "Обслужвано от" or has postal code pattern
      let extractedCity = currentCity;
      let officeLocation = null; // Store the full location for the office name
      
      // Pattern 1: "Обслужвано от 7802 Попово" -> Попово
      const servicedFromMatch = col2Str.match(/Обслужвано от\s+\d+\s+([А-Яа-я\s]+?)(?:,|$)/);
      if (servicedFromMatch) {
        extractedCity = normalizeCity(servicedFromMatch[1]);
      }
      // Pattern 2: Postal code at start "7802 Попово" -> Попово
      else if (!servicedFromMatch && col2Str.match(/^\d{4,5}\s+/)) {
        const postalMatch = col2Str.match(/^\d{4,5}\s+([А-Яа-я][А-Яа-я\s-]+?)(?:\s+кв\.|,|$)/);
        if (postalMatch) {
          extractedCity = normalizeCity(postalMatch[1]);
        }
      }
      // Pattern 3: Check if col1 itself is more specific (this is where we get "Благоевград Главна улица")
      else if (col1Str && col1Str.length > 2 && !col1Str.match(/^\d+$/) && col1Str !== currentCity) {
        officeLocation = normalizeCity(col1Str); // Keep the full name for the office
        extractedCity = getBaseCityName(col1Str); // Extract base city name
      }

      if (!extractedCity || extractedCity.length < 2) {
        extractedCity = currentCity || 'Неизвестен';
      }
      
      // Get base city name (remove location descriptors)
      const baseCity = getBaseCityName(extractedCity) || extractedCity;

      // Initialize city if needed (using base city name)
      if (!officesByCity[baseCity]) {
        officesByCity[baseCity] = [];
        if (Object.keys(officesByCity).length <= 10) {
          console.log(`📍 Found city: ${baseCity}`);
        }
      }

      // Parse the office information
      let officeId = '';
      let address = '';
      let workingHours = '';

      // Look for working hours at the end
      const hoursPatterns = [
        /(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}.*?)$/i,
        /(работно време.*?)$/i,
        /(понеделник.*?)$/i,
      ];

      for (const pattern of hoursPatterns) {
        const match = col2Str.match(pattern);
        if (match) {
          workingHours = match[0].trim();
          col2Str = col2Str.substring(0, col2Str.indexOf(match[0])).trim();
          break;
        }
      }

      // Remove trailing comma
      address = col2Str.replace(/,\s*$/, '').trim();

      // Create office entry
      if (address) {
        const citySlug = baseCity
          .toLowerCase()
          .replace(/[^\u0400-\u04FF\w]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        // Use office location if available, otherwise use extracted city
        const officeName = officeLocation 
          ? `Офис ${officeLocation}` 
          : `Офис ${extractedCity}`;

        const officeEntry = {
          id: `econt-${citySlug}-${officesByCity[baseCity].length + 1}`,
          name: officeName,
          address: address,
          workingHours: workingHours || 'Моля, свържете се за работно време',
          city: baseCity
        };

        officesByCity[baseCity].push(officeEntry);
        processedRows++;

        if (processedRows <= 10) {
          console.log(`✅ ${baseCity} (${officeName}): ${address.substring(0, 40)}...`);
        } else if (processedRows % 500 === 0) {
          console.log(`✅ Processed ${processedRows} offices...`);
        }
      }
    }
  } catch (error) {
    if (skippedRows < 10) {
      console.error(`❌ Error processing row ${index + 2}:`, error.message);
    }
    skippedRows++;
  }
});

console.log(`\n✅ Processed ${processedRows} offices`);
console.log(`⚠️  Skipped ${skippedRows} rows`);

// Sort cities alphabetically using Bulgarian locale
const sortedCities = Object.keys(officesByCity).sort((a, b) => 
  a.localeCompare(b, 'bg')
);

const sortedData = {};
sortedCities.forEach(city => {
  // Sort offices within each city by name
  sortedData[city] = officesByCity[city].sort((a, b) => 
    a.name.localeCompare(b.name, 'bg')
  );
});

// Create output
const output = {
  lastUpdated: new Date().toISOString(),
  totalCities: sortedCities.length,
  totalOffices: Object.values(sortedData).reduce((sum, offices) => sum + offices.length, 0),
  cities: sortedCities,
  officesByCity: sortedData
};

// Write to JSON file
const outputPath = path.join(__dirname, '../public/data/econt-offices.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

console.log('\n🎉 Conversion complete!');
console.log('━'.repeat(50));
console.log(`📊 Total cities: ${output.totalCities}`);
console.log(`🏢 Total offices: ${output.totalOffices}`);
console.log(`📁 Output file: ${outputPath}`);
console.log('━'.repeat(50));

// Show statistics
const citiesWithMostOffices = sortedCities
  .map(city => ({ city, count: sortedData[city].length }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);

console.log('\n📈 Top 5 cities by office count:');
citiesWithMostOffices.forEach(({ city, count }) => {
  console.log(`   ${city}: ${count} offices`);
});

console.log('\n📋 Sample cities:', sortedCities.slice(0, 10).join(', '));

if (sortedCities.length > 0 && sortedData[sortedCities[0]].length > 0) {
  console.log('\n🏢 Sample office:');
  console.log(JSON.stringify(sortedData[sortedCities[0]][0], null, 2));
}

console.log('\n✨ You can now use this data in your checkout page!');
console.log('💡 Restart your dev server to see the changes.');

