import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    const handler = (event: Event) => {
      const { type, data } = (event as CustomEvent<PushTapData>).detail ?? {};

      if (type === "new_blog_post" && data?.slug) {
        navigate(`/blog/${data.slug}`);
      } else if (type === "new_partner") {
        navigate("/member/partners");
      } else if (type === "new_shelter") {
        navigate("/member/shelters");
      } else if (type === "lost_pet_alert" && data?.alert_id) {
        navigate(`/member/lost-found?alert=${data.alert_id}`);
      } else if (
        (type === "community_answer" ||
          type === "community_follow_activity" ||
          type === "answer_accepted") &&
        data?.question_id
      ) {
        navigate(`/community/question/${data.question_id}`);
      } else if (type === "family_invite" && data?.share_code) {
        navigate(`/member/join-family?code=${data.share_code}`);
      } else {
        navigate("/member/notifications");
      }
    };
    window.addEventListener("wooffy:push-tap", handler);
    return () => window.removeEventListener("wooffy:push-tap", handler);
  }, [navigate]);

  return null;
};

export default PushTapHandler;
