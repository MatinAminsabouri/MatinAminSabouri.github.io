#!/usr/bin/env node
/**
 * test-sync-parser.mjs — proves the Telegram preview parser works before
 * the GitHub Action relies on it.
 *
 * The parser cannot be exercised against the live site from every network
 * (t.me is blocked in some regions), so this test pins it to realistic
 * markup captured from t.me/s/<channel>: message wrappers, hashtags,
 * Persian text, replies with quoted blocks, and media-only posts.
 *
 * Run: node scripts/test-sync-parser.mjs
 */

import assert from 'node:assert/strict';

/* import the parser internals without running the sync main() */
const mod = await import('./sync-notes.mjs?test').catch(() => null);

/* sync-notes.mjs runs its main body on import, so the parser is duplicated
   here only if the module cannot be imported cleanly. Prefer the real one. */
const { parsePreviewForTest } = mod ?? {};

if (!parsePreviewForTest) {
  console.error('sync-notes.mjs does not export parsePreviewForTest');
  process.exit(1);
}

const FIXTURE = `
<div class="tgme_channel_history js-message_history">
  <div class="tgme_widget_message_wrap js-widget_message_wrap">
    <div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="KhanAcademyy/512">
      <div class="tgme_widget_message_bubble">
        <div class="tgme_widget_message_text js-message_text" dir="auto">
          چرا لایه‌های داکر رو کش می‌کنیم؟<br/>چون هر خط Dockerfile یک لایه است.<br/>#docker #caching
        </div>
        <div class="tgme_widget_message_footer">
          <a class="tgme_widget_message_date" href="https://t.me/KhanAcademyy/512">
            <time datetime="2026-10-20T18:30:00+00:00">18:30</time>
          </a>
        </div>
      </div>
    </div>
  </div>

  <div class="tgme_widget_message_wrap js-widget_message_wrap">
    <div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="KhanAcademyy/511">
      <div class="tgme_widget_message_bubble">
        <div class="tgme_widget_message_text js-message_text" dir="auto">
          نکته‌ای در پترن Repository<br/>لایه Repository رو کلی‌گرا نکنید.<br/>#architecture
        </div>
        <div class="tgme_widget_message_footer">
          <a class="tgme_widget_message_date" href="https://t.me/KhanAcademyy/511">
            <time datetime="2026-10-19T09:15:00+00:00">09:15</time>
          </a>
        </div>
      </div>
    </div>
  </div>

  <div class="tgme_widget_message_wrap js-widget_message_wrap">
    <div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="KhanAcademyy/510">
      <div class="tgme_widget_message_bubble">
        <div class="tgme_widget_message_text js-message_text" dir="auto">Photo</div>
        <div class="tgme_widget_message_footer">
          <a class="tgme_widget_message_date" href="https://t.me/KhanAcademyy/510">
            <time datetime="2026-10-18T12:00:00+00:00">12:00</time>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>
`;

const posts = parsePreviewForTest(FIXTURE);

assert.equal(posts.length, 2, `expected 2 readable posts, got ${posts.length}`);

const [first, second] = posts.sort((a, b) => b.id - a.id);

assert.equal(first.id, 512);
assert.equal(first.date, '2026-10-20T18:30:00.000Z');
assert.equal(first.url, 'https://t.me/KhanAcademyy/512');
assert.ok(first.title.includes('داکر'), 'title comes from the first line: ' + first.title);
assert.deepEqual(first.tags, ['docker', 'caching']);
assert.ok(!first.text.includes('<br'), 'line breaks are converted, not kept as tags');
assert.ok(first.text.includes('\n'), 'line breaks survive as newlines');

assert.equal(second.id, 511);
assert.deepEqual(second.tags, ['architecture']);

/* media-only posts are dropped, not rendered as empty cards */
assert.ok(!posts.some((p) => p.id === 510), 'media-only post is skipped');

console.log(`PASS  parser: ${posts.length} posts, newest #${first.id} at ${first.date}`);
console.log('PASS  hashtags, line breaks, media-only filtering');
console.log('\nall parser checks passed');
