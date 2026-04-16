const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to a standard desktop size
  await page.setViewportSize({ width: 1440, height: 900 });

  // Load the local HTML file
  const filePath = `file://${path.resolve(__dirname, 'demo_ui.html')}`;
  await page.goto(filePath);

  // Wait for Tailwind to load and Inter font to be ready (approximate)
  await page.waitForTimeout(2000);

  // Take the screenshot
  await page.screenshot({ path: 'demo_mockup.png', fullPage: false });

  await browser.close();
  console.log('Screenshot saved as demo_mockup.png');
})();
