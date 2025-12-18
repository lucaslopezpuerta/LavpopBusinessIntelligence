# CLAUDE.md - Lavpop Business Intelligence

## Project Overview

React-based Business Intelligence dashboard for **Lavpop** (Brazilian laundromat business). Provides customer analytics, WhatsApp marketing campaigns, operational metrics, and financial insights.

**Live Site**: https://www.bilavnova.com/

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18.3 + Vite 5.4 |
| Styling | Tailwind CSS 3.4 |
| Charts | Recharts 2.14 |
| Database | Supabase (PostgreSQL) |
| Backend | Netlify Functions (serverless) |
| Testing | Vitest + @testing-library/react |
| PWA | vite-plugin-pwa |

## Quick Commands

```bash
# Development
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm run preview      # Preview production build

# Testing
npm run test         # Watch mode
npm run test:run     # Single run
npm run test:coverage # With coverage report

# Linting
npm run lint         # ESLint check
```

## Project Structure

```
src/
├── views/              # Main tab views (7 views)
│   ├── Dashboard.jsx   # KPIs, revenue trends, operating cycles
│   ├── Customers.jsx   # RFM segmentation, churn analysis
│   ├── Campaigns.jsx   # WhatsApp marketing, automation
│   ├── Intelligence.jsx # Forecasting, weather impact
│   ├── Operations.jsx  # Machine utilization, peak hours
│   ├── Directory.jsx   # Customer browsing
│   └── DataUploadView.jsx
├── components/         # 80+ React components
│   ├── campaigns/      # Campaign management components
│   ├── customers/      # Customer detail components
│   ├── intelligence/   # Analytics/forecasting sections
│   ├── drilldowns/     # Detail modals
│   └── ui/             # Design system components
├── utils/              # 35+ utility modules
├── contexts/           # React contexts (Theme, Sidebar, Settings, etc.)
├── hooks/              # Custom hooks (useBlacklist, useContactTracking, etc.)
└── config/             # Configuration files

netlify/functions/      # Serverless API endpoints
├── supabase-api.js     # Database proxy
├── twilio-whatsapp.js  # WhatsApp messaging
├── waba-analytics.js   # WhatsApp Business API analytics
├── meta-social.js      # Instagram/Facebook metrics
└── campaign-scheduler.js

supabase/migrations/    # Database schema migrations
```

## Key Conventions

### Brazilian Locale
- **Dates**: DD/MM/YYYY format (e.g., "18/12/2025")
- **Numbers**: Comma as decimal separator (e.g., "1.234,56")
- **Currency**: R$ prefix (e.g., "R$ 1.234,56")
- **Timezone**: America/Sao_Paulo
- **Business Week**: Sunday to Saturday

### Code Style
- ESLint with React Hooks plugin
- Functional components with hooks
- Tailwind CSS for styling (no separate CSS files for components)
- Brand colors: Primary blue (#1a5a8e), Accent green (#55b03b)

### Component Patterns
- View components in `src/views/`
- Reusable UI in `src/components/ui/`
- Custom hooks prefix: `use` (e.g., `useBlacklist`, `useReducedMotion`)
- Contexts provide app-wide state (Theme, Sidebar, AppSettings)

## Database (Supabase)

Main tables:
- `customers` - Customer records with RFM scores
- `transactions` - Sales data
- `campaigns` - Marketing campaigns
- `contact_tracking` - WhatsApp message tracking
- `blacklist` - Opt-out customers
- `app_settings` - Application configuration

Migrations are in `supabase/migrations/` (numbered sequentially).

## Environment Variables

For Netlify Functions:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `TWILIO_ACCOUNT_SID` - Twilio credentials
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`
- `META_ACCESS_TOKEN` - Meta Graph API token
- `GOOGLE_API_KEY` - Google Business API

For Vite (prefix with `VITE_`):
- `VITE_GOOGLE_API_KEY`

## Testing

Tests located alongside source files with `.test.js` suffix:
```
src/utils/phoneUtils.test.js
src/utils/blacklistService.test.js
src/utils/campaignService.test.js
```

Run tests: `npm run test:run`

## Deployment

- **GitHub Pages**: Auto-deploys on push to `main` via `.github/workflows/deploy.yml`
- **Netlify**: Serverless functions deployed automatically

## Important Files

- `src/App.jsx` - Main app with routing and layout
- `src/index.css` - Global styles and Tailwind config
- `vite.config.js` - Build config with PWA settings
- `docs/` - Feature documentation and guides

## Known Issues / Tech Debt

See `CODEBASE_AUDIT_REPORT.md` for detailed audit. Key items:
- Test coverage is low (4/10 rating)
- Some API keys need to be moved to backend functions
- Weather API should use Netlify function proxy

## Documentation

- `docs/SUPABASE_SETUP.md` - Database setup guide
- `docs/CAMPAIGNS_TAB.md` - Campaign feature docs
- `docs/RFM_MIGRATION.md` - RFM scoring implementation
- `src/Design System.md` - UI component reference
