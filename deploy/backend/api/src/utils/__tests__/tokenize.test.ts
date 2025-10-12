import { describe, it, expect } from 'vitest';
import {
  tokenize,
  generateSearchTokens,
  generateSearchName,
} from '../tokenize';

describe('tokenize utilities', () => {
  describe('tokenize', () => {
    it('should split text into lowercase tokens', () => {
      expect(tokenize('Mon Calamari')).toEqual(['mon', 'calamari']);
      expect(tokenize('Wookiee Warrior')).toEqual(['wookiee', 'warrior']);
    });

    it('should handle multiple delimiters', () => {
      expect(tokenize('Mon-Calamari, species')).toEqual([
        'mon',
        'calamari',
        'species',
      ]);
      expect(tokenize('Section 16: Bothan')).toEqual([
        'section',
        '16',
        'bothan',
      ]);
    });

    it('should remove single-character tokens', () => {
      expect(tokenize('A B C Test')).toEqual(['test']);
      expect(tokenize('X Y Z')).toEqual([]);
    });

    it('should filter out empty tokens', () => {
      expect(tokenize('  Mon   Calamari  ')).toEqual(['mon', 'calamari']);
      expect(tokenize('Test,,,,More')).toEqual(['test', 'more']);
    });

    it('should handle empty or invalid input', () => {
      expect(tokenize('')).toEqual([]);
      expect(tokenize('   ')).toEqual([]);
    });

    it('should handle non-string input gracefully', () => {
      expect(tokenize(null as any)).toEqual([]);
      expect(tokenize(undefined as any)).toEqual([]);
    });
  });

  describe('generateSearchTokens', () => {
    it('should combine name, homeworld, and sources', () => {
      const tokens = generateSearchTokens(
        'Bothan',
        'Bothawui',
        ['Section 16: Bothan']
      );
      expect(tokens).toContain('bothan');
      expect(tokens).toContain('bothawui');
      expect(tokens).toContain('section');
      expect(tokens).toContain('16');
    });

    it('should handle missing homeworld', () => {
      const tokens = generateSearchTokens('Bothan', undefined, [
        'Section 16',
      ]);
      expect(tokens).toContain('bothan');
      expect(tokens).toContain('section');
      expect(tokens).toContain('16');
      expect(tokens).not.toContain('undefined');
    });

    it('should handle missing sources', () => {
      const tokens = generateSearchTokens('Mon Calamari', 'Mon Cala');
      expect(tokens).toContain('mon');
      expect(tokens).toContain('calamari');
      expect(tokens).toContain('cala');
    });

    it('should deduplicate tokens', () => {
      const tokens = generateSearchTokens(
        'Human',
        'Human homeworld',
        ['Human species']
      );
      // "human" appears in name, homeworld, and sources but should only appear once
      const humanCount = tokens.filter((t) => t === 'human').length;
      expect(humanCount).toBe(1);
    });

    it('should handle special characters in sources', () => {
      const tokens = generateSearchTokens('Bothan', 'Bothawui', [
        'Section 16: Bothan',
        'Core Rulebook, 2nd Ed.',
      ]);
      expect(tokens).toContain('core');
      expect(tokens).toContain('rulebook');
      expect(tokens).toContain('2nd');
      expect(tokens).toContain('ed');
    });

    it('should return array of unique tokens', () => {
      const tokens = generateSearchTokens(
        'Test Species',
        'Test World',
        ['Test Source']
      );
      expect(new Set(tokens).size).toBe(tokens.length);
    });
  });

  describe('generateSearchName', () => {
    it('should lowercase and trim name', () => {
      expect(generateSearchName('Bothan')).toBe('bothan');
      expect(generateSearchName('Mon Calamari')).toBe('mon calamari');
    });

    it('should handle extra whitespace', () => {
      expect(generateSearchName('  Wookiee  ')).toBe('wookiee');
      expect(generateSearchName('Mon   Calamari')).toBe('mon   calamari');
    });

    it('should preserve spaces in name', () => {
      expect(generateSearchName('Mon Calamari')).toBe('mon calamari');
      expect(generateSearchName('Twi lek')).toBe('twi lek');
    });
  });
});
