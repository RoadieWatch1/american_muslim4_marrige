// Both genders now require 3 photos. Signature kept stable so callers don't change.
export function getMinPhotoCount(_gender?: string | null): number {
  return 3;
}
