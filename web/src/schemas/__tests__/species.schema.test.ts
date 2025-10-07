import { describe, it, expect } from 'vitest';
import {
  speciesSchema,
  speciesArraySchema,
  attributeRangeSchema,
  statsSchema,
  languagesSchema,
  namedTextSchema,
} from '../species.schema';

describe('species.schema', () => {
  describe('attributeRangeSchema', () => {
    it('should validate correct dice notation', () => {
      expect(() =>
        attributeRangeSchema.parse({ min: '1D', max: '4D' })
      ).not.toThrow();
      expect(() =>
        attributeRangeSchema.parse({ min: '2D+1', max: '5D+2' })
      ).not.toThrow();
    });

    it('should accept case-insensitive dice notation', () => {
      expect(() =>
        attributeRangeSchema.parse({ min: '1d', max: '4d' })
      ).not.toThrow();
      expect(() =>
        attributeRangeSchema.parse({ min: '2D+1', max: '5d+2' })
      ).not.toThrow();
    });

    it('should reject invalid dice notation', () => {
      expect(() =>
        attributeRangeSchema.parse({ min: '1', max: '4' })
      ).toThrow();
      expect(() =>
        attributeRangeSchema.parse({ min: '1D+', max: '4D' })
      ).toThrow();
      expect(() =>
        attributeRangeSchema.parse({ min: 'invalid', max: '4D' })
      ).toThrow();
    });
  });

  describe('statsSchema', () => {
    it('should validate correct stats', () => {
      const validStats = {
        attributeDice: '12D',
        attributes: {
          dexterity: { min: '1D', max: '4D' },
          knowledge: { min: '2D', max: '4D' },
        },
        move: '10/12',
        size: '1.3-1.8 meters',
      };
      expect(() => statsSchema.parse(validStats)).not.toThrow();
    });

    it('should validate move patterns', () => {
      const stats = {
        attributeDice: '12D',
        attributes: {},
        size: '1.5 meters',
      };
      expect(() =>
        statsSchema.parse({ ...stats, move: '10' })
      ).not.toThrow();
      expect(() =>
        statsSchema.parse({ ...stats, move: '10/12' })
      ).not.toThrow();
    });

    it('should reject invalid move patterns', () => {
      const stats = {
        attributeDice: '12D',
        attributes: {},
        move: 'invalid',
        size: '1.5 meters',
      };
      expect(() => statsSchema.parse(stats)).toThrow();
    });

    it('should warn but accept non-standard size format', () => {
      const stats = {
        attributeDice: '12D',
        attributes: {},
        move: '10',
        size: 'varies',
      };
      // Should not throw, just warn
      expect(() => statsSchema.parse(stats)).not.toThrow();
    });
  });

  describe('languagesSchema', () => {
    it('should validate correct languages', () => {
      const validLanguages = {
        native: 'Bothese',
        description: 'Bothans speak, read, and write Bothese and Basic.',
      };
      expect(() => languagesSchema.parse(validLanguages)).not.toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => languagesSchema.parse({ native: 'Bothese' })).toThrow();
      expect(() =>
        languagesSchema.parse({ description: 'Some description' })
      ).toThrow();
    });
  });

  describe('namedTextSchema', () => {
    it('should validate correct named text', () => {
      const validNamedText = {
        name: 'Special Ability',
        description: 'Enhanced senses',
      };
      expect(() => namedTextSchema.parse(validNamedText)).not.toThrow();
    });

    it('should reject empty strings', () => {
      expect(() =>
        namedTextSchema.parse({ name: '', description: 'test' })
      ).toThrow();
      expect(() =>
        namedTextSchema.parse({ name: 'test', description: '' })
      ).toThrow();
    });
  });

  describe('speciesSchema', () => {
    const validSpecies = {
      id: 1,
      name: 'Bothan',
      plural: 'Bothans',
      description:
        'Fur-covered information brokers whose SpyNet shapes galactic politics.',
      personality: 'Curious, manipulative, crafty, suspicious, loyal and brave.',
      physicalDescription: 'Short furred humanoids; fur ripples with emotion.',
      homeworld: 'Bothawui and colonies',
      languages: {
        native: 'Bothese',
        description: 'Bothans speak, read, and write Bothese and Basic.',
      },
      exampleNames: ['Borsk Fey\'lya', 'Karka Kre\'fey'],
      adventurers: 'Often SpyNet operatives, soldiers, pilots, diplomats.',
      imageUrl: 'bothan.webp',
      stats: {
        attributeDice: '12D',
        attributes: {
          dexterity: { min: '1D', max: '4D' },
          knowledge: { min: '2D', max: '4D' },
          mechanical: { min: '1D', max: '3D' },
          perception: { min: '3D', max: '5D' },
          strength: { min: '1D+2', max: '3D+2' },
          technical: { min: '2D', max: '4D+1' },
        },
        move: '10/12',
        size: '1.3-1.8 meters',
      },
      specialAbilities: [
        { name: 'Special', description: 'Enhanced' },
      ],
      storyFactors: [
        { name: 'Story', description: 'O' },
      ],
      notes: '',
      sources: ['Section 16: Bothan'],
    };

    it('should validate complete species record', () => {
      expect(() => speciesSchema.parse(validSpecies)).not.toThrow();
    });

    it('should accept minimal species record', () => {
      const minimalSpecies = {
        name: 'Test Species',
        description: 'A test species',
        languages: {
          native: 'Test Language',
          description: 'Test description',
        },
        stats: {
          attributeDice: '12D',
          attributes: {},
          move: '10',
          size: '1-2 meters',
        },
        sources: ['Test Source'],
      };
      expect(() => speciesSchema.parse(minimalSpecies)).not.toThrow();
    });

    it('should apply defaults for arrays', () => {
      const speciesWithoutArrays = {
        name: 'Test Species',
        description: 'A test species',
        languages: {
          native: 'Test Language',
          description: 'Test description',
        },
        stats: {
          attributeDice: '12D',
          attributes: {},
          move: '10',
          size: '1-2 meters',
        },
        sources: ['Test Source'],
      };
      const parsed = speciesSchema.parse(speciesWithoutArrays);
      expect(parsed.exampleNames).toEqual([]);
      expect(parsed.specialAbilities).toEqual([]);
      expect(parsed.storyFactors).toEqual([]);
    });

    it('should reject species missing required fields', () => {
      expect(() =>
        speciesSchema.parse({ name: 'Test' })
      ).toThrow();
      expect(() =>
        speciesSchema.parse({
          name: 'Test',
          description: 'Test',
          sources: [],
        })
      ).toThrow(); // sources requires at least 1 item
    });

    it('should coerce id to string or number', () => {
      const speciesWithNumberId = { ...validSpecies, id: 123 };
      const speciesWithStringId = { ...validSpecies, id: '123' };
      expect(() => speciesSchema.parse(speciesWithNumberId)).not.toThrow();
      expect(() => speciesSchema.parse(speciesWithStringId)).not.toThrow();
    });
  });

  describe('speciesArraySchema', () => {
    it('should validate array of species', () => {
      const validArray = [
        {
          name: 'Species 1',
          description: 'Description 1',
          languages: {
            native: 'Language 1',
            description: 'Desc 1',
          },
          stats: {
            attributeDice: '12D',
            attributes: {},
            move: '10',
            size: '1-2 meters',
          },
          sources: ['Source 1'],
        },
        {
          name: 'Species 2',
          description: 'Description 2',
          languages: {
            native: 'Language 2',
            description: 'Desc 2',
          },
          stats: {
            attributeDice: '12D',
            attributes: {},
            move: '10',
            size: '1-2 meters',
          },
          sources: ['Source 2'],
        },
      ];
      expect(() => speciesArraySchema.parse(validArray)).not.toThrow();
    });

    it('should reject if any species is invalid', () => {
      const invalidArray = [
        {
          name: 'Valid Species',
          description: 'Valid',
          languages: { native: 'Lang', description: 'Desc' },
          stats: {
            attributeDice: '12D',
            attributes: {},
            move: '10',
            size: '1-2 meters',
          },
          sources: ['Source'],
        },
        {
          name: 'Invalid Species',
          // Missing required fields
        },
      ];
      expect(() => speciesArraySchema.parse(invalidArray)).toThrow();
    });
  });
});
