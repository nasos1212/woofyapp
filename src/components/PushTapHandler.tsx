import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Opens the notifications page when the user taps a push notification
 * that launched the app.
 */
const PushTapHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => navigate("/member/notifications");
    window.addEventListener("wooffy:push-tap", handler);
    return () => window.removeEventListener("wooffy:push-tap", handler);
  }, [navigate]);

  return null;
};

export default PushTapHandler;
