#!/usr/bin/env node

/**
 * Delete duplicate family placeholder documents that are causing double entries
 * These are old documents with generic names like "Y-Wing Starfighters" that
 * conflict with our synthetic family entries
 */

const FIREBASE_PROJECT = 'star-wars-d6-species';
const API_KEY = 'AIzaSyAvN3w0J2lNXsnc8WjaPjvsljOyb-UCLww';

// Documents to delete (slug IDs)
const documentsToDelete = [
  'y-wing-starfighters',  // Conflicts with family-y-wing
  'x-wing-starfighters',  // Check if this exists and conflicts with family-x-wing
  'b-wing-starfighters',  // Check if this exists
  'a-wing-starfighters',  // Check if this exists
  'z-95-headhunter-starfighters', // Check if this exists
];

async function deleteDocument(slug) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/starships/${slug}?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log(`✅ Deleted: ${slug}`);
      return true;
    } else if (response.status === 404) {
      console.log(`ℹ️  Not found (already deleted): ${slug}`);
      return false;
    } else {
      const error = await response.text();
      console.error(`❌ Failed to delete ${slug}:`, response.status, error);
      return false;
    }
  } catch (err) {
    console.error(`❌ Error deleting ${slug}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🗑️  Deleting duplicate family placeholder documents...\n');

  let deletedCount = 0;
  for (const slug of documentsToDelete) {
    const deleted = await deleteDocument(slug);
    if (deleted) deletedCount++;
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
  }

  console.log(`\n✨ Done! Deleted ${deletedCount} duplicate documents.`);
  console.log('   Refresh the Starfighters page to see the fix.');
}

main();
