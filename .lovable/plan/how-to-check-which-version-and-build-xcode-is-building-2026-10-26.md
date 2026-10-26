# How to check which version and build Xcode is building

No code changes needed. These are the places in Xcode to check.

## 1. Before you build: the project settings
1. In the left sidebar, click the blue **App** icon at the very top.
2. Under **TARGETS**, click **App**.
3. Open the **General** tab.
4. Look at the **Identity** section:
   - **Version** should say **1.4**
   - **Build** should say **6** for the newest package
   - **Bundle Identifier** should say **app.wooffy.ios**

If Build says 4 or 5, you opened an old folder. Quit Xcode, delete the old wooffy-v14 folders, and open the one from the build 6 zip.

## 2. Check which folder is open
- Hold **Cmd** and click the project name in the title bar at the top of the Xcode window. A list shows the full folder path, so you can see exactly which wooffy-v14 folder is open.
- Or, in the left sidebar, right-click **App** and choose **Show in Finder**.

## 3. After Archive: the Organizer
- **Window → Organizer → Archives**. Each archive shows its **Version** and **Build** in a column, for example "1.4 (6)". Pick the right one before you click **Distribute App**.

## 4. After upload: App Store Connect
- **TestFlight** tab: each build appears as "1.4 (6)".
- On your iPhone, the **TestFlight** app shows the build number under Wooffy before you install it.
