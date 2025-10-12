import { z } from 'zod';

// Dice notation pattern (e.g., "3D+2", "2D", "4D+1")
const dicePattern = /^\d+D(\+\d)?$/i;

export const characterDataSchema = z.object({
  attributes: z.object({
    Dexterity: z.string().regex(dicePattern).optional(),
    Knowledge: z.string().regex(dicePattern).optional(),
    Mechanical: z.string().regex(dicePattern).optional(),
    Perception: z.string().regex(dicePattern).optional(),
    Strength: z.string().regex(dicePattern).optional(),
    Technical: z.string().regex(dicePattern).optional(),
  }).optional(),
  skills: z.record(z.string().regex(dicePattern)).default({}),
  equipment: z.array(z.string()).default([]),
  credits: z.number().optional(),
  forcePoints: z.number().optional(),
  darkSidePoints: z.number().optional(),
  characterPoints: z.number().optional(),
  woundStatus: z.string().optional(),
  notes: z.string().optional(),
});

export const characterFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  species_slug: z.string().min(1, 'Species is required'),
  data: characterDataSchema,
});

export type CharacterDataInput = z.infer<typeof characterDataSchema>;
export type CharacterFormInput = z.infer<typeof characterFormSchema>;
