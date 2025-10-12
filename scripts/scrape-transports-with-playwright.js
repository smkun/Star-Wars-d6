#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: '/usr/bin/chromium-browser'
  });
  
  try {
    const page = await browser.newPage();
    console.error('Navigating to Space Transports page...');
    
    await page.goto('http://d6holocron.com/wiki/index.php/Space_Transports', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.error('Page loaded, taking screenshot and extracting structure...');
    
    // Debug: Get the page content structure
    const content = await page.evaluate(() => {
      const contentDiv = document.querySelector('#mw-content-text');
      if (!contentDiv) return 'No content div found';
      
      // Try different selectors
      const lists = contentDiv.querySelectorAll('ul');
      const links = contentDiv.querySelectorAll('a');
      
      return {
        listsCount: lists.length,
        linksCount: links.length,
        firstFewLinks: Array.from(links).slice(0, 10).map(a => ({
          text: a.textContent.trim(),
          href: a.href
        }))
      };
    });
    
    console.error('Page structure:', JSON.stringify(content, null, 2));
    
    // Now try to get all transport links
    const transports = await page.evaluate(() => {
      const contentDiv = document.querySelector('#mw-content-text');
      if (!contentDiv) return [];
      
      const allLinks = Array.from(contentDiv.querySelectorAll('a'));
      
      return allLinks
        .filter(link => {
          const href = link.href || '';
          const text = link.textContent.trim();
          
          // Must have wiki link and text
          if (!href.includes('/wiki/') || !text) return false;
          
          // Exclude navigation, categories, edit links
          if (href.includes('redlink=1')) return false;
          if (href.includes('Category:')) return false;
          if (text.toLowerCase().includes('edit')) return false;
          if (text.match(/^\d+$/)) return false; // Just numbers
          
          // Must be a page link (not anchor)
          if (href.includes('#') && !href.match(/\/wiki\/[^#]+$/)) return false;
          
          return true;
        })
        .map(link => ({
          name: link.textContent.trim(),
          href: link.href
        }));
    });
    
    console.log(JSON.stringify(transports, null, 2));
    console.error(`\nFound ${transports.length} transports`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
