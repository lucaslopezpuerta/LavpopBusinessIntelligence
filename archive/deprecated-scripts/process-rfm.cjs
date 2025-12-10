/**
 * Process RFM Segmentation
 *
 * This script consolidates the Make.com computeRFM.js and mergeRFMMaster.js
 * into a single Node.js script that runs in GitHub Actions.
 *
 * Inputs (from data/ folder):
 *   - sales.csv: Transaction data from POS
 *   - customer.csv: Customer master data from POS
 *   - rfm.csv: Existing RFM master (for lastContactDate preservation)
 *
 * Output:
 *   - rfm.csv: Updated RFM segmentation with preserved contact dates
 *
 * RFM Scoring (Laundromat-optimized):
 *   Recency: Days since last purchase (5=≤21d, 4=≤45d, 3=≤90d, 2=≤180d, 1=>180d)
 *   Frequency: Number of transactions (5=≥10, 4=≥6, 3=≥3, 2=2, 1=1)
 *   Monetary: Recent 90-day spending (5=≥250, 4=≥150, 3=≥75, 2=≥36, 1=<36)
 *
 * Segments:
 *   - New: Registered ≤30 days AND ≤2 transactions
 *   - Champion: R=5, F≥4, M≥4
 *   - Loyal: R≥4, F≥3, M≥3
 *   - Potential: R≥3, F≥2, M≥2
 *   - AtRisk: R=2 AND (F=2 OR M=2)
 *   - Lost: All others
 */

const fs = require('fs').promises;
const path = require('path');

// ============== CONSTANTS ==============

// Sales CSV columns
const SALE_ID = 'Doc_Cliente';
const SALE_AMOUNT = 'Valor_Pago';
const SALE_DATE = 'Data_Hora';

// Customer CSV columns
const CUST_ID = 'Documento';
const CUST_NAME = 'Nome';
const CUST_PHONE = 'Telefone';
const CUST_LAST_PURCHASE = 'Data_Ultima_Compra';
const CUST_REGISTRATION = 'Data_Cadastro';

// RFM Output columns
const H_SEG = 'segment';
const H_ID = 'Doc_Cliente';
const H_NAME = 'client name';
const H_PHONE = 'phone number';
const H_CONTACT = 'lastContactDate';

// ============== CSV UTILITIES ==============

/**
 * Clean CSV text (remove BOM and Make.com artifacts if any)
 */
function cleanCSV(txt) {
  return txt
    .replace(/^\uFEFF/, '')           // Remove BOM
    .replace(/^IMTString\(\d+\):\s*/, '') // Remove Make.com artifact (legacy)
    .trim();
}

/**
 * Split CSV line respecting quoted fields
 */
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

/**
 * Parse CSV text to array of objects
 */
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

/**
 * Detect delimiter (comma or semicolon)
 */
function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/)[0] || '';
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

// ============== DATA UTILITIES ==============

// Known invalid CPF patterns (all same digit) - matches cpfUtils.js
const INVALID_CPF_PATTERNS = [
  '00000000000', '11111111111', '22222222222', '33333333333', '44444444444',
  '55555555555', '66666666666', '77777777777', '88888888888', '99999999999',
];

/**
 * Normalize CPF/Document to 11 digits
 * Logic matches cpfUtils.js for consistency across frontend/backend
 */
function normalizeCPF(doc) {
  const digits = (doc || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length < 11) return digits.padStart(11, '0');
  if (digits.length > 11) return digits.slice(-11);
  return digits;
}

/**
 * Validate CPF format (basic validation, no mod-11)
 */
function isValidCPF(doc) {
  const normalized = normalizeCPF(doc);
  if (normalized.length !== 11) return false;
  if (INVALID_CPF_PATTERNS.includes(normalized)) return false;
  return true;
}

