const http = require('http');
const { spawn } = require('child_process');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9235;

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

async function debug320() {
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + require('os').tmpdir() + '\\edge_debug320_' + Date.now(),
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
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 568,
    deviceScaleFactor: 2,
    mobile: true
  });

  await client.send('Page.navigate', { url: 'http://localhost:3000' });
  await sleep(4000);

  const diag = await client.evaluate(`
    (() => {
      const header = document.querySelector('header');
      const map = document.querySelector('#safety-map-section');
      const aside = document.querySelector('aside');

      return {
        url: window.location.href,
        headerTag: header ? header.tagName : null,
        headerClass: header ? header.className : null,
        headerDim: header ? { w: header.offsetWidth, h: header.offsetHeight } : null,
        mapDim: map ? { w: map.offsetWidth, h: map.offsetHeight } : null,
        asideOffsetParent: aside ? aside.offsetParent : null
      };
    })()
  `);

  console.log("320 Diagnostics:", JSON.stringify(diag, null, 2));

  client.close();
  browser.kill();
}

debug320().catch(console.error);
