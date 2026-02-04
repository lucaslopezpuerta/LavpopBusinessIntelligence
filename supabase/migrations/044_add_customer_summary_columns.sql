-- Migration 044: Add data_cadastro and risk_level to customer_summary view
-- Purpose: Enable WhatChimp integration with customer labeling and anniversary templates
-- Date: 2026-02-02

-- Drop existing view (required to add new columns)
DROP VIEW IF EXISTS customer_summary CASCADE;

-- Recreate view with new columns: data_cadastro, risk_level
CREATE VIEW customer_summary AS
SELECT
  c.doc,
  c.nome,
  c.telefone,
  c.email,
  c.saldo_carteira,
  c.rfm_segment,
  c.r_score,
  c.f_score,
  c.m_score,
  c.recent_monetary_90d,
  -- NEW: Registration date for anniversary template
  c.data_cadastro,
  -- NEW: Risk level for WhatChimp labeling
  c.risk_level,
  -- Phone normalization (Brazilian mobile format: 55 + DDD + 9 + 8 digits)
  CASE
    WHEN c.telefone IS NULL OR c.telefone = '' THEN NULL
    ELSE (
      SELECT
        CASE
          WHEN n.normalized ~ '^55[1-9]{2}9[0-9]{8}$' THEN n.normalized
          ELSE NULL
        END
      FROM (
        SELECT
          CASE LENGTH(d.digits)
            WHEN 13 THEN
              CASE WHEN d.digits LIKE '55%' THEN d.digits ELSE NULL END
            WHEN 12 THEN
              CASE WHEN d.digits LIKE '55%' THEN SUBSTR(d.digits, 1, 4) || '9' || SUBSTR(d.digits, 5) ELSE NULL END
            WHEN 11 THEN '55' || d.digits
            WHEN 10 THEN '55' || SUBSTR(d.digits, 1, 2) || '9' || SUBSTR(d.digits, 3)
            ELSE NULL
          END AS normalized
        FROM (
          SELECT REGEXP_REPLACE(c.telefone, '[^0-9]', '', 'g') AS digits
        ) d
      ) n
    )
  END AS normalized_phone,
  -- Transaction stats
  COUNT(t.id) FILTER (WHERE NOT t.is_recarga) AS transaction_count,
  COUNT(t.id) FILTER (WHERE t.is_recarga) AS recarga_count,
  COALESCE(SUM(t.net_value) FILTER (WHERE NOT t.is_recarga), 0) AS total_spent,
  COALESCE(SUM(t.total_services), 0) AS total_services,
  COALESCE(SUM(t.wash_count), 0) AS total_washes,
  COALESCE(SUM(t.dry_count), 0) AS total_drys,
  COALESCE(SUM(t.cashback_amount), 0) AS total_cashback,
  -- Date stats
  MIN(t.data_hora)::DATE AS first_visit,
  MAX(t.data_hora)::DATE AS last_visit,
  (CURRENT_DATE - MAX(t.data_hora)::DATE) AS days_since_last_visit,
  -- Coupon usage
  COUNT(t.id) FILTER (WHERE t.usou_cupom) AS coupon_uses,
  -- Average ticket
  ROUND(
    COALESCE(SUM(t.net_value) FILTER (WHERE NOT t.is_recarga), 0) /
    NULLIF(COUNT(t.id) FILTER (WHERE NOT t.is_recarga), 0),
    2
  ) AS avg_ticket
FROM customers c
LEFT JOIN transactions t ON c.doc = t.doc_cliente
GROUP BY
  c.doc,
  c.nome,
  c.telefone,
  c.email,
  c.saldo_carteira,
  c.rfm_segment,
  c.r_score,
  c.f_score,
  c.m_score,
  c.recent_monetary_90d,
  c.data_cadastro,
  c.risk_level;

-- Grant permissions
GRANT SELECT ON customer_summary TO authenticated;
GRANT SELECT ON customer_summary TO anon;
