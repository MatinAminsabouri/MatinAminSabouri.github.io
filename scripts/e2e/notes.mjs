/**
 * notes.mjs — verifies the Notes tab renders the synced cards and reports
 * provenance honestly.
 */
import { launch } from './cdp.mjs';

const BASE = process.env.E2E_BASE || 'http://127.0.0.1:8099';
const b = await launch({ width: 1280, height: 900 });
const fails = [];
const expect = (cond, label, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!cond) fails.push(label);
};

await b.goto(BASE + '/?lang=en#logs');
await new Promise((r) => setTimeout(r, 1200));

const initial = await b.evaluate(`(() => ({
  status: document.querySelector('[data-logs-status]').textContent.trim(),
  cards: document.querySelectorAll('.logs-card').length,
  firstDate: document.querySelector('.logs-meta time')?.textContent
}))()`);

expect(initial.cards > 0, 'notes render', String(initial.cards));
expect(/Live|synced|Archived/i.test(initial.status),
  'status names a real provenance (live / synced age / archived)', initial.status);
expect(initial.status.length > 0 && !initial.status.includes('undefined'),
  'status is a real message', initial.status);

/* FA must localise the status line */
await b.evaluate(`document.querySelector('[data-lang="fa"]').click(); true`);
await new Promise((r) => setTimeout(r, 900));
const fa = await b.evaluate(`document.querySelector('[data-logs-status]').textContent.trim()`);
expect(/[\u0600-\u06FF]/.test(fa), 'status localises to Persian', fa);

await b.screenshot('scripts/e2e/shots/20-notes-status.png');
await b.close();

console.log(fails.length ? `\n${fails.length} failed` : '\nall notes checks passed');
process.exit(fails.length ? 1 : 0);
