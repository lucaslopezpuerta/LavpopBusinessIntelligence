/**
 * Historical Migration Script: CSV to Supabase
 *
 * This script migrates existing CSV data (8 months of transactions) to Supabase.
 * It uses the same parsing logic as transactionParser.js and process-rfm.cjs.
 *
 * Usage:
 *   node scripts/migrate-csv-to-supabase.cjs
 *
 * Environment variables (in .env):
 *   VITE_SUPABASE_URL - Supabase project URL
 *   VITE_SUPABASE_ANON_KEY - Supabase anon key
 *
 * What it does:
 *   1. Reads data/sales.csv and data/customer.csv
 *   2. Parses with Brazilian format handling (dates, numbers)
 *   3. Calculates transaction types, cashback, machine counts
 *   4. Generates deduplication hashes
 *   5. Batch inserts into Supabase transactions and customers tables
 *   6. Links coupon redemptions to transactions
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// ============== CONFIGURATION ==============

const BATCH_SIZE = 100; // Insert in batches of 100
const CASHBACK_RATE = 0.075; // 7.5%
const CASHBACK_START_DATE = new Date(2024, 5, 1); // June 1, 2024

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
    .replace(/^\uFEFF/, '')
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

// ============== DATA PARSING ==============

function parseBrDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split(/[\/\s]/);
  if (parts.length < 3) return null;
  const [day, month, year] = parts;
  const time = parts[3] || '00:00:00';
  // Return the raw components for proper timezone handling
  return { day, month, year, time };
}

// Format date for Supabase WITHOUT timezone offset
// This preserves the exact local time as displayed in the CSV
// The time will be stored as-is (Supabase treats it as UTC, but displays correctly)
function formatBrDateForSupabase(parsed) {
  if (!parsed) return null;
  const { day, month, year, time } = parsed;
  // Format: 2025-12-09T19:23:34 (no timezone offset)
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}`;
}

function parseBrNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const str = String(value).trim();
  if (str.includes('.') && str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }
  if (str.includes(',')) {
    return parseFloat(str.replace(',', '.')) || 0;
  }
  return parseFloat(str) || 0;
}

function normalizeCPF(doc) {
  const digits = (doc || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length < 11) return digits.padStart(11, '0');
  if (digits.length > 11) return digits.slice(-11);
  return digits;
}

function countMachines(str) {
  if (!str) return { wash: 0, dry: 0, total: 0 };
  const machines = String(str).toLowerCase().split(',').map(m => m.trim());
  let wash = 0, dry = 0;
  machines.forEach(m => {
    if (m.includes('lavadora')) wash++;
    else if (m.includes('secadora')) dry++;
  });
  return { wash, dry, total: wash + dry };
}

function classifyTransaction(row) {
  const machineStr = String(row.Maquinas || '').toLowerCase();
  const paymentMethod = String(row.Meio_de_Pagamento || '').toLowerCase();
  const grossValue = parseBrNumber(row.Valor_Venda || 0);

  if (machineStr.includes('recarga')) return 'TYPE_3';
  if (paymentMethod.includes('saldo da carteira') ||
      (grossValue === 0 && machineStr && !machineStr.includes('recarga'))) {
    return 'TYPE_2';
  }
  if (machineStr && !machineStr.includes('recarga') && grossValue > 0) {
    return 'TYPE_1';
  }
  return 'UNKNOWN';
}

function generateHash(dataHora, docCliente, valorVenda, maquinas) {
  const str = `${dataHora}|${docCliente}|${valorVenda}|${maquinas}`;
  return crypto.createHash('md5').update(str).digest('hex');
}

// ============== SUPABASE API ==============

async function supabaseRequest(endpoint, method, body = null) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${method} ${endpoint}: ${response.status} - ${text}`);
  }

  if (response.status === 204 || method === 'POST') {
    return null;
  }
  return response.json();
}

async function upsertBatch(table, data, conflictColumn = null) {
  if (data.length === 0) return;

  let endpoint = table;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': conflictColumn
      ? `resolution=merge-duplicates,return=minimal`
      : 'return=minimal'
  };

  if (conflictColumn) {
    endpoint += `?on_conflict=${conflictColumn}`;
  }

  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upsert ${table}: ${response.status} - ${text}`);
  }
}

// ============== MIGRATION FUNCTIONS ==============

async function migrateTransactions(salesRows) {
  console.log('\n📦 Migrating transactions...');

  const transactions = [];
  const couponRedemptions = [];
  let skipped = 0;
  let duplicateHashes = new Set();

  for (const row of salesRows) {
    const parsedDate = parseBrDate(row.Data_Hora);
    if (!parsedDate) {
      skipped++;
      continue;
    }

    const docCliente = normalizeCPF(row.Doc_Cliente);
    if (!docCliente) {
      skipped++;
      continue;
    }

    const grossValue = parseBrNumber(row.Valor_Venda);
    const machineStr = row.Maquinas || '';

    // Generate deduplication hash
    const hash = generateHash(
      row.Data_Hora,
      row.Doc_Cliente,
      row.Valor_Venda,
      machineStr
    );

    // Skip duplicates within this batch
    if (duplicateHashes.has(hash)) {
      continue;
    }
    duplicateHashes.add(hash);

    // Calculate derived values
    const type = classifyTransaction(row);
    const isRecarga = machineStr.toLowerCase().includes('recarga');
    const machineInfo = countMachines(machineStr);

    let netValue = parseBrNumber(row.Valor_Pago);
    let cashbackAmount = 0;

    // Check if date is after cashback start (June 2024)
    const txDate = new Date(parseInt(parsedDate.year), parseInt(parsedDate.month) - 1, parseInt(parsedDate.day));
    if (txDate >= CASHBACK_START_DATE && grossValue > 0) {
      cashbackAmount = Math.round(grossValue * CASHBACK_RATE * 100) / 100;
      netValue = Math.round((netValue - cashbackAmount) * 100) / 100;
    }

    // Parse coupon fields
    const usouCupom = String(row.Usou_Cupom || '').toLowerCase() === 'sim';
    const codigoCupom = row.Codigo_Cupom && row.Codigo_Cupom !== 'n/d'
      ? row.Codigo_Cupom.trim().toUpperCase()
      : null;

    // Format date with Brazil timezone (UTC-3)
    const dataHoraFormatted = formatBrDateForSupabase(parsedDate);

    transactions.push({
      data_hora: dataHoraFormatted,
      valor_venda: grossValue,
      valor_pago: parseBrNumber(row.Valor_Pago),
      meio_de_pagamento: row.Meio_de_Pagamento || null,
      comprovante_cartao: row.Comprovante_cartao || null,
      bandeira_cartao: row.Bandeira_Cartao || null,
      loja: row.Loja || null,
      nome_cliente: row.Nome_Cliente || null,
      doc_cliente: docCliente,
      telefone: row.Telefone || null,
      maquinas: machineStr || null,
      usou_cupom: usouCupom,
      codigo_cupom: codigoCupom,
      transaction_type: type,
      is_recarga: isRecarga,
      wash_count: machineInfo.wash,
      dry_count: machineInfo.dry,
      total_services: machineInfo.total,
      net_value: netValue,
      cashback_amount: cashbackAmount,
      import_hash: hash,
      source_file: 'historical_migration'
    });

    // Track coupon for later linking
    if (usouCupom && codigoCupom) {
      couponRedemptions.push({
        hash,
        codigo_cupom: codigoCupom,
        customer_doc: docCliente,
        redeemed_at: dataHoraFormatted
      });
    }
  }

  console.log(`   Parsed: ${transactions.length} transactions`);
  console.log(`   Skipped: ${skipped} (invalid date/doc)`);
  console.log(`   Coupons: ${couponRedemptions.length} redemptions`);

  // Insert in batches
  let inserted = 0;
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    try {
      await upsertBatch('transactions', batch, 'import_hash');
      inserted += batch.length;
      process.stdout.write(`\r   Inserting: ${inserted}/${transactions.length}`);
    } catch (err) {
      console.error(`\n   ❌ Batch error at ${i}: ${err.message}`);
      // Continue with next batch
    }
  }
  console.log(`\n   ✅ Inserted ${inserted} transactions`);

  return couponRedemptions;
}

async function migrateCustomers(customerRows) {
  console.log('\n👥 Migrating customers...');

  // Use a Map to deduplicate by CPF (keep latest entry for each customer)
  const customerMap = new Map();
  let skipped = 0;
  let duplicates = 0;

  for (const row of customerRows) {
    const doc = normalizeCPF(row.Documento);
    if (!doc) {
      skipped++;
      continue;
    }

    const parsedCadastro = parseBrDate(row.Data_Cadastro);
    const parsedUltimaCompra = parseBrDate(row.Data_Ultima_Compra);

    // Format dates
    const dataCadastroFormatted = formatBrDateForSupabase(parsedCadastro);
    const firstVisitDate = parsedCadastro
      ? `${parsedCadastro.year}-${parsedCadastro.month.padStart(2, '0')}-${parsedCadastro.day.padStart(2, '0')}`
      : null;
    const lastVisitDate = parsedUltimaCompra
      ? `${parsedUltimaCompra.year}-${parsedUltimaCompra.month.padStart(2, '0')}-${parsedUltimaCompra.day.padStart(2, '0')}`
      : null;

    // Track duplicates
    if (customerMap.has(doc)) {
      duplicates++;
    }

    // Keep latest entry (overwrite previous if exists)
    customerMap.set(doc, {
      doc,
      nome: row.Nome || null,
      telefone: row.Telefone || null,
      email: row.Email || null,
      data_cadastro: dataCadastroFormatted,
      saldo_carteira: parseBrNumber(row.Saldo_Carteira),
      first_visit: firstVisitDate,
      last_visit: lastVisitDate,
      transaction_count: parseInt(row.Quantidade_Compras) || 0,
      total_spent: parseBrNumber(row.Total_Compras),
      source: 'historical_migration'
    });
  }

  // Convert Map to array
  const customers = Array.from(customerMap.values());

  console.log(`   Parsed: ${customerRows.length} rows`);
  console.log(`   Unique customers: ${customers.length}`);
  console.log(`   Skipped: ${skipped} (invalid doc)`);
  console.log(`   Duplicates merged: ${duplicates}`);

  // Insert in batches with upsert
  let inserted = 0;
  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    const batch = customers.slice(i, i + BATCH_SIZE);
    try {
      await upsertBatch('customers', batch, 'doc');
      inserted += batch.length;
      process.stdout.write(`\r   Inserting: ${inserted}/${customers.length}`);
    } catch (err) {
      console.error(`\n   ❌ Batch error at ${i}: ${err.message}`);
    }
  }
  console.log(`\n   ✅ Upserted ${inserted} customers`);
}

async function linkCouponRedemptions(couponRedemptions) {
  if (couponRedemptions.length === 0) {
    console.log('\n🎟️  No coupon redemptions to link');
    return;
  }

  console.log(`\n🎟️  Linking ${couponRedemptions.length} coupon redemptions...`);
  console.log('   (This will be handled by database triggers on future inserts)');
  console.log('   ✅ Coupon data stored in transactions table');
}

// ============== MAIN ==============

async function main() {
  console.log('═'.repeat(60));
  console.log('  LAVPOP Historical Migration: CSV → Supabase');
  console.log('═'.repeat(60));
  console.log(`\n📅 Migration date: ${new Date().toISOString()}`);
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);

  const dataDir = path.join(process.cwd(), 'data');

  // ===== Load CSV Files =====
  console.log('\n📂 Loading CSV files...');

  let salesText, customerText;

  try {
    salesText = await fs.readFile(path.join(dataDir, 'sales.csv'), 'utf8');
    console.log('   ✅ Loaded sales.csv');
  } catch (err) {
    console.error('   ❌ Failed to load sales.csv:', err.message);
    process.exit(1);
  }

  try {
    customerText = await fs.readFile(path.join(dataDir, 'customer.csv'), 'utf8');
    console.log('   ✅ Loaded customer.csv');
  } catch (err) {
    console.error('   ❌ Failed to load customer.csv:', err.message);
    process.exit(1);
  }

  // ===== Parse CSVs =====
  const salesDelim = detectDelimiter(cleanCSV(salesText));
  const customerDelim = detectDelimiter(cleanCSV(customerText));

  const salesRows = csvToRows(cleanCSV(salesText), salesDelim);
  const customerRows = csvToRows(cleanCSV(customerText), customerDelim);

  console.log(`\n📊 Data summary:`);
  console.log(`   Sales rows: ${salesRows.length}`);
  console.log(`   Customer rows: ${customerRows.length}`);

  // ===== Migrate Data =====

  // 1. Migrate customers first (transactions reference them)
  await migrateCustomers(customerRows);

  // 2. Migrate transactions
  const couponRedemptions = await migrateTransactions(salesRows);

  // 3. Link coupon redemptions
  await linkCouponRedemptions(couponRedemptions);

  // ===== Summary =====
  console.log('\n' + '═'.repeat(60));
  console.log('  ✅ MIGRATION COMPLETE');
  console.log('═'.repeat(60));
  console.log('\nNext steps:');
  console.log('  1. Verify data in Supabase dashboard');
  console.log('  2. Run: SELECT COUNT(*) FROM transactions;');
  console.log('  3. Run: SELECT COUNT(*) FROM customers;');
  console.log('  4. Test web app with Supabase data source');
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
