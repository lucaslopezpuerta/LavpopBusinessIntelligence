// DataUploadView.jsx v1.1
// View wrapper for the data upload functionality
//
// This view allows manual CSV uploads to Supabase:
//   - sales.csv: Transaction data
//   - customer.csv: Customer data
//
// Auto-detects file type and handles batch uploads with progress feedback.
//
// CHANGELOG:
// v1.1 (2025-12-13): Pass onDataChange for auto-refresh after upload
//   - Triggers app-wide data refresh after successful upload
//   - Keeps dashboards in sync with newly uploaded data

import React from 'react';
import DataUpload from '../components/DataUpload';

const DataUploadView = ({ onDataChange }) => {
  return (
    <div className="space-y-6">
      <DataUpload onDataChange={onDataChange} />
    </div>
  );
};

export default DataUploadView;
