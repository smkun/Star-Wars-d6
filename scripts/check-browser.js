const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/home/skunian/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  console.log('Navigating...');
  
  await page.goto('https://skunian.github.io/d6StarWars/#/starfighters', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  await page.waitForTimeout(5000);

  const ships = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div[class*="card"], [class*="Card"]'));
    return cards.map(card => {
      const h3 = card.querySelector('h3');
      const h2 = card.querySelector('h2');
      return h3?.textContent?.trim() || h2?.textContent?.trim() || null;
    }).filter(Boolean);
  });

  console.log('Total ships found:', ships.length);
  console.log('\nFirst 25 ships:');
  ships.slice(0, 25).forEach((ship, i) => console.log((i + 1) + '. ' + ship));

  const ties = ships.filter(s => s.toUpperCase().includes('TIE'));
  console.log('\n\nAll ships with TIE (' + ties.length + '):');
  ties.forEach(t => console.log('  - ' + t));

  await browser.close();
})().catch(err => console.error('ERROR:', err));
