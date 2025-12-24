"""
Supabase Uploader - Python port of supabaseUploader.js
Uploads sales and customer CSVs to Supabase with full computed fields.

Features:
- Brazilian format handling (DD/MM/YYYY dates, comma decimals)
- Transaction classification (TYPE_1, TYPE_2, TYPE_3)
- Machine counting (wash/dry)
- Cashback calculation (fetched from app_settings)
- Deduplication via SHA-256 hash
- Smart customer upsert (won't regress computed metrics)
- Upload history logging for transparency

Usage:
    from supabase_uploader import upload_sales_csv, upload_customers_csv
    result = upload_sales_csv('path/to/sales.csv')
"""

import os
import re
import csv
import hashlib
import logging
import time
from datetime import datetime
from typing import Dict, List, Optional, Any

from supabase_client import get_supabase_client

# Configuration
BATCH_SIZE = 100
DEFAULT_CASHBACK_RATE = 0.075  # 7.5%
DEFAULT_CASHBACK_START_DATE = '2024-06-01'

# Cache for app settings
_app_settings_cache = None
_app_settings_cache_time = 0
APP_SETTINGS_CACHE_TTL = 300  # 5 minutes


# ============== SETTINGS ==============

def get_app_settings() -> Dict[str, Any]:
    """
    Fetch cashback settings from Supabase app_settings table.
    Caches result for 5 minutes to reduce API calls.
    """
    global _app_settings_cache, _app_settings_cache_time

    # Return cached if fresh
    if _app_settings_cache and (time.time() - _app_settings_cache_time) < APP_SETTINGS_CACHE_TTL:
        return _app_settings_cache

    defaults = {
        'cashback_percent': DEFAULT_CASHBACK_RATE * 100,  # 7.5
        'cashback_start_date': DEFAULT_CASHBACK_START_DATE
    }

    try:
        client = get_supabase_client()
        if not client:
            return defaults

        result = client.table('app_settings').select('*').eq('id', 'default').single().execute()

        if result.data:
            _app_settings_cache = {
                'cashback_percent': float(result.data.get('cashback_percent', 7.5)),
                'cashback_start_date': result.data.get('cashback_start_date', DEFAULT_CASHBACK_START_DATE)
            }
            _app_settings_cache_time = time.time()
            logging.info(f"[AppSettings] Loaded: {_app_settings_cache['cashback_percent']}% cashback from {_app_settings_cache['cashback_start_date']}")
            return _app_settings_cache

    except Exception as e:
        logging.warning(f"[AppSettings] Failed to load, using defaults: {e}")

    return defaults


# ============== CSV UTILITIES ==============

def clean_csv(text: str) -> str:
    """Remove BOM and IMTString prefix from CSV text."""
    text = text.lstrip('\ufeff')  # BOM
    text = re.sub(r'^IMTString\(\d+\):\s*', '', text)
    return text.strip()


def detect_delimiter(text: str) -> str:
    """Detect CSV delimiter (semicolon or comma) from first line."""
    first_line = text.split('\n')[0] if text else ''
    semicolons = first_line.count(';')
    commas = first_line.count(',')
    return ';' if semicolons > commas else ','


def parse_csv_file(filepath: str) -> List[Dict[str, str]]:
    """Parse CSV file to list of row dictionaries."""
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        text = f.read()

    text = clean_csv(text)
    delimiter = detect_delimiter(text)

    lines = [line for line in text.split('\n') if line.strip()]
    if not lines:
        return []

    # Parse with csv module for proper quote handling
    reader = csv.DictReader(lines, delimiter=delimiter)
    return list(reader)


# ============== BRAZILIAN FORMAT PARSERS ==============

def parse_br_date(date_str: str) -> Optional[str]:
    """
    Parse Brazilian date format to ISO timestamp.
    Input: "DD/MM/YYYY HH:MM:SS" or "DD/MM/YYYY"
    Output: "YYYY-MM-DDTHH:MM:SS"
    """
    if not date_str or not date_str.strip():
        return None

    date_str = date_str.strip()

    try:
        # Split date and time
        parts = date_str.split(' ', 1)
        date_part = parts[0]
        time_part = parts[1] if len(parts) > 1 else '00:00:00'

        # Parse date
        date_parts = date_part.split('/')
        if len(date_parts) != 3:
            return None

        day, month, year = date_parts

        # Handle 2-digit year
        if len(year) == 2:
            year = '20' + year

        return f"{year}-{month.zfill(2)}-{day.zfill(2)}T{time_part}"

    except Exception:
        return None


def parse_br_date_only(date_str: str) -> Optional[str]:
    """
    Parse Brazilian date to date-only format.
    Input: "DD/MM/YYYY" or "DD/MM/YYYY HH:MM:SS"
    Output: "YYYY-MM-DD"
    """
    iso = parse_br_date(date_str)
    if iso:
        return iso.split('T')[0]
    return None


