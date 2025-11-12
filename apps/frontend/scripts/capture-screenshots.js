const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Pages to screenshot
const pages = [
  { name: 'home', url: '/', viewports: ['desktop', 'mobile'] },
  { name: 'explore', url: '/explore', viewports: ['desktop', 'mobile'] },
  { name: 'favorites', url: '/favorites', viewports: ['desktop', 'mobile'] },
  { name: 'messages', url: '/messages', viewports: ['desktop', 'mobile'] },
  { name: 'bookings', url: '/bookings', viewports: ['desktop', 'mobile'] },
  { name: 'profile', url: '/profile', viewports: ['desktop', 'mobile'] },
  { name: 'notifications', url: '/notifications', viewports: ['desktop', 'mobile'] },
  { name: 'wallet', url: '/wallet', viewports: ['desktop', 'mobile'] },
];

const viewportSizes = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 },
};

async function captureScreenshots() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const screenshotsDir = path.join(__dirname, '../../screenshots');

  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Create a README for the screenshots
  const timestamp = new Date().toISOString();
  const commit = process.env.GITHUB_SHA?.substring(0, 7) || 'local';

  let readme = `# Page Screenshots\n\n`;
  readme += `Last updated: ${timestamp}\n`;
  readme += `Commit: ${commit}\n\n`;
  readme += `## Pages\n\n`;

  console.log('🚀 Starting screenshot capture...');
  console.log(`📍 Base URL: ${baseUrl}`);

  const browser = await chromium.launch();

  for (const page of pages) {
    readme += `### ${page.name.charAt(0).toUpperCase() + page.name.slice(1)} (${page.url})\n\n`;

    for (const viewport of page.viewports) {
      try {
        const context = await browser.newContext({
          viewport: viewportSizes[viewport],
          deviceScaleFactor: viewport === 'mobile' ? 2 : 1,
        });

        const browserPage = await context.newPage();

        console.log(`📸 Capturing ${page.name} (${viewport})...`);

        // Navigate to the page
        await browserPage.goto(`${baseUrl}${page.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // Wait a bit for any animations to complete
        await browserPage.waitForTimeout(1000);

        // Take screenshot
        const filename = `${page.name}-${viewport}.png`;
        const filepath = path.join(screenshotsDir, filename);

        await browserPage.screenshot({
          path: filepath,
          fullPage: true,
        });

        console.log(`✅ Saved: ${filename}`);
        readme += `![${page.name} ${viewport}](./${filename})\n\n`;

        await context.close();
      } catch (error) {
        console.error(`❌ Error capturing ${page.name} (${viewport}):`, error.message);
        readme += `*Error capturing ${viewport} screenshot*\n\n`;
      }
    }
  }

  await browser.close();

  // Write README
  fs.writeFileSync(path.join(screenshotsDir, 'README.md'), readme);
  console.log('📝 Generated README.md');

  console.log('✨ Screenshot capture complete!');
}

captureScreenshots().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
