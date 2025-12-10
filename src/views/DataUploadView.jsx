// DataUploadView.jsx v1.0
// View wrapper for the data upload functionality
//
// This view allows manual CSV uploads to Supabase:
//   - sales.csv: Transaction data
//   - customer.csv: Customer data
//
// Auto-detects file type and handles batch uploads with progress feedback.

import React from 'react';
import DataUpload from '../components/DataUpload';

const DataUploadView = () => {
  return (
    <div className="space-y-6">
      <DataUpload />
    </div>
  );
};

export default DataUploadView;
