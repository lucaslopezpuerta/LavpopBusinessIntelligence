# Lavpop Business Intelligence

Modern React-based BI dashboard for Lavpop laundromat business analytics.

## 🎯 Features

- **Real-time Data Loading**: Automatically loads 7 CSV files from `/data` folder
- **Brazilian Standards**: DD/MM/YYYY dates, comma decimal separators, Sunday-Saturday weeks
- **Tab Navigation**: Dashboard, Customers, Analytics, Operations views
- **Responsive Design**: Mobile-friendly interface
- **Brand Colors**: Primary blue (#1a5a8e), accent green (#55b03b)

## 📊 Data Files

The app expects the following CSV files in `/public/data/`:

1. `sales.csv` - Sales transactions
2. `rfm.csv` - Customer RFM segmentation
3. `customer.csv` - Customer records
4. `blacklist.csv` - Blacklist data
5. `twilio.csv` - SMS communication records
6. `weather.csv` - Weather correlations
7. `campaigns.csv` - Campaign information

## 🚀 Deployment to GitHub Pages

### Step 1: Create Repository

1. Go to https://github.com/lucaslopezpuerta/LavpopBusinessIntelligence
2. If repository doesn't exist, create it
3. Clone or copy this project to that repository

### Step 2: Upload Files

```bash
cd lavpop-bi
git init
git add .
git commit -m "Initial commit - Lavpop BI Foundation"
git branch -M main
git remote add origin https://github.com/lucaslopezpuerta/LavpopBusinessIntelligence.git
git push -u origin main
```

### Step 3: Copy Data Files

Your GitHub Actions workflow already fetches data to `/data`. You need to:

1. Update the workflow to also copy files to `/public/data/` before building
2. Or modify the CSV loader to fetch from `/data/` instead of `/public/data/`

**Option A - Update GitHub Actions** (Recommended):

Add this step before the build in your existing `fetch-data.yml`:

```yaml
- name: Copy data for React app
  run: |
    mkdir -p public/data
    cp data/*.csv public/data/
```

**Option B - Update CSV Loader**:

In `src/utils/csvLoader.js`, change:
```javascript
const response = await fetch(`/data/${filename}`);
```

### Step 4: Enable GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Under "Build and deployment":
   - Source: **GitHub Actions**
3. The workflow will automatically deploy on every push to `main`

### Step 5: Access Your BI Dashboard

After deployment completes (2-3 minutes), visit:
```
https://lucaslopezpuerta.github.io/LavpopBusinessIntelligence/
```

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
lavpop-bi/
├── public/
│   └── data/           # CSV files (for local testing)
├── src/
│   ├── utils/
│   │   ├── csvLoader.js      # CSV loading and parsing
│   │   ├── dateUtils.js      # Brazilian date handling
│   │   ├── numberUtils.js    # Brazilian number formatting
│   │   └── calculations.js   # Business logic
│   ├── components/           # React components (to be built)
│   ├── views/               # View components (to be built)
│   ├── App.jsx              # Main app with tab navigation
│   ├── App.css              # Lavpop brand styling
│   └── main.jsx
├── .github/
│   └── workflows/
│       └── deploy.yml       # Auto-deploy to GitHub Pages
└── vite.config.js           # Vite configuration
```

## 🔧 Next Steps (Week 1 Complete!)

- ✅ Vite + React foundation
- ✅ CSV loader with PapaParse
- ✅ Brazilian date/number utilities
- ✅ Core calculation functions
- ✅ Tab navigation shell
- ✅ GitHub Pages deployment config
- ✅ Loading screens with progress
- ✅ Brand styling

**Coming in Week 2:**
- Dashboard view with KPI cards
- Revenue trend chart
- Customer health gauge
- Risk alerts section

## 🎨 Brand Colors

```css
--primary: #1a5a8e;      /* Lavpop Blue */
--accent: #55b03b;       /* Lavpop Green */
--light-blue: #e3f2fd;
--light-green: #e8f5e9;
--dark-blue: #0d3a5c;
```

## 📝 Notes

- All calculations use Brazilian timezone (America/Sao_Paulo)
- Business week: Sunday-Saturday
- Currency formatting: R$ 1.234,56
- Date parsing handles: DD/MM/YYYY, DD-MM-YYYY, and ISO formats
- Machine counting: "Lavadora: 1, Secadora: 2"

## 🤝 Integration

This foundation is ready to integrate your existing **CustomerLifecycleTool-V2_1.jsx** as the Customers tab. Simply:

1. Copy the component to `src/views/CustomerLifecycleTool.jsx`
2. Import in `App.jsx`
3. Pass the loaded data as props

The utilities already match your existing tool's format, so integration should be seamless.
