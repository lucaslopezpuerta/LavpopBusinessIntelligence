// AnimatedWeatherIcon.jsx v1.0
// SVG animated weather icons with CSS animations
// Respects prefers-reduced-motion for accessibility
//
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

  // Map text color to background color
  const bgColorMap = {
    'text-amber-500': 'bg-amber-100 dark:bg-amber-900/30',
    'text-indigo-400': 'bg-indigo-100 dark:bg-indigo-900/30',
    'text-sky-500': 'bg-sky-100 dark:bg-sky-900/30',
    'text-slate-500': 'bg-slate-100 dark:bg-slate-800',
    'text-blue-500': 'bg-blue-100 dark:bg-blue-900/30',
    'text-blue-600': 'bg-blue-100 dark:bg-blue-900/30',
    'text-purple-500': 'bg-purple-100 dark:bg-purple-900/30',
    'text-purple-600': 'bg-purple-100 dark:bg-purple-900/30',
    'text-cyan-400': 'bg-cyan-100 dark:bg-cyan-900/30',
    'text-cyan-500': 'bg-cyan-100 dark:bg-cyan-900/30',
    'text-slate-400': 'bg-slate-100 dark:bg-slate-800',
    'text-teal-500': 'bg-teal-100 dark:bg-teal-900/30'
  };

  const bgColor = bgColorMap[color] || 'bg-slate-100 dark:bg-slate-800';

  return (
    <div
      className={`
        rounded-xl ${bgColor} p-2
        ${className}
      `}
    >
      <AnimatedWeatherIcon icon={icon} size={size} />
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
