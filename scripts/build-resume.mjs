#!/usr/bin/env node
/**
 * build-resume.mjs — renders scripts/resume/resume.html to
 * assets/MatinAminSabouri-Resume.pdf with headless Chrome.
 *
 * Why HTML: the previous PDF was authored in an RTL word processor, which
 * mangled English paragraphs and produced links to a deleted GitHub
 * account. Keeping the resume as HTML makes it reviewable in a diff, gives
 * real selectable text for ATS parsers, and guarantees every link is a
 * literal URL that can be checked.
 *
 * Run: npm run resume
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const run = promisify(execFile);

const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
];

const browser = await (async () => {
  for (const c of CANDIDATES) {
    try {
      await fs.access(c);
      return c;
    } catch { /* keep looking */ }
  }
  return null;
})();

if (!browser) {
  console.error('[resume] no headless browser found');
  process.exit(1);
}

const src = path.resolve('scripts/resume/resume.html');
const out = path.resolve('assets/MatinAminSabouri-Resume.pdf');

await run(browser, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-pdf-header-footer',
  `--print-to-pdf=${out}`,
  '--no-margins',
  pathToFileURL(src).href
], { timeout: 120000 });

const stat = await fs.stat(out);
console.log(`[resume] wrote ${out} (${Math.round(stat.size / 1024)} KB)`);
