// src/lib/googleMaps.ts

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

function getApiKey(): string {
  // ✅ Vite ONLY
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').toString().trim();

  if (!apiKey) {
    throw new Error(
      'Missing Google Maps API key. Vite did not load VITE_GOOGLE_MAPS_API_KEY. ' +
        'Make sure it is set in the environment (and in Vercel for deployed builds).'
    );
  }

  return apiKey;
}

let optionsConfigured = false;

/**
 * Loads the Places library using Google's current dynamic-import pattern.
 *
 * The Maps JS API itself is only fetched on the first importLibrary() call,
 * and the loader de-duplicates internally, so this is safe to call from more
 * than one component without loading the API twice.
 *
 * Resolves with the Places library so callers can destructure the pieces they
 * need, e.g. `const { PlaceAutocompleteElement } = await loadGooglePlaces()`.
 *
 * NOTE: a rejected promise here only covers script/network failures. An API
 * key that Google rejects (bad key, referrer restriction, billing disabled,
 * Places API not enabled) still *loads* successfully and instead surfaces via
 * the `gm_authFailure` global — callers must handle that separately.
 */
export async function loadGooglePlaces(): Promise<google.maps.PlacesLibrary> {
  if (!optionsConfigured) {
    setOptions({ key: getApiKey(), v: 'weekly' });
    optionsConfigured = true;
  }

  return importLibrary('places');
}
