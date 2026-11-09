import { strict as assert } from "node:assert";
import { createReminderPreview, isPreviewReminder } from "../src/lib/reminderPreview";

const samples = createReminderPreview("test-pet", new Date("2026-11-09T22:30:00Z"));
assert.deepEqual(samples.map(s => s.next_due_date), ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-24"], "Preview dates use Athens today, including after UTC midnight boundary");
assert.ok(samples.every(s => isPreviewReminder(s.id)), "All sample actions are identifiable as preview-only");
assert.equal(isPreviewReminder("real-record-id"), false, "Real records retain their normal actions");
console.log("Reminder preview tests passed");