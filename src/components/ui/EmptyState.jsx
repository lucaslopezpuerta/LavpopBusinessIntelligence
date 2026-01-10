// EmptyState.jsx v1.0 - EMPTY STATE COMPONENT
// Reusable component for displaying helpful messages when no data is available
// Design System v4.0 compliant
//
// CHANGELOG:
// v1.0 (2026-01-09): Initial implementation (UX Audit Phase 3.1)
//   - Configurable icon, title, description
//   - Optional action button with callback
//   - Multiple size variants (sm, md, lg)
//   - Framer Motion entrance animation
//   - Full dark mode support
//   - WCAG accessible

import React from 'react';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import Button from './Button';

// Animation configs
const containerAnimation = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
      staggerChildren: 0.1
    }
  }
};

const itemAnimation = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0 }
};

/**
 * Empty State Component
 * Displays a friendly message when there's no data to show
 *
 * @param {React.ComponentType} icon - Lucide icon component (default: Inbox)
 * @param {string} title - Main heading text
 * @param {string} description - Helper/explanatory text
 * @param {function} action - Optional callback when action button is clicked
 * @param {string} actionLabel - Text for the action button
 * @param {string} size - 'sm' | 'md' | 'lg' - Controls overall sizing
 * @param {string} className - Additional CSS classes
 */
const EmptyState = ({
  icon: Icon = Inbox,
  title = 'Nenhum dado encontrado',
  description,
  action,
  actionLabel = 'Começar',
  size = 'md',
  className = ''
}) => {
  // Size configurations
  const sizes = {
    sm: {
      container: 'py-6 px-4',
      iconWrapper: 'w-10 h-10 mb-3',
      icon: 'w-5 h-5',
      title: 'text-sm font-medium',
      description: 'text-xs mt-1',
      button: 'sm'
    },
    md: {
      container: 'py-10 px-6',
      iconWrapper: 'w-14 h-14 mb-4',
      icon: 'w-7 h-7',
      title: 'text-base font-semibold',
      description: 'text-sm mt-2',
      button: 'md'
    },
    lg: {
      container: 'py-16 px-8',
      iconWrapper: 'w-20 h-20 mb-6',
      icon: 'w-10 h-10',
      title: 'text-lg font-semibold',
      description: 'text-base mt-3',
      button: 'lg'
    }
  };

  const sizeConfig = sizes[size] || sizes.md;

  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center ${sizeConfig.container} ${className}`}
      initial="hidden"
      animate="visible"
      variants={containerAnimation}
      role="status"
      aria-label={title}
    >
      {/* Icon Container */}
      <motion.div
        variants={itemAnimation}
        className={`${sizeConfig.iconWrapper} rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center`}
      >
        <Icon
          className={`${sizeConfig.icon} text-slate-400 dark:text-slate-500`}
          aria-hidden="true"
        />
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemAnimation}
        className={`${sizeConfig.title} text-slate-700 dark:text-slate-200`}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          variants={itemAnimation}
          className={`${sizeConfig.description} text-slate-500 dark:text-slate-400 max-w-sm`}
        >
          {description}
        </motion.p>
      )}

      {/* Action Button */}
      {action && actionLabel && (
        <motion.div variants={itemAnimation} className="mt-4">
          <Button
            variant="secondary"
            size={sizeConfig.button}
            onClick={action}
          >
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
