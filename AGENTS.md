# Architecture Rules

- Native OAuth opens externally from Wooffy's production origin and returns through the `/auth` Universal Link; handle both warm and cold app launches.
- Keep native authentication as a compact single-screen experience with one circular brand mark and safe-area-aware spacing.
- Enforce hidden shelter access in database policies and every shelter view, using the server-side admin role; client filters are not an access boundary.
- Render social brand identities through the shared SocialIcons module and semantic CSS tokens so logos remain consistent across screens.