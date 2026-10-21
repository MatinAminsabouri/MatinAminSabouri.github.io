# Matin AminSabouri — Portfolio

Static, bilingual (EN/FA) portfolio for an AI & backend engineer. No framework,
no runtime dependencies, no third-party CDN requests: the page ships every font
and icon it uses.

**Live:** https://matinaminsabouri.github.io/

---

## How it is built

```
index.template.html      pristine page shell (structure + data-i18n keys)
assets/js/data.js        ALL copy — the single source of truth
assets/js/render.js      pure renderers shared by the browser and the build
assets/js/script.js      behaviour: theme, language, routing, notes, lightbox
assets/css/style.css     design tokens + every component
assets/data/notes.json   notes synced from Telegram (build-time)
scripts/build.mjs        prerenders index.html + sitemap/robots/404
```

`npm run build` writes `index.html` from `index.template.html`, injecting the
rendered sections between `<!--BUILD:...-->` markers. That means the shipped
HTML already contains all the content: crawlers, social previews and visitors
without JavaScript see the full page, and the JS then takes over for language
and theme switching.

Edit content in `assets/js/data.js` only — never in `index.html`, which is
generated. Edit structure in `index.template.html`.

## Commands

```bash
npm run build        # icons + prerender + sitemap/robots/404
npm run serve        # preview at http://127.0.0.1:8080
npm run check        # static integrity checks (CI runs this)
npm run sync:notes   # pull the latest Telegram posts into notes.json
npm run resume       # rebuild the resume PDF from scripts/resume/resume.html
npm run og           # rebuild assets/images/og-card.png
```

The end-to-end suite drives headless Chrome over the DevTools protocol with no
dependencies:

```bash
npm run serve &
node scripts/e2e/run.mjs
```

It checks the things that have actually broken here before: the case-study
accordion, sticky sidebar overflow, keyboard access, lightbox focus, RTL and
Persian digits, hash routing, both themes, and that no third-party request is
made.

## Notes feed

`assets/data/notes.json` is produced by `scripts/sync-notes.mjs` from the
public channel preview (`t.me/s/<channel>`), falling back to RSSHub. The
GitHub Action `.github/workflows/sync-notes.yml` runs it every six hours and
commits the result.

This replaced a browser-side scrape that hit CORS, hung ~20s when Telegram was
unreachable, and depended on two public RSS proxies. The runtime now reads one
local JSON file. If the sync fails, `assets/js/data.js` still has fallback posts.

## Resume

`scripts/resume/resume.html` is the master. `npm run resume` prints it to PDF
with headless Chrome, so the PDF always has selectable text and links that can
be verified. The old PDF was authored in an RTL word processor: its English
paragraphs had reversed punctuation and every project link pointed at a
deleted GitHub account.

## Deploying

GitHub Pages serves `main` directly. Commit the build output together with
the source — CI fails if `npm run build` would change a committed file.

## License

MIT for the code. Content, copy, images and the résumé are © Matin AminSabouri
— please do not reuse them.
