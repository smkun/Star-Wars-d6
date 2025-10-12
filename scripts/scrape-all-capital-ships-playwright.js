#!/usr/bin/env node
/**
 * Scrape ALL capital ship data from d6holocron using Playwright
 * Extracts complete data including weapons, sensors, and all stats
 * HANDLES BOTH HTML PATTERNS: <b>Label:</b> AND <b>Label</b>:
 */

const { chromium } = require('playwright');
const mysql = require('mysql2/promise');

const DELAY = 400; // ms between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function scrapeCapitalShipPage(page, name) {
  try {
    const url = `http://d6holocron.com/wiki/index.php/${encodeURIComponent(name.replace(/ /g, '_'))}`;
    console.log(`  Fetching: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Extract data from page using BOTH HTML patterns
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
      let sensorsMatch = text.match(/<b>Sensors:<\/b>\s*<\/p>\s*<ul>(.*?)<\/ul>/is);
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

      // Extract weapons with full details
      // Capital ships use repeating pattern: <ul><li>Name</li></ul><dl><dd>Details</dd></dl>
      const weapons = [];

      // Find start of weapons section
      let weaponsStartMatch = text.match(/<b>Weapons:<\/b>/i);
      if (!weaponsStartMatch) {
        weaponsStartMatch = text.match(/<b>Weapons<\/b>:/i);
      }

      if (weaponsStartMatch) {
        const weaponsStartPos = weaponsStartMatch.index + weaponsStartMatch[0].length;

        // Find end of weapons section (next heading or capsule section)
        const afterWeapons = text.substring(weaponsStartPos);
        const endMatch = afterWeapons.match(/<p><b>(?!Fire Arc|Crew|Skill|Fire Control|Space Range|Atmosphere Range|Damage)/i);
        const weaponsEndPos = endMatch ? weaponsStartPos + endMatch.index : text.length;

        const weaponsSection = text.substring(weaponsStartPos, weaponsEndPos);

        // Extract all <ul><li>...</li></ul><dl><dd>...</dd></dl> pairs
        const weaponBlocks = weaponsSection.matchAll(/<ul>\s*<li>(.*?)<\/li>\s*<\/ul>\s*<dl>\s*<dd>(.*?)<\/dd>\s*<\/dl>/gis);

        for (const match of weaponBlocks) {
          const name = match[1].trim();
          const details = match[2];

          const weapon = {
            name,
            fireArc: details.match(/Fire Arc:\s*([^<\n]+)/i)?.[1]?.trim(),
            crew: details.match(/Crew:\s*([^<\n]+)/i)?.[1]?.trim(),
            skill: details.match(/Skill:\s*([^<\n]+)/i)?.[1]?.trim(),
            fireControl: details.match(/Fire Control:\s*([^<\n]+)/i)?.[1]?.trim(),
            spaceRange: details.match(/Space Range:\s*([^<\n]+)/i)?.[1]?.trim(),
            atmosphereRange: details.match(/Atmosphere Range:\s*([^<\n]+)/i)?.[1]?.trim(),
            damage: details.match(/Damage:\s*([^<\n]+)/i)?.[1]?.trim()
          };

          weapons.push(weapon);
        }
      }

      result.weapons = weapons;

      return result;
    });

    if (!data) {
      console.log(`  ⚠️  No data found`);
      return null;
    }

    const fieldCount = Object.keys(data).filter(k => data[k] != null && data[k] !== '' && (Array.isArray(data[k]) ? data[k].length > 0 : true)).length;
    console.log(`  ✅ Extracted ${fieldCount} fields`);
    return data;

  } catch (err) {
    console.error(`  ❌ Error: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('========================================');
  console.log('STEP 1: Fetching capital ship list from d6holocron');
  console.log('========================================\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE || '/usr/bin/chromium-browser'
  });

  const page = await browser.newPage();
  await page.goto('http://d6holocron.com/wiki/index.php/Capital_Ships', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  const shipList = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('#mw-content-text a'));
    return links
      .filter(a => a.href && a.href.includes('/wiki/index.php/') && a.textContent.trim())
      .map(a => a.textContent.trim())
      .filter(name => {
        // Exclude non-ship pages
        if (name.match(/^(Capital Ships?|Category:|Special:|Template:|Main Page|d6Holocron|File:|Help:|Talk:)/i)) return false;
        if (name.match(/Piloting|Main Page|Corporation|Consortium|Trade Federation|Drive Yards|Manufacturing|Mon Calamari|Star Drives|Engineering Corp/i)) return false;
        if (name.match(/^\d+\s+(Corellian|Damorian|Hapes|Hoersch|Kuat|Loronar|Mon|Rendili|Republic)/i)) return false;
        return true;
      });
  });

  // Remove duplicates
  const uniqueShips = [...new Set(shipList)].sort();
  console.log(`Found ${uniqueShips.length} unique capital ships\n`);

  console.log('========================================');
  console.log('STEP 2: Scraping data for all capital ships');
  console.log('========================================\n');

  const conn = await mysql.createConnection(process.env.MYSQL_URL);
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < uniqueShips.length; i++) {
    const shipName = uniqueShips[i];
    const slug = slugify(shipName);

    console.log(`\n[${i + 1}/${uniqueShips.length}] ${shipName}`);

    const data = await scrapeCapitalShipPage(page, shipName);

    if (data) {
      try {
        const sensorsJson = data.sensors ? JSON.stringify(data.sensors) : null;
        const weaponsJson = data.weapons && data.weapons.length > 0 ? JSON.stringify(data.weapons) : null;
        const sensorsRaw = data.sensors
          ? `Passive: ${data.sensors.passive || 'N/A'}, Scan: ${data.sensors.scan || 'N/A'}, Search: ${data.sensors.search || 'N/A'}, Focus: ${data.sensors.focus || 'N/A'}`
          : null;

        // Check if ship exists
        const [existing] = await conn.query('SELECT slug FROM starships WHERE slug = ?', [slug]);

        if (existing.length > 0) {
          // Update existing
          await conn.query(`
            UPDATE starships SET
              name = ?, craft = ?, type = ?, scale = ?, length = ?, skill = ?,
              crew = ?, crewSkill = ?, passengers = ?, cargoCapacity = ?,
              consumables = ?, cost = ?, hyperdrive = ?, navComputer = ?,
              maneuverability = ?, space = ?, atmosphere = ?, hull = ?,
              shields = ?, sensors_raw = ?, sensors_json = ?, weapons_json = ?
            WHERE slug = ?
          `, [
            shipName, data.craft, data.type, data.scale, data.length, data.skill,
            data.crew, data.crewSkill, data.passengers, data.cargoCapacity,
            data.consumables, data.cost, data.hyperdrive, data.navComputer,
            data.maneuverability, data.space, data.atmosphere, data.hull,
            data.shields, sensorsRaw, sensorsJson, weaponsJson, slug
          ]);
        } else {
          // Insert new
          await conn.query(`
            INSERT INTO starships (
              slug, name, craft, type, scale, length, skill, crew, crewSkill,
              passengers, cargoCapacity, consumables, cost, hyperdrive, navComputer,
              maneuverability, space, atmosphere, hull, shields, sensors_raw,
              sensors_json, weapons_json, category
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            slug, shipName, data.craft, data.type, data.scale, data.length, data.skill,
            data.crew, data.crewSkill, data.passengers, data.cargoCapacity,
            data.consumables, data.cost, data.hyperdrive, data.navComputer,
            data.maneuverability, data.space, data.atmosphere, data.hull,
            data.shields, sensorsRaw, sensorsJson, weaponsJson, 'capital'
          ]);
        }

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

  console.log(`\n========================================`);
  console.log(`✅ Scraping complete: ${updated} updated, ${skipped} skipped`);
  console.log(`========================================`);
}

if (!process.env.MYSQL_URL) {
  console.error('Please set MYSQL_URL environment variable');
  process.exit(1);
}

main().catch(console.error);
