import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

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
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
  } catch (error) {
    console.warn('Keyboard resize mode failed:', error);
  }

  try {
    // Handle Universal Links / custom scheme deep links so email verification,
    // password reset, and shared content open inside the app.
    // iOS keeps returning the same launch URL for the whole app session, so
    // remember handled links to avoid an endless reload loop.
    const HANDLED_KEY = 'wooffy_handled_deep_links';
    const alreadyHandled = (url: string) => {
      try {
        const list: string[] = JSON.parse(localStorage.getItem(HANDLED_KEY) || '[]');
        if (list.includes(url)) return true;
        localStorage.setItem(HANDLED_KEY, JSON.stringify([...list.slice(-9), url]));
      } catch { /* ignore */ }
      return false;
    };

    const openDeepLink = async ({ url }: { url: string }) => {
      try {
        if (alreadyHandled(url)) return;
        await Browser.close().catch(() => undefined);
        if (url.startsWith('wooffy://')) {
          const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token && refresh_token) {
            const { supabase } = await import('@/integrations/supabase/client');
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) console.warn('Native sign-in failed:', error);
            if (window.location.pathname !== '/') window.location.replace('/');
          }
          return;
        }
        const parsed = new URL(url);
        const target = parsed.pathname + parsed.search + parsed.hash;
        const current = window.location.pathname + window.location.search + window.location.hash;
        if (target !== current) window.location.href = target;
      } catch (error) {
        console.warn('Failed to handle deep link:', url, error);
      }
    };

    App.addListener('appUrlOpen', openDeepLink);
    void App.getLaunchUrl().then((launch) => {
      if (launch?.url) void openDeepLink({ url: launch.url });
    });
  } catch (error) {
    console.warn('App deep link listener failed:', error);
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