def parse_br_number(value: str) -> float:
    """
    Parse Brazilian number format to float.
    Examples: "1.234,56" -> 1234.56, "1,5" -> 1.5
    """
    if value is None or value == '':
        return 0.0

    s = str(value).strip()
    if not s:
        return 0.0

    # Brazilian format: 1.234,56 (dots as thousands, comma as decimal)
    if '.' in s and ',' in s:
        return float(s.replace('.', '').replace(',', '.'))
    # Only comma: 1,5
    elif ',' in s:
        return float(s.replace(',', '.'))
    # Standard format or integer
    return float(s) if s else 0.0


def normalize_cpf(doc: str) -> str:
    """
    Normalize CPF to 11-digit string.
    Removes non-digits, pads with zeros if needed.
    """
    if not doc:
        return ''

    digits = re.sub(r'\D', '', str(doc))
    if not digits:
        return ''

    # Pad to 11 digits
    if len(digits) < 11:
        digits = digits.zfill(11)
    # Trim to last 11 digits if too long
    elif len(digits) > 11:
        digits = digits[-11:]

    return digits


# ============== TRANSACTION HELPERS ==============

def count_machines(machine_str: str) -> Dict[str, int]:
    """
    Count washing and drying machines from machine string.
    Returns: {'wash': N, 'dry': N, 'total': N}
    """
    if not machine_str:
        return {'wash': 0, 'dry': 0, 'total': 0}

    machines = machine_str.lower().split(',')
    wash = sum(1 for m in machines if 'lavadora' in m)
    dry = sum(1 for m in machines if 'secadora' in m)

    return {'wash': wash, 'dry': dry, 'total': wash + dry}


def classify_transaction(row: Dict[str, str]) -> str:
    """
    Classify transaction type:
    - TYPE_1: Normal purchase (machines + gross > 0)
    - TYPE_2: Wallet purchase (saldo da carteira OR gross=0 with machines)
    - TYPE_3: Recarga (wallet recharge)
    - UNKNOWN: Cannot classify
    """
    machine_str = str(row.get('Maquinas', '')).lower()
    payment_method = str(row.get('Meio_de_Pagamento', '')).lower()
    gross_value = parse_br_number(row.get('Valor_Venda', '0'))

    # TYPE_3: Wallet recharge
    if 'recarga' in machine_str:
        return 'TYPE_3'

    # TYPE_2: Wallet purchase
    if 'saldo da carteira' in payment_method:
        return 'TYPE_2'
    if gross_value == 0 and machine_str and 'recarga' not in machine_str:
        return 'TYPE_2'

    # TYPE_1: Normal purchase
    if machine_str and 'recarga' not in machine_str and gross_value > 0:
        return 'TYPE_1'

    return 'UNKNOWN'


def generate_hash(data_hora: str, doc_cliente: str, valor_venda: str, maquinas: str) -> str:
    """
    Generate SHA-256 hash for deduplication.
    Returns first 32 hex characters.
    """
    content = f"{data_hora}|{doc_cliente}|{valor_venda}|{maquinas}"
    return hashlib.sha256(content.encode()).hexdigest()[:32]


# ============== UPLOAD HISTORY ==============

def log_upload_history(
    file_type: str,
    file_name: str,
    result: Dict[str, Any],
    duration_ms: int,
    source: str = 'automated'
) -> bool:
    """
    Log upload to upload_history table for transparency.
    Returns True if logged successfully.
    """
    try:
        client = get_supabase_client()
        if not client:
            return False

        record = {
            'file_type': file_type,
            'file_name': file_name,
            'records_total': result.get('total', 0),
            'records_inserted': result.get('inserted', 0),
            'records_updated': result.get('updated', 0),
            'records_skipped': result.get('skipped', 0),
            'errors': result.get('errors', [])[:10],  # Limit to 10 errors
            'source': source,
            'duration_ms': duration_ms,
            'status': 'success' if not result.get('errors') else 'partial'
        }

        client.table('upload_history').insert(record).execute()
        logging.info(f"[UploadHistory] Logged {file_type} upload: {result.get('inserted', 0)} inserted")
        return True

    except Exception as e:
        # Don't fail upload if history logging fails
        logging.warning(f"[UploadHistory] Failed to log: {e}")
        return False


# ============== SALES UPLOAD ==============

