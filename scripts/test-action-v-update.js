#!/usr/bin/env node
/**
 * Test Action V scraping and MySQL update with full error logging
 */

const { chromium } = require('playwright');
const mysql = require('mysql2/promise');

async function testActionV() {
  const conn = await mysql.createConnection(process.env.MYSQL_URL);
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE || '/usr/bin/chromium-browser'
  });

  const page = await browser.newPage();
  const url = 'http://d6holocron.com/wiki/index.php/Action_V_Bulk_Freighter';

  console.log(`Fetching: ${url}\n`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  const data = await page.evaluate(() => {
    const content = document.querySelector('#mw-content-text .mw-parser-output');
    if (!content) return null;

    const result = {};
    const text = content.innerHTML;

    const extractField = (label) => {
      const regex = new RegExp(`<b>${label}:</b>\\s*([^<]+)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : null;
    };

    result.craft = extractField('Craft');
    result.type = extractField('Type');
    result.scale = extractField('Scale');
    result.length = extractField('Length');
    result.crew = extractField('Crew');
    result.hull = extractField('Hull');
    result.shields = extractField('Shields');
    result.hyperdrive = extractField('Hyperdrive Multiplier') || extractField('Hyperdrive');

    return result;
  });

  console.log('Extracted Data:');
  console.log(JSON.stringify(data, null, 2));

  if (data) {
    try {
      console.log('\nAttempting MySQL UPDATE...');
      const result = await conn.query(`
        UPDATE starships SET
          craft = ?, type = ?, scale = ?, length = ?,
          crew = ?, hull = ?, shields = ?, hyperdrive = ?
        WHERE slug = ?
      `, [
        data.craft || null,
        data.type || null,
        data.scale || null,
        data.length || null,
        data.crew || null,
        data.hull || null,
        data.shields || null,
        data.hyperdrive || null,
        'action-v-bulk-freighter'
      ]);

      console.log('UPDATE result:', result[0]);
      console.log('✅ MySQL update successful');
    } catch (err) {
      console.error('❌ MySQL update failed:', err.message);
      console.error('Full error:', err);
    }
  }

  await browser.close();
  await conn.end();
}

if (!process.env.MYSQL_URL) {
  console.error('Please set MYSQL_URL environment variable');
  process.exit(1);
}

testActionV().catch(console.error);
