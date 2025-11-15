// Transaction Parser v1.0 - Shared Utility
// Handles all transaction types with proper cashback calculation
// Used by: businessMetrics.js, operationsMetrics.js, customerMetrics.js

import { parseBrDate } from './dateUtils';

// CASHBACK CONFIGURATION
const CASHBACK_RATE = 0.075; // 7.5%
const CASHBACK_START_DATE = new Date(2024, 5, 1); // June 1, 2024

/**
 * Parse Brazilian number format (handles comma as decimal separator)
 */
export function parseBrNumber(value) {
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
  
  // Format: 17.90 or 17 or 0
  return parseFloat(str) || 0;
}

/**
 * Count machines from transaction string
 * Returns: { wash: number, dry: number, total: number }
 */
export function countMachines(str) {
  if (!str) return { wash: 0, dry: 0, total: 0 };
  
  const machines = String(str).toLowerCase().split(',').map(m => m.trim());
  let wash = 0, dry = 0;
  
  machines.forEach(m => {
    if (m.includes('lavadora')) wash++;
    else if (m.includes('secadora')) dry++;
  });
  
  return { wash, dry, total: wash + dry };
}

/**
 * Classify transaction type
 * Returns: 'TYPE_1', 'TYPE_2', 'TYPE_3', or 'UNKNOWN'
 */
export function classifyTransaction(row) {
  const machineStr = String(row.Maquinas || row.machine || '').toLowerCase();
  const paymentMethod = String(row.Meio_de_Pagamento || row.payment_method || '').toLowerCase();
  const grossValue = parseBrNumber(row.Valor_Venda || row.gross_value || 0);
  
  // TYPE 3: Recarga (credit purchase)
  if (machineStr.includes('recarga')) {
    return 'TYPE_3';
  }
  
  // TYPE 2: Machine purchase with credit (R$0)
  if (paymentMethod.includes('saldo da carteira') || 
      (grossValue === 0 && machineStr && !machineStr.includes('recarga'))) {
    return 'TYPE_2';
  }
  
  // TYPE 1: Machine purchase with card/pix
  if (machineStr && !machineStr.includes('recarga') && grossValue > 0) {
    return 'TYPE_1';
  }
  
  return 'UNKNOWN';
}

/**
 * Parse sales records with proper cashback calculation
 * Returns array of transaction objects with:
 * - date, dateStr, hour
 * - type (TYPE_1, TYPE_2, TYPE_3)
 * - grossValue, netValue (after cashback), discountAmount, cashbackAmount
 * - washCount, dryCount, totalServices
 * - isRecarga (boolean flag)
 */
export function parseSalesRecords(salesData) {
  const records = [];
  
  salesData.forEach(row => {
    const date = parseBrDate(row.Data || row.Data_Hora || row.date || '');
    if (!date) return;
    
    const type = classifyTransaction(row);
    const machineStr = String(row.Maquinas || row.machine || '');
    const isRecarga = machineStr.toLowerCase().includes('recarga');
    
    // Parse values with full precision
    let grossValue = parseBrNumber(row.Valor_Venda || row.gross_value || 0);
    let netValue = parseBrNumber(row.Valor_Pago || row.net_value || 0);
    let discountAmount = grossValue - netValue; // Coupon discount only (at first)
    let cashbackAmount = 0;
    
    // Apply cashback to Type 1 (machine + card) and Type 3 (Recarga)
    // Type 2 (machine + credit) has R$0, so cashback is 0
    if (date >= CASHBACK_START_DATE && grossValue > 0) {
      cashbackAmount = grossValue * CASHBACK_RATE; // Keep full precision!
      netValue = netValue - cashbackAmount;
      discountAmount = discountAmount + cashbackAmount;
    }
    
    const machineInfo = countMachines(machineStr);
    
    // Create dateStr in LOCAL timezone (for debugging/grouping)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    records.push({
      date,
      dateStr,
      hour: date.getHours(),
      type,
      isRecarga,
      grossValue,
      netValue,           // TRUE net after cashback
      discountAmount,     // Includes coupon + cashback
      cashbackAmount,
      washCount: machineInfo.wash,
      dryCount: machineInfo.dry,
      totalServices: machineInfo.total
    });
  });
  
  return records;
}

/**
 * Filter records by type
 */
export function filterByType(records, types) {
  const typeArray = Array.isArray(types) ? types : [types];
  return records.filter(r => typeArray.includes(r.type));
}

/**
 * Filter records that have services (exclude Recarga)
 */
export function filterWithServices(records) {
  return records.filter(r => !r.isRecarga);
}

/**
 * Get revenue-generating records (Type 1 + Type 3)
 */
export function filterRevenueRecords(records) {
  return records.filter(r => r.type === 'TYPE_1' || r.type === 'TYPE_3');
}
