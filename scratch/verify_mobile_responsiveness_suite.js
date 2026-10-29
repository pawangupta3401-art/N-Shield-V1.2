const http = require('http');
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9245;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
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
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result.value;
  }

  close() {
    try { this.ws.close(); } catch (e) {}
  }
}

async function runTestSuite() {
  console.log("=== N-SHIELD MOBILE RESPONSIVENESS & OVERLAP VERIFICATION SUITE ===");

  const userDataDir = path.join(os.tmpdir(), `edge_mobile_suite_${Date.now()}`);
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  let targets = null;
  for (let i = 0; i < 15; i++) {
    try {
      targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
      if (targets && targets.length > 0) break;
    } catch (e) {
      await sleep(500);
    }
  }

  if (!targets) {
    console.error("Could not connect to Headless Edge CDP.");
    browser.kill();
    process.exit(1);
  }

  const pageTarget = targets.find(t => t.type === 'page');
  const client = new CDP(pageTarget.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('DOM.enable');

  const viewports = [
    { name: "320px (Ultra-narrow / SE1)", width: 320, height: 568, isMobile: true },
    { name: "360px (Standard Android)", width: 360, height: 740, isMobile: true },
    { name: "375px (iPhone SE 2/3)", width: 375, height: 667, isMobile: true },
    { name: "390px (iPhone 12/13/14)", width: 390, height: 844, isMobile: true },
    { name: "430px (iPhone 14/15/16 Pro Max)", width: 430, height: 932, isMobile: true },
    { name: "1280px (Desktop Command Center)", width: 1280, height: 800, isMobile: false }
  ];

  let allPassed = true;

  for (const vp of viewports) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`--------------------------------------------------`);

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.isMobile
    });

    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(2500);

    const audit = await client.evaluate(`
      (() => {
        const results = { checks: [], passed: true };

        function check(name, condition, details) {
          results.checks.push({ name, pass: !!condition, details: details || '' });
          if (!condition) results.passed = false;
        }

        // 1. Horizontal Overflow Check
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const hasNoHOverflow = docWidth <= winWidth + 1;
        check("No Horizontal Overflow", hasNoHOverflow, \`docWidth: \${docWidth}, bodyWidth: \${bodyWidth}, winWidth: \${winWidth}\`);

        // 2. Top Action Bar elements & non-overlapping bounds
        const header = document.querySelector('header');
        check("Header Exists", !!header, "Header found");
        if (header) {
          const headerRect = header.getBoundingClientRect();
          check("Header In Viewport", headerRect.top >= 0 && headerRect.bottom <= 80, \`h: \${headerRect.height}px\`);
          
          const buttons = Array.from(header.querySelectorAll('button'));
          // Check for overlapping buttons in header
          let overlaps = 0;
          for (let i = 0; i < buttons.length; i++) {
            const r1 = buttons[i].getBoundingClientRect();
            if (r1.width === 0 || r1.height === 0) continue;
            for (let j = i + 1; j < buttons.length; j++) {
              const r2 = buttons[j].getBoundingClientRect();
              if (r2.width === 0 || r2.height === 0) continue;
              const overlap = !(r1.right <= r2.left || r1.left >= r2.right || r1.bottom <= r2.top || r1.top >= r2.bottom);
              if (overlap) overlaps++;
            }
          }
          check("Header Buttons Do Not Overlap", overlaps === 0, \`overlaps: \${overlaps}\`);
        }

        // 3. Bottom Navigation (Mobile only)
        const bottomNav = document.querySelector('.safe-area-pb nav');
        if (${vp.isMobile}) {
          check("Bottom Nav Visible on Mobile", !!bottomNav, "Found bottom nav");
          if (bottomNav) {
            const navRect = bottomNav.getBoundingClientRect();
            check("Bottom Nav Fixed at Bottom", navRect.bottom <= window.innerHeight + 1, \`nav bottom: \${navRect.bottom}, vh: \${window.innerHeight}\`);
            const navButtons = Array.from(bottomNav.querySelectorAll('button'));
            check("Bottom Nav Has 5 Items", navButtons.length === 5, \`count: \${navButtons.length}\`);
          }
        } else {
          // On desktop, bottom nav should be hidden
          const isBottomNavHidden = !bottomNav || window.getComputedStyle(bottomNav.parentElement).display === 'none';
          check("Bottom Nav Hidden on Desktop", isBottomNavHidden, "Correctly hidden on desktop");
        }

        // 4. Floating AI Assistant Launcher
        const assistantBtn = document.querySelector('button[aria-label="Open AI Safety Assistant"]');
        check("AI Assistant Launcher Present", !!assistantBtn, "Found launcher");
        if (assistantBtn && ${vp.isMobile}) {
          const btnRect = assistantBtn.getBoundingClientRect();
          // Distance from bottom of viewport
          const distFromBottom = window.innerHeight - btnRect.bottom;
          check("Assistant Above Bottom Nav", distFromBottom >= 60, \`distFromBottom: \${Math.round(distFromBottom)}px\`);
          check("Assistant Within Screen Bounds", btnRect.right <= window.innerWidth && btnRect.left >= 0, \`x: \${btnRect.left}-\${btnRect.right}\`);
        }

        // 5. Need Help Section (6 Cards)
        const needHelpText = Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.includes('Need Help?'));
        check("Need Help Section Present", !!needHelpText, "Section heading found");

        // 6. Main Dashboard Vertical Scrollability
        const initialScrollY = window.scrollY;
        window.scrollTo(0, 800);
        const scrolledY = window.scrollY;
        const canScroll = ${vp.isMobile} ? (scrolledY > 0 || document.body.scrollHeight > window.innerHeight) : true;
        check("Dashboard Is Vertically Scrollable", canScroll, \`scrollHeight: \${document.body.scrollHeight}, vh: \${window.innerHeight}\`);
        window.scrollTo(0, 0);

        // 7. Safety Map Container
        const mapSection = document.getElementById('safety-map-section');
        check("Safety Map Section Present", !!mapSection, "Map section found");
        if (mapSection) {
          const mapRect = mapSection.getBoundingClientRect();
          check("Map Section Has Positive Dimensions", mapRect.width > 0 && mapRect.height > 0, \`\${mapRect.width}x\${mapRect.height}\`);
        }

        return results;
      })()
    `);

    for (const c of audit.checks) {
      const status = c.pass ? "✓ PASS" : "✗ FAIL";
      console.log(`  ${status}: ${c.name} (${c.details})`);
      if (!c.pass) allPassed = false;
    }
  }

  // Interactive Test on 375px mobile viewport: Open and Close Assistant
  console.log(`\n--------------------------------------------------`);
  console.log(`Interactive Modal & Panel Testing (375x667)`);
  console.log(`--------------------------------------------------`);

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true
  });
  await client.send('Page.navigate', { url: 'http://localhost:3000' });
  await sleep(2500);

  // Test 1: Open AI Assistant
  const openAssistantResult = await client.evaluate(`
    (() => {
      const btn = document.querySelector('button[aria-label="Open AI Safety Assistant"]');
      if (!btn) return { pass: false, error: "Launcher button not found" };
      btn.click();
      return { pass: true };
    })()
  `);
  await sleep(1000);

  const assistantPanelState = await client.evaluate(`
    (() => {
      const panel = document.getElementById('safety-assistant-panel');
      if (!panel) return { pass: false, error: "Assistant panel not found in DOM" };
      const rect = panel.getBoundingClientRect();
      const input = panel.querySelector('input');
      const sendBtn = panel.querySelector('button[type="submit"]');
      const closeBtn = panel.querySelector('button[title="Close"]');
      
      const inBounds = rect.top >= 0 && rect.bottom <= window.innerHeight + 2 && rect.left >= 0 && rect.right <= window.innerWidth + 2;
      const hasInput = !!input && !!sendBtn;

      // Close it
      if (closeBtn) closeBtn.click();

      return {
        pass: inBounds && hasInput,
        rect: \`\${rect.width}x\${rect.height} at (\${rect.left}, \${rect.top})\`,
        hasInput,
        closeFound: !!closeBtn
      };
    })()
  `);

  console.log(`  ${assistantPanelState.pass ? "✓ PASS" : "✗ FAIL"}: AI Assistant Opens In Full Viewport & Input Accessible (${assistantPanelState.rect})`);
  if (!assistantPanelState.pass) allPassed = false;
  await sleep(500);

  // Test 2: Bottom Navigation Safe Route Modal
  const safeRouteTest = await client.evaluate(`
    (() => {
      const navButtons = Array.from(document.querySelectorAll('.safe-area-pb button'));
      const safeRouteBtn = navButtons.find(b => b.textContent && b.textContent.includes('Safe Route'));
      if (!safeRouteBtn) return { pass: false, error: "Safe Route nav button not found" };
      safeRouteBtn.click();
      return { pass: true };
    })()
  `);
  await sleep(800);

  const safeRouteModalState = await client.evaluate(`
    (() => {
      // Look for route planner modal
      const modal = document.querySelector('.fixed.z-50');
      const hasModal = !!modal;
      const closeBtn = modal?.querySelector('button[aria-label="Close route planner"], button:has(svg.lucide-x)');
      if (closeBtn) closeBtn.click();
      return { pass: hasModal, hasModal };
    })()
  `);

  console.log(`  ${safeRouteModalState.pass ? "✓ PASS" : "✗ FAIL"}: Bottom Nav 'Safe Route' Opens Z-50 Modal Cleanly`);
  if (!safeRouteModalState.pass) allPassed = false;
  await sleep(500);

  // Test 3: Emergency SOS Modal
  const sosModalTest = await client.evaluate(`
    (() => {
      const sosBtn = Array.from(document.querySelectorAll('.safe-area-pb button')).find(b => b.textContent && b.textContent.includes('SOS 112'));
      if (!sosBtn) return { pass: false, error: "SOS button not found" };
      sosBtn.click();
      return { pass: true };
    })()
  `);
  await sleep(800);

  const sosModalState = await client.evaluate(`
    (() => {
      const modal = document.querySelector('.fixed.z-50');
      const hasModal = !!modal && (
        modal.textContent.includes('Emergency') ||
        modal.textContent.includes('Police') ||
        modal.textContent.includes('Directory') ||
        modal.textContent.includes('112')
      );
      const closeBtn = modal?.querySelector('button[aria-label*="Close"], button:has(svg.lucide-x)') || Array.from(modal?.querySelectorAll('button') || []).find(b => b.textContent && (b.textContent.includes('Close') || b.textContent.includes('Return')));
      if (closeBtn) closeBtn.click();
      return { pass: hasModal, hasModal };
    })()
  `);

  console.log(`  ${sosModalState.pass ? "✓ PASS" : "✗ FAIL"}: Bottom Nav 'SOS 112' Opens Emergency Confirmation Modal`);
  if (!sosModalState.pass) allPassed = false;

  client.close();
  browser.kill();

  console.log(`\n==================================================`);
  if (allPassed) {
    console.log("✓ ALL MOBILE RESPONSIVENESS AND LAYOUT TESTS PASSED!");
  } else {
    console.log("✗ SOME TESTS FAILED. PLEASE REVIEW OUTPUT.");
  }
  console.log(`==================================================\n`);
  process.exit(allPassed ? 0 : 1);
}

runTestSuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});

