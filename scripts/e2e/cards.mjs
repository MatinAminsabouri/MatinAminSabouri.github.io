import { launch } from './cdp.mjs';

const BASE = process.env.E2E_BASE || 'http://127.0.0.1:8099';
const b = await launch({ width: 1280, height: 900 });
const fails = [];
const expect = (cond, label, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!cond) fails.push(label);
};

await b.goto(BASE + '/?lang=en#logs');
await new Promise((r) => setTimeout(r, 1500));

const state = await b.evaluate(`(() => {
  const firstTitle = document.querySelector('.logs-card .logs-title')?.textContent.trim();
  const alt = document.querySelector('.logs-thumb')?.getAttribute('alt') || '';
  const chips = Array.from(document.querySelectorAll('.logs-card')[0].querySelectorAll('.chip')).map(c => c.textContent.trim());
  const times = Array.from(document.querySelectorAll('.logs-meta span')).map(s => s.textContent.trim()).filter(Boolean);
  const first = document.querySelector('.logs-card');
  return {
    firstTitle, alt, chips, times,
    avatar: !!first.querySelector('.post-avatar img'),
    handle: first.querySelector('.post-handle')?.textContent.trim(),
    actions: first.querySelectorAll('.post-actions a').length,
    oldBadge: !!first.querySelector('.logs-badge'),
    oldButton: !!first.querySelector('.logs-card-actions')
  };
})()`);

expect(state.firstTitle === 'موسیقی متن فصل اول سریال Silo',
  'runtime rendered the curated card title (cards file consumed)', state.firstTitle);
expect(state.avatar, 'timeline row shows the author avatar');
expect(state.handle === '@KhanAcademyy', 'head shows the channel handle', state.handle);
expect(state.actions === 2, 'action row has reply + share links', String(state.actions));
expect(!state.oldBadge && !state.oldButton, 'legacy card chrome is gone');
expect(state.alt.includes('خاک و غبار'),
  'photo thumb carries the authored alt text', state.alt.slice(0, 40) + '…');
expect(state.chips.some((c) => c === '#Music') && state.chips.some((c) => c === '#Soundtrack'),
  'curated tags render as chips', JSON.stringify(state.chips));

/* popup opens for a prefixed card id */
await b.evaluate(`document.querySelector('.logs-card[data-post-id="tg_705"]').click(); true`);
await new Promise((r) => setTimeout(r, 600));
const modal = await b.evaluate(`(() => ({
  open: !document.getElementById('postModal').hidden,
  title: document.querySelector('.post-modal-title')?.textContent.trim(),
  textStart: document.querySelector('.post-modal-text')?.textContent.trim().slice(0, 30),
  slides: document.querySelectorAll('.post-slide img').length
}))()`);

expect(modal.open, 'popup opens from a tg_ prefixed card id');
expect(modal.title === 'بازطراحی Source Control در عصر هوش مصنوعی',
  'popup shows the curated title', modal.title);
expect(modal.textStart.startsWith('اگر AI بتواند'),
  'popup shows curated full_content', modal.textStart);
expect(modal.slides === 1, 'popup shows the card media', String(modal.slides));

await b.screenshot('scripts/e2e/shots/30-cards-popup.png');
await b.close();

console.log(fails.length ? `\n${fails.length} failed` : '\nall card integration checks passed');
process.exit(fails.length ? 1 : 0);
