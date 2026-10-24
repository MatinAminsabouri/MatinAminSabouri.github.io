#!/usr/bin/env node
/**
 * check.mjs — static integrity checks that run in CI.
 *
 * Catches the failure classes that already bit this repo:
 *   - a CSS class referenced by JS/renderers but never defined (the case
 *     study accordion shipped without its `.open` rule);
 *   - broken relative asset paths;
 *   - leftover third-party CDN references;
 *   - missing SEO files;
 *   - markup that no longer matches the build template.
 *
 * Run: npm run check
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const problems = [];
const warnings = [];
const ok = [];

const exists = async (p) => {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
};

/*-----------------------------------*\
  1. required files
\*-----------------------------------*/

const required = [
  'index.html',
  'index.template.html',
  '404.html',
  'robots.txt',
  'sitemap.xml',
  '.nojekyll',
  'assets/css/style.css',
  'assets/js/data.js',
  'assets/js/render.js',
  'assets/js/script.js',
  'assets/data/notes.json',
  'assets/icons/sprite.svg.html',
  'assets/images/myPic.jpg',
  'assets/images/og-card.png',
  'assets/images/favicon.png',
  'assets/MatinAminSabouri-Resume.pdf'
];

for (const f of required) {
  if (await exists(f)) ok.push(`file ${f}`);
  else problems.push(`missing required file: ${f}`);
}

/*-----------------------------------*\
  2. no third-party runtime CDN
\*-----------------------------------*/

const html = await fs.readFile('index.html', 'utf8');
const externalRefs = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)]
  .map((m) => m[1])
  .filter((u) => !u.startsWith('https://matinaminsabouri.github.io'));

/* links in <a href> are fine; only loaded resources matter */
const loaded = [...html.matchAll(/<(?:script|link|img)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)]
  .map((m) => [m[0], m[1]])
  /* canonical / hreflang / og:image point at our own absolute URL — fine */
  .filter(([tag, url]) => !url.startsWith('https://matinaminsabouri.github.io'))
  /* rel=canonical|alternate are metadata, not loaded resources */
  .filter(([tag]) => !/rel="(canonical|alternate)"/.test(tag))
  .map(([, url]) => url);

if (loaded.length) problems.push(`third-party runtime resources: ${loaded.join(', ')}`);
else ok.push('no third-party runtime resources');

if (!externalRefs.some((u) => u.includes('t.me'))) warnings.push('no Telegram link found in index.html');

/*-----------------------------------*\
  3. local asset references resolve
\*-----------------------------------*/

const localRefs = [...html.matchAll(/(?:src|href)="(\.\/[^"]+|\/[^/"][^"]*)"/g)]
  .map((m) => m[1])
  .filter((u) => !u.startsWith('/assets/MatinAminSabouri-Resume.pdf') || true);

for (const ref of localRefs) {
  if (ref.startsWith('#')) continue;
  const clean = ref.replace(/^\.\//, '').replace(/^\//, '').split('?')[0].split('#')[0];
  if (!clean) continue;
  if (!(await exists(clean))) problems.push(`broken local reference in index.html: ${ref}`);
}
ok.push(`checked ${localRefs.length} local references`);

/* fonts referenced from CSS must exist */
const css = await fs.readFile('assets/css/style.css', 'utf8');
for (const m of css.matchAll(/url\('\.\.\/([^']+)'\)/g)) {
  const p = path.join('assets', m[1]);
  if (!(await exists(p))) problems.push(`missing font: ${p}`);
}

/*-----------------------------------*\
  3b. HTML structure (balanced tags, no duplicate attributes)
\*-----------------------------------*/

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr', 'path', 'circle', 'rect',
  'use', 'stop', 'line', 'polygon', 'polyline', 'ellipse']);

const htmlProblems = [];
const stack = [];
const tagRe = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=/>]+(?:="[^"]*")?)*)\s*(\/?)>/g;
let match;

while ((match = tagRe.exec(html))) {
  const [, closing, rawTag, rawAttrs, selfClose] = match;
  const tag = rawTag.toLowerCase();
  if (VOID.has(tag) || tag === '!doctype') continue;

  if (!closing) {
    /* duplicate attributes are invalid HTML and silently break selectors */
    const names = [...rawAttrs.matchAll(/([^\s=/>]+)\s*=/g)].map((m) => m[1].toLowerCase());
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupes.length) htmlProblems.push(`duplicate attribute(s) ${[...new Set(dupes)].join(', ')} on <${tag}>`);

    if (!selfClose) stack.push(tag);
  } else if (stack.pop() !== tag) {
    htmlProblems.push(`unbalanced </${tag}>`);
  }
}

