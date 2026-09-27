# Fix Google Maps links in Dog-Friendly Places

## The problem

The place cards in the list use each place's stored Google Maps link correctly. The **map popups do not** — their "Directions" button always builds a link from the place's latitude/longitude and ignores the stored Google Maps link.

That matters because roughly 50 of the 137 places have coordinates rounded to a city center (e.g. dozens of places share the exact same Limassol pin at 34.6786, 33.0413). For those places:

- Map markers stack on top of each other at the city center instead of the real location.
- Tapping "Directions" in a map popup opens Google Maps at the city center — the wrong spot — even though the correct Google Maps link exists in the database.

Data check: all 137 places have a valid Google Maps link stored (no nulls, no malformed URLs), so this is purely a display bug, not a data problem.

## The fix

1. **Map popup "Directions" uses the stored Google Maps link first** (`src/components/places/PlacesMap.tsx`): pass `google_maps_url` into the map component and use it for the Directions link, falling back to coordinates only when no link is stored. This matches how the place cards already behave.
2. **Replace `window.open` with proper links** in `src/pages/PetFriendlyPlaces.tsx` (the "Go" and website buttons), so external links open reliably — including in the iOS app — per the project's external-link standard.
3. **Escape place data in popup HTML** (name, description, address) while editing the popup, since it is injected as raw HTML.

## Out of scope (flagging, not fixing)

The rounded city-center coordinates themselves are a data-quality issue — markers for those places will still sit at the city center on the map. Re-geocoding them precisely would require Google Maps API calls per place (usage-metered). If you want that, it can be a follow-up task using the Google Maps connector with a capped, one-time batch.

## Technical details

- Files touched: `src/components/places/PlacesMap.tsx`, `src/pages/PetFriendlyPlaces.tsx`
- No database changes, no new dependencies
- Verify: open Dog-Friendly Places, tap a marker for a place with rounded coordinates (e.g. Musa Restaurant, Alley, The Cookhouse — all at 34.6786, 33.0413), confirm Directions opens the place's real Google Maps link
