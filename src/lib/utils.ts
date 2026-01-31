import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as dateFnsFormat } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standard date format for the application: dd/MM/yyyy
 */
export const DATE_FORMAT = "dd/MM/yyyy";

/**
 * Standard date-time format for the application: dd/MM/yyyy HH:mm
 */
export const DATETIME_FORMAT = "dd/MM/yyyy HH:mm";

/**
 * Format a date using the application's standard date format (dd/MM/yyyy)
 */
export function formatDate(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return dateFnsFormat(d, DATE_FORMAT);
}

/**
 * Format a date-time using the application's standard format (dd/MM/yyyy HH:mm)
 */
export function formatDateTime(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return dateFnsFormat(d, DATETIME_FORMAT);
}

/**
 * Ensures a URL has a proper protocol (https:// or http://)
 * Returns the URL with https:// prepended if no protocol exists
 */
export function ensureHttps(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Normalizes a URL input - adds https:// if missing
 * Use this for form inputs to auto-correct user input
 */
export function normalizeUrlInput(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  // If user is still typing the protocol, don't interfere
  if (trimmed === "h" || trimmed === "ht" || trimmed === "htt" || 
      trimmed === "http" || trimmed === "http:" || trimmed === "http:/" ||
      trimmed === "https" || trimmed === "https:" || trimmed === "https:/") {
    return trimmed;
  }
  return trimmed;
}
