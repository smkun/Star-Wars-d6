/**
 * Zod validation schemas for Species data
 * Converted from AJV schema in PRD.md:271-341
 */

import { z } from 'zod';

// Dice notation pattern (case-insensitive): "1D", "2D+1", "3D+2"
const dicePattern = /^\d+D(\+\d)?$/i;

// Move pattern: "10" or "10/12"
const movePattern = /^\d+(\/\d+)?$/;

// Size pattern (lenient - warns but doesn't fail)
const sizePattern = /^\d+(\.\d+)?-\d+(\.\d+)?\s*(m|meter|meters)?$/i;

/**
 * Attribute range schema (min/max dice notation)
 */
export const attributeRangeSchema = z.object({
  min: z
    .string()
    .regex(dicePattern, 'Must be valid dice notation (e.g., "1D", "2D+1")'),
  max: z
    .string()
    .regex(dicePattern, 'Must be valid dice notation (e.g., "4D", "5D+2")'),
});

/**
 * Attributes schema (all six attributes)
 */
export const attributesSchema = z.object({
  dexterity: attributeRangeSchema.optional(),
  knowledge: attributeRangeSchema.optional(),
  mechanical: attributeRangeSchema.optional(),
  perception: attributeRangeSchema.optional(),
  strength: attributeRangeSchema.optional(),
  technical: attributeRangeSchema.optional(),
});

/**
 * Stats schema
 */
export const statsSchema = z.object({
  attributeDice: z
    .string()
    .regex(dicePattern, 'Must be valid dice notation (e.g., "12D")'),
  attributes: attributesSchema,
  move: z
    .string()
    .regex(movePattern, 'Must be valid move value (e.g., "10" or "10/12")'),
  size: z.string().refine(
    (val) => {
      // Warn if size doesn't match pattern, but don't fail
      if (!sizePattern.test(val)) {
        console.warn(`Size "${val}" doesn't match expected pattern`);
      }
      return true;
    },
    { message: 'Size should be in format "1.3-1.8 meters"' }
  ),
});

/**
 * Languages schema
 */
export const languagesSchema = z.object({
  native: z.string().min(1, 'Native language is required'),
  description: z.string().min(1, 'Language description is required'),
});

/**
 * Named text schema (for abilities and story factors)
 */
export const namedTextSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
});

/**
 * Species schema (single record)
 */
export const speciesSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(1, 'Species name is required'),
  plural: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  personality: z.string().optional(),
  physicalDescription: z.string().optional(),
  homeworld: z.string().optional(),
  languages: languagesSchema,
  exampleNames: z.array(z.string()).default([]),
  adventurers: z.string().optional(),
  imageUrl: z.string().optional(),
  stats: statsSchema,
  specialAbilities: z.array(namedTextSchema).default([]),
  storyFactors: z.array(namedTextSchema).default([]),
  notes: z.string().optional(),
  sources: z.array(z.string()).min(1, 'At least one source is required'),
});

/**
 * Species array schema (for import validation)
 */
export const speciesArraySchema = z.array(speciesSchema);

/**
 * Type exports
 */
export type Species = z.infer<typeof speciesSchema>;
export type SpeciesArray = z.infer<typeof speciesArraySchema>;
export type AttributeRange = z.infer<typeof attributeRangeSchema>;
export type Attributes = z.infer<typeof attributesSchema>;
export type Stats = z.infer<typeof statsSchema>;
export type Languages = z.infer<typeof languagesSchema>;
export type NamedText = z.infer<typeof namedTextSchema>;
