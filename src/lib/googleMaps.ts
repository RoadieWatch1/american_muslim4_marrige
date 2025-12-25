// src/lib/googleMaps.ts

declare global {
  interface Window {
    __googleMapsPromise?: Promise<void>;
  }
}

function getApiKey(): string {
  // ✅ Vite ONLY
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").toString().trim();

  // Helpful debug (remove later)
  // eslint-disable-next-line no-console
  console.log("[googleMaps] VITE_GOOGLE_MAPS_API_KEY present?", Boolean(apiKey));

  if (!apiKey) {
    throw new Error(
      "Missing Google Maps API key. Vite did not load VITE_GOOGLE_MAPS_API_KEY. " +
        "Make sure .env.local is in the project root (same folder as package.json) and restart the dev server."
    );
  }

  return apiKey;
}

function buildScriptUrl(apiKey: string) {
  const params = new URLSearchParams({
    key: apiKey,
    v: "weekly",
    libraries: "places",
  });

  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
}

export async function loadGooglePlaces(): Promise<void> {
  // already loaded
  if ((window as any).google?.maps?.places) return;

  // reuse inflight promise
  if (window.__googleMapsPromise) return window.__googleMapsPromise;

  const apiKey = getApiKey();

  window.__googleMapsPromise = new Promise<void>((resolve, reject) => {
    // if script already exists
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Google Maps script failed to load"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = buildScriptUrl(apiKey);
    script.async = true;
    script.defer = true;
    script.setAttribute("data-google-maps", "true");

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps script failed to load"));

    document.head.appendChild(script);
  });

  return window.__googleMapsPromise;
}
