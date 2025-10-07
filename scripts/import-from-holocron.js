#!/usr/bin/env node
/**
 * Complete workflow to fetch, validate, and import species from d6holocron
 * Usage: node scripts/import-from-holocron.js [--limit=N]
 */

const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');

const ROOT = resolve(__dirname, '..');
const IMPORT_READY_PATH = resolve(ROOT, 'Source Data', 'd6holocron', 'import-ready.json');
const TEMP_ALIENS_PATH = resolve(ROOT, 'ALIENS_IMPORT_TEMP.json');

// Parse arguments
const args = process.argv.slice(2);
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? limitArg.split('=')[1] : '50';

console.log('🚀 Starting d6holocron import workflow...\n');

// Step 1: Fetch data from d6holocron
console.log(`📡 Step 1/3: Fetching species from d6holocron (limit: ${limit})...`);
try {
  execSync(`node scripts/fetch-holocron.js --limit=${limit} --delay=300`, {
    cwd: ROOT,
    stdio: 'inherit'
  });
  console.log('✅ Fetch complete\n');
} catch (error) {
  console.error('❌ Failed to fetch data from d6holocron');
  process.exit(1);
}

// Step 2: Validate the import-ready.json
console.log('🔍 Step 2/3: Validating import-ready.json against schema...');
if (!existsSync(IMPORT_READY_PATH)) {
  console.error(`❌ Import file not found: ${IMPORT_READY_PATH}`);
  process.exit(1);
}

const importData = JSON.parse(readFileSync(IMPORT_READY_PATH, 'utf-8'));

if (!importData.species || !Array.isArray(importData.species)) {
  console.error('❌ Invalid import-ready.json structure: missing species array');
  process.exit(1);
}

console.log(`Found ${importData.species.length} species to import`);

// Quick validation of required fields
const validationErrors = [];
importData.species.forEach((species, index) => {
  const errors = [];

  if (!species.name) errors.push('Missing name');
  if (!species.description) errors.push('Missing description');
  if (!species.languages?.native) errors.push('Missing languages.native');
  if (!species.languages?.description) errors.push('Missing languages.description');
  if (!species.stats?.attributeDice) errors.push('Missing stats.attributeDice');
  if (!species.stats?.move) errors.push('Missing stats.move');
  if (!species.stats?.size) errors.push('Missing stats.size');
  if (!species.sources || species.sources.length === 0) errors.push('Missing sources');

  if (errors.length > 0) {
    validationErrors.push(`Species #${index} (${species.name || 'unnamed'}): ${errors.join(', ')}`);
  }
});

if (validationErrors.length > 0) {
  console.error('❌ Validation errors found:');
  validationErrors.forEach(err => console.error(`  - ${err}`));
  console.error('\nFix these issues in the fetch-holocron.js parser and try again.');
  process.exit(1);
}

console.log('✅ Validation passed\n');

// Step 3: Import to Firestore using Admin SDK (no permission issues)
console.log('📤 Step 3/3: Importing to Firestore with Admin SDK...');

try {
  execSync(`node scripts/import-with-admin.js "${IMPORT_READY_PATH}"`, {
    cwd: ROOT,
    stdio: 'inherit'
  });

  console.log('\n✅ Import complete!');
  console.log(`\n📊 Summary:`);
  console.log(`  - Fetched: ${importData.species.length} species`);
  console.log(`  - Imported to Firestore: ${importData.species.length} documents`);
  console.log(`  - Source: ${importData.metadata?.source || 'http://d6holocron.com/wiki/Races'}`);
  console.log(`  - License: ${importData.metadata?.license || 'CC-BY-SA 3.0'}`);
  console.log(`  - Authentication: Firebase Admin SDK (no permission relaxation needed)`);

} catch (error) {
  console.error('❌ Failed to import to Firestore');
  process.exit(1);
}
