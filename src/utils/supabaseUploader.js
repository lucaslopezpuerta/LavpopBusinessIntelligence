// supabaseUploader.js v1.3
// Client-side CSV parser and Supabase uploader for manual data imports
//
// Usage:
//   import { uploadSalesCSV, uploadCustomerCSV, detectFileType } from './supabaseUploader';
//   const result = await uploadSalesCSV(csvText);
//
// Features:
//   - Auto-detects file type (sales vs customer) based on headers
//   - Brazilian format handling (dates DD/MM/YYYY, numbers with comma)
//   - Deduplication via SHA-256 hash
//   - Batch upsert to Supabase (100 records per batch)
//   - Progress callback for UI feedback
//   - Smart customer upsert: Handles full customer list uploads
//     without regressing computed metrics from transaction triggers
//   - Upload history logging for transparency (v1.2)
//   - Auto-refresh trigger after upload (v1.3)
//
// CHANGELOG:
// v1.3 (2026-01-23): Auto-refresh after upload
//   - Dispatches 'transactionUpdate' event after successful sales upload
//   - Ensures UI refreshes immediately without waiting for Realtime
//   - Works even if Realtime subscription misses UPSERT events
// v1.2 (2025-12-24): Upload history logging
//   - Logs all uploads to upload_history table
//   - Tracks: file_type, records_total/inserted/updated, errors, duration
//   - Matches Python supabase_uploader.py behavior
// v1.1 (2025-12-13): Smart customer upsert
//   - Uses upsert_customer_profiles_batch() RPC for intelligent merge
//   - Profile fields always update (nome, telefone, email, saldo_carteira)
//   - Date fields use GREATEST (won't regress to older dates)
//   - Count fields use GREATEST (won't regress to lower values)
//   - Computed fields (risk_level, avg_days_between) untouched
//   - Falls back to simple upsert if RPC not available

// ============== CONFIGURATION ==============

const BATCH_SIZE = 100;
const CASHBACK_RATE = 0.075; // 7.5%
const CASHBACK_START_DATE = new Date(2024, 5, 1); // June 1, 2024

// Supabase client (lazy loaded)
let supabase = null;

async function getSupabase() {
  if (!supabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// ============== CSV UTILITIES ==============

function cleanCSV(txt) {
  return txt
    .replace(/^\uFEFF/, '') // BOM
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
  if (lines.length === 0) return { headers: [], rows: [] };

  const [headerLine, ...dataLines] = lines;
  const headers = splitCSV(headerLine, sep).map(h => h.replace(/^"|"$/g, '').trim());

  const rows = dataLines.map(line => {
    const cols = splitCSV(line, sep).map(c => c.replace(/^"|"$/g, '').trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] || '';
    });
    return row;
  });

  return { headers, rows };
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
  return { day, month, year, time };
}

