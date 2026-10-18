# Architecture Rules

- Apply offer expiry filtering before limits in user-facing nearby and public offer queries; owner management retains all offers for history.

- Native OAuth opens externally from Wooffy's production origin and returns via the `wooffy://` URL scheme; the website claims no Universal Link paths so wooffy.app always opens in the browser; handle both warm and cold app launches.
- Keep native authentication as a compact single-screen experience with one circular brand mark and safe-area-aware spacing.
- Enforce hidden shelter access in database policies and every shelter view, using the server-side admin role; client filters are not an access boundary.
- Render social brand identities through the shared SocialIcons module and semantic CSS tokens so logos remain consistent across screens.
- Use the native Share plugin for article sharing inside the iPhone shell, retaining standard Facebook share anchors on web; this preserves article URLs through the OS handoff.
- Resolve notification destinations through the shared notificationRouting module and buffer native push taps until authentication is ready, preventing inconsistent links and lost cold-start taps.