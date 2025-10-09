#!/usr/bin/env node
'use strict';

/**
 * Update/replace all starships in Firestore using REST API
 * Uses PATCH to overwrite existing documents
 */

const fs = require('fs');

const FIREBASE_PROJECT = 'star-wars-d6-species';
const API_KEY = 'AIzaSyAvN3w0J2lNXsnc8WjaPjvsljOyb-UCLww';

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const updateAllStarships = async (jsonPath) => {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(`Updating ${data.starships.length} starships (will overwrite existing)...`);

  let updated = 0;
  let failed = 0;

  for (const starship of data.starships) {
    const slug = slugify(starship.name);

    try {
      // Use PATCH to update/create document
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/starships/${slug}?key=${API_KEY}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              name: { stringValue: starship.name || '' },
              craft: { stringValue: starship.craft || '' },
              affiliation: { stringValue: starship.affiliation || '' },
              type: { stringValue: starship.type || '' },
              category: { stringValue: starship.category || '' },
              scale: { stringValue: starship.scale || '' },
              length: { stringValue: starship.length || '' },
              crew: { stringValue: starship.crew || '' },
              passengers: { stringValue: starship.passengers || '' },
              cargoCapacity: { stringValue: starship.cargoCapacity || '' },
              consumables: { stringValue: starship.consumables || '' },
              hyperdrive: { stringValue: starship.hyperdrive || '' },
              backup: { stringValue: starship.backup || '' },
              navComputer: { stringValue: starship.navComputer || '' },
              maneuverability: { stringValue: starship.maneuverability || '' },
              space: { stringValue: starship.space || '' },
              atmosphere: { stringValue: starship.atmosphere || '' },
              hull: { stringValue: starship.hull || '' },
              shields: { stringValue: starship.shields || '' },
              sensors: { stringValue: starship.sensors || '' },
              weapons: {
                arrayValue: {
                  values: (starship.weapons || []).map((w) => ({
                    mapValue: {
                      fields: {
                        name: { stringValue: w.name || '' },
                        fireArc: { stringValue: w.fireArc || '' },
                        damage: { stringValue: w.damage || '' },
                        fireControl: { stringValue: w.fireControl || '' },
                        spaceRange: { stringValue: w.spaceRange || '' },
                        atmosphereRange: { stringValue: w.atmosphereRange || '' },
                      },
                    },
                  })),
                },
              },
              description: { stringValue: starship.description || '' },
              imageUrl: { stringValue: starship.imageUrl || '' },
              imageFilename: { stringValue: starship.imageFilename || '' },
              notes: { stringValue: starship.notes || '' },
              sources: {
                arrayValue: {
                  values: (starship.sources || []).map((s) => ({ stringValue: s })),
                },
              },
              parent: { stringValue: starship.parent || '' },
              variantOf: { stringValue: starship.variantOf || '' },
              isVariant: { booleanValue: starship.isVariant || false },
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ ${starship.name}:`, JSON.stringify(error, null, 2));
        failed++;
      } else {
        updated++;
        if (updated % 20 === 0) {
          console.log(`✓ Updated ${updated}/${data.starships.length}...`);
        }
      }
    } catch (err) {
      console.error(`❌ ${starship.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Update complete: ${updated} succeeded, ${failed} failed`);
};

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error('Usage: node update-all-starships.js <import-ready-json>');
  process.exit(1);
}

updateAllStarships(jsonPath).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