def upload_sales_csv(filepath: str, source: str = 'automated_upload') -> Dict[str, Any]:
    """
    Upload sales CSV to Supabase transactions table.

    Computes all derived fields:
    - transaction_type (TYPE_1, TYPE_2, TYPE_3)
    - is_recarga (boolean)
    - wash_count, dry_count, total_services
    - net_value, cashback_amount (based on app_settings)
    - import_hash (for deduplication)

    Returns: {success, inserted, skipped, total, errors}
    """
    start_time = time.time()
    result = {
        'success': False,
        'inserted': 0,
        'skipped': 0,
        'total': 0,
        'errors': []
    }

    try:
        client = get_supabase_client()
        if not client:
            result['errors'].append('Supabase not configured')
            return result

        # Load settings
        settings = get_app_settings()
        cashback_rate = settings['cashback_percent'] / 100  # Convert 7.5 to 0.075
        cashback_start = datetime.strptime(settings['cashback_start_date'], '%Y-%m-%d')

        # Parse CSV
        rows = parse_csv_file(filepath)
        result['total'] = len(rows)

        if not rows:
            result['success'] = True
            return result

        # Process rows
        transactions = []
        seen_hashes = set()

        for i, row in enumerate(rows):
            try:
                # Parse date
                data_hora = parse_br_date(row.get('Data_Hora'))
                if not data_hora:
                    result['skipped'] += 1
                    continue

                # Normalize CPF
                doc_cliente = normalize_cpf(row.get('Doc_Cliente'))
                if not doc_cliente:
                    result['skipped'] += 1
                    continue

                # Values
                gross_value = parse_br_number(row.get('Valor_Venda', '0'))
                paid_value = parse_br_number(row.get('Valor_Pago', '0'))
                machine_str = row.get('Maquinas', '')

                # Generate dedup hash
                import_hash = generate_hash(
                    row.get('Data_Hora', ''),
                    row.get('Doc_Cliente', ''),
                    row.get('Valor_Venda', ''),
                    machine_str
                )

                if import_hash in seen_hashes:
                    continue
                seen_hashes.add(import_hash)

                # Classify transaction
                tx_type = classify_transaction(row)
                is_recarga = 'recarga' in machine_str.lower()
                machine_info = count_machines(machine_str)

                # Calculate cashback
                tx_date = datetime.strptime(data_hora.split('T')[0], '%Y-%m-%d')
                cashback_amount = 0.0
                net_value = paid_value

                if tx_date >= cashback_start and gross_value > 0:
                    cashback_amount = round(gross_value * cashback_rate, 2)
                    net_value = round(paid_value - cashback_amount, 2)

                # Parse coupon
                usou_cupom = str(row.get('Usou_Cupom', '')).lower() == 'sim'
                codigo_cupom = row.get('Codigo_Cupom', '')
                if codigo_cupom and codigo_cupom.lower() != 'n/d':
                    codigo_cupom = codigo_cupom.strip().upper()
                else:
                    codigo_cupom = None

                transactions.append({
                    'data_hora': data_hora,
                    'valor_venda': gross_value,
                    'valor_pago': paid_value,
                    'meio_de_pagamento': row.get('Meio_de_Pagamento') or None,
                    'comprovante_cartao': row.get('Comprovante_cartao') or None,
                    'bandeira_cartao': row.get('Bandeira_Cartao') or None,
                    'loja': row.get('Loja') or None,
                    'nome_cliente': row.get('Nome_Cliente') or None,
                    'doc_cliente': doc_cliente,
                    'telefone': row.get('Telefone') or None,
                    'maquinas': machine_str or None,
                    'usou_cupom': usou_cupom,
                    'codigo_cupom': codigo_cupom,
                    'transaction_type': tx_type,
                    'is_recarga': is_recarga,
                    'wash_count': machine_info['wash'],
                    'dry_count': machine_info['dry'],
                    'total_services': machine_info['total'],
                    'net_value': net_value,
                    'cashback_amount': cashback_amount,
                    'import_hash': import_hash,
                    'source_file': source
                })

            except Exception as e:
                result['errors'].append(f"Row {i + 1}: {str(e)}")

        # Batch upsert
        for i in range(0, len(transactions), BATCH_SIZE):
            batch = transactions[i:i + BATCH_SIZE]
            try:
                response = client.table('transactions').upsert(
                    batch,
                    on_conflict='import_hash'
                ).execute()
                result['inserted'] += len(batch)
            except Exception as e:
                result['errors'].append(f"Batch {i // BATCH_SIZE}: {str(e)}")

        result['success'] = len(result['errors']) == 0

    except Exception as e:
        result['errors'].append(f"Upload failed: {str(e)}")

    # Log to history
    duration_ms = int((time.time() - start_time) * 1000)
    log_upload_history('sales', os.path.basename(filepath), result, duration_ms, source)

    return result


# ============== CUSTOMER UPLOAD ==============

