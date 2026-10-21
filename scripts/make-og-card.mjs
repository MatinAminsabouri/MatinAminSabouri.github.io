#!/usr/bin/env node
/**
 * make-og-card.mjs — renders assets/images/og-card.png (1200×630) for
 * social previews. Pure SVG → PNG via headless Chrome if available,
 * otherwise writes the SVG next to it so the card can be exported by hand.
 *
 * Run: npm run og
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

const W = 1200;
const H = 630;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#070B12"/>
      <stop offset="1" stop-color="#0B0F17"/>
    </linearGradient>
    <radialGradient id="glowA" cx="0.12" cy="-0.08" r="0.7">
      <stop offset="0" stop-color="#22D3EE" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#22D3EE" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="0.9" cy="0.05" r="0.6">
      <stop offset="0" stop-color="#6366F1" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#6366F1" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#22D3EE"/>
      <stop offset="1" stop-color="#6366F1"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glowA)"/>
  <rect width="${W}" height="${H}" fill="url(#glowB)"/>

  <!-- hairline frame -->
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="28"
        fill="none" stroke="#94A3B8" stroke-opacity="0.16"/>

  <!-- eyebrow -->
  <text x="96" y="150" fill="#22D3EE" font-family="monospace" font-size="22"
        letter-spacing="4">PORTFOLIO / 2026</text>

  <!-- name -->
  <text x="96" y="252" fill="#E6EDF7" font-family="sans-serif" font-size="76"
        font-weight="700">Matin AminSabouri</text>

  <!-- role -->
  <text x="96" y="316" fill="#94A3B8" font-family="sans-serif" font-size="34">
    AI &amp; Backend Engineer · dotnet / AI Systems
  </text>

  <!-- accent rule -->
  <rect x="96" y="356" width="120" height="5" rx="2.5" fill="url(#accent)"/>

  <!-- value line -->
  <text x="96" y="424" fill="#CBD5E1" font-family="sans-serif" font-size="26">
    RAG · On-premise AI · Persian NLP · Backends
  </text>

  <!-- tech chips -->
  <g font-family="monospace" font-size="21" fill="#94A3B8">
    <rect x="96" y="474" width="120" height="46" rx="23" fill="none" stroke="#94A3B8" stroke-opacity="0.28"/>
    <text x="120" y="504">dotnet</text>
    <rect x="232" y="474" width="112" height="46" rx="23" fill="none" stroke="#94A3B8" stroke-opacity="0.28"/>
    <text x="256" y="504">Python</text>
    <rect x="360" y="474" width="96" height="46" rx="23" fill="none" stroke="#94A3B8" stroke-opacity="0.28"/>
    <text x="384" y="504">RAG</text>
    <rect x="472" y="474" width="104" height="46" rx="23" fill="none" stroke="#94A3B8" stroke-opacity="0.28"/>
    <text x="496" y="504">ASR</text>
    <rect x="592" y="474" width="120" height="46" rx="23" fill="none" stroke="#94A3B8" stroke-opacity="0.28"/>
    <text x="616" y="504">MCP</text>
  </g>

  <!-- site -->
  <text x="96" y="566" fill="#7E8B9F" font-family="monospace" font-size="20">
    matinaminsabouri.github.io
  </text>

  <!-- portrait disc -->
  <circle cx="985" cy="315" r="132" fill="none" stroke="url(#accent)" stroke-width="3"/>
  <clipPath id="portraitClip"><circle cx="985" cy="315" r="126"/></clipPath>
  <image href="myPic.jpg" x="859" y="189" width="252" height="252"
         preserveAspectRatio="xMidYMid slice" clip-path="url(#portraitClip)"/>
</svg>`;

const outSvg = 'assets/images/og-card.svg';
await fs.writeFile(outSvg, svg);
console.log(`[og] wrote ${outSvg}`);

/* render to PNG with headless Chrome/Edge if one is installed */
const candidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
];

const browser = await (async () => {
  for (const c of candidates) {
    try {
      await fs.access(c);
      return c;
    } catch { /* keep looking */ }
  }
  return null;
})();

if (!browser) {
  console.warn('[og] no headless browser found — export og-card.svg manually at 1200×630');
  process.exit(0);
}

const htmlPath = path.resolve('assets/images/og-card.svg');
const pngPath = path.resolve('assets/images/og-card.png');

await run(browser, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--screenshot=${pngPath}`,
  `--window-size=${W},${H}`,
  `file:///${htmlPath.replace(/\\/g, '/')}`
], { timeout: 60000 });

const stat = await fs.stat(pngPath);
console.log(`[og] wrote ${pngPath} (${Math.round(stat.size / 1024)} KB)`);
