/**
 * Minimal CDP driver used for end-to-end checks (no npm dependencies).
 * Node 22 has a global WebSocket, so this talks to headless Chrome directly.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

export async function launch({ width = 1280, height = 800, port = 0 } = {}) {
  const bin = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!bin) throw new Error('no chrome/edge binary found');

  /* port 0 → pick a free ephemeral port, so a leftover browser from an
     earlier run can never be mistaken for this one */
  if (!port) port = 9400 + Math.floor(Math.random() * 400);

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
  const proc = spawn(bin, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    'about:blank'
  ], { stdio: 'ignore' });

  // wait for the debugging endpoint
  let target = null;
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      target = list.find((t) => t.type === 'page');
      if (target) break;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!target) throw new Error('chrome did not expose a page target');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let id = 0;
  const pending = new Map();
  const listeners = new Set();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    } else if (msg.method) {
      listeners.forEach((fn) => fn(msg));
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  const consoleErrors = [];
  listeners.add((msg) => {
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails?.exception?.description || 'exception');
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      consoleErrors.push(msg.params.entry.text + ' ' + (msg.params.entry.url || ''));
    }
  });

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: width < 700
  });

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'evaluate failed');
    }
    return res.result.value;
  };

  const goto = async (url) => {
    await send('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, 250));
    for (let i = 0; i < 60; i++) {
      const state = await evaluate('document.readyState');
      if (state === 'complete') break;
      await new Promise((r) => setTimeout(r, 100));
    }
  };

  const screenshot = async (file) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
    return file;
  };

  const setViewport = async (w, h) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 1, mobile: w < 700
    });
    await new Promise((r) => setTimeout(r, 250));
  };

  const key = async (keyName, modifiers = 0) => {
    const map = {
      Tab: { code: 9, text: '' },
      Enter: { code: 13, text: '\r' },
      Escape: { code: 27, text: '' },
      Space: { code: 32, text: ' ' }
    };
    const k = map[keyName];
    if (!k) throw new Error('unsupported key ' + keyName);

    /* activation keys need a full keyDown carrying text — a rawKeyDown does
       not trigger a button's default action in Chrome */
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      windowsVirtualKeyCode: k.code,
      nativeVirtualKeyCode: k.code,
      key: keyName === 'Space' ? ' ' : keyName,
      code: keyName === 'Space' ? 'Space' : keyName,
      text: k.text,
      unmodifiedText: k.text,
      modifiers
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      windowsVirtualKeyCode: k.code,
      nativeVirtualKeyCode: k.code,
      key: keyName === 'Space' ? ' ' : keyName,
      code: keyName === 'Space' ? 'Space' : keyName,
      modifiers
    });
  };

  const close = async () => {
    try { ws.close(); } catch { }
    proc.kill();
  };

  return { send, evaluate, goto, screenshot, setViewport, key, close, consoleErrors };
}
