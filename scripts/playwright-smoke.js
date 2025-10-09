// Playwright smoke test
// Usage:
//   npm run smoke:playwright
//   PLAYWRIGHT_EXECUTABLE=/usr/bin/chromium-browser npm run smoke:playwright

(async function main() {
  try {
    const { chromium } = require('@playwright/test');
    const execPath = process.env.PLAYWRIGHT_EXECUTABLE;
    const launchOptions = { headless: true };
    if (execPath) {
      console.log('Using PLAYWRIGHT_EXECUTABLE:', execPath);
      launchOptions.executablePath = execPath;
    }
    const browser = await chromium.launch(launchOptions);
    const version = await browser.version();
    console.log('Launched Playwright Chromium:', version);
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Playwright smoke test failed:');
    console.error(err && err.stack ? err.stack : err);
    console.error('\nNotes:');
    console.error(
      '- If browsers are not installed, run `npx playwright install` or `npx playwright install chromium`'
    );
    console.error(
      '- Some environments block the Playwright installer; as a workaround use an existing Chrome/Chromium binary with PLAYWRIGHT_EXECUTABLE env var'
    );
    process.exit(1);
  }
})();
