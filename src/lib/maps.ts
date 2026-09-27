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
