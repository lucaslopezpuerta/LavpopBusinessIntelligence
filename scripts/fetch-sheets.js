/**
 * Fetch Data from Google Drive (Both Sheets and CSV files)
 * Runs daily via GitHub Actions to pull latest data
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const { format } = require('date-fns-tz');

// Configuration: Map your Google Drive files
const FILES_CONFIG = [
  // CSV files stored in Google Drive (download directly)
  {
    type: 'csv',
    fileId: process.env.SALES_FILE_ID || 'YOUR_SALES_FILE_ID',
    outputFile: 'sales.csv'
  },
  {
    type: 'csv',
    fileId: process.env.RFM_FILE_ID || 'YOUR_RFM_FILE_ID',
    outputFile: 'rfm.csv'
  },
  {
    type: 'csv',
    fileId: process.env.CUSTOMER_FILE_ID || 'YOUR_CUSTOMER_FILE_ID',
    outputFile: 'customer.csv'
  },
  {
    type: 'csv',
    fileId: process.env.BLACKLIST_FILE_ID || 'YOUR_BLACKLIST_FILE_ID',
    outputFile: 'blacklist.csv'
  },
  {
    type: 'csv',
    fileId: process.env.TWILIO_FILE_ID || 'YOUR_TWILIO_FILE_ID',
    outputFile: 'twilio.csv'
  },
  // Google Sheets (export as CSV)
  {
    type: 'sheet',
    fileId: process.env.WEATHER_SHEET_ID || 'YOUR_WEATHER_SHEET_ID',
    sheetName: 'Weather Master', // Tab name in the sheet
    outputFile: 'weather.csv'
  },
  {
    type: 'sheet',
    fileId: process.env.CAMPAIGNS_SHEET_ID || 'YOUR_CAMPAIGNS_SHEET_ID',
    sheetName: 'Coupon Campaign Registry', // Tab name in the sheet
    outputFile: 'campaigns.csv'
  }
];

/**
 * Convert 2D array to CSV string
 */
function arrayToCSV(data) {
  if (!data || data.length === 0) return '';
  
  return data.map(row => 
    row.map(cell => {
      // Handle null/undefined
      if (cell === null || cell === undefined) return '';
      
      // Convert to string
      const str = String(cell);
      
      // Escape cells containing commas, quotes, or newlines
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      
      return str;
    }).join(',')
  ).join('\n');
}

/**
 * Download CSV file directly from Google Drive
 */
async function downloadCSVFile(drive, fileId, fileName) {
  try {
    console.log(`📥 Downloading CSV: ${fileName}`);
    
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: 'media'
      },
      { responseType: 'text' }
    );

    if (!response.data) {
      console.warn(`⚠️  No data in ${fileName}`);
      return null;
    }

    console.log(`✅ Downloaded ${fileName}`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Error downloading ${fileName}:`, error.message);
    throw error;
  }
}

/**
 * Fetch data from a Google Sheet and convert to CSV
 */
async function fetchSheet(sheets, fileId, sheetName) {
  try {
    console.log(`📥 Fetching Sheet: ${sheetName} (${fileId})`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: fileId,
      range: `${sheetName}!A:ZZ`, // Fetch all columns
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.warn(`⚠️  No data found in ${sheetName}`);
      return null;
    }

    console.log(`✅ Fetched ${rows.length} rows from ${sheetName}`);
    return arrayToCSV(rows);
    
  } catch (error) {
    console.error(`❌ Error fetching ${sheetName}:`, error.message);
    throw error;
  }
}

/**
 * Save CSV content to file
 */
async function saveCSV(csvContent, filename) {
  const dataDir = path.join(process.cwd(), 'data');
  
  // Create data directory if it doesn't exist
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore
  }
  
  const filePath = path.join(dataDir, filename);
  
  await fs.writeFile(filePath, csvContent, 'utf8');
  
  const lines = csvContent.split('\n').length;
  console.log(`💾 Saved: ${filename} (${lines} lines)`);
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Parse Google credentials from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    
    // Authenticate with Google APIs
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.readonly'
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });
    
    console.log('🔐 Authenticated with Google APIs');
    console.log(`⏰ Current time (Brazil): ${format(new Date(), 'yyyy-MM-dd HH:mm:ss zzz', { timeZone: 'America/Sao_Paulo' })}`);
    console.log('━'.repeat(50));

    // Fetch all configured files
    const fetchPromises = FILES_CONFIG.map(async (config) => {
      try {
        let csvContent = null;
        
        if (config.type === 'csv') {
          // Download CSV file from Drive
          csvContent = await downloadCSVFile(drive, config.fileId, config.outputFile);
        } else if (config.type === 'sheet') {
          // Fetch Google Sheet and convert to CSV
          csvContent = await fetchSheet(sheets, config.fileId, config.sheetName);
        }
        
        if (csvContent) {
          await saveCSV(csvContent, config.outputFile);
          return { success: true, file: config.outputFile };
        }
        return { success: false, file: config.outputFile, error: 'No data' };
      } catch (error) {
        return { success: false, file: config.outputFile, error: error.message };
      }
    });

    const results = await Promise.all(fetchPromises);
    
    console.log('━'.repeat(50));
    console.log('📊 Summary:');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successfully fetched: ${successful.length}/${results.length} files`);
    
    if (failed.length > 0) {
      console.log(`❌ Failed: ${failed.length} files`);
      failed.forEach(f => console.log(`   - ${f.file}: ${f.error}`));
      process.exit(1); // Exit with error code to trigger failure notification
    }
    
    console.log('🎉 Data fetch completed successfully!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();
