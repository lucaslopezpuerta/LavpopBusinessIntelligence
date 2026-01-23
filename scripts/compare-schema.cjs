// scripts/compare-schema.cjs
// Compare local schema.sql with remote Supabase database
//
// Usage: node scripts/compare-schema.cjs
//
// Prerequisites:
// - .env file with SUPABASE_URL and SUPABASE_SERVICE_KEY
// - supabase/schema.sql file

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ============== CONFIGURATION ==============

const SCHEMA_FILE = path.join(__dirname, '..', 'supabase', 'schema.sql');
const OUTPUT_FILE = path.join(__dirname, '..', 'schema-diff-report.md');

// ============== REMOTE SCHEMA INTROSPECTION ==============

async function getRemoteTables(supabase) {
  const { data, error } = await supabase.rpc('get_schema_tables', {});

  if (error) {
    // Fallback: query information_schema directly
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .in('table_type', ['BASE TABLE', 'VIEW']);

    if (fallbackError) {
      // Last resort: use raw SQL via RPC
      return await queryRaw(supabase, `
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
    }
    return fallbackData;
  }
  return data;
}

async function queryRaw(supabase, sql) {
  // Use the sql() function if available, otherwise try RPC
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) throw error;
    return data;
  } catch {
    console.log('  Note: Raw SQL execution not available. Using limited introspection.');
    return null;
  }
}

async function getRemoteColumns(supabase) {
  const sql = `
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable,
      c.column_default,
      c.ordinal_position
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name, c.ordinal_position
  `;
  return await queryRaw(supabase, sql);
}

async function getRemoteIndexes(supabase) {
  const sql = `
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `;
  return await queryRaw(supabase, sql);
}

async function getRemoteViews(supabase) {
  const sql = `
    SELECT
      table_name as view_name,
      LEFT(view_definition, 500) as view_definition
    FROM information_schema.views
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  return await queryRaw(supabase, sql);
}

async function getRemoteFunctions(supabase) {
  const sql = `
    SELECT
      p.proname AS function_name,
      pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
      pg_catalog.pg_get_function_result(p.oid) AS return_type
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
    ORDER BY p.proname
  `;
  return await queryRaw(supabase, sql);
}

async function getRemoteTriggers(supabase) {
  const sql = `
    SELECT
      trigger_name,
      event_manipulation,
      event_object_table,
      action_timing
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name
  `;
  return await queryRaw(supabase, sql);
}

async function getRemotePolicies(supabase) {
  const sql = `
    SELECT
      tablename,
      policyname,
      permissive,
      cmd
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `;
  return await queryRaw(supabase, sql);
}

async function getRemoteForeignKeys(supabase) {
  const sql = `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name
  `;
  return await queryRaw(supabase, sql);
}

// ============== ALTERNATIVE: DIRECT TABLE QUERIES ==============
// When raw SQL is not available, we can introspect using Supabase's API

async function getRemoteSchemaViaAPI(supabase) {
  console.log('Using API-based introspection...');

  const schema = {
    tables: new Map(),
    views: new Set(),
    indexes: [],
    functions: [],
    triggers: [],
    policies: [],
    foreignKeys: []
  };

  // Try to get table names by querying each known table
  const knownTables = [
    'transactions', 'customers', 'campaigns', 'contact_tracking',
    'coupon_redemptions', 'blacklist', 'campaign_sends', 'campaign_contacts',
    'scheduled_campaigns', 'comm_logs', 'automation_rules', 'automation_sends',
    'webhook_events', 'app_settings', 'weather_daily_metrics', 'rate_limits',
    'waba_message_analytics', 'waba_templates', 'waba_template_analytics',
    'instagram_daily_metrics', 'upload_history', 'twilio_daily_costs',
    'revenue_predictions', 'model_coefficients', 'model_training_history'
  ];

  for (const tableName of knownTables) {
    try {
      // Try to fetch one row with limit 0 to check if table exists
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        schema.tables.set(tableName, { exists: true, rowCount: count || 0 });
      }
    } catch {
      // Table doesn't exist or no access
    }
  }

  // Check known views
  const knownViews = [
    'campaign_performance', 'campaign_effectiveness', 'campaign_delivery_metrics',
    'contact_effectiveness_summary', 'customer_summary', 'coupon_effectiveness',
    'daily_revenue', 'waba_analytics_summary', 'waba_daily_metrics',
    'waba_template_analytics_view', 'instagram_metrics_with_growth',
    'weather_comfort_analytics', 'prediction_accuracy', 'prediction_accuracy_weekly'
  ];

  for (const viewName of knownViews) {
    try {
      const { error } = await supabase
        .from(viewName)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        schema.views.add(viewName);
      }
    } catch {
      // View doesn't exist
    }
  }

  return schema;
}

// ============== LOCAL SCHEMA PARSING ==============

function parseLocalSchema(schemaPath) {
  // Read main schema.sql only (migrations are historical, may include deprecated objects)
  let content = fs.readFileSync(schemaPath, 'utf8');

  // Remove SQL comments to avoid false matches
  const contentNoComments = content
    .replace(/--.*$/gm, '')  // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '');  // Remove multi-line comments

  const schema = {
    tables: new Map(),
    indexes: [],
    views: [],
    functions: [],
    triggers: [],
    policies: [],
    version: null,
    migrationCount: 0
  };

  // Extract version from main schema.sql
  const versionMatch = content.match(/Version:\s*(\d+\.\d+)/);
  if (versionMatch) {
    schema.version = versionMatch[1];
  }


  // Extract table names from CREATE TABLE statements
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi;
  let match;
  while ((match = tableRegex.exec(contentNoComments)) !== null) {
    const tableName = match[1].toLowerCase();
    // Skip temporary or test tables
    if (!tableName.startsWith('pg_') && !tableName.startsWith('_')) {
      schema.tables.set(tableName, { name: tableName, columns: [] });
    }
  }

  // Extract indexes
  const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)/gi;
  while ((match = indexRegex.exec(contentNoComments)) !== null) {
    schema.indexes.push({
      name: match[1],
      table: match[2].toLowerCase()
    });
  }

  // Extract views (use cleaned content to avoid matching comments)
  const viewRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(\w+)/gi;
  while ((match = viewRegex.exec(contentNoComments)) !== null) {
    const viewName = match[1].toLowerCase();
    if (!schema.views.includes(viewName)) {
      schema.views.push(viewName);
    }
  }

  // Extract functions
  const funcRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(\w+)\s*\(/gi;
  while ((match = funcRegex.exec(contentNoComments)) !== null) {
    const funcName = match[1].toLowerCase();
    if (!schema.functions.includes(funcName)) {
      schema.functions.push(funcName);
    }
  }

  // Extract triggers
  const triggerRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+(\w+)/gi;
  while ((match = triggerRegex.exec(contentNoComments)) !== null) {
    const triggerName = match[1].toLowerCase();
    if (!schema.triggers.includes(triggerName)) {
      schema.triggers.push(triggerName);
    }
  }

  // Extract policies
  const policyRegex = /CREATE\s+POLICY\s+"?(\w+)"?\s+ON\s+(\w+)/gi;
  while ((match = policyRegex.exec(contentNoComments)) !== null) {
    schema.policies.push({
      name: match[1],
      table: match[2].toLowerCase()
    });
  }

  return schema;
}

// ============== COMPARISON LOGIC ==============

function compareSchemas(local, remote) {
  const diff = {
    tables: {
      missingInRemote: [],
      missingInLocal: [],
      matched: []
    },
    indexes: {
      missingInRemote: [],
      extraInRemote: []
    },
    views: {
      missingInRemote: [],
      missingInLocal: [],
      matched: []
    },
    functions: {
      local: local.functions.length,
      remote: remote.functions?.length || 0
    },
    triggers: {
      local: local.triggers.length,
      remote: remote.triggers?.length || 0
    },
    policies: {
      local: local.policies.length,
      remote: remote.policies?.length || 0
    }
  };

  // Compare tables
  const localTableNames = new Set(local.tables.keys());
  const remoteTableNames = remote.tables instanceof Map
    ? new Set(remote.tables.keys())
    : new Set((remote.tables || []).map(t => t.table_name?.toLowerCase()));

  for (const name of localTableNames) {
    if (remoteTableNames.has(name)) {
      diff.tables.matched.push(name);
    } else {
      diff.tables.missingInRemote.push(name);
    }
  }

  for (const name of remoteTableNames) {
    if (!localTableNames.has(name)) {
      diff.tables.missingInLocal.push(name);
    }
  }

  // Compare views
  const localViewNames = new Set(local.views.map(v => v.toLowerCase()));
  const remoteViewNames = remote.views instanceof Set
    ? remote.views
    : new Set((remote.views || []).map(v => v.view_name?.toLowerCase()));

  for (const name of localViewNames) {
    if (remoteViewNames.has(name)) {
      diff.views.matched.push(name);
    } else {
      diff.views.missingInRemote.push(name);
    }
  }

  for (const name of remoteViewNames) {
    if (!localViewNames.has(name)) {
      diff.views.missingInLocal.push(name);
    }
  }

  // Compare indexes
  const localIndexNames = new Set(local.indexes.map(i => i.name.toLowerCase()));
  const remoteIndexNames = new Set((remote.indexes || []).map(i => i.indexname?.toLowerCase()));

  for (const idx of local.indexes) {
    if (!remoteIndexNames.has(idx.name.toLowerCase())) {
      diff.indexes.missingInRemote.push(idx);
    }
  }

  for (const idx of (remote.indexes || [])) {
    const name = idx.indexname?.toLowerCase();
    if (name && !localIndexNames.has(name) && !name.endsWith('_pkey')) {
      diff.indexes.extraInRemote.push(idx);
    }
  }

  return diff;
}

// ============== REPORT GENERATION ==============

function generateReport(diff, localSchema, timestamp) {
  const lines = [];

  lines.push('# Supabase Schema Comparison Report');
  lines.push(`Generated: ${timestamp}`);
  lines.push(`Local Schema Version: ${localSchema.version || 'Unknown'}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push('| Category | Local | Remote | Status |');
  lines.push('|----------|-------|--------|--------|');

  const tableStatus = diff.tables.missingInRemote.length === 0 && diff.tables.missingInLocal.length === 0
    ? 'In Sync' : 'Differences';
  lines.push(`| Tables | ${localSchema.tables.size} | ${diff.tables.matched.length + diff.tables.missingInLocal.length} | ${tableStatus} |`);

  const viewStatus = diff.views.missingInRemote.length === 0 && diff.views.missingInLocal.length === 0
    ? 'In Sync' : 'Differences';
  lines.push(`| Views | ${localSchema.views.length} | ${diff.views.matched.length + diff.views.missingInLocal.length} | ${viewStatus} |`);

  const indexStatus = diff.indexes.missingInRemote.length === 0 ? 'In Sync' : 'Differences';
  lines.push(`| Indexes | ${localSchema.indexes.length} | - | ${indexStatus} |`);

  lines.push(`| Functions | ${diff.functions.local} | ${diff.functions.remote} | ${diff.functions.local === diff.functions.remote ? 'In Sync' : 'Differences'} |`);
  lines.push(`| Triggers | ${diff.triggers.local} | ${diff.triggers.remote} | - |`);
  lines.push(`| Policies | ${diff.policies.local} | ${diff.policies.remote} | - |`);
  lines.push('');

  // Tables section
  lines.push('## Tables');
  lines.push('');

  if (diff.tables.missingInRemote.length > 0) {
    lines.push('### Missing in Remote (Pending Migrations)');
    lines.push('');
    lines.push('| Table | Notes |');
    lines.push('|-------|-------|');
    for (const table of diff.tables.missingInRemote) {
      lines.push(`| ${table} | Exists in local schema.sql but not in remote database |`);
    }
    lines.push('');
  }

  if (diff.tables.missingInLocal.length > 0) {
    lines.push('### Missing in Local (Out-of-Sync or Dynamic Tables)');
    lines.push('');
    lines.push('| Table | Notes |');
    lines.push('|-------|-------|');
    for (const table of diff.tables.missingInLocal) {
      lines.push(`| ${table} | Exists in remote but not in local schema.sql |`);
    }
    lines.push('');
  }

  if (diff.tables.matched.length > 0 && diff.tables.missingInRemote.length === 0 && diff.tables.missingInLocal.length === 0) {
    lines.push('All tables are in sync.');
    lines.push('');
  }

  // Views section
  lines.push('## Views');
  lines.push('');

  if (diff.views.missingInRemote.length > 0) {
    lines.push('### Missing in Remote');
    lines.push('');
    for (const view of diff.views.missingInRemote) {
      lines.push(`- ${view}`);
    }
    lines.push('');
  }

  if (diff.views.missingInLocal.length > 0) {
    lines.push('### Missing in Local');
    lines.push('');
    for (const view of diff.views.missingInLocal) {
      lines.push(`- ${view}`);
    }
    lines.push('');
  }

  if (diff.views.matched.length > 0 && diff.views.missingInRemote.length === 0 && diff.views.missingInLocal.length === 0) {
    lines.push('All views are in sync.');
    lines.push('');
  }

  // Indexes section
  lines.push('## Indexes');
  lines.push('');

  if (diff.indexes.missingInRemote.length > 0) {
    lines.push('### Missing in Remote');
    lines.push('');
    lines.push('| Index | Table |');
    lines.push('|-------|-------|');
    for (const idx of diff.indexes.missingInRemote) {
      lines.push(`| ${idx.name} | ${idx.table} |`);
    }
    lines.push('');
  }

  if (diff.indexes.extraInRemote.length > 0) {
    lines.push('### Extra in Remote (Not in Local Schema)');
    lines.push('');
    lines.push('| Index | Table |');
    lines.push('|-------|-------|');
    for (const idx of diff.indexes.extraInRemote) {
      lines.push(`| ${idx.indexname} | ${idx.tablename} |`);
    }
    lines.push('');
  }

  if (diff.indexes.missingInRemote.length === 0 && diff.indexes.extraInRemote.length === 0) {
    lines.push('Indexes comparison complete. (Note: Full index comparison requires raw SQL access)');
    lines.push('');
  }

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');

  if (diff.tables.missingInRemote.length > 0) {
    lines.push('### Pending Migrations');
    lines.push('');
    lines.push('The following tables exist in your local schema but are missing from the remote database:');
    lines.push('');
    for (const table of diff.tables.missingInRemote) {
      lines.push(`- \`${table}\` - Check if a migration needs to be applied`);
    }
    lines.push('');
  }

  if (diff.tables.missingInLocal.length > 0) {
    lines.push('### Schema Drift');
    lines.push('');
    lines.push('The following tables exist in remote but not in local schema.sql:');
    lines.push('');
    for (const table of diff.tables.missingInLocal) {
      lines.push(`- \`${table}\` - May have been created directly in Supabase dashboard`);
    }
    lines.push('');
    lines.push('Consider adding these to schema.sql for documentation, or remove them if no longer needed.');
    lines.push('');
  }

  if (diff.tables.missingInRemote.length === 0 &&
      diff.tables.missingInLocal.length === 0 &&
      diff.views.missingInRemote.length === 0 &&
      diff.views.missingInLocal.length === 0) {
    lines.push('**Schema is in sync!** No action required.');
    lines.push('');
  }

  return lines.join('\n');
}

