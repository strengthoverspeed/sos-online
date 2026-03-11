const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, 'group-guidelines.html');
  await page.goto('file://' + htmlPath, { waitUntil: 'domcontentloaded', timeout: 10000 });

  await page.pdf({
    path: path.resolve(__dirname, 'group-guidelines.pdf'),
    format: 'Letter',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await browser.close();
  console.log('PDF generated: group-guidelines.pdf');
})();
