#!/usr/bin/env node
/**
 * Compare Action V data: d6holocron source vs our database
 */

const { chromium } = require('playwright');
const mysql = require('mysql2/promise');

async function compare() {
  console.log('========================================');
  console.log('FETCHING FROM D6HOLOCRON');
  console.log('========================================\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE || '/usr/bin/chromium-browser'
  });

  const page = await browser.newPage();
  await page.goto('http://d6holocron.com/wiki/index.php/Action_V_Bulk_Freighter', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  const holocronData = await page.evaluate(() => {
    const content = document.querySelector('#mw-content-text .mw-parser-output');
    if (!content) return null;

    const text = content.innerHTML;
    const result = {};

    const extractField = (label) => {
      const regex1 = new RegExp(`<b>${label}:</b>\\s*([^<]+)`, 'i');
      const match1 = text.match(regex1);
      if (match1) return match1[1].trim();

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

    // Extract sensors
    const sensorsMatch = text.match(/<b>Sensors:<\/b>\s*<\/p>\s*<ul>(.*?)<\/ul>/is);
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

    return result;
  });

  await browser.close();

  console.log('D6HOLOCRON DATA:');
  console.log(JSON.stringify(holocronData, null, 2));

  console.log('\n========================================');
  console.log('FETCHING FROM OUR DATABASE');
  console.log('========================================\n');

  const conn = await mysql.createConnection(process.env.MYSQL_URL);
  const [rows] = await conn.execute(`
    SELECT name, craft, type, scale, length, skill, crew, crewSkill,
           passengers, cargoCapacity, consumables, cost, hyperdrive,
           navComputer, maneuverability, space, atmosphere, hull, shields,
           sensors_json
    FROM starships WHERE slug = ?
  `, ['action-v-bulk-freighter']);

  const dbData = rows[0];
  if (dbData.sensors_json) {
    dbData.sensors = JSON.parse(dbData.sensors_json);
    delete dbData.sensors_json;
  }

  console.log('DATABASE DATA:');
  console.log(JSON.stringify(dbData, null, 2));

  await conn.end();

  console.log('\n========================================');
  console.log('COMPARISON');
  console.log('========================================\n');

  const fields = ['craft', 'type', 'scale', 'length', 'skill', 'crew', 'crewSkill',
                  'passengers', 'cargoCapacity', 'consumables', 'cost', 'hyperdrive',
                  'navComputer', 'maneuverability', 'space', 'atmosphere', 'hull', 'shields'];

  let matches = 0;
  let mismatches = 0;

  fields.forEach(field => {
    const holocron = holocronData[field];
    const db = dbData[field];

    if (holocron === db) {
      console.log(`✅ ${field}: MATCH`);
      matches++;
    } else {
      console.log(`❌ ${field}: MISMATCH`);
      console.log(`   Holocron: "${holocron}"`);
      console.log(`   Database: "${db}"`);
      mismatches++;
    }
  });

  // Check sensors
  const holocronSensors = JSON.stringify(holocronData.sensors);
  const dbSensors = JSON.stringify(dbData.sensors);
  if (holocronSensors === dbSensors) {
    console.log(`✅ sensors: MATCH`);
    matches++;
  } else {
    console.log(`❌ sensors: MISMATCH`);
    console.log(`   Holocron: ${holocronSensors}`);
    console.log(`   Database: ${dbSensors}`);
    mismatches++;
  }

  console.log(`\n========================================`);
  console.log(`SUMMARY: ${matches} matches, ${mismatches} mismatches`);
  console.log(`========================================`);
}

if (!process.env.MYSQL_URL) {
  console.error('Please set MYSQL_URL environment variable');
  process.exit(1);
}

compare().catch(console.error);
