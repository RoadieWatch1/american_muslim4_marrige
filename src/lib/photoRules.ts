export function getMinPhotoCount(gender?: string | null): number {
  return String(gender ?? "").toLowerCase() === "male" ? 3 : 0;
}
