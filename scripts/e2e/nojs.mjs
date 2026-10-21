/**
 * nojs.mjs — verifies the prerendered page is complete without JavaScript.
 * This is what crawlers, social scrapers and no-JS visitors see.
 */
import { launch } from './cdp.mjs';

const b = await launch({ width: 1280, height: 1000 });
await b.send('Emulation.setScriptExecutionDisabled', { value: true });
await b.goto('http://127.0.0.1:8099/');
await new Promise((r) => setTimeout(r, 700));

const info = await b.evaluate(`(() => {
  const arts = [...document.querySelectorAll('article[data-page]')];
  return {
    articles: arts.length,
    articlesVisible: arts.filter(a => getComputedStyle(a).display !== 'none').map(a => a.dataset.page),
    contacts: document.querySelectorAll('.contact-item').length,
    projects: document.querySelectorAll('.project-card').length,
    notes: document.querySelectorAll('.logs-card').length,
    caseStudyVisible: Math.round(document.querySelector('.case-study').getBoundingClientRect().height) > 200,
    icons: document.querySelectorAll('svg.icon use').length,
    navLabels: [...document.querySelectorAll('.navbar-link')].map(b => b.textContent.trim()),
    headings: [...document.querySelectorAll('.article-title')].map(h => h.textContent.trim()),
    hasSkipLink: !!document.querySelector('.skip-link')
  };
})()`);

const fails = [];
const expect = (cond, label, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!cond) fails.push(label);
};

expect(info.articles === 4, 'all four articles exist', String(info.articles));
expect(info.articlesVisible.length === 4, 'all articles visible without JS', info.articlesVisible.join(','));
expect(info.contacts === 4, 'contacts prerendered', String(info.contacts));
expect(info.projects === 4, 'projects prerendered', String(info.projects));
expect(info.notes === 6, 'notes prerendered', String(info.notes));
expect(info.caseStudyVisible, 'case study readable without JS');
expect(info.icons > 20, 'icons render', String(info.icons));
expect(info.headings.join('|') === 'About me|Resume|Portfolio|Notes', 'section headings present', info.headings.join('|'));

await b.screenshot('scripts/e2e/shots/07-nojs.png');
await b.close();

console.log(fails.length ? `\n${fails.length} failed` : '\nall no-JS checks passed');
process.exit(fails.length ? 1 : 0);
