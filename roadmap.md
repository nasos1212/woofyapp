# Roadmap

## v1.1 update (in progress — code done, needs APNs key + rebuild)
- [x] App icon notification badge (unread count on home-screen icon) — client badge sync + badge number included in push payloads
- [x] Apple push notifications server path — `send-push` edge function deployed, `on_notification_created` DB trigger wired
- [ ] Add APNs key + Key ID as project secrets (waiting on user: download .p8 key from wife's Apple Developer account)
- [ ] End-to-end test: sign in on device, send a test notification while app is closed, confirm alert + sound + badge
- [ ] Rebuild, re-archive, and upload v1.1 under wife's account (Team XC7893VNBD, Bundle ID app.wooffy.ios) once the above are in

## v1.0 submission (DONE — approved and live)
- [x] Website published with apple-app-site-association (XC7893VNBD.app.wooffy.ios) live
- [x] Age Rating (4+), Pricing (Tier 0 Free), availability (Cyprus + Greece), DAC7, App Privacy, screenshots, review account (apple@test.com)
- [x] Approved and live on the App Store

## v1.1 extras (done)
- [x] Birthday offers expire 7 days after the pet birthday
- [x] Business analytics PDF report (replaces CSV), share sheet in iOS app
- [x] Admin gift: upgrade Free and lower-tier Paid members
