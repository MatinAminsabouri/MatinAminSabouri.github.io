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
        <a class="tgme_widget_message_reply user-color-19" href="https://t.me/KhanAcademyy/510"><i class="tgme_widget_message_reply_thumb" style="background-image:url('https://cdn4.telestatic.me/file/replythumb.jpg')"></i>
          <div class="tgme_widget_message_author accent_color"><span class="tgme_widget_message_author_name" dir="auto">Khan Academy!</span></div>
          <div class="tgme_widget_message_text js-message_reply_text" dir="auto">Photo</div>
        </a>
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

  <div class="tgme_widget_message_wrap js-widget_message_wrap">
    <div class="tgme_widget_message js-widget_message" data-post="KhanAcademyy/509">
      <div class="tgme_widget_message_bubble">
        <style>.tgme_widget_message_photo_wrap{background-image:url('https://cdn4.telestatic.me/file/thumb.jpg');background-size:437px 257px}</style>
        <a class="tgme_widget_message_photo_wrap js-message_photo" style="width:437px;background-image:url(&quot;https://cdn4.telestatic.me/file/full.jpg&quot;)">
          <span class="tgme_photo"></span>
        </a>
        <div class="tgme_widget_message_footer">
          <a class="tgme_widget_message_date" href="https://t.me/KhanAcademyy/509">
            <time datetime="2026-10-17T12:00:00+00:00">12:00</time>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>
`;

const posts = parsePreviewForTest(FIXTURE);

assert.equal(posts.length, 3, `expected 3 readable posts, got ${posts.length}`);

const [first, second, third] = posts.sort((a, b) => b.id - a.id);

assert.equal(first.id, 512);
assert.equal(first.date, '2026-10-20T18:30:00.000Z');
assert.equal(first.url, 'https://t.me/KhanAcademyy/512');
assert.ok(first.title.includes('داکر'), 'title comes from the main caption, not the reply header: ' + first.title);
assert.deepEqual(first.tags, ['docker', 'caching']);
assert.ok(!first.photos.length, 'reply thumbnails are not picked up as photos');
assert.ok(!first.text.includes('<br'), 'line breaks are converted, not kept as tags');
assert.ok(first.text.includes('\n'), 'line breaks survive as newlines');

assert.equal(second.id, 511);
assert.deepEqual(second.tags, ['architecture']);

/* media-only post without photos is still dropped */
assert.ok(!posts.some((p) => p.id === 510), 'media-only post without photos is skipped');

/* a post that only carries photos is kept; the tiny blurred placeholder
   from the style block is skipped in favour of the anchor's real image */
const photoPost = posts.find((p) => p.id === 509);
assert.ok(photoPost, 'photo-only post is kept');
assert.equal(photoPost.title, 'Photo');
assert.deepEqual(photoPost.photos, ['https://cdn4.telestatic.me/file/full.jpg']);

console.log(`PASS  parser: ${posts.length} posts, newest #${first.id} at ${first.date}`);
console.log('PASS  hashtags, line breaks, media-only filtering');
console.log('\nall parser checks passed');