// ============== MAIN ==============

async function main() {
  console.log('=== Supabase Schema Comparison ===\n');

  // Validate environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
    process.exit(1);
  }

  // Check local schema file exists
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`Error: Schema file not found at ${SCHEMA_FILE}`);
    process.exit(1);
  }

  console.log('1. Parsing local schema...');
  const localSchema = parseLocalSchema(SCHEMA_FILE);
  console.log(`   Found ${localSchema.tables.size} tables, ${localSchema.views.length} views, ${localSchema.indexes.length} indexes`);
  console.log(`   Found ${localSchema.functions.length} functions, ${localSchema.triggers.length} triggers, ${localSchema.policies.length} policies`);

  console.log('\n2. Connecting to remote Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('   Introspecting remote schema...');

  // Try to get detailed schema info
  let remoteSchema = {
    tables: new Map(),
    views: new Set(),
    indexes: [],
    functions: [],
    triggers: [],
    policies: [],
    foreignKeys: []
  };

  // Use API-based introspection (works with standard Supabase permissions)
  const apiSchema = await getRemoteSchemaViaAPI(supabase);
  remoteSchema.tables = apiSchema.tables;
  remoteSchema.views = apiSchema.views;

  console.log(`   Found ${remoteSchema.tables.size} tables, ${remoteSchema.views.size} views in remote`);

  console.log('\n3. Comparing schemas...');
  const diff = compareSchemas(localSchema, remoteSchema);

  console.log('\n4. Generating report...');
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const report = generateReport(diff, localSchema, timestamp);

  // Write report to file
  fs.writeFileSync(OUTPUT_FILE, report);
  console.log(`   Report saved to: ${OUTPUT_FILE}`);

  // Print summary to console
  console.log('\n=== Summary ===');
  console.log(`Tables: ${localSchema.tables.size} local, ${remoteSchema.tables.size} remote`);
  console.log(`  - Matched: ${diff.tables.matched.length}`);
  console.log(`  - Missing in remote: ${diff.tables.missingInRemote.length}`);
  console.log(`  - Missing in local: ${diff.tables.missingInLocal.length}`);

  console.log(`Views: ${localSchema.views.length} local, ${remoteSchema.views.size} remote`);
  console.log(`  - Matched: ${diff.views.matched.length}`);
  console.log(`  - Missing in remote: ${diff.views.missingInRemote.length}`);
  console.log(`  - Missing in local: ${diff.views.missingInLocal.length}`);

  if (diff.tables.missingInRemote.length > 0) {
    console.log('\nTables missing in remote:');
    diff.tables.missingInRemote.forEach(t => console.log(`  - ${t}`));
  }

  if (diff.tables.missingInLocal.length > 0) {
    console.log('\nTables missing in local:');
    diff.tables.missingInLocal.forEach(t => console.log(`  - ${t}`));
  }

  if (diff.views.missingInRemote.length > 0) {
    console.log('\nViews missing in remote:');
    diff.views.missingInRemote.forEach(v => console.log(`  - ${v}`));
  }

  const hasDiscrepancies =
    diff.tables.missingInRemote.length > 0 ||
    diff.tables.missingInLocal.length > 0 ||
    diff.views.missingInRemote.length > 0 ||
    diff.views.missingInLocal.length > 0;

  if (!hasDiscrepancies) {
    console.log('\nSchema is in sync!');
  }

  console.log('\nFull report available at: schema-diff-report.md');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
