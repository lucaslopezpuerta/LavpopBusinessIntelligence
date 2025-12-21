/**
 * Weather CSV Migration Script: Visual Crossing CSV to Supabase
 * Version: 2.0 (2025-12-20)
 *
 * Migrates historical weather data from Visual Crossing CSV exports to Supabase.
 * CSV files location: public/data/
 *   - "caxias do sul 2024.csv" (2024 data)
 *   - "caxias do sul yeartodate.csv" (2025 data)
 *
 * Usage:
 *   node scripts/migrate-weather-csv.cjs
 *
 * Environment variables (in .env):
 *   VITE_SUPABASE_URL - Supabase project URL
 *   VITE_SUPABASE_ANON_KEY - Supabase anon key
 *
 * What it does:
 *   1. Reads Visual Crossing CSV exports
 *   2. Maps CSV columns to database fields
 *   3. Computes comfort_category for each day
 *   4. Batch upserts into Supabase weather_daily_metrics table
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

// ============== CONFIGURATION ==============

const BATCH_SIZE = 100;

// CSV files to migrate (in order)
const CSV_FILES = [
  'caxias do sul 2024.csv',
  'caxias do sul yeartodate.csv'
];

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('   Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// ============== CSV UTILITIES ==============

function cleanCSV(txt) {
  return txt
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/^IMTString\(\d+\):\s*/, '')
    .trim();
}

function splitCSV(line, sep) {
  const out = [];
  let cur = '';
  let inQuote = false;

  for (const ch of line) {
    if (ch === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (ch === sep && !inQuote) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function csvToRows(text, sep) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];

  const [headerLine, ...dataLines] = lines;
  const headers = splitCSV(headerLine, sep).map(h => h.replace(/^"|"$/g, '').trim());

  return dataLines.map(line => {
    const cols = splitCSV(line, sep).map(c => c.replace(/^"|"$/g, '').trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] || '';
    });
    return row;
  });
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/)[0] || '';
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

// ============== COMFORT CATEGORY LOGIC ==============

/**
 * Classify weather into comfort categories based on thermal comfort
 * Categories (in priority order):
 *   - abafado: feels_like >= 27°C (muggy/oppressive heat)
 *   - quente: temp >= 23°C (hot)
 *   - frio: temp <= 10°C (cold)
 *   - chuvoso: precipitation > 5mm (rainy)
 *   - umido: humidity >= 80% AND precipitation > 0 (humid with rain)
 *   - ameno: everything else (mild/pleasant - baseline)
 */
function computeComfortCategory(temp, humidity, precipitation, feelsLike = null) {
  const effectiveFeelsLike = feelsLike !== null ? feelsLike : temp;

  if (effectiveFeelsLike >= 27) return 'abafado';
  if (temp >= 23) return 'quente';
  if (temp <= 10) return 'frio';
  if (precipitation > 5) return 'chuvoso';
  if (humidity >= 80 && precipitation > 0) return 'umido';

  return 'ameno';
}

// ============== SUPABASE CLIENT ==============

async function createSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ============== DATA TRANSFORMATION ==============

/**
 * Transform Visual Crossing CSV row to database record
 *
 * CSV columns from Visual Crossing:
 * name, datetime, tempmax, tempmin, temp, feelslikemax, feelslikemin, feelslike,
 * dew, humidity, precip, precipprob, precipcover, preciptype, snow, snowdepth,
 * windgust, windspeed, winddir, sealevelpressure, cloudcover, visibility,
 * solarradiation, solarenergy, uvindex, severerisk, sunrise, sunset, moonphase,
 * conditions, description, icon, stations
 */
