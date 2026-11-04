#!/usr/bin/env node
/**
 * fetch-emoji.mjs — downloads the Apple-style emoji PNGs used by the Notes
 * feed into assets/images/emoji/, so the site renders iPhone emojis without
 * a third-party emoji CDN at runtime.
 *
 * Scans the synced notes (assets/data/notes.json) and the offline seed
 * (assets/js/data.js) for emoji sequences, skips files already downloaded,
 * and saves each as <codepoints>.png (FE0F stripped, like the datasource
 * filenames). A sequence whose asset is missing renders with the platform's
 * native emoji font instead — nothing breaks.
 *
 * When new emojis show up in future notes: run this, then add the printed
 * code to EMOJI_CODES in assets/js/render.js.
 *
 * Run: node scripts/fetch-emoji.mjs   (needs network; skips what it has)
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCES = ['assets/data/notes.json', 'assets/js/data.js'];
const OUT = 'assets/images/emoji';
const CDN = 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/';

/* keep in sync with EMOJI_RE in assets/js/render.js */
const EMOJI_SCAN_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{2900}-\u{297F}\uFE0F\u200D]+/gu;

/* a run is an emoji token when it contains at least one real emoji base
   (connectors FE0F/ZWJ alone are not) */
const isEmojiRun = (run) =>
  [...run].some((c) => {
    const cp = c.codePointAt(0);
    return cp !== 0xfe0f && cp !== 0x200d;
  });

/* filename = the token's codepoints exactly as they appear in the text
   (FE0F kept — the datasource names files by the same qualified sequence),
   so runtime lookup and build-time download can never disagree */
const codeName = (run) =>
  [...run].map((c) => c.codePointAt(0).toString(16)).join('-');

/* a run may hold several adjacent emojis ("🔥❤️") — split it into single
   emoji tokens: a ZWJ (200d) glues the next codepoint into the same token
   ("🙂‍↕️" = 1f642-200d-2195-fe0f), FE0F and skin tones extend the current one */
const segment = (run) => {
  const cps = [...run];
  const tokens = [];
  let cur = [];
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i].codePointAt(0);
    if (cur.length && cp !== 0xfe0f && cp !== 0x200d && cps[i - 1].codePointAt(0) !== 0x200d) {
      tokens.push(cur);
      cur = [];
    }
    cur.push(cps[i]);
  }
  if (cur.length) tokens.push(cur);
  return tokens.map((t) => t.map((c) => c.codePointAt(0).toString(16)).join('-'));
};

const withTimeout = async (url) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 20000);
  try { return await fetch(url, { signal: c.signal }); } finally { clearTimeout(t); }
};

const texts = [];
for (const src of SOURCES) {
  const raw = await fs.readFile(src, 'utf8');
  if (src.endsWith('.json')) {
    const data = JSON.parse(raw);
    for (const p of data.posts || []) texts.push(p.title, p.text);
  } else {
    texts.push(raw);   /* regex-scan the seed file wholesale */
  }
}

const names = new Set();
for (const text of texts) {
  for (const m of String(text || '').matchAll(EMOJI_SCAN_RE)) {
    if (m[0] && isEmojiRun(m[0])) {
      for (const name of segment(m[0])) names.add(name);
    }
  }
}

await fs.mkdir(OUT, { recursive: true });

let fetched = 0;
let skipped = 0;
let failed = [];

for (const name of names) {
  const file = path.join(OUT, `${name}.png`);
  if (await fs.access(file).then(() => true, () => false)) { skipped++; continue; }
  try {
    const res = await withTimeout(CDN + `${name}.png`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) throw new Error('suspiciously small payload');
    await fs.writeFile(file, buf);
    console.log(`fetched ${name} ${buf.length} bytes`);
    fetched++;
  } catch (e) {
    failed.push(`${name}: ${e.message || e}`);
  }
}

console.log(`\n${fetched} fetched, ${skipped} already present, ${failed.length} failed`);
if (failed.length) {
  for (const f of failed) console.log('  FAILED ' + f + '  (renders with the native emoji font)');
}
console.log('\nNew codes must be added to EMOJI_CODES in assets/js/render.js to be replaced.');
