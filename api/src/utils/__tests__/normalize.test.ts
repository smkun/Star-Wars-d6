import { describe, it, expect } from 'vitest';
import { generateSortName, normalizeDiceNotation } from '../normalize';

describe('normalize utilities', () => {
  describe('generateSortName', () => {
    it('should lowercase and trim name', () => {
      expect(generateSortName('Bothan')).toBe('bothan');
      expect(generateSortName('  Mon Calamari  ')).toBe('mon calamari');
    });

    it('should remove leading articles', () => {
      expect(generateSortName('The Wookiee')).toBe('wookiee');
      expect(generateSortName('A Human')).toBe('human');
      expect(generateSortName('An Ewok')).toBe('ewok');
    });

    it('should handle case-insensitive articles', () => {
      expect(generateSortName('THE Empire')).toBe('empire');
      expect(generateSortName('A Species')).toBe('species');
      expect(generateSortName('AN Alien')).toBe('alien');
    });

    it('should not remove articles in middle of name', () => {
      expect(generateSortName('Mon The Calamari')).toBe('mon the calamari');
      expect(generateSortName('Test A Name')).toBe('test a name');
    });

    it('should preserve spaces after article removal', () => {
      expect(generateSortName('The Mon Calamari')).toBe('mon calamari');
    });

    it('should handle names without articles', () => {
      expect(generateSortName('Bothan')).toBe('bothan');
      expect(generateSortName('Twi\'lek')).toBe('twi\'lek');
    });
  });

  describe('normalizeDiceNotation', () => {
    it('should convert lowercase to uppercase', () => {
      expect(normalizeDiceNotation('2d')).toBe('2D');
      expect(normalizeDiceNotation('3d+1')).toBe('3D+1');
    });

    it('should preserve already uppercase', () => {
      expect(normalizeDiceNotation('2D')).toBe('2D');
      expect(normalizeDiceNotation('12D')).toBe('12D');
    });

    it('should handle mixed case', () => {
      expect(normalizeDiceNotation('2D+1')).toBe('2D+1');
      expect(normalizeDiceNotation('2d+1')).toBe('2D+1');
    });
  });
});