function transformRow(row) {
  // Parse numeric values (handle empty strings)
  const parseNum = (val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  // Extract date from datetime (format: "2024-01-01" or "2024-01-01T05:28:59")
  const datetime = row.datetime || '';
  const date = datetime.split('T')[0];

  if (!date || date.length !== 10) {
    return null; // Skip invalid dates
  }

  // Parse all numeric fields
  const temp = parseNum(row.temp);
  const humidity = parseNum(row.humidity);
  const precip = parseNum(row.precip);
  const feelsLike = parseNum(row.feelslike);

  // Compute comfort category
  const comfortCategory = computeComfortCategory(
    temp || 0,
    humidity || 0,
    precip || 0,
    feelsLike
  );

  // Extract sunrise/sunset time from datetime strings
  // Format: "2024-01-01T05:28:59" -> "05:28:59"
  const extractTime = (val) => {
    if (!val) return null;
    if (val.includes('T')) {
      return val.split('T')[1] || null;
    }
    return val;
  };

  return {
    date,
    temp_avg: temp,
    temp_min: parseNum(row.tempmin),
    temp_max: parseNum(row.tempmax),
    feels_like: feelsLike,
    humidity_avg: humidity,
    precipitation: precip,
    precip_probability: parseNum(row.precipprob),
    wind_speed: parseNum(row.windspeed),
    wind_gust: parseNum(row.windgust),
    wind_direction: parseNum(row.winddir),
    pressure: parseNum(row.sealevelpressure),
    visibility: parseNum(row.visibility),
    cloud_cover: parseNum(row.cloudcover),
    uv_index: parseNum(row.uvindex),
    dew_point: parseNum(row.dew),
    conditions: row.conditions || null,
    description: row.description || null,
    icon: row.icon || null,
    comfort_category: comfortCategory,
    sunrise: extractTime(row.sunrise),
    sunset: extractTime(row.sunset),
    source: 'csv_import'
  };
}

// ============== MAIN MIGRATION ==============

async function migrateWeatherData() {
  console.log('🌤️  Weather CSV Migration Script v2.0');
  console.log('=====================================\n');
  console.log('Source: Visual Crossing CSV exports\n');

  // Initialize Supabase
  const supabase = await createSupabaseClient();
  console.log('✅ Connected to Supabase\n');

  let totalRecords = [];

  // Process each CSV file
  for (const csvFile of CSV_FILES) {
    const csvPath = path.join(__dirname, '..', 'public', 'data', csvFile);
    console.log(`📂 Processing: ${csvFile}`);

    let csvText;
    try {
      csvText = await fs.readFile(csvPath, 'utf-8');
      csvText = cleanCSV(csvText);
    } catch (err) {
      console.log(`   ⚠️  File not found or unreadable: ${err.message}`);
      continue;
    }

    // Parse CSV
    const delimiter = detectDelimiter(csvText);
    const rows = csvToRows(csvText, delimiter);
    console.log(`   Found: ${rows.length} rows`);

    // Transform rows
    const records = rows
      .map(transformRow)
      .filter(r => r !== null);

    console.log(`   Valid: ${records.length} records`);
    totalRecords = totalRecords.concat(records);
  }

  if (totalRecords.length === 0) {
    console.error('\n❌ No data found in CSV files');
    process.exit(1);
  }

  // Deduplicate by date (keep last occurrence)
  const recordsByDate = new Map();
  for (const record of totalRecords) {
    recordsByDate.set(record.date, record);
  }
  const uniqueRecords = Array.from(recordsByDate.values())
    .sort((a, b) => a.date.localeCompare(b.date));

  console.log(`\n📊 Total unique records: ${uniqueRecords.length}`);
  console.log(`   Date range: ${uniqueRecords[0]?.date} to ${uniqueRecords[uniqueRecords.length - 1]?.date}`);

  // Show comfort category distribution
  const categoryCount = {};
  uniqueRecords.forEach(r => {
    categoryCount[r.comfort_category] = (categoryCount[r.comfort_category] || 0) + 1;
  });
  console.log('\n📈 Comfort category distribution:');
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = ((count / uniqueRecords.length) * 100).toFixed(1);
      console.log(`   ${cat}: ${count} days (${pct}%)`);
    });

  // Batch upsert to Supabase
  console.log(`\n⬆️  Uploading to Supabase (batches of ${BATCH_SIZE})...`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < uniqueRecords.length; i += BATCH_SIZE) {
    const batch = uniqueRecords.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(uniqueRecords.length / BATCH_SIZE);

    process.stdout.write(`   Batch ${batchNum}/${totalBatches}... `);

    try {
      // Use direct upsert
      const { data, error } = await supabase
        .from('weather_daily_metrics')
        .upsert(batch, {
          onConflict: 'date',
          ignoreDuplicates: false
        });

      if (error) {
        console.log(`⚠️  ${error.message}`);

        // Fallback to individual inserts
        for (const record of batch) {
          const { error: insertError } = await supabase
            .from('weather_daily_metrics')
            .upsert(record, { onConflict: 'date' });

          if (insertError) {
            console.error(`\n   ⚠️  Error inserting ${record.date}: ${insertError.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        }
      } else {
        successCount += batch.length;
        console.log(`✅ ${batch.length} records`);
      }
    } catch (err) {
      console.error(`\n   ❌ Batch error: ${err.message}`);
      errorCount += batch.length;
    }
  }

  // Summary
  console.log('\n=====================================');
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successfully migrated: ${successCount} records`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount} records`);
  }
  console.log(`   📅 Date range: ${uniqueRecords[0]?.date} to ${uniqueRecords[uniqueRecords.length - 1]?.date}`);
  console.log('=====================================\n');

  // Update app_settings with last sync
  console.log('📝 Updating app_settings.weather_last_sync...');
  const { error: settingsError } = await supabase
    .from('app_settings')
    .update({ weather_last_sync: new Date().toISOString() })
    .eq('id', 'default');

  if (settingsError) {
    console.log(`   ⚠️  Could not update app_settings: ${settingsError.message}`);
  } else {
    console.log('   ✅ app_settings updated');
  }

  console.log('\n🎉 Migration complete!');
}

// Run migration
migrateWeatherData().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
