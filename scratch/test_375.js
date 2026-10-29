const http = require('http');
const { spawn } = require('child_process');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9226;

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

async function run() {
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + require('os').tmpdir() + '\\edge_test375_' + Date.now(),
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
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });

  await client.send('Page.navigate', { url: 'http://localhost:3000' });
  await sleep(4000);

  const res = await client.evaluate(`
    (() => {
      const header = document.querySelector('header');
      const headerRect = header ? header.getBoundingClientRect() : null;
      const headerClasses = header ? header.className : null;

      const main = document.querySelector('main');
      const mainRect = main ? main.getBoundingClientRect() : null;

      const map = document.querySelector('#safety-map-section');
      const mapRect = map ? map.getBoundingClientRect() : null;

      return {
        headerRect,
        headerClasses,
        mainRect,
        mapRect,
        docScrollW: document.documentElement.scrollWidth,
        docClientW: document.documentElement.clientWidth
      };
    })()
  `);

  console.log('375px inspect result:', JSON.stringify(res, null, 2));

  client.close();
  browser.kill();
}
run();
