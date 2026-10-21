#!/usr/bin/env node
/**
 * sync-notes.mjs — pulls the latest Telegram channel posts into
 * assets/data/notes.json so the site never scrapes Telegram at runtime.
 *
 * Why a build-time sync:
 *   - t.me blocks cross-origin reads, and public RSS proxies (rsshub,
 *     rss2json) are frequently rate-limited or behind a challenge;
 *   - a failed live fetch used to hang the Notes tab for ~20s;
 *   - the JSON is committed, so the page is fast and fully cacheable.
 *
 * IMPORTANT: this must run from a network that can reach t.me — i.e. the
 * GitHub Action, not a local machine behind a restrictive network. When
 * every source fails the script exits non-zero and leaves the existing
 * notes.json untouched, so the site never loses its notes.
 *
 * Usage:
 *   npm run sync:notes            # write assets/data/notes.json
 *   npm run sync:notes -- --dry   # print what would change, write nothing
 *
 * Sources are tried in order and the first one with posts wins:
 *   1. the channel's public web preview (t.me/s/<channel>)
 *   2. RSSHub instances
 *   3. a generic read-only text proxy, for networks that block t.me
 *
 * No dependencies: Node 18+ has fetch; the preview markup is stable and
 * regex-parsed conservatively.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CHANNEL = process.env.TELEGRAM_CHANNEL || 'KhanAcademyy';
const OUT = 'assets/data/notes.json';
const MAX_POSTS = Number(process.env.NOTES_LIMIT || 12);
const DRY = process.argv.includes('--dry');

const PREVIEW_URLS = [
  `https://t.me/s/${CHANNEL}`,
  `https://t.me/s/${CHANNEL}?before=999999`
];

const RSS_URLS = [
  `https://rsshub.rssforever.com/telegram/channel/${CHANNEL}`,
  `https://rsshub.app/telegram/channel/${CHANNEL}`
];

/* Read-only mirrors that fetch the page for us when t.me is unreachable
   from the runner's network. They return the same HTML, so the same
   preview parser applies. */
const PROXY_URLS = [
  `https://r.jina.ai/https://t.me/s/${CHANNEL}`,
  `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://t.me/s/${CHANNEL}`)}`,
  `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://t.me/s/${CHANNEL}`)}`
];

const TIMEOUT_MS = Number(process.env.SYNC_TIMEOUT_MS || 20000);

const withTimeout = async (url, init = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; MatinPortfolioNotesSync/1.0)',
        ...(init.headers || {})
      }
    });
  } finally {
    clearTimeout(timer);
  }
};

const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

const htmlToText = (html) =>
  decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|blockquote)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const firstLine = (text) =>
  (text.split('\n').map((l) => l.trim()).find(Boolean) || '').slice(0, 120);

const truncate = (s, n) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s);

/*-----------------------------------*\
  source 1 — Telegram web preview
\*-----------------------------------*/

