// Quick smoke test for puppeteer
// Usage:
//   PUPPETEER_EXECUTABLE_PATH=/path/to/chrome npm run smoke:puppeteer
// or
//   npm run smoke:puppeteer

(async function main() {
  try {
    const puppeteer = require('puppeteer');
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    const launchOptions = {};
    if (executablePath) {
      console.log('Using PUPPETEER_EXECUTABLE_PATH:', executablePath);
      launchOptions.executablePath = executablePath;
    }
    const browser = await puppeteer.launch(launchOptions);
    const version = await browser.version();
    console.log('Launched browser:', version);
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Puppeteer smoke test failed:');
    console.error(err && err.stack ? err.stack : err);
    console.error('\nTips:');
    console.error(
      '- If the script fails to launch Chromium due to missing OS libraries, either install them (see TASKS.md)'
    );
    console.error(
      "- Or run with an existing Chrome/Chromium via PUPPETEER_EXECUTABLE_PATH='/usr/bin/chromium' npm run smoke:puppeteer"
    );
    process.exit(1);
  }
})();
