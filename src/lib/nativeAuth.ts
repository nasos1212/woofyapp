import { Browser } from "@capacitor/browser";

const PRODUCTION_ORIGIN = "https://wooffy.app";

export async function signInWithGoogleFromNative() {
  const stateBytes = crypto.getRandomValues(new Uint8Array(16));
  // "native" prefix tells the website callback to hand tokens back to the app.
  const state = "native" + Array.from(stateBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const params = new URLSearchParams({
    provider: "google",
    redirect_uri: `${PRODUCTION_ORIGIN}/auth`,
    state,
    prompt: "select_account",
  });

  try {
    await Browser.open({
      url: `${PRODUCTION_ORIGIN}/~oauth/initiate?${params.toString()}`,
      presentationStyle: "fullscreen",
    });
    return { error: null, redirected: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}