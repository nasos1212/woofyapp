import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type Token,
} from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { supabase } from "@/integrations/supabase/client";

export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/**
 * Set the app icon badge count (home screen).
 * No-op on web.
 */
export async function setAppBadge(count: number): Promise<void> {
  if (!isNativeApp()) return;
  try {
    await LocalNotifications.setBadgeCount({ count: Math.max(0, count) });
  } catch (error) {
    console.warn("setAppBadge failed:", error);
  }
}

let pushInitialized = false;
let pendingToken: string | null = null;

const saveToken = async (token: string): Promise<void> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      // No session yet — remember the token and save it once the user signs in.
      pendingToken = token;
      return;
    }
    const platform = Capacitor.getPlatform();
    const { error } = await supabase
      .from("push_tokens")
      .upsert(
        { user_id: user.id, token, platform },
        { onConflict: "token" }
      );
    if (error) console.warn("Failed to save push token:", error.message);
  } catch (error) {
    console.warn("Failed to save push token:", error);
  }
};

/**
 * Register the device for Apple push notifications and keep the
 * device token in sync with the user's account. Safe to call on web —
 * it no-ops outside the native iOS/Android shell.
 */
export function initializePushNotifications(): void {
  if (!isNativeApp() || pushInitialized) return;
  pushInitialized = true;

  try {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && pendingToken) {
        const token = pendingToken;
        pendingToken = null;
        void saveToken(token);
      }
    });

    void (async () => {
      try {
        let status = await PushNotifications.checkPermissions();
        if (status.receive !== "granted") {
          status = await PushNotifications.requestPermissions();
        }
        if (status.receive !== "granted") {
          console.warn("Push notifications permission not granted");
          return;
        }

        PushNotifications.addListener("registration", (token: Token) => {
          void saveToken(token.value);
        });

        PushNotifications.addListener("registrationError", (error) => {
          console.warn("Push registration error:", error);
        });

        // User tapped a notification while the app was closed/backgrounded.
        // The app relaunches into the app; route them to the notifications page.
        PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            const data = (action.notification?.data ?? {}) as {
              notification_id?: string;
              type?: string;
            };
            window.dispatchEvent(
              new CustomEvent("wooffy:push-tap", { detail: data })
            );
          }
        );

        await PushNotifications.register();
      } catch (error) {
        console.warn("Push setup failed:", error);
      }
    })();
  } catch (error) {
    console.warn("Push init failed:", error);
  }
}
