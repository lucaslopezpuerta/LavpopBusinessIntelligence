// InsightBox.jsx v1.0 - CHART INSIGHTS COMPONENT
// Reusable component for displaying actionable insights below charts
// 
// CHANGELOG:
// v1.0 (2025-11-24): Initial implementation
//   - Displays insights with icons and colored backgrounds
//   - Supports success (green), warning (amber), info (blue) types
//   - Fully responsive with dark mode support

import React from 'react';
import { CheckCircle, AlertTriangle, Info, TrendingUp } from 'lucide-react';

const InsightBox = ({ insights }) => {
    if (!insights || insights.length === 0) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4" />;
            case 'warning': return <AlertTriangle className="w-4 h-4" />;
            case 'action': return <TrendingUp className="w-4 h-4" />;
            default: return <Info className="w-4 h-4" />;
        }
    };

    const getStyles = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400';
            case 'warning':
                return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400';
            case 'action':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400';
            default:
                return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
        }
    };

    return (
        <div className="mt-4 space-y-2">
            {insights.map((insight, index) => (
                <div
                    key={index}
                    className={`flex items-start gap-2 p-3 rounded-lg border text-xs font-medium ${getStyles(insight.type)}`}
                >
                    <span className="flex-shrink-0 mt-0.5">{getIcon(insight.type)}</span>
                    <span>{insight.text}</span>
                </div>
            ))}
        </div>
    );
};

export default InsightBox;
