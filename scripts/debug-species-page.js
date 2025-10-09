#!/usr/bin/env node
const playwright = require('@playwright/test');

async function debug() {
  const browser = await playwright.chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  // Listen for network requests
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('API REQUEST:', request.method(), request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('API RESPONSE:', response.status(), response.url());
    }
  });

  console.log('Navigating to species page...');
  await page.goto('http://localhost:5174/d6StarWars/species', {
    waitUntil: 'networkidle',
    timeout: 10000
  });

  // Wait a bit for API calls
  await page.waitForTimeout(2000);

  // Get page content
  const title = await page.title();
  console.log('Page title:', title);

  // Check for error messages
  const errorText = await page.textContent('body').catch(() => '');
  if (errorText.includes('Unable to load') || errorText.includes('Failed')) {
    console.log('ERROR MESSAGE FOUND:', errorText.substring(0, 500));
  }

  // Check if species cards are present
  const speciesCount = await page.locator('[data-testid="species-card"], .species-card, article').count();
  console.log('Species cards found:', speciesCount);

  // Get the loading/error state
  const loadingText = await page.textContent('main').catch(() => '');
  console.log('Main content (first 300 chars):', loadingText.substring(0, 300));

  await browser.close();
}

debug().catch(console.error);
