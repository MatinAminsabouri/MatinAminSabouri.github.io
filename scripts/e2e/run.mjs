/**
 * e2e.mjs — end-to-end checks against the built site.
 *
 * Runs headless Chrome over CDP (no dependencies) and asserts the things
 * that actually broke before: the case-study accordion, sticky sidebar
 * overflow, keyboard access, notes loading, RTL, themes, routing and
 * absence of third-party requests.
 *
 * Run: node scripts/e2e/run.mjs   (starts its own server)
 */
import { launch } from './cdp.mjs';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.E2E_BASE || 'http://127.0.0.1:8099';
const SHOTS = path.resolve('scripts/e2e/shots');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

const browser = await launch({ width: 1280, height: 800 });

try {
  /*-----------------------------------*\
    1. desktop, EN, dark
  \*-----------------------------------*/
  await browser.goto(BASE + '/');
  await browser.evaluate('localStorage.clear(); location.reload(); true');
  await new Promise((r) => setTimeout(r, 1200));
  await browser.goto(BASE + '/');
  await new Promise((r) => setTimeout(r, 1200));

  const boot = await browser.evaluate(`(() => {
    const ext = performance.getEntriesByType('resource')
      .map(r => r.name).filter(n => !n.startsWith(location.origin));
    /* local dev may fetch the published notes file when the local copy has
       never been synced — that is the only permitted cross-origin request */
    const notesFallback = ext.filter(n => /notes\\.json/.test(n));
    return {
      notes: document.querySelectorAll('.logs-card').length,
      external: ext.filter(n => !/notes\\.json/.test(n)),
      notesFallback,
      isProduction: /(^|\\.)matinaminsabouri\\.github\\.io$/.test(location.hostname),
      sprite: !!document.getElementById('i-mail-outline'),
      svgIcons: document.querySelectorAll('svg.icon').length,
      ionIcons: document.querySelectorAll('ion-icon').length,
      title: document.title,
      fontsLoaded: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family),
      caseStudyHeight: Math.round(document.querySelector('.case-study').getBoundingClientRect().height),
      prerenderedText: document.body.innerText.includes('Software Engineer with 3+ years')
    };
  })()`);

  check('notes render from local JSON', boot.notes > 0, boot.notes + ' cards');
  check('no third-party runtime requests', boot.external.length === 0, boot.external.join(', ') || 'none');
  check('production makes no cross-origin notes request',
    !boot.isProduction || boot.notesFallback.length === 0,
    boot.isProduction ? boot.notesFallback.join(', ') || 'none' : 'n/a (dev origin)');
  check('icon sprite inlined', boot.sprite && boot.svgIcons > 10 && boot.ionIcons === 0, boot.svgIcons + ' svg icons');
  check('fonts load locally', boot.fontsLoaded.length > 0, boot.fontsLoaded.join(', '));
  check('prerendered content present before JS', boot.prerenderedText);
  check('case study starts collapsed', boot.caseStudyHeight === 0, boot.caseStudyHeight + 'px');

  await browser.screenshot(path.join(SHOTS, '01-desktop-en-dark.png'));

  /*-----------------------------------*\
    2. case study opens
  \*-----------------------------------*/
  await browser.evaluate(`(() => {
    document.querySelector('[data-nav-target="portfolio"]').click();
    return true;
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  await browser.evaluate(`document.querySelector('[data-case-toggle]').click(); true`);
  await new Promise((r) => setTimeout(r, 700));

  const cs = await browser.evaluate(`(() => {
    const card = document.querySelector('.project-card--featured');
    const box = card.querySelector('.case-study');
    const toggle = card.querySelector('[data-case-toggle]');
    return {
      open: card.classList.contains('open'),
      height: Math.round(box.getBoundingClientRect().height),
      expanded: toggle.getAttribute('aria-expanded'),
      label: toggle.querySelector('.case-toggle-label').textContent,
      blocks: card.querySelectorAll('.case-block').length,
      overflow: document.documentElement.scrollWidth > window.innerWidth
    };
  })()`);

  check('case study expands', cs.open && cs.height > 200, cs.height + 'px');
  check('case study aria-expanded syncs', cs.expanded === 'true' && /Show Less/.test(cs.label), cs.label);
  check('no horizontal overflow', !cs.overflow);

  await browser.screenshot(path.join(SHOTS, '02-case-study-open.png'));

  /*-----------------------------------*\
    3. sticky sidebar must scroll, not clip
  \*-----------------------------------*/
  const side = await browser.evaluate(`(() => {
    const sb = document.querySelector('.sidebar');
    const cs = getComputedStyle(sb);
    const socials = document.querySelector('.social-list');
    const contacts = document.querySelector('.contacts-list');
    const inner = document.querySelector('.sidebar-info_more-inner');
    sb.scrollTop = 99999;
    const sr = socials.getBoundingClientRect();
    return {
      maxHeight: cs.maxHeight,
      overflowY: cs.overflowY,
      scrollable: sb.scrollHeight > sb.clientHeight + 1,
      socialsVisible: sr.top < window.innerHeight && sr.bottom > 0,
      contactsVisible: contacts.getBoundingClientRect().height > 0,
      innerVisibility: getComputedStyle(inner).visibility
    };
  })()`);

  check('sidebar is scrollable on short viewports', side.overflowY === 'auto' && side.scrollable,
    `overflow-y=${side.overflowY}, max-height=${side.maxHeight}`);
  check('sidebar socials reachable after scroll', side.socialsVisible);
  check('desktop sidebar shows contacts', side.contactsVisible && side.innerVisibility === 'visible',
    side.innerVisibility);

  /*-----------------------------------*\
    4. keyboard: skip link, avatar, tabs
  \*-----------------------------------*/
  await browser.goto(BASE + '/');
  await new Promise((r) => setTimeout(r, 900));

  const kb = await browser.evaluate(`(() => {
    const skip = document.querySelector('.skip-link');
    const avatar = document.querySelector('[data-avatar-trigger]');
    const more = document.querySelector('.sidebar-info_more-inner');
    return {
      skipHref: skip && skip.getAttribute('href'),
      avatarTag: avatar && avatar.tagName,
      avatarFocusable: avatar && avatar.tabIndex >= 0,
      collapsedVisibility: getComputedStyle(more).visibility
    };
  })()`);

  check('skip link targets main content', kb.skipHref === '#main-content');
  check('avatar is a focusable button', kb.avatarTag === 'BUTTON' && kb.avatarFocusable);

  /* tab to the skip link, press Enter, then open the lightbox from the keyboard */
  await browser.evaluate(`document.querySelector('[data-avatar-trigger]').focus(); true`);
  await browser.key('Enter');
  await new Promise((r) => setTimeout(r, 500));

  const lb = await browser.evaluate(`(() => {
    const box = document.getElementById('avatarLightbox');
    return {
      open: !box.hidden,
      focusIsClose: document.activeElement === box.querySelector('.lightbox-close'),
      active: document.activeElement.tagName + '.' + document.activeElement.className,
      bodyLocked: document.body.style.overflow === 'hidden'
    };
  })()`);

  check('keyboard opens lightbox', lb.open && lb.focusIsClose && lb.bodyLocked, JSON.stringify(lb));

  await browser.key('Escape');
  await new Promise((r) => setTimeout(r, 400));
  const lbClosed = await browser.evaluate(`(() => {
    const box = document.getElementById('avatarLightbox');
    return {
      closed: box.hidden,
      focusRestored: document.activeElement === document.querySelector('[data-avatar-trigger]'),
      bodyFree: document.body.style.overflow === ''
    };
  })()`);
  check('Escape closes lightbox and restores focus', lbClosed.closed && lbClosed.focusRestored && lbClosed.bodyFree);

  /*-----------------------------------*\
    5. collapsed contacts are not tabbable (mobile)
  \*-----------------------------------*/
  await browser.setViewport(390, 844);
  await new Promise((r) => setTimeout(r, 500));
  const mobile = await browser.evaluate(`(() => {
    const inner = document.querySelector('.sidebar-info_more-inner');
    const btn = document.querySelector('[data-sidebar-btn]');
    const before = getComputedStyle(inner).visibility;
    btn.click();
    const after = getComputedStyle(inner).visibility;
    return {
      collapsed: before,
      expanded: after,
      ariaExpanded: btn.getAttribute('aria-expanded'),
      navBottom: Math.round(document.querySelector('.navbar').getBoundingClientRect().bottom),
      overflowX: document.documentElement.scrollWidth > window.innerWidth
    };
  })()`);

  check('collapsed contacts hidden from AT/tab order', mobile.collapsed === 'hidden', mobile.collapsed);
  check('contact toggle expands and reports state', mobile.expanded === 'visible' && mobile.ariaExpanded === 'true');
  check('mobile has no horizontal overflow', !mobile.overflowX);

  /* the bottom nav must stay a single row in both languages */
  const navRows = await browser.evaluate(`(() => {
    const links = [...document.querySelectorAll('.navbar-link')];
    const tops = new Set(links.map(l => Math.round(l.getBoundingClientRect().top)));
    const nav = document.querySelector('.navbar').getBoundingClientRect();
    return { rows: tops.size, height: Math.round(nav.height), width: Math.round(nav.width), vw: window.innerWidth };
  })()`);
  check('mobile nav stays one row (FA)', navRows.rows === 1,
    `${navRows.rows} rows, ${navRows.width}px of ${navRows.vw}px`);

  await browser.screenshot(path.join(SHOTS, '03-mobile-contacts-open.png'));

  /*-----------------------------------*\
    6c. mobile filter dropdown: keyboard open/select/Escape
  \*-----------------------------------*/
  await browser.evaluate(`document.querySelector('[data-nav-target="portfolio"]').click(); true`);
  await new Promise((r) => setTimeout(r, 500));

  await browser.evaluate(`(() => {
    const btn = document.querySelector('[data-select]');
    btn.focus();
    btn.click();
    return true;
  })()`);
  /* the panel fades in over --dur-1, so sample it after the transition */
  await new Promise((r) => setTimeout(r, 350));

  const filterKb = await browser.evaluate(`(() => {
    const btn = document.querySelector('[data-select]');
    const openState = btn.getAttribute('aria-expanded');
    const panel = document.getElementById('filter-select-list');
    const visible = getComputedStyle(panel).visibility;
    const option = panel.querySelector('[data-select-item][data-filter-value="backend"]');
    option.click();
    return {
      openState,
      visible,
      closedAfterPick: btn.getAttribute('aria-expanded'),
      activeFilter: [...document.querySelectorAll('[data-filter-btn].active')].map(b => b.dataset.filterValue),
      visibleProjects: [...document.querySelectorAll('.project-item.active')].map(i => i.dataset.category),
      focusBackOnButton: document.activeElement === btn
    };
  })()`);

  check('mobile filter opens as a disclosure', filterKb.openState === 'true' && filterKb.visible === 'visible');
  check('picking a filter closes it and refocuses the button',
    filterKb.closedAfterPick === 'false' && filterKb.focusBackOnButton);
  check('filter actually filters projects',
    filterKb.visibleProjects.length === 2 && filterKb.visibleProjects.every((c) => c === 'backend'),
    filterKb.visibleProjects.join(', '));

  /*-----------------------------------*\
    6d. Tab-walk: focus never lands on invisible content
    (inactive tabs and collapsed accordions are display:none / hidden,
    so a naive "are all buttons visible" check would be wrong; what
    matters is what the browser actually focuses when the user presses Tab)
  \*-----------------------------------*/
  await browser.goto(BASE + '/?lang=en');
  await new Promise((r) => setTimeout(r, 900));
  await browser.evaluate(`document.body.focus(); document.querySelector('.skip-link').focus(); true`);

  const tabWalk = [];
  for (let i = 0; i < 24; i++) {
    await browser.key('Tab');
    await new Promise((r) => setTimeout(r, 60));
    tabWalk.push(await browser.evaluate(`(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { name: 'BODY', ok: true };
      let hidden = false;
      let node = el;
      while (node && node !== document.documentElement) {
        const cs = getComputedStyle(node);
        if (cs.display === 'none' || cs.visibility === 'hidden') { hidden = true; break; }
        node = node.parentElement;
      }
      return {
        name: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 26),
        ok: !hidden && el.getBoundingClientRect().height > 0
      };
    })()`));
  }

  const badFocus = tabWalk.filter((s) => !s.ok);
  check('Tab never focuses hidden or zero-size content', badFocus.length === 0,
    badFocus.map((s) => s.name).join(' | ') || `${tabWalk.length} stops, all visible`);
  check('Tab reaches the skip link, nav, theme and avatar',
    tabWalk.some((s) => /Skip to content/.test(s.name)) &&
    tabWalk.some((s) => /Toggle theme|Switch to/.test(s.name)) &&
    tabWalk.some((s) => /profile picture/i.test(s.name)),
    tabWalk.map((s) => s.name).slice(0, 24).join(' → '));

  /*-----------------------------------*\
    6e. language switch (FA) + RTL + Persian digits
  \*-----------------------------------*/
  await browser.evaluate(`document.querySelector('[data-lang="fa"]').click(); true`);
  await new Promise((r) => setTimeout(r, 800));

  const fa = await browser.evaluate(`(() => {
    const reading = [...document.querySelectorAll('.logs-meta span')].map(s => s.textContent).join(' ');
    const title = document.title;
    return {
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      url: location.search,
      title,
      persianReading: /[۰-۹]/.test(reading),
      readingSample: reading.slice(0, 40),
      navFa: document.querySelector('[data-nav-target="about"]').textContent,
      noteLang: document.querySelector('.logs-title').getAttribute('lang')
    };
  })()`);

  check('FA switch sets lang/dir', fa.lang === 'fa' && fa.dir === 'rtl');
  check('FA switch updates URL', fa.url === '?lang=fa', fa.url);
  check('FA page title localised', /متین/.test(fa.title));
  check('Persian digits in reading time', fa.persianReading, fa.readingSample);
  check('note text tagged lang=fa', fa.noteLang === 'fa');

  await browser.screenshot(path.join(SHOTS, '04-mobile-fa-dark.png'));

  /*-----------------------------------*\
    6b. 360px is the narrowest common phone
  \*-----------------------------------*/
  await browser.setViewport(360, 740);
  await new Promise((r) => setTimeout(r, 500));
  const narrow = await browser.evaluate(`(() => {
    const links = [...document.querySelectorAll('.navbar-link')];
    return {
      rows: new Set(links.map(l => Math.round(l.getBoundingClientRect().top))).size,
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
      navWidth: Math.round(document.querySelector('.navbar').getBoundingClientRect().width),
      vw: window.innerWidth
    };
  })()`);
  check('360px: FA nav one row, no overflow', narrow.rows === 1 && !narrow.overflowX,
    `${narrow.rows} rows, nav ${narrow.navWidth}/${narrow.vw}`);
  await browser.screenshot(path.join(SHOTS, '06-mobile-360-fa.png'));
  await browser.setViewport(390, 844);
  await new Promise((r) => setTimeout(r, 400));

  /*-----------------------------------*\
    7. routing: hash + back button + shareable URL
  \*-----------------------------------*/
  await browser.evaluate(`document.querySelector('[data-nav-target="portfolio"]').click(); true`);
  await new Promise((r) => setTimeout(r, 500));
  const route1 = await browser.evaluate(`({ hash: location.hash, active: document.querySelector('article.active').dataset.page })`);
  check('tab click updates hash', route1.hash === '#portfolio' && route1.active === 'portfolio', JSON.stringify(route1));

  await browser.send('Runtime.evaluate', { expression: 'history.back()' });
  await new Promise((r) => setTimeout(r, 600));
  const route2 = await browser.evaluate(`({ hash: location.hash, active: document.querySelector('article.active').dataset.page })`);
  check('browser Back restores previous tab', route2.active === 'about', JSON.stringify(route2));

  await browser.goto(BASE + '/?lang=fa#logs');
  await new Promise((r) => setTimeout(r, 900));
  const deep = await browser.evaluate(`({ active: document.querySelector('article.active').dataset.page, lang: document.documentElement.lang })`);
  check('deep link opens tab + language', deep.active === 'logs' && deep.lang === 'fa', JSON.stringify(deep));

  /*-----------------------------------*\
    8. light theme
  \*-----------------------------------*/
  await browser.evaluate(`document.querySelector('[data-theme-toggle]').click(); true`);
  await new Promise((r) => setTimeout(r, 600));
  const light = await browser.evaluate(`(() => {
    const card = document.querySelector('.project-card--featured');
    const bg = getComputedStyle(card).backgroundImage;
    return {
      theme: document.documentElement.dataset.theme,
      pressed: document.querySelector('[data-theme-toggle]').getAttribute('aria-pressed'),
      featuredDark: /rgba\\(16, 23, 37/.test(bg)
    };
  })()`);

  check('light theme applies', light.theme === 'light');
  check('theme toggle reports pressed state', light.pressed === 'true');
  check('featured card has no dark overlay in light theme', !light.featuredDark, light.featuredDark ? 'still dark' : 'ok');

  await browser.setViewport(1280, 800);
  await browser.goto(BASE + '/?lang=en#portfolio');
  await new Promise((r) => setTimeout(r, 900));
  await browser.evaluate(`document.querySelector('[data-theme-toggle]').click(); true`);
  await new Promise((r) => setTimeout(r, 500));
  await browser.evaluate(`document.querySelector('[data-case-toggle]').click(); true`);
  await new Promise((r) => setTimeout(r, 700));
  await browser.screenshot(path.join(SHOTS, '05-desktop-en-light.png'));

  /*-----------------------------------*\
    9. console cleanliness
  \*-----------------------------------*/
  /* the dev-only notes fallback probes a URL that may not exist yet; that
     is an expected, handled miss, not a page error */
  const errs = browser.consoleErrors.filter(
    (e) => !/favicon|404 \(Not Found\)/i.test(e) && !/notes\.json/i.test(e)
  );
  check('no console errors', errs.length === 0, errs.slice(0, 3).join(' | '));

} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log('  ✗ ' + f.name + (f.detail ? ' — ' + f.detail : '')));
  process.exit(1);
}
