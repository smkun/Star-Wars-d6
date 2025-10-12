const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser'
  });
  const page = await browser.newPage();

  console.log('Loading YT-1300 Transport page...');
  await page.goto('http://d6holocron.com/wiki/index.php/YT-1300_Transport', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  const checks = await page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    return {
      hasInfobox: Boolean(document.querySelector('.infobox')),
      tableCount: tables.length,
      firstTableClass: tables[0]?.className || 'none',
      firstTableHTML: tables[0]?.outerHTML.substring(0, 500) || 'No table found',
      contentHTML: document.querySelector('#mw-content-text')?.innerHTML.substring(0, 1000) || 'No content'
    };
  });

  console.log(JSON.stringify(checks, null, 2));

  await browser.close();
})();
