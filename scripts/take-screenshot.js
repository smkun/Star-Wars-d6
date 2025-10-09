#!/usr/bin/env node
const playwright = require('@playwright/test');
const path = require('path');

async function screenshot() {
  const browser = await playwright.chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Navigating to species page...');
  await page.goto('http://localhost:5174/d6StarWars/species', { waitUntil: 'networkidle' });

  await page.waitForTimeout(2000);

  const outputPath = path.join(__dirname, '..', 'species-catalog-screenshot.png');
  await page.screenshot({ path: outputPath, fullPage: false });
  console.log('Screenshot saved to:', outputPath);

  await browser.close();
}

screenshot().catch(console.error);
