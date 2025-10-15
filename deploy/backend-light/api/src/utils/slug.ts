/**
 * Slug generation utilities
 *
 * Generates URL-safe slugs from species names with collision handling
 */

/**
 * Convert string to kebab-case slug
 * @param text - Input text to slugify
 * @returns URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate unique slug with collision handling
 * @param name - Species name
 * @param id - Optional numeric ID for collision fallback
 * @param existingSlugs - Set of existing slugs to check against
 * @returns Unique slug
 */
export function generateSlug(
  name: string,
  id?: number | string,
  existingSlugs?: Set<string>
): string {
  const baseSlug = slugify(name);

  // If no collision checking needed, return base slug
  if (!existingSlugs) {
    return baseSlug;
  }

  // Check for collisions
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  // Handle collision with ID fallback
  if (id !== undefined) {
    const slugWithId = `${baseSlug}-${id}`;
    if (!existingSlugs.has(slugWithId)) {
      return slugWithId;
    }
  }

  // Last resort: append incrementing number
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  while (existingSlugs.has(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}
