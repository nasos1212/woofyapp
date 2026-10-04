# What to Do With the iOS Package — 3 Steps

You only need to touch **one item** in the unzipped folder. Everything else is internal support structure that Xcode manages by itself — don't move or edit it.

## Step 1 — Open the project in Xcode
- Unzip `wooffy-ios-package.zip` (if you haven't already)
- In Xcode: File → Open → select **`ios/App/App.xcodeproj`** (this is the only file you'll ever open)

## Step 2 — Sign and run
- Left sidebar → click the blue **App** project icon → target **App** → **Signing & Capabilities** → choose your Team (2DLWZ7MYZ5 account)
- Select an iPhone simulator at the top, press **▶ Play**
- The Wooffy app should build and launch showing the landing page

## Step 3 — What the other files are (for reference only — do nothing with them)
- `ios/App/App/` — app screen configuration, icons, splash screens, Universal Links (already set up)
- `ios/App/CapApp-SPM/` — native plugin code, auto-managed
- `ios/capacitor-cordova-ios-plugins/`, `ios/debug.xcconfig`, `.gitignore` — internal build plumbing
- `IOS-SUBMISSION-GUIDE.md` — the full step-by-step guide from building in Xcode to App Store submission

## If Play shows a red error
Tell me the exact error message (especially anything about signing) and I'll walk you through the fix.
