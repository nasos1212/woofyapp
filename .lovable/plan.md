# Fix "Missing package product CapApp-SPM" — Rebuild the iOS Package

## The problem

The iOS project's CapApp-SPM package (the native glue that connects the app to Capacitor's plugins) references plugin source code by relative path: `../../../node_modules/@capacitor/...`. The zip you downloaded only contained the `ios/` folder, so on your Mac those paths point to nothing and Xcode reports "Missing package product CapApp-SPM".

## The fix

Rebuild `wooffy-ios-package.zip` so the folder layout on your Mac matches what the project expects:

```text
wooffy-ios-package/
├── IOS-SUBMISSION-GUIDE.md
├── ios/                        (unchanged — already on your Mac)
└── node_modules/
    └── @capacitor/
        ├── app/
        ├── browser/
        ├── keyboard/
        ├── splash-screen/
        └── status-bar/
```

Only the 5 plugin packages the iOS project actually references are included (each is small; the full node_modules folder is hundreds of MB and unnecessary).

## Steps

1. Verify the 5 plugin packages exist in the project's node_modules and copy them into the package staging folder, preserving the exact relative structure.
2. Rebuild the zip with `ios/` + the new `node_modules/@capacitor/*` folders + the guide.
3. Replace the download in Files with the new zip.

## What you do after downloading the new zip

1. Delete the old unzipped `wooffy-ios-package` folder (or just unzip the new one over it).
2. Unzip the new package and open `ios/App/App.xcodeproj` again.
3. In Xcode: **Product → Clean Build Folder** (Shift+Cmd+K) to clear the stale error, then press **▶ Play**.

The signing setup you already did (Team 2DLWZ7MYZ5) is stored in the project file and will carry over.

## Technical details

- Root cause: `ios/App/CapApp-SPM/Package.swift` declares local path dependencies on `../../../node_modules/@capacitor/{app,browser,keyboard,splash-screen,status-bar}` — standard for Capacitor 8 SPM projects, which expect the whole project root, not just `ios/`.
- Alternative considered: rewriting Package.swift to use remote git packages — rejected, because Capacitor CLI manages that file and would overwrite changes on the next sync.
- No changes to the app code, the iOS project settings, or the website.
