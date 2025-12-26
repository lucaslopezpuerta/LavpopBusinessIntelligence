/**
 * Native Status Bar Utility
 * Handles status bar styling for Capacitor native apps
 *
 * @version 1.1.0
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
 * Since env(safe-area-inset-top) doesn't work on Android
 */
function setAndroidSafeAreaInsets() {
  // Get device pixel ratio for density-independent pixels
  const density = window.devicePixelRatio || 1;

  // Calculate status bar height in CSS pixels
  // Standard Android status bar is 24dp
  const statusBarHeight = Math.round(ANDROID_STATUS_BAR_HEIGHT * (density / density)); // Keep as dp

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
