# Architecture Rules

- Apply offer expiry filtering before limits in user-facing nearby and public offer queries; owner management retains all offers for history.
- Generate community participant reply alerts in the existing database answer trigger using a deduplicated union of interactions, retaining the existing notification type so deployed clients and push delivery remain compatible.

- Native OAuth opens externally from Wooffy's production origin and returns via the `wooffy://` URL scheme; the website claims no Universal Link paths so wooffy.app always opens in the browser; handle both warm and cold app launches.
- Keep native authentication as a compact single-screen experience with one circular brand mark and safe-area-aware spacing.
- Enforce hidden shelter access in database policies and every shelter view, using the server-side admin role; client filters are not an access boundary.
- Render social brand identities through the shared SocialIcons module and semantic CSS tokens so logos remain consistent across screens.
- Share articles as URL-only items through the native Share plugin or browser Web Share API when supported, with Facebook share anchors as the browser fallback; this avoids mobile redirects losing the article URL.
- Resolve notification destinations through the shared notificationRouting module and buffer native push taps until authentication is ready, preventing inconsistent links and lost cold-start taps.