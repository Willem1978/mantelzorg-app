/**
 * Adobe XD Prototype to PDF Converter
 *
 * Dit script opent het Adobe XD prototype in een browser,
 * ontdekt alle schermen via de grid view, maakt screenshots
 * van elk scherm en combineert alles in één PDF document.
 *
 * Gebruik:
 *   node scripts/xd-to-pdf.mjs
 *
 * Vereisten:
 *   - Node.js 18+
 *   - npx playwright install chromium
 *   - npm install (voor jsPDF dependency)
 */

import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== CONFIGURATIE =====
const XD_BASE_URL = 'https://xd.adobe.com/view/10b91b4a-3950-443a-8e5e-304b997c756e-45ea';
const FIRST_SCREEN_ID = 'f8361423-4b80-4c29-b390-eb71756ad26b';
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'xd-screenshots');
const PDF_OUTPUT_PATH = path.join(OUTPUT_DIR, 'mantelzorg-app-design.pdf');

// Viewport instellingen (mobiel app design)
const VIEWPORT = { width: 1440, height: 900 };
const DEVICE_SCALE = 2;

// Timing
const PAGE_LOAD_WAIT = 4000;
const SCREEN_TRANSITION_WAIT = 2000;

async function ensureDirectories() {
  for (const dir of [OUTPUT_DIR, SCREENSHOT_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

async function findChromiumPath() {
  // Zoek naar beschikbare Chromium installatie
  const possiblePaths = [
    // Playwright system cache
    '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
    // Common Linux paths
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    // macOS paths
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback: laat Playwright zelf zoeken
  return undefined;
}

async function discoverScreensFromGrid(page) {
  console.log('\n📋 Schermen ontdekken via grid view...');

  // Navigeer naar de grid view van het prototype
  await page.goto(`${XD_BASE_URL}/grid`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForTimeout(PAGE_LOAD_WAIT);

  // Probeer scherm-links te vinden in de grid view
  const screens = await page.evaluate((baseUrl) => {
    const results = [];

    // Methode 1: Zoek naar links met screen IDs
    const links = document.querySelectorAll('a[href*="/screen/"]');
    links.forEach(link => {
      const href = link.href;
      const match = href.match(/screen\/([a-f0-9-]+)/);
      if (match) {
        const name = link.textContent?.trim() ||
                     link.getAttribute('aria-label') ||
                     link.getAttribute('title') ||
                     `Screen ${results.length + 1}`;
        results.push({ id: match[1], name, href });
      }
    });

    // Methode 2: Zoek naar artboard thumbnails/kaarten
    if (results.length === 0) {
      const cards = document.querySelectorAll('[class*="artboard"], [class*="screen"], [class*="card"], [class*="thumb"]');
      cards.forEach((card, i) => {
        const link = card.closest('a') || card.querySelector('a');
        if (link) {
          const match = link.href.match(/screen\/([a-f0-9-]+)/);
          if (match) {
            results.push({
              id: match[1],
              name: card.textContent?.trim()?.substring(0, 50) || `Screen ${i + 1}`,
              href: link.href,
            });
          }
        }
      });
    }

    // Methode 3: Zoek naar UUID-patronen in de pagina
    if (results.length === 0) {
      const html = document.documentElement.innerHTML;
      const screenPattern = /screen\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/g;
      let match;
      const seen = new Set();
      while ((match = screenPattern.exec(html)) !== null) {
        if (!seen.has(match[1])) {
          seen.add(match[1]);
          results.push({
            id: match[1],
            name: `Screen ${results.length + 1}`,
            href: `${baseUrl}/screen/${match[1]}`,
          });
        }
      }
    }

    return results;
  }, XD_BASE_URL);

  return screens;
}

async function discoverScreensByNavigation(page) {
  console.log('\n🔍 Schermen ontdekken via navigatie...');

  const visitedScreens = new Set();
  const screenQueue = [FIRST_SCREEN_ID];
  const results = [];

  while (screenQueue.length > 0) {
    const screenId = screenQueue.shift();
    if (visitedScreens.has(screenId)) continue;
    visitedScreens.add(screenId);

    console.log(`  Bezoeken: ${screenId.substring(0, 8)}...`);

    await page.goto(`${XD_BASE_URL}/screen/${screenId}?fullscreen`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(SCREEN_TRANSITION_WAIT);

    // Haal scherm naam op
    const screenName = await page.evaluate(() => {
      // Probeer de artboard naam te vinden
      const nameEl = document.querySelector('[class*="artboard-name"], [class*="screen-name"], title');
      return nameEl?.textContent?.trim() || document.title || '';
    });

    results.push({
      id: screenId,
      name: screenName || `Screen ${results.length + 1}`,
      href: `${XD_BASE_URL}/screen/${screenId}`,
    });

    // Zoek naar links naar andere schermen
    const linkedScreens = await page.evaluate(() => {
      const html = document.documentElement.innerHTML;
      const pattern = /screen\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/g;
      const ids = new Set();
      let match;
      while ((match = pattern.exec(html)) !== null) {
        ids.add(match[1]);
      }
      return [...ids];
    });

    for (const id of linkedScreens) {
      if (!visitedScreens.has(id)) {
        screenQueue.push(id);
      }
    }

    // Beperk het aantal schermen om oneindige lussen te voorkomen
    if (visitedScreens.size > 100) {
      console.log('  ⚠️  Maximum aantal schermen bereikt (100)');
      break;
    }
  }

  return results;
}

async function captureScreenshots(page, screens) {
  console.log(`\n📸 Screenshots maken van ${screens.length} schermen...\n`);

  const screenshotPaths = [];

  for (let i = 0; i < screens.length; i++) {
    const screen = screens[i];
    const paddedIndex = String(i + 1).padStart(3, '0');
    const safeName = screen.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const filename = `${paddedIndex}_${safeName}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);

    console.log(`  [${i + 1}/${screens.length}] ${screen.name}`);

    try {
      await page.goto(`${XD_BASE_URL}/screen/${screen.id}?fullscreen`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await page.waitForTimeout(SCREEN_TRANSITION_WAIT);

      // Wacht tot de content geladen is
      await page.evaluate(() => {
        return new Promise((resolve) => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve);
          }
        });
      });

      // Verberg eventuele XD UI overlays
      await page.evaluate(() => {
        const selectors = [
          '[class*="toolbar"]',
          '[class*="header"]',
          '[class*="footer"]',
          '[class*="nav-bar"]',
          '[class*="HUD"]',
          '[class*="comment"]',
        ];
        selectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => {
            if (el.closest('[class*="artboard"]') === null) {
              el.style.display = 'none';
            }
          });
        });
      });

      await page.screenshot({
        path: filepath,
        fullPage: false,
      });

      screenshotPaths.push({
        path: filepath,
        name: screen.name,
        index: i,
      });
    } catch (err) {
      console.error(`  ❌ Fout bij ${screen.name}: ${err.message}`);
    }
  }

  return screenshotPaths;
}

async function createPDFFromScreenshots(screenshots) {
  console.log('\n📄 PDF genereren...');

  // Dynamisch jsPDF laden
  const { jsPDF } = await import('jspdf');

  // Eerste screenshot lezen om afmetingen te bepalen
  const firstImg = fs.readFileSync(screenshots[0].path);
  const base64First = firstImg.toString('base64');

  // Maak een landscape A4 PDF (geschikt voor design screens)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 5;
  const titleHeight = 8;

  for (let i = 0; i < screenshots.length; i++) {
    const screenshot = screenshots[i];

    if (i > 0) {
      doc.addPage();
    }

    // Titel toevoegen
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${screenshot.name} (${i + 1}/${screenshots.length})`,
      margin,
      margin + 3
    );

    // Screenshot toevoegen
    const imgData = fs.readFileSync(screenshot.path);
    const base64 = imgData.toString('base64');
    const imgDataUrl = `data:image/png;base64,${base64}`;

    // Bereken afmetingen zodat het screenshot op de pagina past
    const availableWidth = pageWidth - (margin * 2);
    const availableHeight = pageHeight - (margin * 2) - titleHeight;

    doc.addImage(
      imgDataUrl,
      'PNG',
      margin,
      margin + titleHeight,
      availableWidth,
      availableHeight,
      undefined,
      'MEDIUM'
    );

    console.log(`  Pagina ${i + 1}/${screenshots.length} toegevoegd: ${screenshot.name}`);
  }

  // PDF opslaan
  const pdfBuffer = doc.output('arraybuffer');
  fs.writeFileSync(PDF_OUTPUT_PATH, Buffer.from(pdfBuffer));
  console.log(`\n✅ PDF opgeslagen: ${PDF_OUTPUT_PATH}`);
  console.log(`   Totaal pagina's: ${screenshots.length}`);
  console.log(`   Bestandsgrootte: ${(fs.statSync(PDF_OUTPUT_PATH).size / 1024 / 1024).toFixed(2)} MB`);
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  Adobe XD Prototype → PDF Converter      ║');
  console.log('║  Mantelzorg App Design                   ║');
  console.log('╚══════════════════════════════════════════╝\n');

  await ensureDirectories();

  const chromiumPath = await findChromiumPath();
  console.log(`🌐 Chromium: ${chromiumPath || 'auto-detect'}`);

  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  };
  if (chromiumPath) {
    launchOptions.executablePath = chromiumPath;
  }

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
  });
  const page = await context.newPage();

  try {
    // Stap 1: Ontdek alle schermen
    let screens = await discoverScreensFromGrid(page);

    if (screens.length === 0) {
      console.log('  Grid view leverde geen resultaten op, probeer navigatie...');
      screens = await discoverScreensByNavigation(page);
    }

    if (screens.length === 0) {
      console.log('  Alleen het eerste scherm gebruiken als fallback');
      screens = [{
        id: FIRST_SCREEN_ID,
        name: 'Startscherm',
        href: `${XD_BASE_URL}/screen/${FIRST_SCREEN_ID}`,
      }];
    }

    // Verwijder duplicaten
    const uniqueScreens = [];
    const seenIds = new Set();
    for (const screen of screens) {
      if (!seenIds.has(screen.id)) {
        seenIds.add(screen.id);
        uniqueScreens.push(screen);
      }
    }

    console.log(`\n✅ ${uniqueScreens.length} unieke schermen gevonden:`);
    uniqueScreens.forEach((s, i) => console.log(`   ${i + 1}. ${s.name}`));

    // Stap 2: Maak screenshots
    const screenshots = await captureScreenshots(page, uniqueScreens);

    if (screenshots.length === 0) {
      throw new Error('Geen screenshots gemaakt. Controleer of het prototype toegankelijk is.');
    }

    // Stap 3: Genereer PDF
    await createPDFFromScreenshots(screenshots);

  } catch (err) {
    console.error(`\n❌ Fout: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
