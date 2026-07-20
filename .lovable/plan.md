No good reason — you are right to flag it. `app.lovable.woofyapp` was the default from the earlier Capacitor setup, but it should match your real domain. I will switch the bundle ID to `app.wooffy` (or `com.wooffy.app` if you prefer) so it aligns with `wooffy.app` and looks correct in App Store Connect.

## Updated plan

### What I'll do in this project

1. Update `capacitor.config.ts`:
   - Change `appId` from `app.lovable.woofyapp` to `app.wooffy` (or your preferred variant).
   - Add iOS block: `contentInset: "always"`, `backgroundColor: "#1A1A2E"`.
2. Install native Capacitor plugins: `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/app`, `@capacitor/browser`, `@capacitor/keyboard`, `@capacitor/assets`.
3. Add `src/lib/native.ts` to initialize StatusBar (dark), hide splash screen, handle external links via `Browser.open`, and listen for app-state changes. Guarded by `Capacitor.isNativePlatform()`.
4. Bootstrap the native module from `src/main.tsx`.
5. Generate iOS icon and splash screen assets from the Wooffy dog mark (`public/wooffy-logo.png` or existing source). Output into `resources/` and run `npx capacitor-assets generate --ios`.
6. Audit fixed bottom navigation bars and add `env(safe-area-inset-bottom)` padding so the iPhone home indicator does not overlap controls.
7. Add a `.capacitor` class fallback so the Lovable badge is hidden inside the native shell.

### What you'll do on your Mac

```text
1. Export project → GitHub → git pull
2. npm install
3. npx cap add ios
4. npm run build
5. npx capacitor-assets generate --ios
6. npx cap sync ios
7. npx cap open ios
8. In Xcode: set Signing Team + Bundle ID, bump version, Archive → App Store Connect
```

Prereqs: macOS + Xcode 15+, Apple Developer account, App Store Connect app record.

### Two decisions still needed

1. **Bundle ID preference**
   - `app.wooffy` — clean, matches domain, Apple-acceptable
   - `com.wooffy.app` — more conventional if you ever expect Android too
   - Keep whichever you choose consistent forever across iOS/Android.

2. **Deep links for auth**
   - **Option A (recommended):** Universal Links on `wooffy.app` — best UX, links open in app automatically. Requires serving `/.well-known/apple-app-site-association` from your domain.
   - **Option B:** Custom scheme `wooffy://` — easier to set up, but users see a system confirmation sheet and it looks less polished.

3. **Scope for this turn** — implement steps 1–7 (code + config + assets), or also draft App Store listing copy (name, subtitle, description, keywords) in the same pass?

Tell me your bundle ID preference and deep-link choice and I'll implement.
