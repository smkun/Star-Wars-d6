#!/usr/bin/env node
/**
 * Test scraping Action V Bulk Freighter specifically with debug output
 */

const { chromium } = require('playwright');

async function testScrape() {
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
    if (!content) return { error: 'No content div found' };

    const result = {};
    const text = content.innerHTML;

    // Show first 2000 chars of HTML for debugging
    console.log('HTML Preview:', text.substring(0, 2000));

    // Parse <b>Label:</b> Value patterns
    const extractField = (label) => {
      const regex = new RegExp(`<b>${label}:</b>\\s*([^<]+)`, 'i');
      const match = text.match(regex);
      console.log(`${label}: ${match ? match[1].trim() : 'NOT FOUND'}`);
      return match ? match[1].trim() : null;
    };

    result.craft = extractField('Craft');
    result.type = extractField('Type');
    result.scale = extractField('Scale');
    result.length = extractField('Length');
    result.skill = extractField('Skill');
    result.crew = extractField('Crew');
    result.hull = extractField('Hull');
    result.shields = extractField('Shields');
    result.hyperdrive = extractField('Hyperdrive Multiplier') || extractField('Hyperdrive');

    return result;
  });

  console.log('\n\nExtracted Data:');
  console.log(JSON.stringify(data, null, 2));

  await browser.close();
}

testScrape().catch(console.error);
