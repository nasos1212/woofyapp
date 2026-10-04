# No — Don't Create a New Project

Xcode's welcome screen shows "Create a New Project" first, but Wooffy already **has** a ready-made project in the package. Creating a new one would start from scratch — you don't want that.

## What to click instead
- On the welcome screen: click **"Open a project or file"** (or if Xcode is already open, menu **File → Open…**)
- Navigate to the unzipped package: `wooffy-ios-package` → `ios` → `App`
- Select **`App.xcodeproj`** → click **Open**

## Then
1. Click the blue **App** icon at the very top of the left sidebar
2. Middle panel → **Signing & Capabilities** tab → under **Team**, pick your Apple account (Team ID 2DLWZ7MYZ5)
3. Choose an iPhone simulator in the device menu at the top and press **▶ Play**
4. The Wooffy app should build and show the landing page in the simulator

If Play shows a red error — especially anything about signing — paste it here and I'll walk you through the fix.
