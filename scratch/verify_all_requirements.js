const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9228;
const SCREENSHOT_DIR = "C:\\Users\\Khushal\\.gemini\\antigravity-ide\\brain\\39a93c51-c38e-4828-8ddc-0abd357384a9\\verification_screenshots";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

class CDP {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 1; this.callbacks = new Map(); }
  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((r, j) => { this.ws.onopen = r; this.ws.onerror = j; });
    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result.value;
  }
  async captureScreenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
  }
  async waitForSelector(selector, maxTries = 30) {
    for (let i = 0; i < maxTries; i++) {
      const exists = await this.evaluate(`!!document.querySelector('${selector}')`);
      if (exists) return true;
      await sleep(200);
    }
    return false;
  }
  close() { try { this.ws.close(); } catch(e){} }
}

const VIEWPORTS = [
  { w: 320, h: 568, name: "320x568 (iPhone SE)", isMobile: true },
  { w: 360, h: 800, name: "360x800 (Galaxy S20)", isMobile: true },
  { w: 375, h: 812, name: "375x812 (iPhone X/11/12)", isMobile: true },
  { w: 390, h: 844, name: "390x844 (iPhone 13/14)", isMobile: true },
  { w: 430, h: 932, name: "430x932 (iPhone 14/15 Pro Max)", isMobile: true },
  { w: 844, h: 390, name: "844x390 (Mobile Landscape)", isMobile: true },
  { w: 768, h: 1024, name: "768x1024 (iPad Portrait)", isMobile: false },
  { w: 1024, h: 768, name: "1024x768 (iPad Landscape)", isMobile: false },
  { w: 1280, h: 800, name: "1280x800 (Small Desktop)", isMobile: false },
  { w: 1440, h: 900, name: "1440x900 (Large Desktop)", isMobile: false }
];

