## Why you can't see Blog on /member

The Blog link **is** in the header nav for logged-in users, but only on screens ≥1024px (desktop). Your current viewport is 934px, so the desktop nav is hidden. On smaller screens, logged-in users only see the **avatar dropdown menu** — and that menu currently lists Dashboard, Offers, Community, Notifications, Upgrade, Admin, Sign Out… but **not Blog**. That's the gap.

The Footer also has a Blog link, but it's easy to miss.

## Plan

### 1. Add Blog to the user avatar dropdown (both desktop and mobile variants in Header)
- Insert a "Blog" item (with `BookOpen` icon) right after "Community Hub" in both `DropdownMenuContent` blocks (lines ~312 and ~244 of `src/components/Header.tsx`).
- Uses existing translation key `header.blog` (already in EN/EL).
- This guarantees every logged-in user — member, business, shelter, admin — can reach the blog from any page on any screen size.

### 2. Add a "Latest from the Blog" strip on the landing page
- New component `src/components/LatestFromBlog.tsx`:
  - Fetches the 3 most recent published posts (`status='published'`, `published_at <= now()`, ordered by `published_at desc`).
  - Renders a section with title "Latest from the Blog" / "Τελευταία από το Blog", a 3-card grid (cover image, category badge, title, excerpt, reading time), and a "View all articles" button → `/blog`.
  - Hides itself entirely if no published posts exist (so the landing page stays clean until first publish).
  - Localized via existing `localized()` helper in `src/lib/blog.ts`.
- Insert it in `src/pages/Index.tsx` just above the final CTA section.
- Add 3 translation keys: `landing.blog.title`, `landing.blog.subtitle`, `landing.blog.viewAll` in `en.json` + `el.json`.

### 3. Add a small "Read our blog" card to the Member Dashboard (optional but nice)
- A compact card in the MemberDashboard sidebar/secondary area linking to `/blog`, so blog content is discoverable without relying on the avatar menu.
- Uses `BookOpen` icon, one-line copy: "Tips, stories & partner interviews →".

### Files to change
- `src/components/Header.tsx` — add Blog item to both dropdown menus
- `src/components/LatestFromBlog.tsx` — new
- `src/pages/Index.tsx` — mount the new section
- `src/pages/MemberDashboard.tsx` — small blog discovery card
- `src/i18n/locales/en.json`, `src/i18n/locales/el.json` — 3 new keys

No DB or RLS changes needed — `blog_posts` already allows public read of published posts.