/**
 * Brazilian mobile phone validation and normalization
 *
 * Valid format: +55 AA 9 NNNNNNNN (13 digits without +)
 *   - Country code: always 55
 *   - Area code (DDD): 2 digits, both 1-9 (no leading 0)
 *   - Mobile prefix: always 9
 *   - Number: 8 digits
 *
 * Examples:
 *   "54996923504"     → "+5554996923504" ✓
 *   "5554996923504"   → "+5554996923504" ✓
 *   "+5554996923504"  → "+5554996923504" ✓
 *   "5408123456"      → null (landline, no 9 prefix)
 *   "5509912345678"   → null (invalid area code starting with 0)
 */
const BR_MOBILE_PATTERN = /^55[1-9]{2}9\d{8}$/;

function normalizePhone(phone) {
  if (!phone) return null;

  // Remove all non-digits
  let digits = (phone || '').replace(/\D/g, '');

  // If 11 digits (AA9NNNNNNNN), prepend country code 55
  if (digits.length === 11) {
    digits = '55' + digits;
  }

  // Validate against Brazilian mobile pattern
  if (!BR_MOBILE_PATTERN.test(digits)) {
    return null;
  }

  return '+' + digits;
}

/**
 * Parse Brazilian date (DD/MM/YYYY or DD/MM/YYYY HH:MM:SS)
 */
