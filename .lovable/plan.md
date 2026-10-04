# Fix native Google sign-in and simplify the sign-in logo

## Changes
- Use a native-safe Google sign-in flow that opens authentication outside the embedded app page and returns through `https://wooffy.app/auth`.
- Keep the existing browser sign-in flow unchanged.
- Ensure the iOS return link restores the session and closes the authentication window cleanly.
- Remove both current Wooffy images from the native sign-in screen and show one centered blue circle with the white dog mark near the top.
- Rebuild and sync the iOS project, then provide a new versioned download package.

## Validation
- Confirm the web build is clean and the native project contains the updated settings and assets.
- Verify the sign-in page has exactly one native logo at mobile size.
- Check production callback URLs and packaged files contain no preview or internal project address.
