// DataUploadView.jsx v1.3 - MOBILE-FRIENDLY
// View wrapper for the data upload functionality with history tab
//
// This view allows manual CSV uploads to Supabase:
//   - sales.csv: Transaction data
//   - customer.csv: Customer data
//
// Tabs:
//   - Upload: Drag & drop CSV import
//   - Historico: View past uploads from upload_history table
//
// CHANGELOG:
// v1.3 (2025-12-26): Mobile-friendly tab navigation
//   - Full-width tabs on mobile (< sm breakpoint)
//   - Flexible tab container that adapts to screen size
// v1.2 (2025-12-24): Added upload history tab
//   - Tab navigation between Upload and Historico
//   - UploadHistoryTab component for viewing past uploads
//   - Auto-refresh history after successful upload
// v1.1 (2025-12-13): Pass onDataChange for auto-refresh after upload
//   - Triggers app-wide data refresh after successful upload
//   - Keeps dashboards in sync with newly uploaded data

import React, { useState } from 'react';
import { Upload, Clock } from 'lucide-react';
import DataUpload from '../components/DataUpload';
import UploadHistoryTab from '../components/UploadHistoryTab';

const DataUploadView = ({ onDataChange }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // Wrapper for onDataChange that also triggers history refresh
  const handleDataChange = (source) => {
    // Trigger history refresh
    setHistoryRefresh(prev => prev + 1);
    // Call original handler
    if (onDataChange) {
      onDataChange(source);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation - full width on mobile */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('upload')}
          className={`
            flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all
            ${activeTab === 'upload'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }
          `}
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`
            flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all
            ${activeTab === 'history'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }
          `}
        >
          <Clock className="w-4 h-4" />
          Histórico
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'upload' ? (
        <DataUpload onDataChange={handleDataChange} />
      ) : (
        <UploadHistoryTab refreshTrigger={historyRefresh} />
      )}
    </div>
  );
};

export default DataUploadView;
