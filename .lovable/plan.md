# Clickable place names → place's Google page

## What we build
On the Dog-Friendly Directory cards, the place name becomes a clickable link that opens that place's own Google page (reviews, photos, opening hours, menu/website) — separate from the existing "Go" button, which keeps opening directions in the Google Maps app.

## Changes

1. **`src/lib/maps.ts`** — add `getGooglePlacePageUrl(place)`. It builds a Google Maps "search" universal link (`https://www.google.com/maps/search/?api=1&query=<name>, <city>`) using the place name + city (same text-query pattern as the existing directions helper, which sidesteps the ~50 places with city-center coordinates). This URL shows the place's listing — reviews, photos, website — and opens straight in the Google Maps app on iPhone when installed, web otherwise, consistent with the "Go" button behavior.

2. **`src/pages/PetFriendlyPlaces.tsx`** — wrap the place name heading on each card in an `<a>` (real link, `target="_blank" rel="noopener noreferrer"`) pointing to `getGooglePlacePageUrl(place)`. Same typography, subtle hover underline; nothing else on the card changes.

3. **`src/components/places/PlacesMap.tsx`** — same clickable-name treatment in the map popup title, for parity (this component is currently unused but was already kept in sync with the last fix).

## Not changing
- "Go" button stays as directions (`dir/?api=1`).
- Website/phone buttons stay as they are.

## Verification
- Preview the directory signed in, confirm each card's name is a link and opens the correct place's Google page (spot-check Tekke Picnic Area).
- Check build output clean.
