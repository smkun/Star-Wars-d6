import { describe, it, expect } from 'vitest';
import { slugify, generateSlug } from '../slug';

describe('slug utilities', () => {
  describe('slugify', () => {
    it('should convert to lowercase kebab-case', () => {
      expect(slugify('Bothan')).toBe('bothan');
      expect(slugify('Mon Calamari')).toBe('mon-calamari');
      expect(slugify('Wookiee Warrior')).toBe('wookiee-warrior');
    });

    it('should remove special characters', () => {
      expect(slugify('Human (Corellian)')).toBe('human-corellian');
      expect(slugify("Twi'lek")).toBe('twilek');
      expect(slugify('R2-D2')).toBe('r2-d2');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('Mon   Calamari')).toBe('mon-calamari');
      expect(slugify('  Extra  Spaces  ')).toBe('extra-spaces');
    });

    it('should remove leading/trailing hyphens', () => {
      expect(slugify('-Bothan-')).toBe('bothan');
      expect(slugify('--Multiple--')).toBe('multiple');
    });

    it('should handle empty strings', () => {
      expect(slugify('')).toBe('');
      expect(slugify('   ')).toBe('');
    });
  });

  describe('generateSlug', () => {
    it('should return base slug when no collisions', () => {
      const slug = generateSlug('Bothan');
      expect(slug).toBe('bothan');
    });

    it('should return base slug when not checking collisions', () => {
      const slug = generateSlug('Mon Calamari', 1);
      expect(slug).toBe('mon-calamari');
    });

    it('should handle collision with ID fallback', () => {
      const existing = new Set(['human']);
      const slug = generateSlug('Human', 5, existing);
      expect(slug).toBe('human-5');
    });

    it('should handle collision with incrementing counter', () => {
      const existing = new Set(['human', 'human-1', 'human-2']);
      const slug = generateSlug('Human', undefined, existing);
      expect(slug).toBe('human-3');
    });

    it('should handle collision even with ID already taken', () => {
      const existing = new Set(['human', 'human-5']);
      const slug = generateSlug('Human', 5, existing);
      expect(slug).toBe('human-1');
    });

    it('should generate unique slug for multiple collisions', () => {
      const existing = new Set([
        'bothan',
        'bothan-1',
        'bothan-2',
        'bothan-3',
      ]);
      const slug = generateSlug('Bothan', undefined, existing);
      expect(slug).toBe('bothan-4');
    });
  });
});
