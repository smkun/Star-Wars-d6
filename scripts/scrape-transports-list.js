#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: '/usr/bin/chromium-browser'
  });
  
  try {
    const page = await browser.newPage();
    console.error('Navigating to d6holocron.com/wiki/Space_Transports...');
    
    await page.goto('http://d6holocron.com/wiki/index.php/Space_Transports', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.error('Page loaded, extracting transport names...');
    
    // Extract all links from the content area
    const transports = await page.evaluate(() => {
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
          !item.href.includes('redlink=1') &&
          !item.name.match(/^\d+(\.\d+)?/) // Filter out section numbers
        );
    });
    
    console.log(JSON.stringify(transports, null, 2));
    console.error(`\nFound ${transports.length} space transports`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