function parseBrDate(dateStr) {
  if (!dateStr) return null;

  const parts = dateStr.split(/[\/\s]/);
  if (parts.length < 3) return null;

  const [day, month, year] = parts;
  const time = parts[3] || '00:00:00';

  const date = new Date(`${year}-${month}-${day}T${time}`);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse Brazilian number format (comma as decimal)
 */
function parseBrNumber(value) {
  if (value === null || value === undefined || value === '') return 0;

  const str = String(value).trim();

  // Format: 1.234,56 → 1234.56
  if (str.includes('.') && str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }

  // Format: 17,90 → 17.90
  if (str.includes(',')) {
    return parseFloat(str.replace(',', '.')) || 0;
  }

  return parseFloat(str) || 0;
}

// ============== RFM CALCULATION ==============

/**
 * Calculate RFM scores and segment
 */
function calculateRFM(recencyDays, frequency, recentMonetary, registrationDays) {
  // Recency Score (R)
  const rScore =
    recencyDays <= 21 ? 5 :
    recencyDays <= 45 ? 4 :
    recencyDays <= 90 ? 3 :
    recencyDays <= 180 ? 2 : 1;

  // Frequency Score (F)
  const fScore =
    frequency >= 10 ? 5 :
    frequency >= 6 ? 4 :
    frequency >= 3 ? 3 :
    frequency === 2 ? 2 : 1;

  // Monetary Score (M) - based on last 90 days
  const mScore =
    recentMonetary >= 250 ? 5 :
    recentMonetary >= 150 ? 4 :
    recentMonetary >= 75 ? 3 :
    recentMonetary >= 36 ? 2 : 1;

  // Segment Assignment
  let segment;

  // New customers: registered ≤30 days AND ≤2 transactions
  if (registrationDays !== null && registrationDays <= 30 && frequency <= 2) {
    segment = 'New';
  }
  // Champion: High recency, high frequency, high monetary
  else if (rScore === 5 && fScore >= 4 && mScore >= 4) {
    segment = 'Champion';
  }
  // Loyal: Good across all metrics
  else if (rScore >= 4 && fScore >= 3 && mScore >= 3) {
    segment = 'Loyal';
  }
  // Potential: Moderate activity
  else if (rScore >= 3 && fScore >= 2 && mScore >= 2) {
    segment = 'Potential';
  }
  // AtRisk: Declining engagement
  else if (rScore === 2 && (fScore === 2 || mScore === 2)) {
    segment = 'AtRisk';
  }
  // Lost: Low engagement
  else {
    segment = 'Lost';
  }

  return { rScore, fScore, mScore, segment };
}

// ============== MAIN PROCESSING ==============

async function main() {
  const dataDir = path.join(process.cwd(), 'data');
  const today = new Date();

  console.log('🔄 Starting RFM Processing...');
  console.log(`📅 Processing date: ${today.toISOString().split('T')[0]}`);
  console.log('━'.repeat(50));

  // ===== 1. Load CSV Files =====

  let salesText, customerText, rfmText;

  try {
    salesText = await fs.readFile(path.join(dataDir, 'sales.csv'), 'utf8');
    console.log('✅ Loaded sales.csv');
  } catch (err) {
    console.error('❌ Failed to load sales.csv:', err.message);
    process.exit(1);
  }

  try {
    customerText = await fs.readFile(path.join(dataDir, 'customer.csv'), 'utf8');
    console.log('✅ Loaded customer.csv');
  } catch (err) {
    console.error('❌ Failed to load customer.csv:', err.message);
    process.exit(1);
  }

  try {
    rfmText = await fs.readFile(path.join(dataDir, 'rfm.csv'), 'utf8');
    console.log('✅ Loaded existing rfm.csv');
  } catch (err) {
    console.log('⚠️  No existing rfm.csv found (will create new)');
    rfmText = '';
  }

  // ===== 2. Parse CSVs =====

  const salesDelim = detectDelimiter(cleanCSV(salesText));
  const customerDelim = detectDelimiter(cleanCSV(customerText));
  const rfmDelim = rfmText ? detectDelimiter(cleanCSV(rfmText)) : ',';

  const salesRows = csvToRows(cleanCSV(salesText), salesDelim);
  const customerRows = csvToRows(cleanCSV(customerText), customerDelim);
  const existingRfmRows = rfmText ? csvToRows(cleanCSV(rfmText), rfmDelim) : [];

  console.log(`📊 Sales rows: ${salesRows.length}`);
  console.log(`📊 Customer rows: ${customerRows.length}`);
  console.log(`📊 Existing RFM rows: ${existingRfmRows.length}`);
  console.log('━'.repeat(50));

  // ===== 3. Build Lookup Maps =====

  // Customer map: CPF → customer data
  const customerMap = {};
  customerRows.forEach(row => {
    const cpf = normalizeCPF(row[CUST_ID]);
    if (cpf) {
      customerMap[cpf] = row;
    }
  });

  // Existing RFM map: CPF → lastContactDate
  const existingRfmMap = {};
  existingRfmRows.forEach(row => {
    const cpf = normalizeCPF(row[H_ID]);
    if (cpf) {
      existingRfmMap[cpf] = {
        lastContactDate: row[H_CONTACT] || '',
        name: row[H_NAME] || '',
        phone: row[H_PHONE] || ''
      };
    }
  });

  // ===== 4. Aggregate Sales Data =====

  const salesBuckets = {};
  let invalidCpfCount = 0;

  salesRows.forEach(row => {
    const cpf = normalizeCPF(row[SALE_ID]);
    if (!cpf) return;

    // Skip invalid CPF patterns (all same digit)
    if (!isValidCPF(cpf)) {
      invalidCpfCount++;
      return;
    }

    const saleDate = parseBrDate(row[SALE_DATE] || row['Data'] || '');
    const amount = parseBrNumber(row[SALE_AMOUNT]);

    if (!salesBuckets[cpf]) {
      salesBuckets[cpf] = {
        frequency: 0,
        totalMonetary: 0,
        recentMonetary: 0 // Last 90 days
      };
    }

    const bucket = salesBuckets[cpf];
    bucket.frequency += 1;
    bucket.totalMonetary += amount;

    // Check if sale is within last 90 days
    if (saleDate) {
      const daysAgo = (today - saleDate) / (1000 * 60 * 60 * 24);
      if (daysAgo <= 90) {
        bucket.recentMonetary += amount;
      }
    }
  });

  console.log(`📈 Unique customers with sales: ${Object.keys(salesBuckets).length}`);
  if (invalidCpfCount > 0) {
    console.log(`⚠️  Skipped ${invalidCpfCount} sales with invalid CPF patterns`);
  }

  // ===== 5. Calculate RFM for Each Customer =====

  const rfmResults = {};
  const skipped = {
    noLastPurchase: 0,
    invalidPhone: 0,
    invalidPhoneExamples: []
  };

  Object.entries(salesBuckets).forEach(([cpf, bucket]) => {
    const customer = customerMap[cpf] || {};

    // Get dates from customer data
    const lastPurchaseDate = parseBrDate(customer[CUST_LAST_PURCHASE] || '');
    const registrationDate = parseBrDate(customer[CUST_REGISTRATION] || '');

    // Skip if no last purchase date
    if (!lastPurchaseDate) {
      skipped.noLastPurchase++;
      return;
    }

    // Calculate days
    const recencyDays = Math.floor((today - lastPurchaseDate) / (1000 * 60 * 60 * 24));
    const registrationDays = registrationDate
      ? Math.floor((today - registrationDate) / (1000 * 60 * 60 * 24))
      : null;

    // Calculate RFM
    const { segment } = calculateRFM(
      recencyDays,
      bucket.frequency,
      bucket.recentMonetary,
      registrationDays
    );

    // Get phone (normalize and validate Brazilian mobile)
    const rawPhone = customer[CUST_PHONE] || '';
    const phone = normalizePhone(rawPhone);

    // Skip if no valid Brazilian mobile phone (required for WhatsApp campaigns)
    if (!phone) {
      skipped.invalidPhone++;
      if (skipped.invalidPhoneExamples.length < 5) {
        skipped.invalidPhoneExamples.push({ cpf, rawPhone, name: customer[CUST_NAME] || '' });
      }
      return;
    }

    // Get name
    const name = customer[CUST_NAME] || existingRfmMap[cpf]?.name || '';

    // Preserve lastContactDate from existing RFM
    const lastContactDate = existingRfmMap[cpf]?.lastContactDate || '';

    rfmResults[cpf] = {
      segment,
      cpf,
      name,
      phone,
      lastContactDate
    };
  });

  console.log(`✅ Calculated RFM for ${Object.keys(rfmResults).length} customers`);

  // Log skipped customers
  if (skipped.noLastPurchase > 0 || skipped.invalidPhone > 0) {
    console.log(`⚠️  Skipped: ${skipped.noLastPurchase} (no purchase date), ${skipped.invalidPhone} (invalid mobile)`);
    if (skipped.invalidPhoneExamples.length > 0) {
      console.log('   Invalid phone examples:');
      skipped.invalidPhoneExamples.forEach(ex => {
        console.log(`   - ${ex.name || ex.cpf}: "${ex.rawPhone}"`);
      });
    }
  }

  // ===== 6. Sort by Segment Priority =====

  const segmentOrder = ['New', 'Champion', 'Loyal', 'Potential', 'AtRisk', 'Lost'];

  const sortedResults = Object.values(rfmResults).sort((a, b) => {
    return segmentOrder.indexOf(a.segment) - segmentOrder.indexOf(b.segment);
  });

  // ===== 7. Generate Output CSV =====

  const outputHeader = [H_SEG, H_ID, H_NAME, H_PHONE, H_CONTACT].join(',');
  const outputRows = sortedResults.map(r =>
    [r.segment, r.cpf, r.name, r.phone, r.lastContactDate].join(',')
  );

  const outputCSV = [outputHeader, ...outputRows].join('\n');

  // ===== 8. Write Output =====

  await fs.writeFile(path.join(dataDir, 'rfm.csv'), outputCSV, 'utf8');

  console.log('━'.repeat(50));
  console.log(`💾 Saved rfm.csv (${sortedResults.length} rows)`);

  // ===== 9. Print Summary =====

  const segmentCounts = {};
  sortedResults.forEach(r => {
    segmentCounts[r.segment] = (segmentCounts[r.segment] || 0) + 1;
  });

  console.log('\n📊 Segment Distribution:');
  segmentOrder.forEach(seg => {
    const count = segmentCounts[seg] || 0;
    const pct = sortedResults.length > 0
      ? ((count / sortedResults.length) * 100).toFixed(1)
      : '0.0';
    console.log(`   ${seg.padEnd(10)} ${String(count).padStart(4)} (${pct}%)`);
  });

  console.log('\n🎉 RFM Processing complete!');
}

// Run
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
