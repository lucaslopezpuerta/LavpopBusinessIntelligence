// KPIDetailModal.jsx v3.0 - BASEMODAL MIGRATION
// KPI drill-down modal using unified BaseModal component
// Design System v5.1 compliant - Tier 2 Enhanced
//
// CHANGELOG:
// v3.0 (2026-01-31): BaseModal migration
//   - Migrated to BaseModal component for consistent UX
//   - Removed duplicate boilerplate (portal, animations, swipe, scroll lock)
//   - Uses solidIconColors prop for solid icon well backgrounds
//   - Reduced from ~250 lines to ~50 lines
// v2.15 (2026-01-31): Enhanced drag handle
// v2.14 (2026-01-31): Enhanced modal transitions
// v2.13 (2026-01-30): Swipe-to-close and portal rendering
// v2.12 (2026-01-29): Amber color standardization
// v2.11 (2026-01-29): Orange to yellow color migration
// v2.10 (2026-01-29): Solid color migration
// v2.9 (2026-01-27): Animation standardization
// v2.8 (2026-01-17): Cosmic Precision upgrade

import React from 'react';
import BaseModal from '../ui/BaseModal';

/**
 * KPIDetailModal - Drill-down modal for KPI metrics
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback when modal should close
 * @param {string} title - Modal title (metric name)
 * @param {string} subtitle - Optional subtitle (e.g., "Últimas 8 semanas")
 * @param {React.ReactNode} children - Drill-down content (charts, tables)
 * @param {string} maxWidth - Tailwind max-width class (default: 'max-w-2xl')
 * @param {React.ComponentType} icon - Lucide icon for header
 * @param {'green' | 'blue' | 'purple' | 'cyan' | 'orange' | 'red' | 'slate'} color - Icon well color
 * @param {string|React.ReactNode} badge - Optional badge in header
 */
const KPIDetailModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '2xl',
  icon,
  color = 'slate',
  badge
}) => {
  // Map legacy maxWidth prop format (e.g., 'max-w-2xl') to BaseModal format ('2xl')
  const normalizedMaxWidth = maxWidth.replace('max-w-', '');

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="large"
      maxWidth={normalizedMaxWidth}
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconColor={color}
      solidIconColors={true}
      badge={badge}
      contentClassName="p-6"
    >
      {children}
    </BaseModal>
  );
};

export default KPIDetailModal;
