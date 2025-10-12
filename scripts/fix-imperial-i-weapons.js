// Quick script to re-scrape just Imperial I Star Destroyer and check weapons
const { chromium } = require('playwright');
const mysql = require('mysql2/promise');

async function scrapeImperialI() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE || '/usr/bin/chromium-browser'
  });

  const page = await browser.newPage();
  await page.goto('http://d6holocron.com/wiki/index.php/Imperial_I_Star_Destroyer', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  const data = await page.evaluate(() => {
    const text = document.body.innerHTML;

    // Find weapons section
    const weaponsStart = text.search(/<b>Weapons:<\/b>/i);
    let htmlSample = '';
    if (weaponsStart !== -1) {
      htmlSample = text.substring(weaponsStart, weaponsStart + 2000);
    }

    return { weapons: [], htmlSample };
  });

  // Print HTML sample
  if (data.htmlSample) {
    console.log('=== WEAPONS HTML SAMPLE ===');
    console.log(data.htmlSample);
    console.log('=== END SAMPLE ===\n');
  }

  await browser.close();
  return data;
}

async function main() {
  console.log('Re-scraping Imperial I Star Destroyer weapons...\n');

  const data = await scrapeImperialI();

  console.log(`Found ${data.weapons.length} weapons:\n`);
  data.weapons.forEach((w, i) => {
    console.log(`${i + 1}. ${w.name}`);
    console.log(`   Fire Arc: ${w.fireArc}`);
    console.log(`   Damage: ${w.damage}`);
    console.log('');
  });

  // Update database
  const conn = await mysql.createConnection(process.env.MYSQL_URL);
  const weaponsJson = JSON.stringify(data.weapons);

  await conn.query(
    'UPDATE starships SET weapons_json = ? WHERE slug = ?',
    [weaponsJson, 'imperial-i-star-destroyer']
  );

  console.log('✅ Updated database');
  await conn.end();
}

if (!process.env.MYSQL_URL) {
  console.error('Please set MYSQL_URL environment variable');
  process.exit(1);
}

main().catch(console.error);
