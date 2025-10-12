const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser'
  });
  const page = await browser.newPage();

  console.log('Scraping YT-1300 Transport...');
  await page.goto('http://d6holocron.com/wiki/index.php/YT-1300_Transport', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  const data = await page.evaluate(() => {
    const content = document.querySelector('#mw-content-text .mw-parser-output');
    if (!content) return null;

    const result = {};
    const text = content.innerHTML;

    // Parse <b>Label:</b> Value patterns
    const extractField = (label) => {
      const regex = new RegExp(`<b>${label}:</b>\\s*([^<]+)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : null;
    };

    result.craft = extractField('Craft');
    result.scale = extractField('Scale');
    result.length = extractField('Length');
    result.skill = extractField('Skill');
    result.crew = extractField('Crew');
    result.hull = extractField('Hull');
    result.hyperdrive = extractField('Hyperdrive Multiplier') || extractField('Hyperdrive');
    result.shields = extractField('Shields');

    return result;
  });

  console.log(JSON.stringify(data, null, 2));

  await browser.close();
})();
