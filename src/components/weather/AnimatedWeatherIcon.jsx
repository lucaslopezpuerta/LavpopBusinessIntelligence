// AnimatedWeatherIcon.jsx v1.4 - MODE-AWARE AMBER BADGE MIGRATION
// SVG animated weather icons with CSS animations
// Respects prefers-reduced-motion for accessibility
//
// CHANGELOG:
// v1.4 (2026-01-29): Mode-aware amber badge migration
//   - Replaced bg-yellow-600 dark:bg-yellow-500 with mode-aware amber badge styling
//   - New pattern: bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400
// v1.3 (2026-01-29): Orange to yellow color migration
//   - Updated orange-600/orange-500 to yellow-600/yellow-500 in bgColorMap
// v1.2 (2026-01-29): Amber to orange color migration
//   - Updated amber-600/amber-500 to orange-600/orange-500 in bgColorMap
// v1.1 (2026-01-29): Solid color icon-well migration
//   - Updated WeatherIconWithBackground bgColorMap from opacity-based to solid
//   - Icon-well pattern: bg-{color}-600 dark:bg-{color}-500 (icon uses text-white)
// v1.0 (2025-12-20): Initial implementation
//   - 12 weather icon variants
//   - Size variants: sm, md, lg, xl
//   - CSS-based animations
//   - Dark mode support

import React from 'react';
import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Snowflake,
  Wind,
  Droplets
} from 'lucide-react';

// Size configuration
const SIZE_MAP = {
  sm: { container: 'w-8 h-8', icon: 'w-5 h-5' },
  md: { container: 'w-12 h-12', icon: 'w-8 h-8' },
  lg: { container: 'w-16 h-16', icon: 'w-10 h-10' },
  xl: { container: 'w-20 h-20', icon: 'w-14 h-14' },
  '2xl': { container: 'w-24 h-24', icon: 'w-16 h-16' }
};

// Icon mapping from Visual Crossing codes
const ICON_MAP = {
  'clear-day': { Icon: Sun, animation: 'animate-sun-pulse', color: 'text-amber-500' },
  'clear-night': { Icon: Moon, animation: '', color: 'text-indigo-400' },
  'partly-cloudy-day': { Icon: CloudSun, animation: 'animate-cloud-drift', color: 'text-sky-500' },
  'partly-cloudy-night': { Icon: CloudMoon, animation: 'animate-cloud-drift', color: 'text-indigo-400' },
  'cloudy': { Icon: Cloud, animation: 'animate-cloud-drift', color: 'text-slate-500' },
  'rain': { Icon: CloudRain, animation: 'animate-rain-fall', color: 'text-blue-500' },
  'showers-day': { Icon: CloudRain, animation: 'animate-rain-fall', color: 'text-blue-500' },
  'showers-night': { Icon: CloudRain, animation: 'animate-rain-fall', color: 'text-blue-600' },
  'thunder-rain': { Icon: CloudLightning, animation: 'animate-pulse', color: 'text-purple-500' },
  'thunder-showers-day': { Icon: CloudLightning, animation: 'animate-pulse', color: 'text-purple-500' },
  'thunder-showers-night': { Icon: CloudLightning, animation: 'animate-pulse', color: 'text-purple-600' },
  'snow': { Icon: Snowflake, animation: 'animate-snow-fall', color: 'text-cyan-400' },
  'snow-showers-day': { Icon: CloudSnow, animation: 'animate-snow-fall', color: 'text-cyan-400' },
  'snow-showers-night': { Icon: CloudSnow, animation: 'animate-snow-fall', color: 'text-cyan-500' },
  'fog': { Icon: CloudFog, animation: 'animate-pulse-subtle', color: 'text-slate-400' },
  'wind': { Icon: Wind, animation: 'animate-cloud-drift', color: 'text-teal-500' },
  'hail': { Icon: CloudSnow, animation: 'animate-rain-fall', color: 'text-slate-500' }
};

// Default icon for unknown codes
const DEFAULT_ICON = { Icon: Cloud, animation: '', color: 'text-slate-500' };

/**
 * Check if user prefers reduced motion
 */
function useReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * AnimatedWeatherIcon Component
 *
 * @param {Object} props
 * @param {string} props.icon - Visual Crossing icon code (e.g., 'clear-day', 'rain')
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg', 'xl', '2xl'
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.animated - Enable animations (default: true)
 * @param {string} props.colorOverride - Override default color
 */
const AnimatedWeatherIcon = ({
  icon,
  size = 'md',
  className = '',
  animated = true,
  colorOverride = null
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { Icon, animation, color } = ICON_MAP[icon] || DEFAULT_ICON;
  const sizes = SIZE_MAP[size] || SIZE_MAP.md;

  // Disable animation if user prefers reduced motion or animated=false
  const animationClass = animated && !prefersReducedMotion ? animation : '';
  const iconColor = colorOverride || color;

  return (
    <div
      className={`
        ${sizes.container}
        flex items-center justify-center
        ${className}
      `}
    >
      <Icon
        className={`
          ${sizes.icon}
          ${iconColor}
          ${animationClass}
          transition-colors duration-200
        `}
      />
    </div>
  );
};

/**
 * WeatherIconWithBackground - Icon with colored background
 */
export const WeatherIconWithBackground = ({
  icon,
  size = 'md',
  className = ''
}) => {
  const { color } = ICON_MAP[icon] || DEFAULT_ICON;

  // Map text color to solid background color
  const bgColorMap = {
    'text-amber-500': 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400',
    'text-indigo-400': 'bg-indigo-600 dark:bg-indigo-500',
    'text-sky-500': 'bg-sky-600 dark:bg-sky-500',
    'text-slate-500': 'bg-slate-600 dark:bg-slate-500',
    'text-blue-500': 'bg-blue-600 dark:bg-blue-500',
    'text-blue-600': 'bg-blue-600 dark:bg-blue-500',
    'text-purple-500': 'bg-purple-600 dark:bg-purple-500',
    'text-purple-600': 'bg-purple-600 dark:bg-purple-500',
    'text-cyan-400': 'bg-cyan-600 dark:bg-cyan-500',
    'text-cyan-500': 'bg-cyan-600 dark:bg-cyan-500',
    'text-slate-400': 'bg-slate-600 dark:bg-slate-500',
    'text-teal-500': 'bg-teal-600 dark:bg-teal-500'
  };

  const bgColor = bgColorMap[color] || 'bg-slate-600 dark:bg-slate-500';

  return (
    <div
      className={`
        rounded-xl ${bgColor} p-2
        ${className}
      `}
    >
      <AnimatedWeatherIcon icon={icon} size={size} colorOverride="text-white" />
    </div>
  );
};

/**
 * Get just the icon component for a weather code (for use in other components)
 */
export function getWeatherIcon(iconCode) {
  const { Icon } = ICON_MAP[iconCode] || DEFAULT_ICON;
  return Icon;
}

/**
 * Get icon info for a weather code
 */
export function getWeatherIconInfo(iconCode) {
  return ICON_MAP[iconCode] || DEFAULT_ICON;
}

export default AnimatedWeatherIcon;
