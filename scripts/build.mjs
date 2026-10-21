#!/usr/bin/env node
/**
 * build.mjs — prerenders index.html and generates the static SEO files.
 *
 * The site stays a plain static page (no framework, no bundler), but the
 * content that used to exist only after JS runs is written into the HTML at
 * build time. That gives:
 *   - crawlers, social previews and no-JS visitors the real content;
 *   - a first paint that already shows text (JS then takes over and
 *     re-renders the same markup for language/theme switching).
 *
 * Markers in index.template.html:
 *   <!--BUILD:ICONS-->      icon sprite
 *   <!--BUILD:CONTACTS-->   sidebar contacts
 *   ... see `sections` below
 *
 * The build reads index.template.html (the pristine shell) and writes
 * index.html, so running it twice produces the same output.
 *
 * Run:  node scripts/build.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const R = require('../assets/js/render.js');

const SITE = 'https://matinaminsabouri.github.io';
const LANG = 'en';

/*-----------------------------------*\
  load SITE_DATA exactly like the browser does
\*-----------------------------------*/

const dataSource = await fs.readFile('assets/js/data.js', 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(dataSource, sandbox);
const DATA = sandbox.window.SITE_DATA;
const T = DATA.i18n[LANG];

/*-----------------------------------*\
  sections
\*-----------------------------------*/

const notesPayload = JSON.parse(await fs.readFile('assets/data/notes.json', 'utf8').catch(() => 'null'));
const notePosts = (notesPayload && Array.isArray(notesPayload.posts) && notesPayload.posts.length)
  ? notesPayload.posts
  : (DATA.notes && DATA.notes.posts) || [];

const sections = {
  ICONS: await fs.readFile('assets/icons/sprite.svg.html', 'utf8'),
  CONTACTS: R.renderContacts(DATA, LANG, T),
  SOCIALS: R.renderSocials(DATA, LANG),
  ABOUT: R.renderAbout(DATA, LANG, T),
  RESUME: R.renderResume(DATA, LANG, T),
  FILTERS: R.renderFilterChips(DATA, LANG, 'all'),
  PROJECTS: R.renderProjects(DATA, LANG, T, { filter: 'all', caseOpen: false }),
  NOTES: R.renderNotes(notePosts, LANG, T)
};

/*-----------------------------------*\
  inject markers
\*-----------------------------------*/

let html = await fs.readFile('index.template.html', 'utf8');

/* Emit LF regardless of how the template was checked out. Windows clones
   with core.autocrlf=true deliver CRLF; without this the build output
   differs from the committed file byte-for-byte and CI fails. */
const toLF = (s) => s.replace(/\r\n/g, '\n');

html = toLF(html);
for (const [name, value] of Object.entries(sections)) {
  sections[name] = toLF(value);
}

for (const [name, value] of Object.entries(sections)) {
  const re = new RegExp(`(<!--BUILD:${name}-->)([\\s\\S]*?)(<!--/BUILD:${name}-->)`);
  if (!re.test(html)) {
    console.warn(`[build] marker BUILD:${name} not found — skipping`);
    continue;
  }
  html = html.replace(re, (_m, open, _old, close) => `${open}\n${value}\n${close}`);
}

/* fill the chrome strings that hold data-i18n keys with empty bodies */
html = html.replace(/<([a-z0-9-]+)([^>]*\bdata-i18n="([^"]+)"[^>]*)><\/\1>/gi, (match, tag, attrs, key) => {
  const value = T[key];
  return value == null ? match : `<${tag}${attrs}>${value}</${tag}>`;
});

/* aria labels likewise, so the prerendered page is announced correctly */
html = html.replace(
  /<([a-z0-9-]+)([^>]*\bdata-i18n-aria="([^"]+)"[^>]*)>/gi,
  (match, tag, attrs, key) => {
    const value = T[key];
    if (value == null) return match;
    const withoutLabel = attrs.replace(/\s+aria-label="[^"]*"/i, '');
    return `<${tag}${withoutLabel} aria-label="${escapeAttr(value)}">`;
  }
);

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/* meta description follows the prerendered language */
html = html.replace(
  /<meta name="description" content="[^"]*">/,
  `<meta name="description" content="${escapeAttr(T.meta_desc)}">`
);

await fs.writeFile('index.html', html);
console.log(`[build] index.html prerendered (${(html.length / 1024).toFixed(1)} KB, ${notePosts.length} notes)`);

/*-----------------------------------*\
  sitemap + robots + 404
\*-----------------------------------*/

/* lastmod must come from the content, not the clock: a build-time date
   makes sitemap.xml differ on every run, which breaks the CI check that
   the committed build output is up to date */
const newestNote = notePosts
  .map((p) => p.date)
  .filter(Boolean)
  .sort()
  .pop();

const today = newestNote
  ? new Date(newestNote).toISOString().slice(0, 10)
  : '2026-01-01';

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/"/>
    <xhtml:link rel="alternate" hreflang="fa" href="${SITE}/?lang=fa"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>
  </url>
  <url>
    <loc>${SITE}/assets/MatinAminSabouri-Resume.pdf</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
`;

await fs.writeFile('sitemap.xml', sitemap);
console.log('[build] sitemap.xml');

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;

await fs.writeFile('robots.txt', robots);
console.log('[build] robots.txt');

/* a 404 that matches the site's shell and links back home */
const notFound = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>404 — Page not found | Matin AminSabouri</title>
  <link rel="shortcut icon" href="/assets/images/favicon.png" type="image/png">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
  <main style="width:min(560px,100% - 2rem);margin:12vh auto;">
    <article class="active" style="text-align:center;">
      <p class="project-category" style="margin-bottom:12px;">HTTP 404</p>
      <h1 class="article-title" style="display:inline-block;">Page not found</h1>
      <p class="about-text" style="max-width:none;margin:16px auto 24px;">
        This page does not exist. The portfolio itself is one page — use the link below.
      </p>
      <p class="about-text" style="max-width:none;margin:0 auto 24px;" lang="fa" dir="rtl">
        این صفحه وجود ندارد. پورتفولیو یک صفحهٔ واحد است — از پیوند زیر استفاده کنید.
      </p>
      <a class="btn btn--primary" href="/">Back to portfolio</a>
    </article>
  </main>
</body>
</html>
`;

await fs.writeFile('404.html', notFound);
console.log('[build] 404.html');
