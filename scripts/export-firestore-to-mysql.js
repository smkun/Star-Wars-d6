#!/usr/bin/env node
/**
 * Export complete species data from Firestore and update MySQL
 * This fills in missing fields: personality, physicalDescription, adventurers, languages, sources
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const mysql = require('mysql2/promise');

// Firebase config from web/src/utils/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyBaJ9TbEYPBCzcXATHqVqLRG_mcuhcRu5Y",
  authDomain: "d6-holocron.firebaseapp.com",
  projectId: "d6-holocron",
  storageBucket: "d6-holocron.firebasestorage.app",
  messagingSenderId: "610224385526",
  appId: "1:610224385526:web:5e01e0e3c9dd2a20e5cf07"
};

const MYSQL_URL = process.env.MYSQL_URL;

if (!MYSQL_URL) {
  console.error('MYSQL_URL environment variable is required');
  process.exit(1);
}

async function main() {
  console.log('Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('Connecting to MySQL...');
  const mysqlConn = await mysql.createConnection(MYSQL_URL);

  console.log('Fetching species from Firestore...');
  const speciesRef = collection(db, 'species');
  const snapshot = await getDocs(speciesRef);

  console.log(`Found ${snapshot.size} species in Firestore\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const slug = doc.id;

    try {
      // Check if species exists in MySQL
      const [rows] = await mysqlConn.query('SELECT properties FROM species WHERE slug = ?', [slug]);

      if (rows.length === 0) {
        console.log(`⚠️  ${slug} - not in MySQL, skipping`);
        skipped++;
        continue;
      }

      // Parse existing properties
      const existingProps = JSON.parse(rows[0].properties || '{}');

      // Build updated properties with all data
      const updatedProps = {
        ...existingProps,
        sources: data.sources || existingProps.sources || [],
      };

      // Add optional fields if they exist in Firestore
      if (data.personality) updatedProps.personality = data.personality;
      if (data.physicalDescription) updatedProps.physicalDescription = data.physicalDescription;
      if (data.adventurers) updatedProps.adventurers = data.adventurers;
      if (data.languages) updatedProps.languages = data.languages;

      // Update MySQL with enriched properties
      await mysqlConn.query(
        'UPDATE species SET properties = ? WHERE slug = ?',
        [JSON.stringify(updatedProps), slug]
      );

      console.log(`✅ ${slug} - updated with complete data`);
      updated++;

    } catch (err) {
      console.error(`❌ ${slug} - error:`, err.message);
      errors++;
    }
  }

  await mysqlConn.end();

  console.log('\n=== Migration Summary ===');
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total: ${snapshot.size}`);
}

main().catch(console.error);
