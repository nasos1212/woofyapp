import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { initializePushNotifications } from './push';
import { getScrollTop } from './scroll';

/**
 * Initialize native iOS/Android shell behavior.
 * Safe to call on web — it no-ops when not running in a native shell.
 */
export async function initializeNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // Tag the document so CSS can hide web-only chrome (e.g. Lovable badge)
  // and switch scrolling to #root so fixed top bars stay pinned on iOS.
  document.documentElement.classList.add('capacitor');
  document.body.classList.add('capacitor');

  setupKeyboardScroll();
  setupPullToRefresh();
  setupFixedBarRepair();

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
    // Register for Apple push notifications and keep the device token
    // synced so the backend can deliver alerts when the app is closed.
    initializePushNotifications();
  } catch (error) {
    console.warn('Push notifications init failed:', error);
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


/**
 * iOS WebKit sometimes leaves fixed bars (the top header) drawn at a stale
 * position after the screen size changes (call banner, keyboard, resume).
 * A tap or reload fixes it, so nudge a re-layout ourselves on those events.
 */
function setupFixedBarRepair(): void {
  let pending = false;
  const repair = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      // The document itself never scrolls in the native shell; snap it back
      // in case iOS shifted it (e.g. after the keyboard closed).
      if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
      document.querySelectorAll<HTMLElement>('header.fixed, header[class*="fixed"]').forEach((el) => {
        el.style.transform = 'translateZ(0)';
        void el.offsetHeight;
        el.style.transform = '';
      });
    });
  };
  const repairSoon = () => { repair(); setTimeout(repair, 300); };
  window.addEventListener('resize', repairSoon);
  window.addEventListener('orientationchange', repairSoon);
  window.visualViewport?.addEventListener('resize', repairSoon);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) repairSoon(); });
  window.addEventListener('focusout', () => setTimeout(repairSoon, 100));
  void App.addListener('resume', repairSoon);
  void Keyboard.addListener('keyboardDidHide', repairSoon);
}

/** Keep the focused field visible above the iOS keyboard. */
function setupKeyboardScroll(): void {
  document.addEventListener('focusin', (e) => {
    const el = e.target as HTMLElement | null;
    if (!el || !el.matches('input, textarea, select, [contenteditable="true"]')) return;
    setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 350);
  });
}

/** Pull down at the top of a page to reload it. */
function setupPullToRefresh(): void {
  const THRESHOLD = 90;
  let startY: number | null = null;
  let distance = 0;
  const indicator = document.createElement('div');
  indicator.setAttribute('aria-hidden', 'true');
  indicator.style.cssText =
    'position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 64px);width:36px;height:36px;margin-left:-18px;' +
    'border-radius:9999px;background:hsl(var(--card));box-shadow:0 2px 10px rgba(0,0,0,.15);z-index:9999;' +
    'display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s;pointer-events:none;' +
    'color:hsl(var(--primary));font-size:20px;font-weight:700;';
  indicator.textContent = '↻';
  document.body.appendChild(indicator);

  const inScrollable = (t: EventTarget | null) => {
    let el = t as HTMLElement | null;
    while (el && el !== document.body) {
      if (el.closest('[role="dialog"]')) return true;
      if (el.scrollHeight > el.clientHeight && el.scrollTop > 0) return true;
      el = el.parentElement;
    }
    return false;
  };

  window.addEventListener('touchstart', (e) => {
    startY = getScrollTop() <= 0 && !inScrollable(e.target) ? e.touches[0].clientY : null;
    distance = 0;
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (startY === null) return;
    distance = e.touches[0].clientY - startY;
    if (distance <= 0) { indicator.style.opacity = '0'; return; }
    const p = Math.min(distance / THRESHOLD, 1);
    indicator.style.opacity = String(p);
    indicator.style.transform = `translateY(${Math.min(distance, THRESHOLD) * 0.5}px) rotate(${p * 270}deg)`;
  }, { passive: true });
  window.addEventListener('touchend', () => {
    if (startY !== null && distance >= THRESHOLD) {
      window.location.reload();
      return;
    }
    indicator.style.opacity = '0';
    startY = null;
  });
}
