/**
 * Search tokenization utilities
 *
 * Tokenizes text for efficient Firestore ARRAY_CONTAINS queries
 */

/**
 * Tokenize text into searchable tokens
 * @param text - Input text to tokenize
 * @returns Array of lowercase tokens
 */
export function tokenize(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return text
    .toLowerCase()
    .split(/[\s,.-]+/) // Split on whitespace, commas, periods, hyphens
    .filter((token) => token.length > 0) // Remove empty strings
    .filter((token) => token.length >= 2); // Remove single-character tokens
}

/**
 * Generate search tokens for a species record
 * Combines name, homeworld, and sources into searchable tokens
 *
 * @param name - Species name
 * @param homeworld - Homeworld name
 * @param sources - Array of source references
 * @returns Array of unique search tokens
 */
export function generateSearchTokens(
  name: string,
  homeworld?: string,
  sources?: string[]
): string[] {
  const tokens = new Set<string>();

  // Tokenize name
  tokenize(name).forEach((token) => tokens.add(token));

  // Tokenize homeworld
  if (homeworld) {
    tokenize(homeworld).forEach((token) => tokens.add(token));
  }

  // Tokenize sources
  if (sources && Array.isArray(sources)) {
    sources.forEach((source) => {
      tokenize(source).forEach((token) => tokens.add(token));
    });
  }

  return Array.from(tokens);
}

/**
 * Generate normalized search name (lowercase, trimmed)
 * Used for exact name searches
 *
 * @param name - Species name
 * @returns Normalized search name
 */
export function generateSearchName(name: string): string {
  return name.toLowerCase().trim();
}
