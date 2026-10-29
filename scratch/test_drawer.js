const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9230;

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
        this.callbacks.get(msg.id).resolve(msg.result);
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
    return res.result.value;
  }
  close() { try { this.ws.close(); } catch(e){} }
}

async function testDrawer() {
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + require('os').tmpdir() + '\\edge_drawer_' + Date.now(),
    'about:blank'
  ]);

  let targets;
  for (let i = 0; i < 10; i++) {
    try { targets = await fetchJson(`http://127.0.0.1:${PORT}/json`); break; }
    catch(e) { await sleep(500); }
  }

  const client = new CDP(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  client.ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('BROWSER LOG:', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.log('BROWSER ERROR:', msg.params.exceptionDetails);
    }
    if (msg.id && client.callbacks.has(msg.id)) {
      client.callbacks.get(msg.id).resolve(msg.result);
    }
  };
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await client.send('Page.navigate', { url: 'http://localhost:3000' });
  await sleep(3000); // give ample time for React hydration

  const btnExists = await client.evaluate(`!!document.querySelector('button[aria-label="Open Mobile Menu"]')`);
  console.log("Button exists:", btnExists);

  // Click using simulated CDP mouse click
  const btnInfo = await client.evaluate(`
    (() => {
      const btn = document.querySelector('button[aria-label="Open Mobile Menu"]');
      if (!btn) return { exists: false };
      const r = btn.getBoundingClientRect();
      const style = window.getComputedStyle(btn);
      return {
        exists: true,
        rect: { left: r.left, top: r.top, width: r.width, height: r.height },
        display: style.display,
        visibility: style.visibility,
        pointerEvents: style.pointerEvents,
        zIndex: style.zIndex,
        parentTag: btn.parentElement.tagName,
        parentClass: btn.parentElement.className
      };
    })()
  `);
  console.log("Button Info:", JSON.stringify(btnInfo, null, 2));

  // Click using btn.click()
  const clickResult = await client.evaluate(`
    (() => {
      const btn = document.querySelector('button[aria-label="Open Mobile Menu"]');
      if (!btn) return "btn not found";
      try {
        btn.click();
        return "clicked via btn.click()";
      } catch (err) {
        return "error: " + err.message;
      }
    })()
  `);
  console.log("Click result:", clickResult);
  await sleep(1000);

  const drawerState = await client.evaluate(`
    (() => {
      const drawer = document.querySelector('#mobile-nav-drawer');
      const allDivsWithDrawer = Array.from(document.querySelectorAll('*')).filter(el => el.id && el.id.includes('drawer'));
      return {
        drawerExists: !!drawer,
        foundIds: allDivsWithDrawer.map(el => el.id)
      };
    })()
  `);
  console.log("Drawer State after click:", drawerState);

  // Now press Escape
  await client.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(600);

  const drawerClosed = await client.evaluate(`!document.querySelector('#mobile-nav-drawer')`);
  console.log("Drawer Closed on Escape:", drawerClosed);

  client.close();
  browser.kill();
}

testDrawer().catch(console.error);
