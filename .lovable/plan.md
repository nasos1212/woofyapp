## Add partner credit at top of blog articles

When a blog post has a linked business (`business_id`), show a small, subtle credit line near the top of the article — regardless of category — so partners get visible recognition on guides, news, and stories too (not just interviews).

### Where it appears
In `src/pages/BlogPost.tsx`, just below the meta row (author / date / reading time) and above the cover image. A single line like:

> 🤝 In partnership with **Pet Nas**

- The business name is a clickable link to `/business/{id}`.
- Uses the business `logo_url` as a tiny avatar (fallback: Building2 icon) for visual identity.
- Muted/small styling so it reads as a credit, not a promo.

### Behavior rules
- Only renders when `business` is loaded (i.e. `business_id` is set on the post).
- Shows for ALL categories (interview, guide, news, story).
- The existing "Meet the Partner" card at the bottom stays as-is, but only for `interview` posts (no change to that logic).

### i18n
Add a translation key `blog.inPartnershipWith` → "In partnership with" / "Σε συνεργασία με" in `src/i18n/locales/en.json` and `el.json`.

### Files to edit
- `src/pages/BlogPost.tsx` — add the credit line markup.
- `src/i18n/locales/en.json`, `src/i18n/locales/el.json` — add the new key.
