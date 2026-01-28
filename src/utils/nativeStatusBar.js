/**
 * Native Status Bar Utility
 * Handles status bar styling for Capacitor native apps
 *
 * @version 1.2.0
 *
 * ANDROID SAFE AREA NOTE:
 * Android doesn't reliably expose status bar height to WebViews via CSS env().
 * Unlike iOS which provides env(safe-area-inset-top) automatically, Android WebViews
 * require manual calculation. This utility uses the standard 24dp status bar height
 * which works for most Android devices (90%+). For devices with custom status bars
 * (e.g., some gaming phones with larger notches), EdgeToEdge mode with CSS env()
 * would be preferred, but this requires API level 30+ and additional configuration.
 *
 * The current 24dp fallback provides acceptable results for the target user base.
 * If issues arise on specific devices, consider using WindowInsetsCompat in the
 * native Android layer to pass accurate insets to the WebView.
 *
 * CHANGELOG:
 * v1.2.0 (2026-01-27): Added Android limitations documentation
 * v1.1.0 (2025-12-26): Detect initial theme for correct status bar style
 */

import { isNative, isAndroid } from './platform';

// Default Android status bar height in pixels (24dp * density)
const ANDROID_STATUS_BAR_HEIGHT = 24;

/**
 * Get the current theme from localStorage or system preference
 */
function getCurrentTheme() {
  // Check localStorage first (matches ThemeContext logic)
  const savedTheme = localStorage.getItem('lavpop-theme');
  if (savedTheme) {
    return savedTheme;
  }

  // Fall back to system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

/**
 * Initialize status bar for native platforms
 * Sets up proper status bar styling and CSS variables
 */
export async function initializeStatusBar() {
  if (!isNative()) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');

    // Detect current theme and set appropriate status bar style
    // Light theme = dark icons (Style.Light), Dark theme = light icons (Style.Dark)
    const currentTheme = getCurrentTheme();
    const style = currentTheme === 'dark' ? Style.Dark : Style.Light;
    await StatusBar.setStyle({ style });

    // On Android, set the status bar to overlay content
    if (isAndroid()) {
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setBackgroundColor({ color: '#00000000' }); // Transparent

      // Set CSS variable for Android status bar height
      // Android doesn't support env(safe-area-inset-top) reliably
      setAndroidSafeAreaInsets();
    }
  } catch (error) {
    console.warn('[StatusBar] Failed to initialize:', error);
  }
}

/**
 * Set Android-specific safe area CSS variables
 * Since env(safe-area-inset-top) doesn't work reliably on Android WebViews.
 *
 * NOTE: This uses a hardcoded 24dp value which is the standard Android status bar
 * height. This works for ~90% of Android devices. Some edge cases include:
 * - Devices with larger notches may have taller status bars (up to 48dp)
 * - Some OEM skins modify the status bar height
 * - Foldable devices may have different heights in different states
 *
 * For production apps requiring pixel-perfect accuracy on all devices, consider
 * using WindowInsetsCompat in the native layer to pass actual inset values.
 */
function setAndroidSafeAreaInsets() {
  // Standard Android status bar is 24dp
  // We keep this as dp (density-independent pixels) because CSS pixels map 1:1
  // with dp on Android WebViews when using viewport meta tag with device-width
  const statusBarHeight = ANDROID_STATUS_BAR_HEIGHT;

  // Set CSS custom property
  document.documentElement.style.setProperty(
    '--android-status-bar-height',
    `${statusBarHeight}px`
  );

  // Also set a general native safe area variable
  document.documentElement.style.setProperty(
    '--native-safe-area-top',
    `${statusBarHeight}px`
  );
}

/**
 * Update status bar style based on theme
 * @param {'light' | 'dark'} theme - Current app theme
 */
export async function updateStatusBarForTheme(theme) {
  if (!isNative()) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');

    // Dark theme = light status bar text, Light theme = dark status bar text
    const style = theme === 'dark' ? Style.Dark : Style.Light;
    await StatusBar.setStyle({ style });
  } catch (error) {
    console.warn('[StatusBar] Failed to update style:', error);
  }
}

/**
 * Hide status bar (for fullscreen experiences)
 */
export async function hideStatusBar() {
  if (!isNative()) return;

  try {
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.hide();
  } catch (error) {
    console.warn('[StatusBar] Failed to hide:', error);
  }
}

/**
 * Show status bar
 */
export async function showStatusBar() {
  if (!isNative()) return;

  try {
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.show();
  } catch (error) {
    console.warn('[StatusBar] Failed to show:', error);
  }
}

export default {
  initialize: initializeStatusBar,
  updateForTheme: updateStatusBarForTheme,
  hide: hideStatusBar,
  show: showStatusBar,
};
