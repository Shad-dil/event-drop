import { customAlphabet } from "nanoid";

// Lowercase alphanumeric, no ambiguous characters — short and URL/QR friendly.
const nanoid = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 6);

export function slugifyBase(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return base.length > 0 ? base.slice(0, 40) : "event";
}

/** Builds a candidate slug like "sarahs-birthday-bash-x7k2pq". */
export function buildSlugCandidate(name: string): string {
  return `${slugifyBase(name)}-${nanoid()}`;
}
