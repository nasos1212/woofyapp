# Roadmap

## October 18 Facebook article sharing
- [x] Prefer URL-only system sharing on iPhone and supported web browsers; retain Facebook link fallback on other browsers
- [x] Verify URL-only browser handoff, Facebook fallback and error-free article rendering
- [ ] Confirm Facebook composer on a real iPhone after publishing (requires device)

## October 18 community activity alerts
- [x] Notify savers, followers, answerers, voters and helpful-markers about new replies on that specific question; exclude reply author and avoid duplicates
- [x] Verify deployed function and isolated PostgreSQL recipient rules without broadcasting test alerts; retain existing question-owner alerts and destination links
- [ ] Confirm an actual new-reply alert on iPhone; requires user/device test without unsolicited test broadcasts

## October 18 offer expiry check
- [x] Exclude expired offers from Offers Near Me and public offer previews before limiting results
- [x] Verify expiry regression and signed-in nearby offer query
- [x] Exclude expired offers from the assistant's available-offer suggestions

## October 15 small fixes
- [x] #1–5 Shelter remove controls, compact stats, single-line timestamps, two-line support subjects and gallery captions
- [x] #6–7 Offer month/year picker and fully visible pet-type choices
- [x] #8 Shared notification destinations, exact lost-pet popup, support conversation links, buffered native taps
- [x] #9 Support status shown as coloured clickable dots
- [x] #10 Business dashboard offer cards link to management, with View All always available; public profile already opens details
- [x] Signed-in notification/article/lost-pet/support flows verified; Greek subject and status dots checked at iPhone width; destination tests and preview build pass
- [ ] Real shelter/business-owner screen checks: current test session is a member, not a shelter/business owner
- [ ] Native push warm/cold tap check on an iPhone after next build; requires device/Xcode

## v1.2 remaining feedback
- [x] #16 Admin-only hidden shelters; guest/member/admin live access regression passed
- [x] #29 Verified titles bold in both languages; user confirmed no changes wanted
- [x] #30 Branded social logos throughout app; native Facebook uses share menu (phone check awaits next build)
- [ ] #5, #11, #14, #31 Await clarification from user
- [ ] #10, #15, #18 On hold at user's request
- [ ] Package next iPhone release after feedback is complete
- [ ] App Store search fix: keywords + subtitle (EN/EL) written before the next update goes live

## v1.1 update (code + backend done, push verified — needs rebuild/upload)
- [x] App icon notification badge (unread count on home-screen icon) — client badge sync + badge number included in push payloads
- [x] Apple push notifications server path — `send-push` edge function deployed, `on_notification_created` DB trigger wired
- [x] Add APNs key + Key ID as project secrets (key "Wooffy Push", both environments)
- [x] End-to-end test passed on iPhone (v9 build): alert + sound + badge confirmed, Apple accepted pushes 2026-10-07
- [x] Rebuild, re-archive, and upload v1.1 under wife's account (Team XC7893VNBD, Bundle ID app.wooffy.ios) — uploaded 2026-10-07
- [x] Create version 1.1 in App Store Connect, attach build, add What's New (EN/EL), submitted for review 2026-10-07

## v1.0 submission (DONE — approved and live)
- [x] Website published with apple-app-site-association (XC7893VNBD.app.wooffy.ios) live
- [x] Age Rating (4+), Pricing (Tier 0 Free), availability (Cyprus + Greece), DAC7, App Privacy, screenshots, review account (apple@test.com)
- [x] Approved and live on the App Store

## v1.1 extras (done)
- [x] Birthday offers expire 7 days after the pet birthday
- [x] Business analytics PDF report (replaces CSV), share sheet in iOS app
- [x] Admin gift: upgrade Free and lower-tier Paid members
