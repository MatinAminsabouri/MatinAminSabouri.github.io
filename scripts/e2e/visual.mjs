import { launch } from './cdp.mjs';
const b = await launch({ width: 1440, height: 900 });
const shots='scripts/e2e/shots';

// notes, dark, EN
await b.goto('http://127.0.0.1:8099/?lang=en#logs');
await new Promise(r=>setTimeout(r,1200));
await b.screenshot(`${shots}/10-notes-dark.png`);

// notes, light, FA
await b.goto('http://127.0.0.1:8099/?lang=fa#logs');
await new Promise(r=>setTimeout(r,900));
await b.evaluate(`document.querySelector('[data-theme-toggle]').click(); true`);
await new Promise(r=>setTimeout(r,700));
await b.screenshot(`${shots}/11-notes-light-fa.png`);

// resume tab, light
await b.goto('http://127.0.0.1:8099/?lang=en#resume');
await new Promise(r=>setTimeout(r,900));
await b.screenshot(`${shots}/12-resume-light.png`);

// mobile notes
await b.setViewport(390,844);
await b.goto('http://127.0.0.1:8099/?lang=fa#logs');
await new Promise(r=>setTimeout(r,900));
await b.screenshot(`${shots}/13-notes-mobile-fa.png`);

console.log('done');
await b.close();