const parsePreview = (html) => {
  const posts = [];

  /* each message bubble; the class also appears on nested wrappers, so
     split on the outer "tgme_widget_message_wrap" only */
  const chunks = html.split('class="tgme_widget_message_wrap').slice(1);

  for (const chunk of chunks) {
    const idMatch = /data-post="[^/]+\/(\d+)"/.exec(chunk);
    const textMatch = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(chunk);
    const timeMatch = /<time[^>]*datetime="([^"]+)"/.exec(chunk);
    const linkMatch = /<a class="tgme_widget_message_date" href="([^"]+)"/.exec(chunk);

    if (!idMatch || !textMatch) continue;

    const text = htmlToText(textMatch[1]);
    if (text.length < 20) continue;

    const id = Number(idMatch[1]);
    const tags = Array.from(
      new Set((text.match(/#[\p{L}\p{N}_]+/gu) || []).map((t) => t.slice(1)))
    ).slice(0, 5);

    posts.push({
      id,
      date: timeMatch ? new Date(timeMatch[1]).toISOString() : null,
      title: truncate(firstLine(text), 110),
      tags,
      url: linkMatch ? linkMatch[1] : `https://t.me/${CHANNEL}/${id}`,
      text,
      lang: 'fa'
    });
  }

  return posts;
};

/*-----------------------------------*\
  source 2 — RSSHub
\*-----------------------------------*/

const parseRss = (xml) => {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  const pick = (block, tag) => {
    const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block);
    return m ? m[1].replace(/^<!\[CDATA\[|\]\]>$/g, '').trim() : '';
  };

  return items
    .map((block) => {
      const link = pick(block, 'link');
      const idMatch = /t\.me\/(?:s\/)?[^/]+\/(\d+)/.exec(link);
      const text = htmlToText(pick(block, 'description'));
      if (!idMatch || text.length < 20) return null;
      const id = Number(idMatch[1]);
      return {
        id,
        date: pick(block, 'pubDate') ? new Date(pick(block, 'pubDate')).toISOString() : null,
        title: truncate(firstLine(text), 110),
        tags: Array.from(
          new Set((text.match(/#[\p{L}\p{N}_]+/gu) || []).map((t) => t.slice(1)))
        ).slice(0, 5),
        url: `https://t.me/${CHANNEL}/${id}`,
        text,
        lang: 'fa'
      };
    })
    .filter(Boolean);
};

/*-----------------------------------*\
  main
\*-----------------------------------*/

const trySource = async (label, fn) => {
  try {
    const posts = await fn();
    if (posts.length) {
      console.log(`[sync-notes] ${label}: ${posts.length} posts`);
      return posts;
    }
    console.warn(`[sync-notes] ${label}: no readable posts`);
  } catch (e) {
    console.warn(`[sync-notes] ${label}: ${e.message || e}`);
  }
  return null;
};


const main = async () => {
  let posts = null;
  let channelNotPublic = false;

  for (const url of PREVIEW_URLS) {
    posts = await trySource(`preview ${url}`, async () => {
      const res = await withTimeout(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const body = await res.text();

      /* A reachable t.me that serves "Telegram: Contact @x" instead of the
         message history means the channel has no public web preview. That is
         a property of the channel, not a network fault, and retrying other
         URLs will not help. */
      if (/<meta property="og:title" content="Telegram: Contact/.test(body)) {
        channelNotPublic = true;
        throw new Error(
          't.me answered with the Contact page — this channel has no public preview'
        );
      }

      return parsePreview(body);
    });
    if (posts) break;
  }

  /* A private channel is an expected state, not a broken build: the site is
     designed to fall back to the archived notes. Exit 0 so the scheduled job
     stays green until the channel is made public, and log one clear line. */
  if (!posts && channelNotPublic) {
    console.log(
      '[sync-notes] channel is not public yet — keeping the archived notes. ' +
      'Once the channel has a public history (t.me/s/<channel>) this job ' +
      'will pick the posts up automatically.'
    );
    return;
  }

  if (!posts) {
    for (const url of RSS_URLS) {
      posts = await trySource(`rss ${url}`, async () => {
        const res = await withTimeout(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return parseRss(await res.text());
      });
      if (posts) break;
    }
  }

  /* last resort: mirrors that fetch t.me for us (for runners whose network
     blocks Telegram directly). Same HTML → same preview parser. */
  if (!posts) {
    for (const url of PROXY_URLS) {
      posts = await trySource(`proxy ${new URL(url).host}`, async () => {
        const res = await withTimeout(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const body = await res.text();
        return parsePreview(body);
      });
      if (posts) break;
    }
  }

  if (!posts) {
    throw new Error('every source failed — keeping the existing notes.json');
  }

  /* newest first, dedupe by id, cap the list */
  const seen = new Set();
  const cleaned = posts
    .filter((p) => p.id && !seen.has(p.id) && seen.add(p.id))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, MAX_POSTS);

  /* Refuse to overwrite good data with a partial/older scrape: if the newest
     post we just fetched is older than the newest post already on disk, the
     source was stale (cached mirror, rate-limited proxy). Keep the file. */
  let previous = null;
  try {
    previous = JSON.parse(await fs.readFile(OUT, 'utf8'));
  } catch { /* first run */ }

  const newestOnDisk = (previous && previous.posts || [])
    .map((p) => p.date)
    .filter(Boolean)
    .sort()
    .pop();

  const newestFetched = cleaned.map((p) => p.date).filter(Boolean).sort().pop();

  if (newestOnDisk && newestFetched && newestFetched < newestOnDisk) {
    throw new Error(
      `fetched data is older than what is on disk ` +
      `(${newestFetched} < ${newestOnDisk}) — source was stale, keeping notes.json`
    );
  }

  /* nothing new: still refresh the timestamp so the UI can say "checked now",
     but keep the post list byte-identical so the commit stays a no-op */
  const unchanged = previous &&
    previous.source === "telegram" &&
    JSON.stringify(previous.posts) === JSON.stringify(cleaned);

  const payload = {
    source: "telegram",
    updated: new Date().toISOString(),
    channel: CHANNEL,
    posts: unchanged ? previous.posts : cleaned
  };

  const json = JSON.stringify(payload, null, 2) + '\n';

  if (DRY) {
    console.log(`[sync-notes] dry run: would write ${payload.posts.length} posts`);
    console.log(json.slice(0, 800));
  } else {
    await fs.mkdir(path.dirname(OUT), { recursive: true });
    await fs.writeFile(OUT, json);
    console.log(
      `[sync-notes] wrote ${payload.posts.length} posts to ${OUT}` +
      (unchanged ? ' (post list unchanged)' : ` (newest: ${newestFetched})`)
    );
  }

};

/* run only when invoked directly — importing this module (tests) must not
   hit the network or write files */
/* Run only when invoked directly — importing this module (tests) must not
   hit the network or write files. Comparing via pathToFileURL is the only
   portable form: hand-building 'file:///' + argv[1] yields four slashes on
   POSIX, so the guard silently never fired on the CI runner and the sync
   exited 0 having done nothing. */
const invokedDirectly = process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch((e) => {
    console.error('[sync-notes] ' + (e.message || e));
    process.exit(1);
  });
}

export { parsePreview as parsePreviewForTest, parseRss as parseRssForTest, htmlToText };
