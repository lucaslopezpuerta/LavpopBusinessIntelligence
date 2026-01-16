/**
 * BilavnovaLogo - SVG logo components for Bilavnova
 *
 * Cosmic Precision design system v4.0
 * Provides the Saturn icon and full logo variants with theme support.
 * Brand gradient: #2d388a (deep indigo) → #00aeef (stellar cyan)
 *
 * Features:
 * - Orbital ring animation wrapper
 * - Glassmorphism container support
 * - SVG stroke draw animation
 *
 * @version 2.0.0
 */

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Saturn icon only (for loading screens, favicons, compact spaces)
 *
 * @param {string} className - Additional CSS classes
 * @param {string} variant - 'gradient' | 'white' | 'dark' | 'current'
 * @param {string} gradientId - Unique ID for gradient (needed when multiple on page)
 */
export const BilavnovaIcon = ({
  className = '',
  variant = 'gradient',
  gradientId = 'bilavnovaGradient'
}) => {
  const getFill = () => {
    switch (variant) {
      case 'white': return '#ffffff';
      case 'dark': return '#1f2937';
      case 'current': return 'currentColor';
      case 'gradient':
      default: return `url(#${gradientId})`;
    }
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bilavnova logo"
      role="img"
    >
      {variant === 'gradient' && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2d388a"/>
            <stop offset="100%" stopColor="#00aeef"/>
          </linearGradient>
        </defs>
      )}
      <g fill={getFill()}>
        {/* Saturn planet with ring */}
        <path d="M88.47,49.8C88.19,65.87,78.32,80.58,63,86A38.48,38.48,0,0,1,17,30,38.85,38.85,0,0,1,57.82,12.12C75.7,15.82,88.16,31.77,88.47,49.8c0,1.93,3,1.93,3,0A42,42,0,0,0,64.41,10.91a41.48,41.48,0,0,0-50,60.19A41.89,41.89,0,0,0,57.29,90.62c19.79-3.48,33.84-21,34.19-40.83C91.5,47.87,88.5,47.87,88.47,49.8Z"/>
        <path d="M3.3,51.3H97.63a1.5,1.5,0,0,0,0-3H3.3a1.5,1.5,0,0,0,0,3h0Z"/>
      </g>
    </svg>
  );
};

/**
 * Full horizontal logo (Saturn icon + "Bil.AVA N.OVA" text)
 * For headers, splash screens, and prominent branding
 *
 * @param {string} className - Additional CSS classes
 * @param {string} variant - 'gradient' | 'white' | 'dark'
 * @param {boolean} iconOnly - If true, renders only the text portion (icon separate)
 */
