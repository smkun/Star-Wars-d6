#!/usr/bin/env node
'use strict';

// ARCHIVED COPY: patch-starships.js
const fs = require('fs');
const FIREBASE_PROJECT = 'star-wars-d6-species';
const API_KEY = process.env.FIRESTORE_API_KEY || '';
const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const patchStarships = async (jsonPath) => {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (!data.starships || !Array.isArray(data.starships))
    throw new Error('Invalid format: missing starships array');
  console.log(`Patching ${data.starships.length} starships...`);
  let imported = 0;
  let failed = 0;
  for (const starship of data.starships) {
    const slug = slugify(starship.name);
    try {
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
              skill: { stringValue: starship.skill || '' },
              crew: { stringValue: starship.crew || '' },
              crewSkill: { stringValue: starship.crewSkill || '' },
              passengers: { stringValue: starship.passengers || '' },
              cargoCapacity: { stringValue: starship.cargoCapacity || '' },
              consumables: { stringValue: starship.consumables || '' },
              cost: { stringValue: starship.cost || '' },
              hyperdrive: { stringValue: starship.hyperdrive || '' },
              navComputer: { stringValue: starship.navComputer || '' },
              maneuverability: { stringValue: starship.maneuverability || '' },
              space: { stringValue: starship.space || '' },
              atmosphere: { stringValue: starship.atmosphere || '' },
              hull: { stringValue: starship.hull || '' },
              shields: { stringValue: starship.shields || '' },
              sensors: starship.sensors
                ? {
                    mapValue: {
                      fields: {
                        passive: {
                          stringValue: starship.sensors.passive || '',
                        },
                        scan: { stringValue: starship.sensors.scan || '' },
                        search: { stringValue: starship.sensors.search || '' },
                        focus: { stringValue: starship.sensors.focus || '' },
                      },
                    },
                  }
                : { mapValue: { fields: {} } },
              weapons: {
                arrayValue: {
                  values: (starship.weapons || []).map((weapon) => ({
                    mapValue: {
                      fields: {
                        name: { stringValue: weapon.name || '' },
                        fireArc: { stringValue: weapon.fireArc || '' },
                        scale: { stringValue: weapon.scale || '' },
                        skill: { stringValue: weapon.skill || '' },
                        fireControl: { stringValue: weapon.fireControl || '' },
                        spaceRange: { stringValue: weapon.spaceRange || '' },
                        atmosphereRange: {
                          stringValue: weapon.atmosphereRange || '',
                        },
                        damage: { stringValue: weapon.damage || '' },
                      },
                    },
                  })),
                },
              },
              description: { stringValue: starship.description || '' },
              imageUrl: { stringValue: starship.imageUrl || '' },
              imageFilename: { stringValue: starship.imageFilename || '' },
              notes: { stringValue: starship.notes || '' },
              parent: starship.parent
                ? { stringValue: starship.parent }
                : { nullValue: null },
              variantOf: starship.variantOf
                ? { stringValue: starship.variantOf }
                : { nullValue: null },
              isVariant: { booleanValue: starship.isVariant || false },
              sources: {
                arrayValue: {
                  values: (starship.sources || []).map((s) => ({
                    stringValue: s,
                  })),
                },
              },
              pageId: { integerValue: String(starship.pageId || 0) },
              revisionId: { integerValue: String(starship.revisionId || 0) },
            },
          }),
        }
      );
      if (response.ok) {
        console.log(`\u2705 ${starship.name} (${slug})`);
        imported++;
      } else {
        const error = await response.text();
        console.error(`\u274c ${starship.name}: ${error}`);
        failed++;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`\u274c ${starship.name}: ${error.message}`);
      failed++;
    }
  }
  console.log(`\nPatch complete: ${imported} succeeded, ${failed} failed`);
};
const main = async () => {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('Usage: node scripts/patch-starships.js <import-ready-json>');
    process.exit(1);
  }
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }
  await patchStarships(jsonPath);
};
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