function formatBrDateForSupabase(parsed) {
  if (!parsed) return null;
  const { day, month, year, time } = parsed;
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

// Simple hash for browser (no crypto module)
async function generateHash(dataHora, docCliente, valorVenda, maquinas) {
  const str = `${dataHora}|${docCliente}|${valorVenda}|${maquinas}`;
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============== FILE TYPE DETECTION ==============

/**
 * Detect if CSV is sales or customer data based on headers
 * @param {string} csvText - Raw CSV text
 * @returns {'sales' | 'customer' | 'unknown'}
 */
export function detectFileType(csvText) {
  const cleaned = cleanCSV(csvText);
  const delimiter = detectDelimiter(cleaned);
  const { headers } = csvToRows(cleaned, delimiter);

  const headersLower = headers.map(h => h.toLowerCase());

  // Sales file headers
  const salesHeaders = ['data_hora', 'valor_venda', 'doc_cliente', 'maquinas'];
  const hasSalesHeaders = salesHeaders.some(h =>
    headersLower.some(hdr => hdr.includes(h.replace('_', '')))
  );

  // Customer file headers
  const customerHeaders = ['documento', 'nome', 'telefone', 'saldo_carteira'];
  const hasCustomerHeaders = customerHeaders.some(h =>
    headersLower.some(hdr => hdr.includes(h.replace('_', '')))
  );

  // Check for distinctive headers
  if (headersLower.includes('data_hora') || headersLower.includes('maquinas')) {
    return 'sales';
  }
  if (headersLower.includes('documento') || headersLower.includes('saldo_carteira')) {
    return 'customer';
  }

  if (hasSalesHeaders && !hasCustomerHeaders) return 'sales';
  if (hasCustomerHeaders && !hasSalesHeaders) return 'customer';

  return 'unknown';
}

// ============== SALES UPLOAD ==============

/**
 * Parse and upload sales CSV to Supabase
 * @param {string} csvText - Raw CSV text
 * @param {function} onProgress - Progress callback (current, total, phase)
 * @returns {Promise<{success: boolean, inserted: number, skipped: number, errors: string[]}>}
 */
export async function uploadSalesCSV(csvText, onProgress = () => {}) {
  const startTime = Date.now();
  const client = await getSupabase();
  if (!client) {
    return { success: false, inserted: 0, skipped: 0, errors: ['Supabase not configured'] };
  }

  const cleaned = cleanCSV(csvText);
  const delimiter = detectDelimiter(cleaned);
  const { rows } = csvToRows(cleaned, delimiter);

  onProgress(0, rows.length, 'parsing');

  const transactions = [];
  const duplicateHashes = new Set();
  const errors = [];
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
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
      const hash = await generateHash(
        row.Data_Hora,
        row.Doc_Cliente,
        row.Valor_Venda,
        machineStr
      );

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

      const txDate = new Date(
        parseInt(parsedDate.year),
        parseInt(parsedDate.month) - 1,
        parseInt(parsedDate.day)
      );
      // Calculate cashback for tracking (as a liability, not deducted from netValue)
      // netValue = Valor_Pago (coupon discounts only), cashback tracked separately
      if (txDate >= CASHBACK_START_DATE && grossValue > 0) {
        cashbackAmount = Math.round(grossValue * CASHBACK_RATE * 100) / 100;
        // Do NOT deduct cashback from netValue - it's a liability, not an expense
      }

      const usouCupom = String(row.Usou_Cupom || '').toLowerCase() === 'sim';
      const codigoCupom = row.Codigo_Cupom && row.Codigo_Cupom !== 'n/d'
        ? row.Codigo_Cupom.trim().toUpperCase()
        : null;

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
        source_file: 'manual_upload'
      });
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err.message}`);
    }

    if (i % 100 === 0) {
      onProgress(i, rows.length, 'parsing');
    }
  }

  onProgress(rows.length, rows.length, 'uploading');

  // Batch insert with upsert
  let inserted = 0;
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    try {
      const { error } = await client
        .from('transactions')
        .upsert(batch, { onConflict: 'import_hash' });

      if (error) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE)}: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    } catch (err) {
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE)}: ${err.message}`);
    }
    onProgress(i + batch.length, transactions.length, 'uploading');
  }

  const result = {
    success: errors.length === 0,
    inserted,
    skipped,
    total: rows.length,
    duplicates: duplicateHashes.size - transactions.length,
    errors
  };

  // Log to upload history
  const durationMs = Date.now() - startTime;
  await logUploadHistory('sales', 'manual_upload', result, durationMs, 'manual');

  // Trigger UI refresh after successful upload
  // This ensures immediate refresh even if Realtime subscription misses the event
  if (result.inserted > 0 && typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('transactionUpdate', {
        detail: { type: 'UPLOAD', data: { count: result.inserted } }
      }));
      console.log(`[SalesUpload] Dispatched transactionUpdate event for ${result.inserted} records`);
    } catch (err) {
      // Don't fail upload if event dispatch fails
      console.warn('[SalesUpload] Failed to dispatch refresh event:', err);
    }
  }

  return result;
}

// ============== CUSTOMER UPLOAD ==============

/**
 * Parse and upload customer CSV to Supabase
 * Uses smart upsert that won't regress computed metrics from transaction triggers
 *
 * @param {string} csvText - Raw CSV text
 * @param {function} onProgress - Progress callback (current, total, phase)
 * @returns {Promise<{success: boolean, inserted: number, updated: number, skipped: number, errors: string[]}>}
 */
