import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
