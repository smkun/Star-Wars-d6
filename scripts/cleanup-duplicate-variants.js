#!/usr/bin/env node
'use strict';

/**
 * Find and delete duplicate/problematic variant documents
 * These are variants with generic names that duplicate properly-named variants
 */

const FIREBASE_PROJECT = 'star-wars-d6-species';
const API_KEY = 'AIzaSyAvN3w0J2lNXsnc8WjaPjvsljOyb-UCLww';

async function findAndDeleteDuplicates() {
  console.log('Finding duplicate variant documents...\n');

  // Fetch all starships
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/starships?pageSize=300&key=${API_KEY}`
  );

  const data = await response.json();
  const docs = data.documents || [];

  const toDelete = [];

  for (const doc of docs) {
    const fields = doc.fields;
    const slug = doc.name.split('/').pop();
    const name = fields.name?.stringValue || '';
    const parent = fields.parent?.stringValue || '';
    const isVariant = fields.isVariant?.booleanValue || false;
    const craft = fields.craft?.stringValue || '';

    // Skip if not a variant
    if (!isVariant || !parent) continue;

    // Clean parent name
    const parentClean = parent
      .replace(/'''/g, '')
      .replace(/\[\[|\]\]/g, '')
      .replace(/Running the /i, '')
      .trim();

    // Identify problematic documents:
    // 1. Self-referential (name matches parent)
    // 2. Generic name when craft exists (name != craft) and slug has no hyphens (simple slug)
    const isSelfReferential = name.toLowerCase() === parentClean.toLowerCase();
    const hasGenericName = craft && name !== craft && !slug.includes('-');

    if (isSelfReferential || hasGenericName) {
      toDelete.push({
        slug,
        name,
        craft,
        parent,
        reason: isSelfReferential ? 'self-referential' : 'generic-name-duplicate'
      });
    }
  }

  console.log(`Found ${toDelete.length} problematic documents:\n`);
  toDelete.forEach(d => {
    console.log(`  ${d.slug}: "${d.name}" (${d.reason})`);
    if (d.craft) console.log(`    → Should be: "${d.craft}"`);
  });

  if (toDelete.length === 0) {
    console.log('\nNo duplicates found! Database is clean.');
    return;
  }

  console.log('\nDeleting problematic documents...\n');

  let deleted = 0;
  let failed = 0;

  for (const doc of toDelete) {
    try {
      const deleteResponse = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/starships/${doc.slug}?key=${API_KEY}`,
        { method: 'DELETE' }
      );

      if (deleteResponse.ok) {
        console.log(`✅ Deleted ${doc.slug}`);
        deleted++;
      } else {
        const error = await deleteResponse.text();
        console.error(`❌ Failed to delete ${doc.slug}: ${error}`);
        failed++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Error deleting ${doc.slug}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nCleanup complete: ${deleted} deleted, ${failed} failed`);
}

findAndDeleteDuplicates().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
