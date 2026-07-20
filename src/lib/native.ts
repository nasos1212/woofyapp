import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Initialize native iOS/Android shell behavior.
 * Safe to call on web — it no-ops when not running in a native shell.
 */
export async function initializeNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // Tag the document so CSS can hide web-only chrome (e.g. Lovable badge)
  document.body.classList.add('capacitor');

  try {
    // Dark status bar text/icons on our dark background
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1A1A2E' });
  } catch (error) {
    console.warn('StatusBar init failed:', error);
  }

  try {
    // Keep the splash visible until React has rendered, then hide it.
    // Call this once the app shell is ready.
    await SplashScreen.hide();
  } catch (error) {
    console.warn('SplashScreen hide failed:', error);
  }

  try {
    // Let the web view resize when the keyboard opens instead of pushing
    // fixed bottom nav bars up and breaking layout.
    await Keyboard.setResizeMode({ mode: 'body' });
  } catch (error) {
    console.warn('Keyboard resize mode failed:', error);
  }

  try {
    // Listen for app state changes if needed for analytics or refresh logic.
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Active:', isActive);
    });
  } catch (error) {
    console.warn('App state listener failed:', error);
  }
}

/**
 * Open an external URL using the native browser (SFSafariViewController / Chrome Custom Tab).
 * Falls back to window.open on web.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    await Browser.open({ url, presentationStyle: 'popover' });
  } catch (error) {
    console.warn('Browser.open failed:', error);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Hide the native splash screen once the React app is mounted and ready.
 */
export async function hideSplashScreen(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await SplashScreen.hide();
  } catch (error) {
    console.warn('SplashScreen hide failed:', error);
  }
}