export const BilavnovaFullLogo = ({
  className = '',
  variant = 'gradient',
  iconOnly = false
}) => {
  const getIconFill = () => {
    switch (variant) {
      case 'white': return '#ffffff';
      case 'dark': return '#000000';
      case 'gradient':
      default: return 'url(#fullLogoGradient)';
    }
  };

  const getTextFill = () => {
    switch (variant) {
      case 'white': return '#ffffff';
      case 'dark': return '#060606';
      case 'gradient':
      default: return null; // Uses separate fills for left/right text
    }
  };

  const leftTextFill = getTextFill() || '#060606';
  const rightTextFill = getTextFill() || 'url(#fullLogoGradient)';

  return (
    <svg
      viewBox="0 0 357 89"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bilavnova full logo"
      role="img"
    >
      <defs>
        <linearGradient id="fullLogoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2d388a"/>
          <stop offset="100%" stopColor="#00aeef"/>
        </linearGradient>
      </defs>

      {/* Saturn icon */}
      {!iconOnly && (
        <g transform="matrix(0.742,0,0,0.742,0,3)" fill={getIconFill()}>
          <path d="M88.47,49.8C88.19,65.87,78.32,80.58,63,86A38.48,38.48,0,0,1,17,30,38.85,38.85,0,0,1,57.82,12.12C75.7,15.82,88.16,31.77,88.47,49.8c0,1.93,3,1.93,3,0A42,42,0,0,0,64.41,10.91a41.48,41.48,0,0,0-50,60.19A41.89,41.89,0,0,0,57.29,90.62c19.79-3.48,33.84-21,34.19-40.83C91.5,47.87,88.5,47.87,88.47,49.8Z"/>
          <path d="M3.3,51.3H97.63a1.5,1.5,0,0,0,0-3H3.3a1.5,1.5,0,0,0,0,3h0Z"/>
        </g>
      )}

      {/* "Bil.AVA" text - left portion */}
      <g transform="matrix(1.72,0,0,1.72,87,19)" fill={leftTextFill}>
        <path d="M12.18 12.18 q1.04 0.64 1.52 1.84 q0.28 0.64 0.28 1.58 q0 1.46 -0.78 2.45 t-2.28 1.47 q-0.94 0.32 -2.22 0.32 l-6.38 0 q-0.28 0 -0.49 -0.21 t-0.21 -0.49 l0 -1.44 q0 -0.3 0.21 -0.51 t0.49 -0.21 l6.54 0 q1.16 0 1.72 -0.42 q0.48 -0.4 0.48 -1.09 t-0.5 -1.13 q-0.62 -0.54 -1.86 -0.54 l-6.38 0 q-0.28 0 -0.49 -0.21 t-0.21 -0.51 l0 -1.38 q0 -0.28 0.21 -0.49 t0.49 -0.21 l6.02 0 q0.86 0 1.34 -0.3 q0.34 -0.2 0.54 -0.58 q0.14 -0.28 0.14 -0.65 t-0.1 -0.67 q-0.08 -0.24 -0.28 -0.44 q-0.44 -0.5 -1.46 -0.5 l-6.2 0 q-0.28 0 -0.49 -0.21 t-0.21 -0.51 l0 -1.44 q0 -0.28 0.21 -0.49 t0.49 -0.21 l6.02 0 q2.48 0 3.82 1.4 q1.14 1.14 1.14 2.86 q0 1.84 -1.12 2.92 z M18.64 10.94 q0.3 0 0.5 0.21 t0.2 0.51 l0 7.48 q0 0.28 -0.2 0.49 t-0.5 0.21 l-1.52 0 q-0.28 0 -0.49 -0.21 t-0.21 -0.49 l0 -7.48 q0 -0.3 0.21 -0.51 t0.49 -0.21 l1.52 0 z M18.64 5 q0.3 0 0.5 0.21 t0.2 0.49 l0 3.7 q0 0.3 -0.2 0.51 t-0.5 0.21 l-1.52 0 q-0.28 0 -0.49 -0.21 t-0.21 -0.51 l0 -3.7 q0 -0.28 0.21 -0.49 t0.49 -0.21 l1.52 0 z M24.8 5 q0.28 0 0.49 0.21 t0.21 0.49 l0 13.4 q0 0.28 -0.21 0.49 t-0.49 0.21 l-1.52 0 q-0.28 0 -0.49 -0.21 t-0.21 -0.49 l0 -13.4 q0 -0.28 0.21 -0.49 t0.49 -0.21 l1.52 0 z M32.1 16.94 q0.3 0 0.5 0.21 t0.2 0.49 l0 1.46 q0 0.28 -0.2 0.49 t-0.5 0.21 l-4.66 0 q-0.3 0 -0.5 -0.21 t-0.2 -0.49 l0 -1.46 q0 -0.28 0.2 -0.49 t0.5 -0.21 l4.66 0 z M47.9 18.86 q0.14 0.32 -0.07 0.65 t-0.57 0.33 l-13.32 0 q-0.18 0 -0.34 -0.09 t-0.24 -0.23 q-0.22 -0.32 -0.06 -0.66 l0.62 -1.46 q0.08 -0.2 0.26 -0.32 t0.38 -0.12 l9.32 0 l-3.28 -7.84 l-2.68 6.4 q-0.08 0.2 -0.25 0.31 t-0.39 0.11 l-1.68 0 q-0.38 0 -0.6 -0.32 q-0.08 -0.14 -0.1 -0.32 t0.04 -0.34 l4.06 -9.52 q0.08 -0.2 0.25 -0.32 t0.39 -0.12 l1.92 0 q0.22 0 0.39 0.12 t0.25 0.32 z M62.16 5.32 q0.22 0.3 0.08 0.66 l-5.48 13.54 q-0.08 0.2 -0.26 0.32 t-0.4 0.12 l-1.76 0 q-0.22 0 -0.4 -0.12 t-0.26 -0.32 l-5.48 -13.54 q-0.16 -0.34 0.06 -0.66 t0.58 -0.32 l6.68 0 q0.28 0 0.49 0.21 t0.21 0.51 l0 1.46 q0 0.3 -0.21 0.51 t-0.49 0.21 l-3.36 0 l3.06 7.7 l4.02 -10.16 q0.08 -0.2 0.26 -0.32 t0.4 -0.12 l1.68 0 q0.18 0 0.34 0.09 t0.24 0.23 z"/>
      </g>

      {/* "N.OVA" text - right portion with gradient */}
      <g transform="matrix(1.72,0,0,1.72,194,19)" fill={rightTextFill}>
        <path d="M13.88 5 q0.28 0 0.49 0.21 t0.21 0.49 l0 13.4 q0 0.28 -0.21 0.49 t-0.49 0.21 l-1.76 0 q-0.36 0 -0.58 -0.28 l-9.78 -13.4 q-0.12 -0.16 -0.14 -0.36 t0.07 -0.38 t0.26 -0.28 t0.37 -0.1 l1.76 0 q0.16 0 0.32 0.07 t0.24 0.21 l7.02 9.54 l0 -9.12 q0 -0.28 0.2 -0.49 t0.5 -0.21 l1.52 0 z M3.84 14.7 q0.28 0 0.49 0.2 t0.21 0.5 l0 3.7 q0 0.28 -0.21 0.49 t-0.49 0.21 l-1.52 0 q-0.28 0 -0.49 -0.21 t-0.21 -0.49 l0 -3.7 q0 -0.3 0.21 -0.5 t0.49 -0.2 l1.52 0 z M23.62 5.16 q0.24 0.2 0.24 0.54 l0 1.5 q0 0.26 -0.15 0.45 t-0.41 0.25 q-1.28 0.26 -2.18 1.22 q-1.22 1.28 -1.22 3.33 t1.22 3.35 q0.9 0.94 2.18 1.2 q0.26 0.06 0.41 0.25 t0.15 0.45 l0 1.5 q0 0.32 -0.24 0.54 q-0.22 0.16 -0.46 0.16 l-0.12 0 q-2.32 -0.38 -3.98 -2.1 q-2.08 -2.14 -2.08 -5.33 t2.08 -5.37 q1.62 -1.68 3.98 -2.08 q0.32 -0.06 0.58 0.14 z M29.9 7.1 q2.08 2.18 2.08 5.37 t-2.08 5.33 q-1.66 1.72 -3.98 2.1 l-0.12 0 q-0.24 0 -0.46 -0.16 q-0.24 -0.22 -0.24 -0.54 l0 -1.5 q0 -0.26 0.15 -0.45 t0.41 -0.25 q1.28 -0.26 2.18 -1.2 q1.22 -1.3 1.22 -3.35 t-1.22 -3.33 q-0.9 -0.96 -2.18 -1.22 q-0.26 -0.06 -0.41 -0.25 t-0.15 -0.45 l0 -1.5 q0 -0.34 0.25 -0.54 t0.57 -0.14 q2.36 0.4 3.98 2.08 z M46.86 5.32 q0.22 0.3 0.08 0.66 l-5.48 13.54 q-0.08 0.2 -0.26 0.32 t-0.4 0.12 l-1.76 0 q-0.22 0 -0.4 -0.12 t-0.26 -0.32 l-5.48 -13.54 q-0.16 -0.34 0.06 -0.66 t0.58 -0.32 l6.68 0 q0.28 0 0.49 0.21 t0.21 0.51 l0 1.46 q0 0.3 -0.21 0.51 t-0.49 0.21 l-3.36 0 l3.06 7.7 l4.02 -10.16 q0.08 -0.2 0.26 -0.32 t0.4 -0.12 l1.68 0 q0.18 0 0.34 0.09 t0.24 0.23 z M61.84 18.86 q0.14 0.32 -0.07 0.65 t-0.57 0.33 l-13.32 0 q-0.18 0 -0.34 -0.09 t-0.24 -0.23 q-0.22 -0.32 -0.06 -0.66 l0.62 -1.46 q0.08 -0.2 0.26 -0.32 t0.38 -0.12 l9.32 0 l-3.28 -7.84 l-2.68 6.4 q-0.08 0.2 -0.25 0.31 t-0.39 0.11 l-1.68 0 q-0.38 0 -0.6 -0.32 q-0.08 -0.14 -0.1 -0.32 t0.04 -0.34 l4.06 -9.52 q0.08 -0.2 0.25 -0.32 t0.39 -0.12 l1.92 0 q0.22 0 0.39 0.12 t0.25 0.32 z"/>
      </g>
    </svg>
  );
};