def upload_customers_csv(filepath: str, source: str = 'automated_upload') -> Dict[str, Any]:
    """
    Upload customer CSV to Supabase customers table.

    Uses smart upsert RPC that won't regress computed metrics:
    - Profile fields: always update (nome, telefone, email, saldo_carteira)
    - Date fields: use GREATEST (won't regress to older dates)
    - Count fields: use GREATEST (won't regress to lower values)
    - Falls back to simple upsert if RPC not available

    Returns: {success, inserted, updated, skipped, total, errors}
    """
    start_time = time.time()
    result = {
        'success': False,
        'inserted': 0,
        'updated': 0,
        'skipped': 0,
        'total': 0,
        'errors': []
    }

    try:
        client = get_supabase_client()
        if not client:
            result['errors'].append('Supabase not configured')
            return result

        # Parse CSV
        rows = parse_csv_file(filepath)
        result['total'] = len(rows)

        if not rows:
            result['success'] = True
            return result

        # Deduplicate by CPF
        customer_map = {}

        for i, row in enumerate(rows):
            try:
                doc = normalize_cpf(row.get('Documento'))
                if not doc:
                    result['skipped'] += 1
                    continue

                # Parse dates
                data_cadastro = parse_br_date(row.get('Data_Cadastro'))
                first_visit = parse_br_date_only(row.get('Data_Cadastro'))
                last_visit = parse_br_date_only(row.get('Data_Ultima_Compra'))

                customer_map[doc] = {
                    'doc': doc,
                    'nome': row.get('Nome') or None,
                    'telefone': row.get('Telefone') or None,
                    'email': row.get('Email') or None,
                    'data_cadastro': data_cadastro,
                    'saldo_carteira': parse_br_number(row.get('Saldo_Carteira', '0')),
                    'first_visit': first_visit,
                    'last_visit': last_visit,
                    'transaction_count': int(row.get('Quantidade_Compras', '0') or 0),
                    'total_spent': parse_br_number(row.get('Total_Compras', '0')),
                    'source': source
                }

            except Exception as e:
                result['errors'].append(f"Row {i + 1}: {str(e)}")

        customers = list(customer_map.values())
        use_smart_upsert = True

        # Batch upload
        for i in range(0, len(customers), BATCH_SIZE):
            batch = customers[i:i + BATCH_SIZE]

            if use_smart_upsert:
                try:
                    # Smart upsert: Won't overwrite dates/counts with older/lower values
                    response = client.rpc('upsert_customer_profiles_batch', {
                        'p_customers': batch
                    }).execute()

                    if response.data:
                        result['inserted'] += response.data.get('inserted', 0)
                        result['updated'] += response.data.get('updated', 0)
                        continue

                except Exception as e:
                    error_msg = str(e)
                    # If RPC doesn't exist, fallback to simple upsert
                    if 'does not exist' in error_msg or 'PGRST116' in error_msg:
                        logging.info("[CustomerUpload] Smart upsert not available, using simple upsert")
                        use_smart_upsert = False
                    else:
                        result['errors'].append(f"Batch {i // BATCH_SIZE}: {error_msg}")
                        continue

            # Fallback: Simple upsert
            if not use_smart_upsert:
                try:
                    client.table('customers').upsert(
                        batch,
                        on_conflict='doc'
                    ).execute()
                    result['inserted'] += len(batch)
                except Exception as e:
                    result['errors'].append(f"Batch {i // BATCH_SIZE}: {str(e)}")

        result['success'] = len(result['errors']) == 0

    except Exception as e:
        result['errors'].append(f"Upload failed: {str(e)}")

    # Log to history
    duration_ms = int((time.time() - start_time) * 1000)
    log_upload_history('customers', os.path.basename(filepath), result, duration_ms, source)

    return result


# ============== REFRESH METRICS ==============

def refresh_customer_metrics() -> Dict[str, Any]:
    """
    Refresh customer computed metrics after upload.
    Calls the refresh_customer_metrics() database function.
    """
    try:
        client = get_supabase_client()
        if not client:
            return {'success': False, 'updated': 0, 'error': 'Supabase not configured'}

        response = client.rpc('refresh_customer_metrics').execute()

        return {
            'success': True,
            'updated': response.data or 0,
            'error': None
        }

    except Exception as e:
        return {
            'success': False,
            'updated': 0,
            'error': str(e)
        }


# ============== DETECT FILE TYPE ==============

def detect_file_type(filepath: str) -> str:
    """
    Detect if CSV is sales or customer data based on headers.
    Returns: 'sales', 'customer', or 'unknown'
    """
    try:
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            first_line = f.readline().lower()

        # Sales file indicators
        if 'data_hora' in first_line or 'maquinas' in first_line:
            return 'sales'

        # Customer file indicators
        if 'documento' in first_line or 'saldo_carteira' in first_line:
            return 'customer'

        return 'unknown'

    except Exception:
        return 'unknown'
