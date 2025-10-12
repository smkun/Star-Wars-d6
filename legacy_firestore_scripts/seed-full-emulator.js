#!/usr/bin/env node
// ARCHIVED COPY: seed-full-emulator.js
// Seed script preserved for emulator/manual use. Use EXPLICIT_FIRESTORE_ACK=1 to run.
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function slugify(name) {
  return name.toLowerCase().replace(/["'`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function chunkArray(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }

function parseArgs() { const out = {}; for (const raw of process.argv.slice(2)) { if (!raw.startsWith('--')) continue; const eq = raw.indexOf('='); if (eq === -1) { out[raw.replace(/^--+/, '')] = true; } else { const key = raw.slice(2, eq); const val = raw.slice(eq + 1); out[key] = val; } } return out; }

const argv = parseArgs();
const commit = typeof argv.commit !== 'undefined' && argv.commit !== 'false';
const dryRun = argv.dry === 'true' || argv.dry === true || !commit;
const batchSize = parseInt(argv['batch-size'] || argv['batchSize'] || 250, 10);
const delayMs = parseInt(argv['delay-ms'] || argv['delayMs'] || 200, 10);

async function main() {
  const inputFile = argv.file || argv.f || path.join(__dirname, '..', 'ALIENS.json');
  const targetCollection = argv.collection || argv.c || 'species';
  if (!fs.existsSync(inputFile)) { console.error('Input file not found at', inputFile); process.exit(1); }
  const raw = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const items = raw.races || raw.starships || (Array.isArray(raw) ? raw : raw.items) || raw;
  const docs = items.map((r) => { const name = r.name || r.title || `id-${r.id}`; const slugBase = slugify(name); const slug = r.slug || `${slugBase}${r.id ? '-' + r.id : ''}`; const searchTokens = [name.toLowerCase()]; if (r.homeworld) searchTokens.push(String(r.homeworld).toLowerCase()); if (r.sources && Array.isArray(r.sources)) searchTokens.push(...r.sources.map((s) => String(s).toLowerCase())); return { slug, name, homeworld: r.homeworld || null, searchTokens: Array.from(new Set(searchTokens)), sortName: (r.name || '').toLowerCase(), hasImage: !!r.hasImage || !!r.imagePath || !!r.imageUrl, imagePath: r.imagePath || (r.imageUrl ? `aliens/${r.imageUrl}` : null), attributeDice: r.stats ? r.stats.attributeDice : undefined, attributes: r.stats ? r.stats.attributes : undefined, move: r.stats ? r.stats.move : undefined, size: r.stats ? r.stats.size : undefined, specialAbilities: r.specialAbilities || [], storyFactors: r.storyFactors || [], sources: r.sources || [], rawId: r.id || null }; });
  const batches = chunkArray(docs, batchSize);
  console.log(`Will write ${docs.length} documents in ${batches.length} batch(es) (batch size ${batchSize}).`);
  if (dryRun) { console.log('Dry-run enabled. No writes will be performed. Use --commit to perform writes.'); process.exit(0); }
  if (!process.env.FIRESTORE_EMULATOR_HOST && !process.env.GOOGLE_APPLICATION_CREDENTIALS) { console.error('Either FIRESTORE_EMULATOR_HOST (for emulator) or GOOGLE_APPLICATION_CREDENTIALS (for real project) must be set. Aborting.'); process.exit(1); }
  if (process.env.FIRESTORE_EMULATOR_HOST) { admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT || 'demo-project', }); } else { admin.initializeApp({ credential: admin.credential.applicationDefault() }); }
  const db = admin.firestore(); try { db.settings && db.settings({ ignoreUndefinedProperties: true }); } catch (err) {}
  for (let i = 0; i < batches.length; i++) { const batchDocs = batches[i]; console.log(`Writing batch ${i + 1}/${batches.length} (${batchDocs.length} docs)`); const batch = db.batch(); for (const d of batchDocs) { const ref = db.collection(targetCollection).doc(d.slug); batch.set(ref, { ...d, updatedAt: admin.firestore.FieldValue.serverTimestamp(), }); } await batch.commit(); if (i < batches.length - 1) await new Promise((res) => setTimeout(res, delayMs)); }
  console.log('All batches written. Seeding complete.'); try { await admin.app().delete(); } catch (e) {} process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
#!/usr/bin/env node
// Archived: seed-full-emulator.js
console.error(
  '\nThis script has been archived to legacy_firestore_scripts/seed-full-emulator.js.'
);
console.error(
  'To run it intentionally set FIRESTORE_EMULATOR_HOST or GOOGLE_APPLICATION_CREDENTIALS and run from the legacy folder.\n'
);
process.exit(1);
