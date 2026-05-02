import i18n from "@/i18n";

export type BlogCategory = "interview" | "guide" | "news" | "story";
export type BlogStatus = "draft" | "published";

export interface BlogPost {
  id: string;
  slug: string;
  status: BlogStatus;
  published_at: string | null;
  category: BlogCategory;
  title_en: string;
  title_el: string | null;
  excerpt_en: string | null;
  excerpt_el: string | null;
  content_en: string;
  content_el: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  business_id: string | null;
  shelter_id: string | null;
  reading_minutes: number;
  view_count: number;
  seo_title_en: string | null;
  seo_title_el: string | null;
  seo_description_en: string | null;
  seo_description_el: string | null;
  created_at: string;
  updated_at: string;
}

export const isGreek = () => (i18n.language || "en").toLowerCase().startsWith("el");

export const localized = (en: string | null | undefined, el: string | null | undefined): string => {
  if (isGreek()) {
    const v = (el ?? "").trim();
    if (v) return v;
  }
  return (en ?? "").trim();
};

export const slugify = (input: string): string => {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
};

export const computeReadingMinutes = (markdown: string): number => {
  const words = (markdown || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

export const formatDate = (iso: string | null) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(isGreek() ? "el-GR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
