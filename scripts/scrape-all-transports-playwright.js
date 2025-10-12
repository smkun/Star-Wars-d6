#!/usr/bin/env node
/**
 * Scrape ALL transport data from d6holocron using Playwright
 * Extracts complete infobox data from rendered HTML
 */

const { chromium } = require('playwright');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DELAY = 400; // ms between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function scrapeTransportPage(page, name) {
  try {
    const url = `http://d6holocron.com/wiki/index.php/${encodeURIComponent(name.replace(/ /g, '_'))}`;
    console.log(`  Fetching: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Extract data from paragraph with <b>Label:</b> Value format
    const data = await page.evaluate(() => {
      const content = document.querySelector('#mw-content-text .mw-parser-output');
      if (!content) return null;

      const result = {};
      const text = content.innerHTML;

      // Parse field - try BOTH patterns (<b>Label:</b> AND <b>Label</b>:)
      const extractField = (label) => {
        // Pattern 1: <b>Label:</b> Value (colon inside <b>)
        const regex1 = new RegExp(`<b>${label}:</b>\\s*([^<]+)`, 'i');
        const match1 = text.match(regex1);
        if (match1) return match1[1].trim();

        // Pattern 2: <b>Label</b>: Value (colon outside <b>)
        const regex2 = new RegExp(`<b>${label}</b>:\\s*([^<]+)`, 'i');
        const match2 = text.match(regex2);
        return match2 ? match2[1].trim() : null;
      };

      result.craft = extractField('Craft');
      result.type = extractField('Type');
      result.scale = extractField('Scale');
      result.length = extractField('Length');
      result.skill = extractField('Skill');
      result.crew = extractField('Crew');
      result.crewSkill = extractField('Crew Skill');
      result.passengers = extractField('Passengers');
      result.cargoCapacity = extractField('Cargo Capacity');
      result.consumables = extractField('Consumables');
      result.cost = extractField('Cost');
      result.hyperdrive = extractField('Hyperdrive Multiplier') || extractField('Hyperdrive');
      result.navComputer = extractField('Nav Computer');
      result.maneuverability = extractField('Maneuverability');
      result.space = extractField('Space');
      result.atmosphere = extractField('Atmosphere');
      result.hull = extractField('Hull');
      result.shields = extractField('Shields');

      // Extract sensors from list - try BOTH patterns
      // Pattern 1: <b>Sensors:</b></p><ul> (colon inside <b>)
      let sensorsMatch = text.match(/<b>Sensors:<\/b>\s*<\/p>\s*<ul>(.*?)<\/ul>/is);
      // Pattern 2: <b>Sensors</b>:</p><ul> (colon outside <b>)
      if (!sensorsMatch) {
        sensorsMatch = text.match(/<b>Sensors<\/b>:\s*<\/p>\s*<ul>(.*?)<\/ul>/is);
      }

      if (sensorsMatch) {
        const sensorsList = sensorsMatch[1];
        const passive = sensorsList.match(/Passive:\s*([^<]+)/i)?.[1]?.trim();
        const scan = sensorsList.match(/Scan:\s*([^<]+)/i)?.[1]?.trim();
        const search = sensorsList.match(/Search:\s*([^<]+)/i)?.[1]?.trim();
        const focus = sensorsList.match(/Focus:\s*([^<]+)/i)?.[1]?.trim();

        if (passive || scan || search || focus) {
          result.sensors = { passive, scan, search, focus };
        }
      }

      // Extract weapons with full details from <ul><li> + <dl><dd> structure
      const weapons = [];

      // Find weapons section - try both patterns
      let weaponsSection = text.match(/<b>Weapons:<\/b>\s*<\/p>\s*<ul>(.*?)<\/ul>\s*(<dl>.*?<\/dl>)?/is);
      if (!weaponsSection) {
        weaponsSection = text.match(/<b>Weapons<\/b>:\s*<\/p>\s*<ul>(.*?)<\/ul>\s*(<dl>.*?<\/dl>)?/is);
      }

      if (weaponsSection) {
        const weaponsList = weaponsSection[1];
        const detailsSection = weaponsSection[2] || '';

        // Extract weapon names from <li> tags
        const weaponNames = [];
        const nameMatches = weaponsList.match(/<li>([^<]+)/g) || [];
        nameMatches.forEach(match => {
          const name = match.replace(/<li>/, '').trim();
          if (name) weaponNames.push(name);
        });

        // Extract weapon details from <dl><dd> tags
        const detailMatches = detailsSection.match(/<dd>(.*?)<\/dd>/gs) || [];

        weaponNames.forEach((name, index) => {
          const weapon = { name };

          // If we have corresponding details, parse them
          if (detailMatches[index]) {
            const details = detailMatches[index].replace(/<\/?dd>/g, '');

            weapon.fireArc = details.match(/Fire Arc:\s*([^<\n]+)/i)?.[1]?.trim();
            weapon.crew = details.match(/Crew:\s*([^<\n]+)/i)?.[1]?.trim();
            weapon.skill = details.match(/Skill:\s*([^<\n]+)/i)?.[1]?.trim();
            weapon.fireControl = details.match(/Fire Control:\s*([^<\n]+)/i)?.[1]?.trim();
            weapon.spaceRange = details.match(/Space Range:\s*([^<\n]+)/i)?.[1]?.trim();
            weapon.atmosphereRange = details.match(/Atmosphere Range:\s*([^<\n]+)/i)?.[1]?.trim();
            weapon.damage = details.match(/Damage:\s*([^<\n]+)/i)?.[1]?.trim();
          }

          weapons.push(weapon);
        });
      }
      result.weapons = weapons;

      return result;
    });

    if (!data) {
      console.log(`  ⚠️  No infobox found`);
      return null;
    }

    console.log(`  ✅ Extracted ${Object.keys(data).length} fields`);
    return data;

  } catch (err) {
    console.error(`  ❌ Error: ${err.message}`);
    return null;
  }
}

async function main() {
  // Get transport list from MySQL
  const conn = await mysql.createConnection(process.env.MYSQL_URL);
  const [transports] = await conn.query(
    "SELECT slug, name FROM starships WHERE category = 'transport' ORDER BY name"
  );

  console.log(`Starting Playwright scraper for ${transports.length} transports...`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE || '/usr/bin/chromium-browser'
  });

  const page = await browser.newPage();
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < transports.length; i++) {
    const transport = transports[i];
    console.log(`\n[${i + 1}/${transports.length}] ${transport.name}`);

    const data = await scrapeTransportPage(page, transport.name);

    if (data) {
      try {
        const sensorsJson = data.sensors ? JSON.stringify(data.sensors) : null;
        const weaponsJson = data.weapons && data.weapons.length > 0 ? JSON.stringify(data.weapons) : null;
        const sensorsRaw = data.sensors
          ? `Passive: ${data.sensors.passive || 'N/A'}, Scan: ${data.sensors.scan || 'N/A'}, Search: ${data.sensors.search || 'N/A'}, Focus: ${data.sensors.focus || 'N/A'}`
          : null;

        await conn.query(`
          UPDATE starships SET
            craft = ?, type = ?, scale = ?, length = ?, skill = ?,
            crew = ?, crewSkill = ?, passengers = ?, cargoCapacity = ?,
            consumables = ?, cost = ?, hyperdrive = ?, navComputer = ?,
            maneuverability = ?, space = ?, atmosphere = ?, hull = ?,
            shields = ?, sensors_raw = ?, sensors_json = ?, weapons_json = ?
          WHERE slug = ?
        `, [
          data.craft || null,
          data.type || null,
          data.scale || null,
          data.length || null,
          data.skill || null,
          data.crew || null,
          data.crewSkill || null,
          data.passengers || null,
          data.cargoCapacity || null,
          data.consumables || null,
          data.cost || null,
          data.hyperdrive || null,
          data.navComputer || null,
          data.maneuverability || null,
          data.space || null,
          data.atmosphere || null,
          data.hull || null,
          data.shields || null,
          sensorsRaw,
          sensorsJson,
          weaponsJson,
          transport.slug
        ]);

        console.log(`  💾 Updated MySQL`);
        updated++;
      } catch (err) {
        console.error(`  ❌ MySQL update failed: ${err.message}`);
        skipped++;
      }
    } else {
      skipped++;
    }

    await sleep(DELAY);
  }

  await browser.close();
  await conn.end();

  console.log(`\n✅ Scraping complete: ${updated} updated, ${skipped} skipped`);
}

if (!process.env.MYSQL_URL) {
  console.error('Please set MYSQL_URL environment variable');
  process.exit(1);
}

main().catch(console.error);
