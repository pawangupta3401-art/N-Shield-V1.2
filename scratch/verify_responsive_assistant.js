const http = require('http');
const { spawn } = require('child_process');
const os = require('os');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9235;

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
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result.value;
  }

  async waitForSelector(selector, maxTries = 40) {
    for (let i = 0; i < maxTries; i++) {
      const exists = await this.evaluate(`!!document.querySelector('${selector}')`);
      if (exists) return true;
      await sleep(250);
    }
    return false;
  }
}

async function runAudit() {
  console.log("Starting browser audit with Edge CDP...");
  const tempDir = os.tmpdir() + '\\edge_safety_audit_' + Date.now();
  const edge = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempDir}`,
    'about:blank',
  ]);

  try {
    let targets = null;
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      try {
        targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        if (targets && targets.length > 0) break;
      } catch (e) {}
    }

    if (!targets) {
      console.log("Edge CDP port not reachable.");
      return;
    }

    const pageTarget = targets.find(t => t.type === 'page');
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    const viewports = [
      { w: 320, h: 568, name: "320px (iPhone SE)", mobile: true },
      { w: 375, h: 812, name: "375px (iPhone X/12)", mobile: true },
      { w: 390, h: 844, name: "390px (iPhone 13/14)", mobile: true },
      { w: 430, h: 932, name: "430px (iPhone 14/15 Pro Max)", mobile: true },
      { w: 768, h: 1024, name: "768px (iPad Portrait)", mobile: true },
      { w: 1024, h: 768, name: "1024px (iPad Landscape)", mobile: false },
      { w: 1440, h: 900, name: "1440px (Desktop)", mobile: false },
    ];

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: vp.mobile ? 2 : 1,
        mobile: vp.mobile,
      });

      await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
      await cdp.waitForSelector('header');
      await cdp.waitForSelector('#safety-map-section');
      await sleep(1500);

      const check = await cdp.evaluate(`
        (() => {
          const scrollW = document.documentElement.scrollWidth;
          const clientW = document.documentElement.clientWidth;
          const hasOverflow = scrollW > clientW;
          const launcherBtn = !!document.querySelector('button[aria-label="Open AI Safety Assistant"]');
          const headerAiBtn = !!Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('AI Safety Assistant'));
          const sosBtn = !!document.querySelector('button[title="Emergency Services"]');
          return {
            name: "${vp.name}",
            scrollW,
            clientW,
            hasOverflow,
            launcherBtn,
            headerAiBtn,
            sosBtn
          };
        })()
      `);

      console.log(`[${check.name}] Client: ${check.clientW}px, Scroll: ${check.scrollW}px | Overflow: ${check.hasOverflow ? 'FAIL' : 'PASS'} | Launcher: ${check.launcherBtn ? 'FOUND' : 'MISSING'} | SOS: ${check.sosBtn ? 'FOUND' : 'MISSING'}`);
    }

    // Now test opening the assistant and sending a message
    console.log("\nTesting interaction with AI Safety Assistant...");
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1024,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(400);

    // Click launcher
    const clicked = await cdp.evaluate(`
      (() => {
        const btn = document.querySelector('button[aria-label="Open AI Safety Assistant"]');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log("Launcher button clicked:", clicked);

    await cdp.waitForSelector('#safety-assistant-panel');
    await sleep(600);

    // Verify assistant opened
    const assistantState = await cdp.evaluate(`
      (() => {
        const panel = document.getElementById('safety-assistant-panel');
        if (!panel) return { isOpen: false };
        const input = panel.querySelector('input[placeholder*="Ask about hospitals"]');
        const emergencyDial = panel.querySelector('a[href="tel:112"]');
        const suggestedChips = panel.querySelectorAll('button');
        return {
          isOpen: true,
          hasInput: !!input,
          has112Button: !!emergencyDial,
          chipsCount: suggestedChips.length
        };
      })()
    `);
    console.log("Safety Assistant Panel State:", assistantState);

    // Test typing and sending question
    console.log("Sending question: 'Find the nearest hospital'...");
    await cdp.evaluate(`
      (() => {
        const panel = document.getElementById('safety-assistant-panel');
        const input = panel.querySelector('input');
        input.value = "Find the nearest hospital";
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const form = panel.querySelector('form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      })()
    `);

    await sleep(2500);

    const replyCheck = await cdp.evaluate(`
      (() => {
        const panel = document.getElementById('safety-assistant-panel');
        const cards = panel.querySelectorAll('a[href^="tel:"]');
        const text = panel.textContent;
        return {
          hasHospitalReply: text.includes('hospitals') || text.includes('hospital'),
          phoneCallLinksCount: cards.length
        };
      })()
    `);
    console.log("Assistant Response Verified:", replyCheck);

  } finally {
    edge.kill();
  }
}

runAudit().catch(console.error);
