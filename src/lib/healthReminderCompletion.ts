import { addDays, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export function healthReminderCompletion(record: { record_type: string; reminder_interval_type: string | null; reminder_interval_days: number | null }, now = new Date()) {
  const today = toZonedTime(now, "Europe/Athens");
  const recurring = ["vaccination", "medication"].includes(record.record_type) && record.reminder_interval_type !== "once";
  return {
    date_administered: format(today, "yyyy-MM-dd"),
    next_due_date: recurring ? format(addDays(today, record.reminder_interval_days || 365), "yyyy-MM-dd") : null,
  };
}