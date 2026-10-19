import { strict as assert } from "node:assert";
import { notificationDestination } from "../src/lib/notificationRouting";

assert.equal(notificationDestination("lost_pet_alert", { alert_id: "lost-pet-1" }), "/member/lost-found?alert=lost-pet-1");
assert.equal(notificationDestination("new_blog_post", { slug: "apollon" }), "/blog/apollon");
assert.equal(notificationDestination("community_follow_activity", { question_id: "question-1", answer_id: "answer-1" }), "/community/question/question-1");
assert.equal(notificationDestination("support_reply", { conversation_id: "request-1" }), "/member/notifications?conversation=request-1");
assert.equal(notificationDestination("new_partner", { business_id: "partner-1" }), "/business/partner-1");
assert.equal(notificationDestination("announcement", {}, "notice-1"), "/member/notifications?notification=notice-1");
assert.equal(notificationDestination("announcement", { action_url: "https://evil.example/path" }, "notice-1"), "/member/notifications?notification=notice-1");
assert.equal(notificationDestination("adoption_inquiry", { inquiry_id: "inq-1" }), "/shelter-dashboard?tab=inquiries");
console.log("Notification destination tests passed");