#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: '/usr/bin/chromium-browser'
  });
  
  try {
    const page = await browser.newPage();
    console.error('Navigating to d6holocron.com/wiki/Starfighters...');
    
    await page.goto('http://d6holocron.com/wiki/index.php/Starfighters', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.error('Page loaded, extracting starfighter names...');
    
    // Extract all links from the content area
    const starfighters = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('#mw-content-text ul li a'));
      return links
        .map(link => ({
          name: link.textContent.trim(),
          href: link.href
        }))
        .filter(item => 
          item.name && 
          !item.name.includes('Category:') &&
          !item.name.includes('edit') &&
          item.href.includes('/wiki/') &&
          !item.href.includes('redlink=1')
        );
    });
    
    console.log(JSON.stringify(starfighters, null, 2));
    console.error(`\nFound ${starfighters.length} starfighters`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
