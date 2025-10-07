/**
 * Zod validation schemas for Starship data from d6 Holocron
 */

import { z } from 'zod';

/**
 * Sensor range schema
 */
export const sensorRangeSchema = z.object({
  passive: z.string().optional(),
  scan: z.string().optional(),
  search: z.string().optional(),
  focus: z.string().optional(),
});

/**
 * Weapon schema
 */
export const weaponSchema = z.object({
  name: z.string().min(1, 'Weapon name is required'),
  fireArc: z.string().optional(),
  scale: z.string().optional(),
  skill: z.string().optional(),
  fireControl: z.string().optional(),
  spaceRange: z.string().optional(),
  atmosphereRange: z.string().optional(),
  damage: z.string().optional(),
  ammo: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Starship schema
 */
export const starshipSchema = z.object({
  // Basic info
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(1, 'Ship name is required'),
  craft: z.string().optional(), // Full craft name/model
  affiliation: z.string().optional(),
  type: z.string().optional(),
  category: z.enum(['starfighter', 'transport', 'capital', 'other']),

  // Physical characteristics
  scale: z.string().optional(),
  length: z.string().optional(),

  // Crew & Capacity
  crew: z.string().optional(),
  crewSkill: z.string().optional(),
  passengers: z.string().optional(),
  cargoCapacity: z.string().optional(),
  consumables: z.string().optional(),

  // Cost
  cost: z.string().optional(),

  // Flight characteristics
  skill: z.string().optional(), // Piloting skill required
  hyperdrive: z.string().optional(),
  navComputer: z.string().optional(),
  maneuverability: z.string().optional(),
  space: z.string().optional(), // Space speed
  atmosphere: z.string().optional(),

  // Defense
  hull: z.string().optional(),
  shields: z.string().optional(),

  // Sensors
  sensors: sensorRangeSchema.optional(),

  // Weapons
  weapons: z.array(weaponSchema).default([]),

  // Additional info
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
  sources: z.array(z.string()).min(1, 'At least one source is required'),
});

/**
 * Starship array schema (for import validation)
 */
export const starshipArraySchema = z.array(starshipSchema);

/**
 * Type exports
 */
export type Starship = z.infer<typeof starshipSchema>;
export type StarshipArray = z.infer<typeof starshipArraySchema>;
export type Weapon = z.infer<typeof weaponSchema>;
export type SensorRange = z.infer<typeof sensorRangeSchema>;
