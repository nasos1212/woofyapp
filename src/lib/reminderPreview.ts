import { addDays, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const PREVIEW_PREFIX = "preview-reminder-";

export const isPreviewReminder = (id: string) => id.startsWith(PREVIEW_PREFIX);

export function createReminderPreview(petId: string, now = new Date()) {
  const today = toZonedTime(now, "Europe/Athens");
  return [
    { title: "Annual vaccination", record_type: "vaccination", offset: -1, status: "overdue" as const, interval: "yearly", days: 365 },
    { title: "Daily medication", record_type: "medication", offset: 0, status: "due-today" as const, interval: "daily", days: 1 },
    { title: "Flea & tick prevention", record_type: "medication", offset: 1, status: "due-soon" as const, interval: "monthly", days: 30 },
    { title: "Vet check-up", record_type: "vet_visit", offset: 14, status: "upcoming" as const, interval: "once", days: 0 },
  ].map((sample, index) => ({
    id: `${PREVIEW_PREFIX}${index}`,
    pet_id: petId,
    record_type: sample.record_type,
    title: sample.title,
    description: null,
    date_administered: null,
    next_due_date: format(addDays(today, sample.offset), "yyyy-MM-dd"),
    veterinarian_name: null,
    clinic_name: null,
    notes: null,
    document_url: null,
    reminder_interval_type: sample.interval,
    reminder_interval_days: sample.days,
    preferred_time: sample.interval === "daily" ? "09:00" : null,
    reminder_days_before: [1, 0],
    created_at: now.toISOString(),
    daysUntil: sample.offset,
    status: sample.status,
  }));
}