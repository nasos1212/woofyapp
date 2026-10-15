import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { consumePendingPushTap } from "@/lib/push";
import { notificationDestination } from "@/lib/notificationRouting";

interface PushTapData {
  notification_id?: string;
  type?: string;
  data?: {
    slug?: string;
    alert_id?: string;
    question_id?: string;
    business_id?: string;
    share_code?: string;
  };
}

/**
 * Opens the right page when the user taps a push notification that
 * launched the app. Falls back to the notifications page when the
 * notification type has no dedicated destination.
 */
const PushTapHandler = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    const handler = () => {
      const tap = consumePendingPushTap();
      if (!tap) return;
      navigate(notificationDestination(
        typeof tap.type === "string" ? tap.type : "",
        tap.data,
        typeof tap.notification_id === "string" ? tap.notification_id : undefined,
      ));
    };
    window.addEventListener("wooffy:push-tap", handler);
    handler();
    return () => window.removeEventListener("wooffy:push-tap", handler);
  }, [navigate, user, loading]);

  return null;
};

export default PushTapHandler;