/**
 * Animated logo for loading screens
 * Wraps BilavnovaIcon with a glow animation
 */
export const BilavnovaAnimatedIcon = ({
  className = '',
  containerClassName = '',
  animate = true,
  prefersReducedMotion = false
}) => {
  return (
    <motion.div
      className={`flex items-center justify-center ${containerClassName}`}
      animate={animate && !prefersReducedMotion ? {
        filter: [
          'drop-shadow(0 0 20px rgba(45, 56, 138, 0.3))',
          'drop-shadow(0 0 40px rgba(0, 174, 239, 0.5))',
          'drop-shadow(0 0 20px rgba(45, 56, 138, 0.3))',
        ],
      } : undefined}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <BilavnovaIcon className={className} variant="gradient" />
    </motion.div>
  );
};

/**
 * Orbital Logo Container - Cosmic Precision design
 * Saturn icon with rotating orbital ring, glassmorphism background, and glow effects
 * Uses explicit pixel values for precise centering
 *
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 * @param {boolean} showOrbit - Show rotating orbital ring
 * @param {boolean} showGlass - Apply glassmorphism container
 * @param {boolean} isDark - Dark theme mode
 * @param {boolean} prefersReducedMotion - Disable animations
 */
export const OrbitalLogoContainer = ({
  size = 'md',
  showOrbit = true,
  showGlass = true,
  isDark = true,
  prefersReducedMotion = false,
  className = '',
  gradientId = 'orbitalLogoGradient'
}) => {
  // Explicit pixel values for precise centering
  const sizeConfig = {
    sm: { containerPx: 64, ringPx: 88, logoPx: 32, padding: 12, radius: 12 },
    md: { containerPx: 96, ringPx: 128, logoPx: 48, padding: 20, radius: 16 },
    lg: { containerPx: 112, ringPx: 144, logoPx: 56, padding: 24, radius: 24 },
    xl: { containerPx: 128, ringPx: 160, logoPx: 64, padding: 28, radius: 24 },
  };

  const config = sizeConfig[size] || sizeConfig.md;
  const ringOffset = (config.ringPx - config.containerPx) / 2;

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: config.ringPx,
        height: config.ringPx,
      }}
    >
      {/* Orbital ring - centered around container */}
      {showOrbit && (
        <motion.div
          className="absolute border-2 border-transparent rounded-full"
          style={{
            width: config.ringPx,
            height: config.ringPx,
            top: 0,
            left: 0,
            borderTopColor: isDark ? 'rgba(0, 174, 239, 0.6)' : 'rgba(45, 56, 138, 0.5)',
            borderRightColor: isDark ? 'rgba(0, 174, 239, 0.25)' : 'rgba(45, 56, 138, 0.2)',
          }}
          animate={prefersReducedMotion ? {} : { rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Logo container - centered within ring */}
      <motion.div
        className={`
          absolute flex items-center justify-center
          ${showGlass ? 'glass' : ''}
          ${isDark
            ? 'bg-space-dust/70 border border-stellar-cyan/20'
            : 'bg-white/90 border border-stellar-blue/10 shadow-xl'
          }
        `}
        style={{
          width: config.containerPx,
          height: config.containerPx,
          top: ringOffset,
          left: ringOffset,
          borderRadius: config.radius,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        animate={prefersReducedMotion ? {} : {
          boxShadow: isDark
            ? [
                '0 0 20px rgba(45, 56, 138, 0.3), 0 0 40px rgba(0, 174, 239, 0.15)',
                '0 0 30px rgba(0, 174, 239, 0.4), 0 0 60px rgba(45, 56, 138, 0.2)',
                '0 0 20px rgba(45, 56, 138, 0.3), 0 0 40px rgba(0, 174, 239, 0.15)',
              ]
            : [
                '0 4px 24px rgba(45, 56, 138, 0.15)',
                '0 4px 32px rgba(0, 174, 239, 0.25)',
                '0 4px 24px rgba(45, 56, 138, 0.15)',
              ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <BilavnovaIcon
          style={{ width: config.logoPx, height: config.logoPx }}
          variant="gradient"
          gradientId={gradientId}
        />
      </motion.div>
    </div>
  );
};

export default BilavnovaIcon;
