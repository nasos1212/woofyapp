## Wooffy Blog – Articles & Partner Interviews

A bilingual (EN/EL) blog to publish articles and interviews with signed-up businesses. Admin-managed, public-facing, SEO-friendly.

### Goals
- Publish editorial content (interviews, guides, news) on wooffy.app
- Tie interview posts to existing businesses (and optionally shelters)
- Bilingual content (EN + EL) matching the rest of the site
- Discoverable from the landing page header/footer and from partner profiles

### Pages & Routes

| Route | Purpose | Access |
|---|---|---|
| `/blog` | Blog index: featured + latest posts, category filter, search | Public |
| `/blog/:slug` | Article detail page with SEO meta and share buttons | Public |
| `/admin` → new "Blog" tab | Admin CRUD for posts (list, create, edit, publish, delete) | Admin only |

Header (guest + logged-in) and Footer get a "Blog" / "Ιστολόγιο" link.
Business profile page gets a "Featured in" section listing related posts.

### Content Model

New table `blog_posts`:
- `id`, `slug` (unique), `status` (`draft` | `published`), `published_at`
- `title_en`, `title_el`, `excerpt_en`, `excerpt_el`
- `content_en`, `content_el` (Markdown)
- `cover_image_url`
- `category` (enum: `interview`, `guide`, `news`, `story`)
- `author_name`, `author_avatar_url`
- `business_id` (nullable FK → `businesses`) for interview posts
- `shelter_id` (nullable FK → `shelters`) for shelter interviews
- `reading_minutes` (int, computed on save)
- `view_count` (int, default 0)
- `seo_title_en/el`, `seo_description_en/el` (optional overrides)
- `created_at`, `updated_at`, `created_by` (admin user id)

New storage bucket `blog-images` (public) for cover images and inline images, 8MB limit, HEIC/HEIF supported (reuse `validateImageFile`).

### Security (RLS)
- Public can `SELECT` rows where `status = 'published'`
- Admins (via `has_role(auth.uid(), 'admin')`) can do everything
- No insert/update/delete for non-admins
- Storage: public read on `blog-images`, admin-only write

### Admin Experience (in `/admin`)
New "Blog" tab in `AdminDashboard` with:
- List view: title, status, category, linked business, published date, views
- Create/Edit dialog with two-language tabs (EN / EL) per field
- Markdown editor (textarea + preview using `react-markdown` + `remark-gfm`)
- Cover image uploader (reuse `PhotoUpload` pattern, crop to 1200×630 for OG)
- Business/shelter selector (searchable) for interview posts
- Slug auto-generated from EN title, editable, uniqueness check
- Publish / Unpublish toggle, schedule via `published_at`

### Public Blog UX
- `/blog` index:
  - Hero with featured post (most recent published, `category = 'interview'` priority)
  - Filter chips: All, Interviews, Guides, News, Stories
  - Grid of post cards (cover, category badge, title, excerpt, reading time, date)
  - Pagination (12 per page)
- `/blog/:slug`:
  - Cover image, title, author, date, reading time, category badge
  - Markdown body rendered with Tailwind typography
  - For interview posts: "Meet the partner" card linking to the business profile (`/business/:id`) with logo and CTA
  - Share buttons (Facebook, X, WhatsApp, copy link) — uses `<a target="_blank" rel="noopener noreferrer">`
  - "Related posts" (3 most recent in same category)
  - Auto-scroll-to-top on mount, BackToTop after 300px
- SEO: `<Helmet>` with title, description, OG image, canonical, `article` schema, `og:locale` per current language

### Internationalization
- Add `blog` namespace to `src/i18n/locales/en.json` and `el.json` (UI strings: filters, "Read more", "Featured in", "Share", etc.)
- Title/excerpt/content stored per language; current `i18n.language` decides which to render, falling back to EN if EL is empty
- Header/Footer add "Blog" (EN) / "Ιστολόγιο" (EL)

### Discoverability
- Header link "Blog" added to desktop nav and mobile menu (lg breakpoint rule)
- Footer "Quick Links" gets "Blog"
- Landing page: small "Latest from the Blog" strip (3 cards) above `CTASection` (optional, behind a feature flag we can enable after first 3 posts exist)
- `BusinessProfile.tsx`: query `blog_posts` where `business_id = id AND status = 'published'`, render "Featured in our Blog" section

### Notifications & Engagement (optional, phase 2)
- When a partner is interviewed, notify the business owner (email + in-app notification) with a link to the post
- Send a one-off bulk email to paid members announcing new interview posts (reuse `send-bulk-email` edge function)

### Tech / Implementation Details
- Add `react-markdown` + `remark-gfm` (small, no server) for rendering
- Slug helper: lowercase, strip diacritics, replace spaces with `-`
- Reading time: `Math.max(1, Math.round(words / 220))`
- View count: increment via lightweight RPC `increment_blog_view(slug)` called once per session (sessionStorage guard)
- All Supabase reads paginated with `.range()` per the project's edge-function pagination rule (only relevant if we add an edge function later)

### Out of Scope (for now)
- Public commenting (we already have community for discussion)
- Member-submitted posts
- RSS feed and newsletter signup (can be added later)

### Suggested Build Order
1. DB migration: `blog_posts` table, RLS, `blog-images` bucket, view-count RPC
2. Admin Blog tab (list + create/edit dialog with markdown + bilingual fields)
3. Public `/blog` index and `/blog/:slug` pages with SEO
4. Header + Footer "Blog" link, i18n strings
5. "Featured in our Blog" section on `BusinessProfile`
6. Optional: landing page "Latest from the Blog" strip + partner notification email

Ready to implement once you approve. Anything you'd like to add or trim — for example, do you want scheduled publishing, or is publish-now enough for v1?