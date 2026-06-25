## Context

You're right — for shelters and businesses, contact info (email, phone, website, social links) is the whole point of the directory. Hiding it defeats the purpose: members can't reach a shelter to adopt, and can't contact a partner business.

The security scanner flagged these because *unauthenticated* (anonymous) visitors could scrape emails/phones in bulk — a spam/harvesting risk. The fix should distinguish **who** sees contact info, not hide it from everyone.

## Proposed approach: gate by authentication, not hide entirely

**Shelters** (`shelters_public` view)
- Add back: `email`, `phone`, `contact_person`, website, socials.
- Restrict the view to `authenticated` only (revoke from `anon`).
- Result: signed-in members see full shelter contact info; anonymous landing-page visitors see name/photo/city/description but not email/phone.

**Businesses** (`businesses_public` view)
- Add back: `email`, `phone`, website, socials.
- Same pattern — `authenticated` only.
- Anonymous visitors on the landing page still see business name/category/city/photos (enough to advertise the directory); signed-in members get contact details.

**Landing page impact**
- `SheltersSection` and any anonymous business preview will need to drop email/phone from their cards (they likely already do — they show name + city + CTA "Sign in to contact"). I'll verify before changing.

**What stays as-is from the previous fix**
- Base `shelters` / `businesses` tables remain locked down (only owner + admin direct access).
- `business_reviews`, `community_answers`, `pet_friendly_place_ratings`, `realtime support-unread-count` fixes are unrelated and stay.

## Open question before I write the migration

Should anonymous (logged-out) visitors on the public landing page see shelter/business **contact info**, or is "name + city, sign in to see contact" acceptable?

- **Option A (recommended):** Authenticated members see full contact; anonymous visitors see name/city only. Closes the scraping risk, keeps the directory useful.
- **Option B:** Everyone (including anonymous) sees email/phone. Reopens the scraper risk — I'd re-ignore the two findings with a written justification in security memory.

Tell me A or B and I'll produce the migration + any frontend tweaks in build mode.