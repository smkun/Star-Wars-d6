/**
 * Text normalization utilities
 *
 * Normalizes text for sorting and comparison
 */

/**
 * Generate normalized sort name for alphabetical sorting
 * Removes articles (a, an, the) from beginning and lowercases
 *
 * @param name - Species name
 * @returns Normalized name for sorting
 */
export function generateSortName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/^(a|an|the)\s+/i, ''); // Remove leading articles
}

/**
 * Normalize dice notation to uppercase
 * Ensures consistent storage format (2D+1 not 2d+1)
 *
 * @param dice - Dice notation string
 * @returns Uppercase dice notation
 */
export function normalizeDiceNotation(dice: string): string {
  return dice.toUpperCase();
}