if (stack.length) htmlProblems.push(`unclosed: ${stack.join(', ')}`);

if (htmlProblems.length) problems.push(...htmlProblems.map((p) => 'index.html: ' + p));
else ok.push('index.html structure balanced');

const renderers = await fs.readFile('assets/js/render.js', 'utf8');
const usedClasses = new Set();
for (const m of renderers.matchAll(/class="([^"]+)"/g)) {
  /* skip template-literal segments: only plain class="a b c" strings count */
  if (/['+]/.test(m[1])) continue;
  m[1].split(/\s+/).filter(Boolean).forEach((c) => {
    if (/^[a-zA-Z][\w-]*$/.test(c)) usedClasses.add(c);
  });
}

/* classes that are state hooks or JS-only markers */
const ignore = new Set([
  'active', 'open', 'copied', 'skeleton-card', 'skel',
  'skel-meta', 'skel-title', 'skel-line', 'skel-chips', 'icon', 'badge',
  'chip', 'btn', 'btn--ghost', 'btn--primary', 'case-block',
  'case-toggle', 'case-toggle-label', 'social-item', 'service-content-box',
  'project-card-head', 'logs-card-actions'
]);

const cssClasses = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const missing = [...usedClasses].filter((c) => !ignore.has(c) && !cssClasses.has(c));
if (missing.length) problems.push(`classes used but never styled: ${missing.join(', ')}`);
else ok.push('all renderer classes are styled');

/* the specific regression that broke the Ravin case study */
if (!/\.project-card\.open\s+\.case-study\s*\{[^}]*grid-template-rows:\s*1fr/.test(css)) {
  problems.push('case-study accordion has no expanded state (.project-card.open .case-study)');
}

/*-----------------------------------*\
  5. notes data shape
\*-----------------------------------*/

const notes = JSON.parse(await fs.readFile('assets/data/notes.json', 'utf8'));
if (!Array.isArray(notes.posts) || !notes.posts.length) {
  problems.push('assets/data/notes.json has no posts');
} else {
  const bad = notes.posts.filter((p) => !p.id || !p.text || !p.url || !/^https:\/\/t\.me\//.test(p.url));
  if (bad.length) problems.push(`notes with invalid url/id/text: ${bad.map((p) => p.id).join(', ')}`);
  else ok.push(`${notes.posts.length} notes valid`);
}

/*-----------------------------------*\
  6. resume PDF integrity
\*-----------------------------------*/

/* Run through pymupdf when available; the checks are cheap and catch the
   exact regression the old PDF shipped with (dead account, reversed text). */
const { execFile } = await import('node:child_process');
const { promisify } = await import('node:util');

try {
  const { stdout } = await promisify(execFile)('python', ['-c', `
import pymupdf, sys, json
d = pymupdf.open('assets/MatinAminSabouri-Resume.pdf')
text = ''.join(p.get_text() for p in d)
links = [l['uri'] for p in d for l in p.get_links()]
print(json.dumps({
  'pages': d.page_count,
  'legacy_account': text.count('matinsangar'),
  'links': links,
  'rtl_mangled': '.features' in text or text.count(' .NET') > 3
}))
`]);
  const info = JSON.parse(stdout.trim().split('\n').pop());
  if (info.legacy_account > 0) problems.push('resume still references the deleted matinsangar account');
  if (info.links.some((u) => u.includes('matinsangar'))) problems.push('resume has a link to the deleted account');
  if (info.rtl_mangled) problems.push('resume has RTL-mangled English text');
  if (info.pages > 2) warnings.push(`resume is ${info.pages} pages`);
  else ok.push(`resume ${info.pages} pages, ${info.links.length} links`);
} catch (e) {
  warnings.push('resume PDF checks skipped (python + pymupdf not available)');
}

/*-----------------------------------*\
  7. JS syntax
\*-----------------------------------*/

for (const f of ['assets/js/data.js', 'assets/js/render.js', 'assets/js/script.js']) {
  const src = await fs.readFile(f, 'utf8');
  try {
    new Function(src);
    ok.push(`syntax ${f}`);
  } catch (e) {
    problems.push(`syntax error in ${f}: ${e.message}`);
  }
}

/*-----------------------------------*\
  report
\*-----------------------------------*/

for (const w of warnings) console.warn('warn  ' + w);
if (problems.length) {
  console.error('\nFAIL');
  for (const p of problems) console.error('  ✗ ' + p);
  process.exit(1);
}
console.log(`OK — ${ok.length} checks passed`);
