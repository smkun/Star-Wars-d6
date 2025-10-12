#!/usr/bin/env node
/**
 * Complete transport data scraper using Playwright
 * Extracts full infobox data from d6holocron wiki pages
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.resolve(__dirname, '..', 'Source Data', 'd6holocron', 'starships', 'transports-complete-data.json');
const DELAY = 500; // ms between requests

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Transport list from previous scrape
const transportPages = require(path.resolve(__dirname, '..', 'Source Data', 'd6holocron', 'starships', 'transports-variants-import-ready.json')).starships.map(s => s.name);

async function scrapeTransportData(page, name) {
  try {
    const url = `http://d6holocron.com/wiki/index.php/${encodeURIComponent(name.replace(/ /g, '_'))}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Extract infobox data
    const data = await page.evaluate(() => {
      const infobox = document.querySelector('.infobox');
      if (!infobox) return null;

      const result = {};
      const rows = infobox.querySelectorAll('tr');

      rows.forEach(row => {
        const header = row.querySelector('th');
        const cell = row.querySelector('td');
        if (header && cell) {
          const key = header.textContent.trim().toLowerCase().replace(/[:\s]+/g, '_');
          const value = cell.textContent.trim();
          result[key] = value || null;
        }
      });

      // Extract weapons table if exists
      const weaponsTable = document.querySelector('table:has(th:contains("Weapon"))');
      const weapons = [];
      if (weaponsTable) {
        const weaponRows = weaponsTable.querySelectorAll('tr');
        weaponRows.forEach((row, idx) => {
          if (idx === 0) return; // Skip header
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            weapons.push({
              name: cells[0]?.textContent.trim() || '',
              fireArc: cells[1]?.textContent.trim() || '',
              damage: cells[2]?.textContent.trim() || '',
              fireControl: cells[3]?.textContent.trim() || '',
              spaceRange: cells[4]?.textContent.trim() || ''
            });
          }
        });
      }

      return { ...result, weapons };
    });

    if (!data) {
      console.error(`  ⚠️  No infobox found for ${name}`);
      return null;
    }

    console.log(`  ✅ ${name} - ${Object.keys(data).length} fields extracted`);
    return data;

  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`);
    return null;
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser'
  });

  const page = await browser.newPage();
  const results = [];

  console.log(`Scraping ${transportPages.length} transport pages...`);

  for (let i = 0; i < transportPages.length; i++) {
    const name = transportPages[i];
    console.log(`[${i + 1}/${transportPages.length}] ${name}`);

    const data = await scrapeTransportData(page, name);
    if (data) {
      results.push({ name, ...data });
    }

    await sleep(DELAY);
  }

  await browser.close();

  // Save results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ transports: results, count: results.length }, null, 2));
  console.log(`\n✅ Scraped ${results.length} transports → ${OUTPUT_FILE}`);
})();
