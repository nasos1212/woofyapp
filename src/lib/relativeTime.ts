import { formatDistanceToNow } from "date-fns";
import { el, enUS } from "date-fns/locale";
import i18n from "@/i18n";

export const getDateFnsLocale = () => (i18n.language?.startsWith("el") ? el : enUS);

export const formatRelative = (date: Date | string, addSuffix = true) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix, locale: getDateFnsLocale() });
};
