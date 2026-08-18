/**
 * Utility to safely normalize and format official university, program, and scholarship URLs.
 * Handles edge cases such as missing protocols, null inputs, spaces, and fallback queries.
 */
export function formatOfficialUrl(
  rawUrl?: string | null,
  domain?: string | null,
  fallbackQuery?: string | null
): string {
  // 1. If explicit raw URL exists (e.g. program sourceUrl or scholarship sourceUrl)
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim().length > 0) {
    const trimmed = rawUrl.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    // Lacks protocol prefix
    return `https://${trimmed}`;
  }

  // 2. If domain exists (e.g. "tum.de", "tudelft.nl", "ed.ac.uk")
  if (domain && typeof domain === 'string' && domain.trim().length > 0) {
    const trimmedDomain = domain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return `https://${trimmedDomain}`;
  }

  // 3. Fallback: Construct Google official website search link
  if (fallbackQuery && typeof fallbackQuery === 'string' && fallbackQuery.trim().length > 0) {
    const encoded = encodeURIComponent(`${fallbackQuery.trim()} official website`);
    return `https://www.google.com/search?q=${encoded}`;
  }

  return '#';
}
