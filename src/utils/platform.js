/**
 * Platform detection utilities for Capacitor
 *
 * Provides functions to detect if the app is running as:
 * - Native app (iOS or Android)
 * - Web browser (PWA or regular)
 *
 * @version 1.0.0
 */

/**
 * Check if Capacitor is available
 * @returns {boolean}
 */
export function isCapacitorAvailable() {
  return typeof window !== 'undefined' && window.Capacitor !== undefined;
}

/**
 * Check if running as native app
 * @returns {boolean}
 */
export function isNative() {
  if (!isCapacitorAvailable()) return false;
  return window.Capacitor.isNativePlatform();
}

/**
 * Check if running on iOS
 * @returns {boolean}
 */
export function isIOS() {
  if (!isCapacitorAvailable()) return false;
  return window.Capacitor.getPlatform() === 'ios';
}

/**
 * Check if running on Android
 * @returns {boolean}
 */
export function isAndroid() {
  if (!isCapacitorAvailable()) return false;
  return window.Capacitor.getPlatform() === 'android';
}

/**
 * Check if running on web (browser)
 * @returns {boolean}
 */
export function isWeb() {
  return !isNative();
}

/**
 * Get current platform name
 * @returns {'ios' | 'android' | 'web'}
 */
export function getPlatform() {
  if (!isCapacitorAvailable()) return 'web';
  return window.Capacitor.getPlatform();
}

/**
 * Platform info object for easy access
 * Uses getters to evaluate at access time (not module load time)
 */
export const Platform = {
  get isNative() { return isNative(); },
  get isIOS() { return isIOS(); },
  get isAndroid() { return isAndroid(); },
  get isWeb() { return isWeb(); },
  get name() { return getPlatform(); },
};

export default Platform;