export async function uploadCustomerCSV(csvText, onProgress = () => {}) {
  const startTime = Date.now();
  const client = await getSupabase();
  if (!client) {
    return { success: false, inserted: 0, updated: 0, skipped: 0, errors: ['Supabase not configured'] };
  }

  const cleaned = cleanCSV(csvText);
  const delimiter = detectDelimiter(cleaned);
  const { rows } = csvToRows(cleaned, delimiter);

  onProgress(0, rows.length, 'parsing');

  // Use a Map to deduplicate by CPF
  const customerMap = new Map();
  const errors = [];
  let skipped = 0;
  let duplicates = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      const doc = normalizeCPF(row.Documento);
      if (!doc) {
        skipped++;
        continue;
      }

      const parsedCadastro = parseBrDate(row.Data_Cadastro);
      const parsedUltimaCompra = parseBrDate(row.Data_Ultima_Compra);

      const dataCadastroFormatted = formatBrDateForSupabase(parsedCadastro);
      const firstVisitDate = parsedCadastro
        ? `${parsedCadastro.year}-${parsedCadastro.month.padStart(2, '0')}-${parsedCadastro.day.padStart(2, '0')}`
        : null;
      const lastVisitDate = parsedUltimaCompra
        ? `${parsedUltimaCompra.year}-${parsedUltimaCompra.month.padStart(2, '0')}-${parsedUltimaCompra.day.padStart(2, '0')}`
        : null;

      if (customerMap.has(doc)) {
        duplicates++;
      }

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
        source: 'manual_upload'
      });
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err.message}`);
    }

    if (i % 100 === 0) {
      onProgress(i, rows.length, 'parsing');
    }
  }

  const customers = Array.from(customerMap.values());
  onProgress(rows.length, rows.length, 'uploading');

  // Try smart upsert RPC first, fallback to simple upsert
  let inserted = 0;
  let updated = 0;
  let useSmartUpsert = true;

  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    const batch = customers.slice(i, i + BATCH_SIZE);

    if (useSmartUpsert) {
      try {
        // Smart upsert: Won't overwrite dates/counts with older/lower values
        const { data, error } = await client.rpc('upsert_customer_profiles_batch', {
          p_customers: batch
        });

        if (error) {
          // If RPC doesn't exist, fallback to simple upsert
          if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
            console.log('[CustomerUpload] Smart upsert not available, using simple upsert');
            useSmartUpsert = false;
          } else {
            errors.push(`Batch ${Math.floor(i / BATCH_SIZE)}: ${error.message}`);
            continue;
          }
        } else if (data) {
          inserted += data.inserted || 0;
          updated += data.updated || 0;
          onProgress(i + batch.length, customers.length, 'uploading');
          continue;
        }
      } catch (err) {
        console.log('[CustomerUpload] Smart upsert error, falling back:', err.message);
        useSmartUpsert = false;
      }
    }

    // Fallback: Simple upsert (may overwrite data)
    if (!useSmartUpsert) {
      try {
        const { error } = await client
          .from('customers')
          .upsert(batch, { onConflict: 'doc' });

        if (error) {
          errors.push(`Batch ${Math.floor(i / BATCH_SIZE)}: ${error.message}`);
        } else {
          inserted += batch.length;
        }
      } catch (err) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE)}: ${err.message}`);
      }
    }

    onProgress(i + batch.length, customers.length, 'uploading');
  }

  const result = {
    success: errors.length === 0,
    inserted,
    updated,
    skipped,
    total: rows.length,
    duplicates,
    errors,
    smartUpsert: useSmartUpsert // Indicates if smart upsert was used
  };

  // Log to upload history
  const durationMs = Date.now() - startTime;
  await logUploadHistory('customers', 'manual_upload', result, durationMs, 'manual');

  return result;
}

// ============== REFRESH METRICS ==============

/**
 * Refresh customer computed metrics after upload
 * Calls the refresh_customer_metrics() database function
 * @returns {Promise<{success: boolean, updated: number, error: string|null}>}
 */
export async function refreshCustomerMetrics() {
  const client = await getSupabase();
  if (!client) {
    return { success: false, updated: 0, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await client.rpc('refresh_customer_metrics');

    if (error) {
      return { success: false, updated: 0, error: error.message };
    }

    return { success: true, updated: data || 0, error: null };
  } catch (err) {
    return { success: false, updated: 0, error: err.message };
  }
}

// ============== UPLOAD HISTORY LOGGING ==============

/**
 * Log upload to upload_history table for transparency
 * @param {string} fileType - 'sales' or 'customers'
 * @param {string} fileName - Original filename
 * @param {object} result - Upload result object
 * @param {number} durationMs - Upload duration in milliseconds
 * @param {string} source - 'manual' or 'automated'
 */
async function logUploadHistory(fileType, fileName, result, durationMs, source = 'manual') {
  try {
    const client = await getSupabase();
    if (!client) return;

    await client.from('upload_history').insert({
      file_type: fileType,
      file_name: fileName,
      records_total: result.total || 0,
      records_inserted: result.inserted || 0,
      records_updated: result.updated || 0,
      records_skipped: result.skipped || 0,
      errors: (result.errors || []).slice(0, 10), // Limit to 10 errors
      source,
      duration_ms: durationMs,
      status: result.errors?.length > 0 ? 'partial' : 'success'
    });

    console.log(`[UploadHistory] Logged ${fileType} upload: ${result.inserted || 0} inserted`);
  } catch (err) {
    // Don't fail upload if history logging fails
    console.warn('[UploadHistory] Failed to log:', err.message);
  }
}
