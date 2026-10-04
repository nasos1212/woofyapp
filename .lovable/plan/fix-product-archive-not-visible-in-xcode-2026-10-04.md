# Fix: "Product → Archive" not visible in Xcode

The device target is already "Any iOS Device (arm64)", so the issue is one of these two:

## Check 1 — The menu is in the Mac's top menu bar, not inside Xcode

The **Product** menu is not a button inside the Xcode window. It lives in the **macOS menu bar at the very top of the screen** (next to the Apple logo), and it only appears when Xcode is the active app.

1. Click anywhere inside the Xcode window so Xcode is the frontmost app.
2. Look at the very top-left of your screen: you should see **Xcode | File | Edit | View | Find | Navigate | Editor | Product | Debug | ...**
3. Click **Product → Archive**.

## Check 2 — The wrong scheme is selected

If **Product** is visible but **Archive** is greyed out, the active scheme is probably `CapApp-SPM` (the package helper) instead of the app itself.

1. At the top of the Xcode window, next to the ▶ Play button, click the scheme name (it may say **CapApp-SPM**).
2. In the dropdown, choose **App** (the one with the blue app icon, not the package icon).
3. Keep the device as **Any iOS Device (arm64)**.
4. Now **Product → Archive** will be enabled.

## Then continue Phase 1

1. **Product → Archive** — wait a few minutes for the build.
2. The **Organizer** window opens automatically with the archive listed.
3. Click **Distribute App → App Store Connect → Upload**, keep defaults, finish the upload.
4. Apple emails you when the build is processed (~10–30 min), then we move to App Store Connect.

## If still stuck

Send a screenshot of the whole screen (including the very top menu bar) and I'll pinpoint it.
