import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/** Minimum gap between two logged sessions for the same device. */
export const SESSION_GAP_MS = 30 * 60 * 1000;
const LAST_KEY = 'wooffy_last_session_logged';

export function shouldLogSession(lastLoggedAt: number | null, now: number): boolean {
  return lastLoggedAt === null || now - lastLoggedAt >= SESSION_GAP_MS;
}

let appVersion: string | null = null;

async function logSession() {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(LAST_KEY);
    if (!shouldLogSession(raw ? Number(raw) : null, now)) return;
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;
    const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web';
    if (platform !== 'web' && !appVersion) {
      try {
        const { App } = await import('@capacitor/app');
        appVersion = (await App.getInfo()).version;
      } catch { /* ignore */ }
    }
    localStorage.setItem(LAST_KEY, String(now));
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'app_session',
      metadata: { platform, app_version: appVersion },
    });
  } catch (e) {
    console.warn('Session tracking failed', e);
  }
}

/** Logs one session per app open / return (throttled), for web and iOS. */
export function initSessionTracking() {
  void logSession();
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') void logSession();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void logSession();
  });
}
