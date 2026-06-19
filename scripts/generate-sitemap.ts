// Generates public/sitemap.xml before `vite dev` and `vite build`.
// Includes all public, indexable routes plus published blog posts.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://wooffy.app";
const SUPABASE_URL = "https://qvdrwfltbqhlwkqndpdp.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2ZHJ3Zmx0YnFobHdrcW5kcGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NTkyNjYsImV4cCI6MjA4MjMzNTI2Nn0.my3dAqqvBUWM2dsLvQd4ExUDehKZKROqAwb1mOMXJvw";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

// Public static routes that should be indexed.
// Auth/member/business/admin/checkout routes are intentionally excluded.
const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/blog", changefreq: "weekly", priority: "0.9" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/auth", changefreq: "monthly", priority: "0.5" },
];

async function fetchBlogPosts(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,updated_at,published_at&status=eq.published`,
      {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
      },
    );
    if (!res.ok) {
      console.warn(`[sitemap] blog fetch failed: ${res.status}`);
      return [];
    }
    const rows = (await res.json()) as Array<{
      slug: string;
      updated_at: string | null;
      published_at: string | null;
    }>;
    return rows
      .filter((r) => r.slug)
      .map((r) => ({
        path: `/blog/${r.slug}`,
        lastmod: (r.updated_at || r.published_at || "").slice(0, 10) || undefined,
        changefreq: "monthly" as const,
        priority: "0.7",
      }));
  } catch (err) {
    console.warn(`[sitemap] blog fetch error:`, err);
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  const blogEntries = await fetchBlogPosts();
  const entries = [...staticEntries, ...blogEntries];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
}

main();
