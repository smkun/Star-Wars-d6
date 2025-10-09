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
      response.text().then(body => {
        if (body.length < 500) {
          console.log('Response body:', body);
        } else {
          console.log('Response body length:', body.length);
        }
      }).catch(() => {});
    }
  });

  console.log('Navigating to species detail page (aar-aa)...');
  await page.goto('http://localhost:5174/d6StarWars/species/aar-aa', {
    waitUntil: 'networkidle',
    timeout: 10000
  });

  await page.waitForTimeout(2000);

  const title = await page.title();
  console.log('Page title:', title);

  // Check for species name
  const h1Text = await page.locator('h1').first().textContent().catch(() => 'No h1 found');
  console.log('H1 text:', h1Text);

  // Check for error or loading messages
  const bodyText = await page.textContent('body');
  if (bodyText.includes('Loading') || bodyText.includes('Unable')) {
    console.log('Page shows loading/error:', bodyText.substring(0, 300));
  }

  // Check what content is displayed
  const mainContent = await page.textContent('main').catch(() => '');
  console.log('Main content (first 500 chars):', mainContent.substring(0, 500));

  await browser.close();
}

debug().catch(console.error);
