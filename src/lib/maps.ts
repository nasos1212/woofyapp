/**
 * Builds a Google Maps "universal link" (api=1) for a place.
 * These URLs open directly in the Google Maps app on iOS/Android when
 * installed, and fall back to the web version otherwise — unlike plain
 * google.com/maps or maps.app.goo.gl links, which often stay in the browser.
 *
 * The destination is the place name + city (a text query) rather than raw
 * coordinates, because some places have coordinates rounded to the city
 * center; a name query resolves to the actual place card in the app.
 */
export interface MapsPlaceLike {
  name: string;
  city?: string | null;
  area?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export function getGoogleMapsUrl(place: MapsPlaceLike): string {
  const location = place.city || place.area || "Cyprus";
  const destination = `${place.name}, ${location}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

/**
 * Builds a Google Maps "search" universal link for a place's own listing page
 * (reviews, photos, opening hours, website/menu) — as opposed to
 * getGoogleMapsUrl, which builds directions.
 *
 * Same api=1 pattern: opens the place page directly in the Google Maps app on
 * iOS/Android when installed, web otherwise. A text query (name + city) is
 * used instead of stored goo.gl links or raw coordinates, since some places
 * have coordinates rounded to the city center.
 */
export function getGooglePlacePageUrl(place: MapsPlaceLike): string {
  const location = place.city || place.area || "Cyprus";
  const query = `${place.name}, ${location}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
