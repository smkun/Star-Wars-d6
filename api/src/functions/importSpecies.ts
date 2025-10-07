/**
 * Import Species Cloud Function
 *
 * Callable function that validates and imports species data into Firestore
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { generateSlug } from '../utils/slug';
import {
  generateSearchTokens,
  generateSearchName,
} from '../utils/tokenize';
import { generateSortName, normalizeDiceNotation } from '../utils/normalize';
import { createAuditLog } from '../utils/audit';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Dice notation pattern (case-insensitive)
const dicePattern = /^\d+D(\+\d)?$/i;

// Zod schema matching web/src/schemas/species.schema.ts
const attributeRangeSchema = z.object({
  min: z.string().regex(dicePattern),
  max: z.string().regex(dicePattern),
});

const attributesSchema = z.object({
  dexterity: attributeRangeSchema.optional(),
  knowledge: attributeRangeSchema.optional(),
  mechanical: attributeRangeSchema.optional(),
  perception: attributeRangeSchema.optional(),
  strength: attributeRangeSchema.optional(),
  technical: attributeRangeSchema.optional(),
});

const statsSchema = z.object({
  attributeDice: z.string().regex(dicePattern),
  attributes: attributesSchema,
  move: z.string().regex(/^\d+(\/\d+)?$/),
  size: z.string(),
});

const languagesSchema = z.object({
  native: z.string().min(1),
  description: z.string().min(1),
});

const namedTextSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

const speciesSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(1),
  plural: z.string().optional(),
  description: z.string().min(1),
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
  sources: z.array(z.string()).min(1),
});

const importRequestSchema = z.object({
  species: z.array(speciesSchema),
  dryRun: z.boolean().default(false),
});

interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  failed: number;
  errors: Array<{ index: number; name: string; error: string }>;
}

/**
 * Normalize dice notation in attributes
 */
function normalizeDiceInAttributes(attrs: any): any {
  const normalized: any = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value && typeof value === 'object' && 'min' in value && 'max' in value) {
      normalized[key] = {
        min: normalizeDiceNotation((value as any).min),
        max: normalizeDiceNotation((value as any).max),
      };
    }
  }
  return normalized;
}

/**
 * Import species data into Firestore
 */
export const importSpecies = functions.https.onCall(
  async (data, context): Promise<ImportResult> => {
    // Check authentication and admin claim
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated to import species'
      );
    }

    if (!context.auth.token.admin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Must have admin role to import species'
      );
    }

    try {
      // Validate request
      const { species: speciesArray, dryRun } = importRequestSchema.parse(data);

      const result: ImportResult = {
        success: true,
        imported: 0,
        updated: 0,
        failed: 0,
        errors: [],
      };

      // Dry run: just validate and return
      if (dryRun) {
        return {
          success: true,
          imported: 0,
          updated: speciesArray.length,
          failed: 0,
          errors: [],
        };
      }

      // Get existing slugs to handle collisions
      const existingDocs = await db.collection('species').get();
      const existingSlugs = new Set(existingDocs.docs.map((doc) => doc.id));

      // Process in batches of 500 (Firestore limit)
      const BATCH_SIZE = 500;
      for (let i = 0; i < speciesArray.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = speciesArray.slice(i, i + BATCH_SIZE);

        for (const species of chunk) {
          try {
            // Generate computed fields
            const slug = generateSlug(
              species.name,
              species.id,
              existingSlugs
            );
            existingSlugs.add(slug); // Add to set to prevent duplicates in same batch

            const searchName = generateSearchName(species.name);
            const searchTokens = generateSearchTokens(
              species.name,
              species.homeworld,
              species.sources
            );
            const sortName = generateSortName(species.name);

            // Normalize dice notation
            const normalizedStats = {
              ...species.stats,
              attributeDice: normalizeDiceNotation(species.stats.attributeDice),
              attributes: normalizeDiceInAttributes(species.stats.attributes),
            };

            // Prepare document
            const docData = {
              ...species,
              stats: normalizedStats,
              slug,
              searchName,
              searchTokens,
              sortName,
              imagePath: species.imageUrl
                ? `aliens/${slug}.webp`
                : undefined,
              hasImage: false,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            // Check if document exists
            const docRef = db.collection('species').doc(slug);
            const existingDoc = await docRef.get();

            if (existingDoc.exists) {
              batch.update(docRef, docData);
              result.updated++;
            } else {
              batch.set(docRef, docData);
              result.imported++;
            }
          } catch (error) {
            result.failed++;
            result.errors.push({
              index: i + chunk.indexOf(species),
              name: species.name,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        // Commit batch
        await batch.commit();
      }

      // Write audit log
      const auditLogRef = db.collection('adminLogs').doc();
      const auditLog = createAuditLog(
        context.auth.uid,
        context.auth.token.email || 'unknown',
        'import',
        undefined,
        {
          imported: result.imported,
          updated: result.updated,
          failed: result.failed,
        }
      );
      await auditLogRef.set(auditLog);

      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid species data',
          error.errors
        );
      }

      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);
