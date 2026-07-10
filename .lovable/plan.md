# Add Sign in with Apple

Apple requires "Sign in with Apple" whenever an app offers other third-party logins (Google, Facebook, etc.). Since Wooffy already has Google sign-in, adding Apple is mandatory for App Store approval.

Good news: Lovable Cloud has managed Apple auth built in, so this is quick.

## What I'll build

1. **Enable Apple as a login provider** on the backend (managed by Lovable — no Apple Developer credentials needed for the initial setup; can be swapped to your own credentials later once your Developer account is approved).

2. **Add an "Apple" button** on the sign-in / sign-up screen (`src/pages/Auth.tsx`), placed directly above the existing Google button so both social options sit together.
   - Uses the official black Apple button styling per Apple's Human Interface Guidelines (required, or Apple can still reject).
   - Same behavior as Google: calls `lovable.auth.signInWithOAuth("apple", ...)`, handles errors with a toast, and respects the T&C checkbox on sign-up.

3. **Add translations** for the new button labels in English and Greek:
   - `common.signInWithApple` → "Sign in with Apple" / "Σύνδεση με Apple"
   - `common.signUpWithApple` → "Sign up with Apple" / "Εγγραφή με Apple"

## What stays the same

- Email/password login untouched
- Google login untouched
- No changes to routing, role assignment, or the `handle_new_user` trigger — Apple users flow through the same profile-creation logic as Google users

## Later (when your Apple Developer account is approved)

Once you have your $99/year Developer membership, you can optionally switch from Lovable's managed Apple auth to **your own Apple credentials** so the Apple sign-in sheet shows "Wooffy" instead of Lovable. That's a 10-minute config change in the backend dashboard — I can guide you through it when you're ready. Not required for App Store approval; just nicer branding.

## Files touched

- `src/pages/Auth.tsx` — add Apple button + handler
- `src/i18n/locales/en.json` — add Apple button labels
- `src/i18n/locales/el.json` — add Greek Apple button labels
- Backend — enable Apple provider (managed)

Approve and I'll ship it.
