export interface NotificationLinkData {
  slug?: string;
  alert_id?: string;
  question_id?: string;
  business_id?: string;
  shelter_id?: string;
  share_code?: string;
  conversation_id?: string;
  action_url?: string;
}

export function notificationDestination(type: string, rawData: unknown, id?: string): string {
  const data = (rawData && typeof rawData === "object" ? rawData : {}) as NotificationLinkData;
  const encoded = encodeURIComponent;
  if (type === "new_blog_post" && data.slug) return `/blog/${encoded(data.slug)}`;
  if (type === "lost_pet_alert" && data.alert_id) return `/member/lost-found?alert=${encoded(data.alert_id)}`;
  if (["community_answer", "community_follow_activity", "answer_accepted"].includes(type) && data.question_id) return `/community/question/${encoded(data.question_id)}`;
  if (type === "family_invite" && data.share_code) return `/member/join-family?code=${encoded(data.share_code)}`;
  if (type === "support_reply" && data.conversation_id) return `/member/notifications?conversation=${encoded(data.conversation_id)}`;
  if (type === "new_partner") return data.business_id ? `/business/${encoded(data.business_id)}` : "/member/partners";
  if (type === "adoption_inquiry") return "/shelter-dashboard?tab=inquiries";
  if (type === "new_shelter") return "/member/shelters";
  if (type === "review_request" && data.business_id) return `/business/${encoded(data.business_id)}`;
  if (type === "redemption") return "/member/history";
  if (type === "business_birthday_reminder") return "/business/birthdays";
  if (type === "pet_birthday" || type === "anniversary") return "/member";
  // Only allow same-site action links, never arbitrary external redirect URLs.
  if (data.action_url) {
    try {
      const url = new URL(data.action_url, "https://wooffy.app");
      if (["https://wooffy.app", "https://www.wooffy.app"].includes(url.origin)) return url.pathname + url.search + url.hash;
    } catch { /* Fall back to opening the notification itself. */ }
  }
  return id ? `/member/notifications?notification=${encoded(id)}` : "/member/notifications";
}