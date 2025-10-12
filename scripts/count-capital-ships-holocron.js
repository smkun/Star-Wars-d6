#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: true, executablePath: '/usr/bin/chromium-browser'});
  const page = await browser.newPage();
  await page.goto('http://d6holocron.com/wiki/index.php/Capital_Ships', {waitUntil: 'networkidle', timeout: 30000});

  const ships = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('#mw-content-text a'));
    return links
      .filter(a => a.href && a.href.includes('/wiki/index.php/') && a.textContent.trim())
      .map(a => ({
        name: a.textContent.trim(),
        url: a.href
      }))
      .filter(ship => {
        const excludePatterns = /^(Capital Ships|Category:|Special:|Template:|Main Page|d6Holocron|File:|Help:)/i;
        return !ship.name.match(excludePatterns);
      });
  });

  console.log('Total capital ships on holocron:', ships.length);
  console.log('\nFirst 10:');
  ships.slice(0, 10).forEach((s, i) => console.log(`  ${i+1}. ${s.name}`));
  console.log('\nLast 10:');
  ships.slice(-10).forEach((s, i) => console.log(`  ${ships.length - 9 + i}. ${s.name}`));

  await browser.close();
})();
