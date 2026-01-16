# CLAUDE.md

This file provides guidance for Claude Code when working with this repository.

## Project Overview

Bilavnova Business Intelligence is a React-based business analytics dashboard for a Brazilian laundromat chain (formerly branded as Lavpop). It provides real-time insights into customer behavior, revenue, operations, and marketing campaigns.

**Live site:** https://www.bilavnova.com/

## Tech Stack

### Frontend
- **React 18** with Vite 7
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Lucide React** for icons
- **React Router DOM** for navigation

### Backend/Infrastructure
- **Supabase** for database and real-time sync
- **Netlify Functions** for serverless APIs
- **Capacitor** for Android native app
- **Sentry** for error tracking

### Python Automation
- **Selenium** for POS data scraping (POS_automation.py)
- **Google APIs** for Drive integration

## Project Structure

```
├── src/
│   ├── components/          # React components organized by feature
│   │   ├── auth/           # Authentication (LoginPage, ProtectedRoute)
│   │   ├── campaigns/      # Campaign management
│   │   ├── customers/      # Customer-related components
│   │   ├── drilldowns/     # Detail/drill-down views
│   │   ├── intelligence/   # Analytics and forecasting
│   │   ├── modals/         # Modal dialogs
│   │   ├── navigation/     # Bottom nav, sidebar
│   │   ├── social/         # Social media analytics
│   │   ├── ui/             # Reusable UI components
│   │   └── weather/        # Weather widgets
│   ├── views/              # Main page views
│   │   ├── Dashboard.jsx   # Main dashboard
│   │   ├── Customers.jsx   # Customer lifecycle tool
│   │   ├── Campaigns.jsx   # Campaign management
│   │   ├── Intelligence.jsx # Business intelligence
│   │   ├── Operations.jsx  # Operational metrics
│   │   ├── Weather.jsx     # Weather correlation
│   │   └── SocialMedia.jsx # Social analytics
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   ├── RealtimeSyncContext.jsx
│   │   └── DataFreshnessContext.jsx
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   │   ├── supabaseClient.js
│   │   ├── supabaseLoader.js
│   │   ├── dateUtils.js    # Brazilian date handling
│   │   ├── numberUtils.js  # Brazilian number formatting
│   │   ├── calculations.js # Business metrics
│   │   └── formatters.js
│   ├── constants/          # App constants
│   ├── config/             # Configuration
│   └── test/               # Test setup
├── netlify/functions/      # Serverless functions
│   ├── twilio-whatsapp.js  # WhatsApp messaging
│   ├── twilio-webhook.js   # Webhook handler
│   ├── campaign-scheduler.js # Scheduled campaigns
│   ├── weather-sync.js     # Weather data sync
│   ├── revenue-predict.js  # ML predictions
│   └── supabase-api.js     # Database API
├── supabase/
│   ├── schema.sql          # Database schema
│   └── migrations/         # SQL migrations
├── android/                # Capacitor Android app
├── public/                 # Static assets
└── data/                   # Local CSV data files
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage

# Build
npm run build         # Production build
npm run preview       # Preview production build

# Native app
npm run build:native  # Build + Capacitor sync
npm run cap:android   # Open Android Studio
npm run cap:sync      # Sync web assets to native

# Linting
npm run lint
```

## Testing

- **Framework:** Vitest with React Testing Library
- **Environment:** jsdom
- **Test files:** `src/**/*.{test,spec}.{js,jsx}`
- **Setup file:** `src/test/setup.js`

## Environment Variables

Set in Netlify dashboard or `.env` for local development:

```
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx (server-side only)

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=+5554xxx

# APIs
GOOGLE_API_KEY=xxx
VITE_SENTRY_DSN=xxx
```

## Brazilian Localization

This app uses Brazilian standards throughout:

### Date Formatting
- Format: DD/MM/YYYY
- Business week: Sunday through Saturday
- Timezone: America/Sao_Paulo
- Use `src/utils/dateUtils.js` for all date operations

### Number Formatting
- Decimal separator: comma (,)
- Thousands separator: period (.)
- Currency: R$ 1.234,56
- Use `src/utils/numberUtils.js` for all number formatting

### Examples
```javascript
// Correct
formatCurrency(1234.56)  // "R$ 1.234,56"
formatDate(date)         // "07/01/2026"

// Parsing
parseNumber("1.234,56")  // 1234.56
parseDate("07/01/2026")  // Date object
```

## Key Patterns

### Data Loading
Data is loaded from Supabase via `src/utils/supabaseLoader.js`. The app uses React contexts for global state:
- `AuthContext` - User authentication
- `RealtimeSyncContext` - Real-time data subscriptions
- `DataFreshnessContext` - Data freshness tracking
- `ThemeContext` - Dark/light mode

### Component Structure
- Use functional components with hooks
- Mobile-first responsive design
- Components use Tailwind CSS classes
- Animations via Framer Motion

### Error Handling
- Sentry integration via `@sentry/react`
- Custom error tracking in `src/utils/errorTracking.js`
- ErrorBoundary component wraps the app

## Database Schema

Key Supabase tables:
- `customers` - Customer records with RFM scores
- `sales` - Transaction history
- `campaigns` - Marketing campaigns
- `contact_tracking` - Message delivery tracking
- `blacklist` - Opted-out customers
- `weather_daily_metrics` - Weather data
- `app_settings` - Application configuration

Migrations are in `supabase/migrations/` with numbered prefixes.

## Netlify Functions

Scheduled functions:
- `campaign-scheduler` - Runs every 5 minutes for campaign dispatch
- `weather-sync` - Runs daily at 06:00 Brazil time

API functions:
- `twilio-whatsapp` - Send WhatsApp messages
- `twilio-webhook` - Handle delivery receipts
- `supabase-api` - Database operations
- `revenue-predict` - ML revenue predictions

## Python Automation

`POS_automation.py` scrapes POS data from the laundromat management system:
- Uses Selenium for browser automation
- Uploads data to Supabase via `supabase_uploader.py`
- Dependencies in `requirements.txt`

## Brand Colors

```css
--primary: #1a5a8e;      /* Lavpop Blue */
--accent: #55b03b;       /* Lavpop Green */
--light-blue: #e3f2fd;
--light-green: #e8f5e9;
--dark-blue: #0d3a5c;
```

## Code Style

- ESLint configuration in `eslint.config.js`
- Prefer functional components
- Use destructuring for props
- Keep components focused and small
- Use custom hooks to extract reusable logic