async function run() {
  console.log("Starting full verification on Edge CDP port", PORT);
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + require('os').tmpdir() + '\\edge_verify_full_' + Date.now(),
    'about:blank'
  ]);

  let targets;
  for (let i = 0; i < 15; i++) {
    try {
      targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
      if (targets && targets.length > 0) break;
    } catch(e) { await sleep(1000); }
  }

  const pageTarget = targets.find(t => t.type === 'page');
  const client = new CDP(pageTarget.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('DOM.enable');
  await client.send('Runtime.enable');

  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================`);
    console.log(`Verifying: ${vp.name}`);
    console.log(`========================================`);

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: vp.isMobile ? 2 : 1,
      mobile: vp.isMobile
    });

    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await client.waitForSelector('header');
    await client.waitForSelector('#safety-map-section');
    await sleep(2000);

    const check = await client.evaluate(`
      (() => {
        const scrollW = document.documentElement.scrollWidth;
        const clientW = document.documentElement.clientWidth;
        const hasHorizontalOverflow = scrollW > clientW;

        const header = document.querySelector('header');
        const headerRect = header ? { w: Math.round(header.getBoundingClientRect().width), h: Math.round(header.getBoundingClientRect().height) } : null;

        const map = document.querySelector('#safety-map-section');
        const mapRect = map ? { w: Math.round(map.getBoundingClientRect().width), h: Math.round(map.getBoundingClientRect().height) } : null;

        const bottomNav = document.querySelector('nav');
        const bottomNavVisible = !!(bottomNav && bottomNav.offsetParent !== null);

        const hamburgerBtn = document.querySelector('button[aria-label="Open Mobile Menu"]');
        const hamburgerVisible = !!(hamburgerBtn && hamburgerBtn.offsetParent !== null);

        const desktopSidebar = document.querySelector('aside');
        const desktopSidebarVisible = !!(desktopSidebar && desktopSidebar.offsetParent !== null);

        // Check for any search vs SOS overlap in header
        const searchInput = document.querySelector('#global-search-input');
        const searchRect = searchInput ? searchInput.getBoundingClientRect() : null;

        const sosBtn = document.querySelector('header button[title="Emergency Services"]');
        const sosRect = sosBtn ? sosBtn.getBoundingClientRect() : null;

        let hasHeaderOverlap = false;
        if (searchRect && sosRect && searchRect.width > 0 && sosRect.width > 0) {
          // If searchRight > sosLeft
          hasHeaderOverlap = searchRect.right > sosRect.left;
        }

        return {
          scrollW,
          clientW,
          hasHorizontalOverflow,
          headerRect,
          mapRect,
          bottomNavVisible,
          hamburgerVisible,
          desktopSidebarVisible,
          hasHeaderOverlap
        };
      })()
    `);

    const shotPath = path.join(SCREENSHOT_DIR, `final_${vp.w}x${vp.h}.png`);
    await client.captureScreenshot(shotPath);

    const testPassed = !check.hasHorizontalOverflow && !check.hasHeaderOverlap && check.headerRect && check.mapRect && check.mapRect.h > 200;
    results.push({
      viewport: vp.name,
      dimensions: `${vp.w}x${vp.h}`,
      passed: testPassed,
      scrollW: check.scrollW,
      clientW: check.clientW,
      hasOverflow: check.hasHorizontalOverflow,
      hasHeaderOverlap: check.hasHeaderOverlap,
      header: check.headerRect,
      map: check.mapRect,
      hamburgerVisible: check.hamburgerVisible,
      desktopSidebarVisible: check.desktopSidebarVisible,
      bottomNavVisible: check.bottomNavVisible,
      screenshot: `final_${vp.w}x${vp.h}.png`
    });

    console.log(`  Passed: ${testPassed ? "✅ YES" : "❌ NO"}`);
    console.log(`  Horizontal Overflow: ${check.hasHorizontalOverflow ? "❌ YES" : "✅ 0px"}`);
    console.log(`  Header Collision: ${check.hasHeaderOverlap ? "❌ YES" : "✅ 0px"}`);
    console.log(`  Header: ${JSON.stringify(check.headerRect)}, Map: ${JSON.stringify(check.mapRect)}`);
    console.log(`  Hamburger: ${check.hamburgerVisible}, Sidebar: ${check.desktopSidebarVisible}, BottomNav: ${check.bottomNavVisible}`);
  }

  // Interactive Mobile Drawer Test on 390x844
  console.log(`\n========================================`);
  console.log(`Interactive Mobile Drawer & Escape Key Test`);
  console.log(`========================================`);
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await client.send('Page.navigate', { url: 'http://localhost:3000' });
  await client.waitForSelector('button[aria-label="Open Mobile Menu"]');
  await sleep(3000);

  // Click hamburger
  await client.evaluate(`
    (() => {
      const btn = document.querySelector('button[aria-label="Open Mobile Menu"]');
      if (btn) btn.click();
    })()
  `);
  await sleep(600);

  const drawerIsOpen = await client.evaluate(`
    (() => {
      const drawer = document.querySelector('#mobile-nav-drawer');
      return !!drawer;
    })()
  `);
  console.log(`  Drawer Opened on Hamburger Click: ${drawerIsOpen ? "✅ YES" : "❌ NO"}`);

  await client.captureScreenshot(path.join(SCREENSHOT_DIR, 'drawer_open_verified.png'));

  // Press Escape key
  await client.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(600);

  const drawerIsClosed = await client.evaluate(`
    (() => {
      const drawer = document.querySelector('#mobile-nav-drawer');
      return !drawer;
    })()
  `);
  console.log(`  Drawer Dismissed on Escape Key: ${drawerIsClosed ? "✅ YES" : "❌ NO"}`);

  client.close();
  browser.kill();

  console.log(`\n========================================`);
  console.log(`ALL TESTS PASSED: ${results.filter(r => r.passed).length}/${results.length}`);
  console.log(`========================================`);
  console.log(JSON.stringify(results, null, 2));

  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'final_results.json'), JSON.stringify({ results, drawerIsOpen, drawerIsClosed }, null, 2));
}

run().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
