# Supabase Setup Guide for Lavpop BI

This guide will walk you through setting up Supabase as your backend database.

## Overview

Supabase provides:
- **PostgreSQL database** - For storing campaigns, blacklist, logs
- **REST API** - Auto-generated from your schema
- **Real-time subscriptions** - For live updates (optional)
- **Free tier** - 500MB database, perfect for starting out

---

## Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email

---

## Step 2: Create New Project

1. Click **"New Project"**
2. Fill in the details:
   - **Name**: `Bilavnova` (or any name you prefer)
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users (e.g., South America - São Paulo)
3. Click **"Create new project"**
4. Wait 2-3 minutes for setup to complete

---

## Step 3: Get Your API Keys

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **"API"** in the left menu
3. Copy these values:

```
Project URL:        https://xxxxxxxxxxxxx.supabase.co
anon (public) key:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZHhiZ3JpZXRpc2V5cm1ubGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxOTQxOTUsImV4cCI6MjA4MDc3MDE5NX0.8WYk3Wd41xiqBDzmA2_7i6_h-Upb2OxbkrrjIMXJ_B0
service_role key:   eyJhbGciOiJIUzI1NiIsInR5cCI6...  ⚠️ KEEP SECRET!
```

**Important**:
- `anon key` is safe for client-side (public)
- `service_role key` is for server-side only (Netlify functions)

---

## Step 4: Create Database Tables

1. Go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the editor
5. Click **"Run"** (or Ctrl+Enter)

You should see: `Success. No rows returned.`

### Verify Tables Created

1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - `blacklist`
   - `campaigns`
   - `campaign_sends`
   - `scheduled_campaigns`
   - `comm_logs`
   - `automation_rules`

---

## Step 5: Configure Netlify Environment Variables

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Your project URL |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOi...` | Service role key (secret!) |

**Note**: You already have Twilio variables configured. Don't remove those.

---

## Step 6: Install Supabase Client (Netlify Functions)

The Netlify functions need the Supabase client. It's already added to your project, but you need to install dependencies:

```bash
cd netlify/functions
npm init -y  # If package.json doesn't exist
npm install @supabase/supabase-js
```

Or add to your root `package.json`:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0"
  }
}
```

Then run `npm install`.

---

## Step 7: Deploy and Test

1. Commit your changes:
```bash
git add .
git commit -m "Add Supabase integration for campaigns backend"
git push
```

2. Netlify will auto-deploy

3. Test the API:
```bash
# Test blacklist endpoint
curl -X POST https://your-site.netlify.app/.netlify/functions/supabase-api \
  -H "Content-Type: application/json" \
  -d '{"action": "blacklist.getAll"}'
```

---

## Step 8: Migrate Existing Data

If you have data in localStorage, use the migration utility in the app:

1. Open your app in the browser
2. Open DevTools Console (F12)
3. Run the migration:

```javascript
// This will migrate all localStorage data to Supabase
await window.migrateToSupabase();
```

Or use the Migration Manager component in the Campaigns tab (if added).

---

## Database Schema Reference

### blacklist
| Column | Type | Description |
|--------|------|-------------|
| phone | TEXT (PK) | Normalized phone (+5554996923504) |
| customer_name | TEXT | Customer name |
| reason | TEXT | opt-out, undelivered, number-blocked, manual |
| source | TEXT | twilio-sync, manual, csv-import |
| error_code | INT | Twilio error code |
| added_at | TIMESTAMP | When added |

### campaigns
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | CAMP_timestamp |
| name | TEXT | Campaign name |
| template_id | TEXT | Template reference |
| audience | TEXT | Target segment |
| status | TEXT | draft, active, paused, completed |
| sends | INT | Total successful sends |

### scheduled_campaigns
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | SCHED_timestamp |
| template_id | TEXT | Template to use |
| recipients | JSONB | Array of recipients |
| scheduled_for | TIMESTAMP | When to send |
| status | TEXT | scheduled, processing, sent, failed |

---

## Scheduled Campaign Executor

The `campaign-scheduler` function runs every 5 minutes automatically:

1. Checks `scheduled_campaigns` for due campaigns
2. Sends WhatsApp messages via Twilio
3. Updates status to `sent` or `failed`
4. Logs results to `campaign_sends`

### Monitoring

Check function logs in Netlify:
1. Go to **Functions** tab
2. Click `campaign-scheduler`
3. View execution logs

---

## Troubleshooting

### "Supabase credentials not configured"
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set in Netlify
- Redeploy after adding environment variables

### "relation does not exist"
- Run the schema.sql script in Supabase SQL Editor
- Make sure all tables were created

### Scheduled campaigns not executing
- Check that the cron schedule is correct in netlify.toml
- View function logs in Netlify dashboard
- Ensure Twilio credentials are also configured

### CORS errors
- The functions include CORS headers for all origins
- If using a custom domain, verify it's allowed

---

## Security Best Practices

1. **Never expose `service_role` key** in client-side code
2. **Enable RLS** (Row Level Security) if you add user authentication
3. **Use environment variables** for all secrets
4. **Regularly rotate keys** if you suspect they're compromised

---

## Cost Estimates

### Supabase Free Tier
- 500MB database
- 1GB file storage
- 50,000 monthly active users
- 500MB bandwidth

This is plenty for a single-tenant business like Lavpop.

### When to Upgrade
- Database > 500MB
- Need point-in-time recovery
- Need more than 2 projects
- Need priority support

Pro plan starts at $25/month.

---

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Create database schema
3. ✅ Configure Netlify environment variables
4. ✅ Deploy functions
5. ⬜ Migrate existing localStorage data
6. ⬜ Test campaign scheduling
7. ⬜ Monitor function executions
