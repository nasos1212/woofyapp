import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "@/integrations/supabase/client";

const PRODUCTION_ORIGIN = "https://wooffy.app";

const nativeLovableAuth = createLovableAuth({
  oauthBrokerUrl: `${PRODUCTION_ORIGIN}/~oauth/initiate`,
});

export async function signInWithGoogleFromNative() {
  const result = await nativeLovableAuth.signInWithOAuth("google", {
    redirect_uri: `${PRODUCTION_ORIGIN}/auth`,
    extraParams: {
      prompt: "select_account",
    },
  });

  if (result.redirected || result.error) {
    return result;
  }

  try {
    await supabase.auth.setSession(result.tokens);
    return result;
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}