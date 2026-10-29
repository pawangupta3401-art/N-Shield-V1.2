const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9225;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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
    try { this.ws.close(); } catch(e){}
  }
}

async function getTargetsWithRetry(port, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fetchJson(`http://127.0.0.1:${port}/json`);
    } catch (e) {
      await sleep(1000);
    }
  }
  throw new Error("Could not connect to Edge on port " + port);
}

async function run() {
  console.log("Launching Edge on port", PORT);
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + require('os').tmpdir() + '\\edge_audit_' + Date.now(),
    'about:blank'
  ]);

  const targets = await getTargetsWithRetry(PORT);
  const pageTarget = targets.find(t => t.type === 'page');
  const client = new CDP(pageTarget.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('DOM.enable');
  await client.send('Runtime.enable');

  const viewports = [
    { w: 320, h: 568, name: "iPhone SE (320px)" },
    { w: 360, h: 800, name: "Android Standard (360px)" },
    { w: 375, h: 812, name: "iPhone X/11/12 (375px)" },
    { w: 390, h: 844, name: "iPhone 13/14 (390px)" },
    { w: 430, h: 932, name: "iPhone 14/15 Pro Max (430px)" },
    { w: 768, h: 1024, name: "Tablet Portrait (768px)" },
    { w: 1024, h: 768, name: "Tablet Landscape (1024px)" }
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`AUDITING VIEWPORT: ${vp.name} (${vp.w}x${vp.h})`);
    console.log(`========================================`);

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: vp.w < 768 ? 2 : 1,
      mobile: vp.w < 768
    });

    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(2500);

    const audit = await client.evaluate(`
      (() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const bodyW = document.body.clientWidth;
        const bodyScrollW = document.body.scrollWidth;
        const winW = window.innerWidth;

        // Check for horizontal overflow
        const hasOverflow = scrollW > docW || bodyScrollW > winW;

        // Find elements that overflow beyond window.innerWidth
        const overflowingElements = [];
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.right > winW + 1) {
            overflowingElements.push({
              tag: el.tagName,
              id: el.id,
              className: (el.className || '').toString().slice(0, 100),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              overflowPx: Math.round(rect.right - winW)
            });
          }
        }

        // Check key components visibility
        const header = document.querySelector('header');
        const headerRect = header ? header.getBoundingClientRect() : null;

        const main = document.querySelector('main');
        const mainRect = main ? main.getBoundingClientRect() : null;

        const bottomNav = document.querySelector('nav');
        const bottomNavVisible = !!bottomNav;

        const searchInputs = Array.from(document.querySelectorAll('input[type="text"], input[placeholder*="Search"]')).map(input => ({
          placeholder: input.placeholder,
          visible: input.offsetParent !== null,
          width: Math.round(input.getBoundingClientRect().width)
        }));

        const mapContainer = document.querySelector('#safety-map-section');
        const mapRect = mapContainer ? mapContainer.getBoundingClientRect() : null;

        return {
          docW,
          scrollW,
          winW,
          hasOverflow,
          overflowCount: overflowingElements.length,
          topOverflowElements: overflowingElements.slice(0, 5),
          header: headerRect ? { h: Math.round(headerRect.height), w: Math.round(headerRect.width) } : null,
          main: mainRect ? { w: Math.round(mainRect.width), h: Math.round(mainRect.height) } : null,
          map: mapRect ? { w: Math.round(mapRect.width), h: Math.round(mapRect.height) } : null,
          searchInputs
        };
      })()
    `);

    console.log(`Doc clientWidth: ${audit.docW}, scrollWidth: ${audit.scrollW}, winW: ${audit.winW}`);
    console.log(`Has Overflow: ${audit.hasOverflow ? "❌ YES" : "✅ NO"}`);
    if (audit.overflowCount > 0) {
      console.log(`Overflow elements count: ${audit.overflowCount}`);
      console.log(`Top offending elements:`, JSON.stringify(audit.topOverflowElements, null, 2));
    }
    console.log(`Header:`, audit.header);
    console.log(`Main:`, audit.main);
    console.log(`Map:`, audit.map);
  }

  client.close();
  browser.kill();
  console.log("\nAudit complete!");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
