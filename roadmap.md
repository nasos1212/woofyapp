# Roadmap

## v1.1 update (code + backend done, push verified — needs rebuild/upload)
- [x] App icon notification badge (unread count on home-screen icon) — client badge sync + badge number included in push payloads
- [x] Apple push notifications server path — `send-push` edge function deployed, `on_notification_created` DB trigger wired
- [x] Add APNs key + Key ID as project secrets (key "Wooffy Push", both environments)
- [x] End-to-end test passed on iPhone (v9 build): alert + sound + badge confirmed, Apple accepted pushes 2026-10-07
- [x] Rebuild, re-archive, and upload v1.1 under wife's account (Team XC7893VNBD, Bundle ID app.wooffy.ios) — uploaded 2026-10-07
- [ ] Create version 1.1 in App Store Connect, attach build, add What's New, Submit for Review

## v1.0 submission (DONE — approved and live)
- [x] Website published with apple-app-site-association (XC7893VNBD.app.wooffy.ios) live
- [x] Age Rating (4+), Pricing (Tier 0 Free), availability (Cyprus + Greece), DAC7, App Privacy, screenshots, review account (apple@test.com)
- [x] Approved and live on the App Store

## v1.1 extras (done)
- [x] Birthday offers expire 7 days after the pet birthday
- [x] Business analytics PDF report (replaces CSV), share sheet in iOS app
- [x] Admin gift: upgrade Free and lower-tier Paid members
