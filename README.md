# Bilavnova Business Intelligence

Modern React-based BI dashboard for Bilavnova laundromat business analytics.

**Live Site:** https://www.bilavnova.com/

## Features

### Dashboard
- Real-time KPIs with Hero/Secondary card layouts
- Operating cycles chart with weather correlation
- Pull-to-refresh mobile support
- Compact/Expanded layout toggle

### Customer Intelligence
- RFM segmentation analysis
- Churn risk prediction
- At-risk customer identification
- Customer lifecycle tracking

### Revenue Forecasting
- ML-based revenue predictions (OLS regression)
- Weather impact analysis
- Prediction accuracy tracking
- Contingency recommendations

### Campaign Management
- WhatsApp marketing automation
- Audience segmentation with filters
- Template management
- Delivery tracking and analytics

### Weather Analytics
- Weather-to-revenue correlation
- Business impact predictions
- Forecast integration

### Social Media
- WhatsApp analytics
- Instagram metrics integration
- Google Business Profile stats

## Tech Stack

### Frontend
- **React 18** with Vite 7
- **Tailwind CSS** with Cosmic Precision Design System v5.1
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend
- **Supabase** - PostgreSQL database + realtime subscriptions
- **Netlify Functions** - Serverless APIs
- **Capacitor** - Android native app
- **Sentry** - Error tracking

### Design System
The app uses the **Cosmic Precision Design System v5.1** featuring:
- Space-age aesthetics with stellar gradients
- Full dark mode support via `useTheme()` hook
- Glassmorphism effects (backdrop-blur)
- Mobile-first responsive design
- 5 component variants (A-E) for consistent styling

**Color Palette:**
- Space colors: Void `#050816`, Nebula `#0a0f1e`, Dust `#1a1f35`
- Stellar accents: Cyan `#00aeef`, Green `#00d68f`, Blue `#2d388a`

See `src/Design System.md` for complete documentation.

## Deployment

The application is deployed on **Netlify** with automatic deployments from main branch.

- **Production:** https://www.bilavnova.com/
- **Scheduled Functions:**
  - `campaign-scheduler` - Every 5 minutes
  - `weather-sync` - Daily at 06:00 BRT

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── src/
│   ├── components/          # 97 React components by feature
│   │   ├── auth/           # Authentication
│   │   ├── campaigns/      # Campaign management (13)
│   │   ├── customers/      # Customer analytics
│   │   ├── drilldowns/     # Detail views (5)
│   │   ├── intelligence/   # Forecasting (5)
│   │   ├── modals/         # Modal dialogs
│   │   ├── navigation/     # Nav components
│   │   ├── social/         # Social analytics (3)
│   │   ├── ui/             # UI primitives (23)
│   │   └── weather/        # Weather widgets (9)
│   ├── views/              # 9 main page views
│   ├── contexts/           # React contexts (4)
│   ├── hooks/              # Custom hooks (13)
│   ├── utils/              # Utility functions
│   ├── constants/          # App constants
│   └── config/             # Configuration
├── netlify/functions/      # Serverless functions
├── supabase/migrations/    # Database migrations (51)
└── android/                # Capacitor native app
```

## Documentation

- `CLAUDE.md` - AI assistant instructions and project patterns
- `src/Design System.md` - Cosmic Precision v5.1 design system
- `docs/` - Technical documentation

## Brazilian Localization

- **Dates:** DD/MM/YYYY format
- **Currency:** R$ 1.234,56
- **Timezone:** America/Sao_Paulo
- **Business week:** Sunday-Saturday
