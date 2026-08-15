# UI/UX & Architectural Overhaul Report
**Repository:** `MatinAminSabouri.github.io` · **Branch:** `main` · **Hosting:** GitHub Pages (static)
**Scope:** Content modernization + full design-system rewrite (Phases 1–7) · **Date:** 2026-08-15

> Prepared for external peer review by Senior Frontend/Design Architects. All metrics below are
> verified against the working tree (line counts, rule counts, brace/tag balance, asset footprint).

---

## 1. Executive Summary & Profile Transformation

### 1.1 From → To

| Dimension | Legacy state (pre-overhaul) | Target state (current) |
|---|---|---|
| **Identity** | "CE Student — Software Eng at Nosazco" (20 y/o intern narrative) | **AI & Backend Engineer (.NET / AI Systems)** |
| **Narrative** | Student, hobbyist (Deep-House, F1), intern | 3+ yrs engineering, **Tech Lead of "Ravin"** (first specialized municipal AI assistant in Iran), on-premise deployment specialist |
| **Skill presentation** | 6 percentage progress bars (C++, C# 70%, old `.NET Framework`, Express/Glitch) | 4 categorized chip groups × 24 chips (RAG, AI Agents, MCP, .NET Core, PyTorch, OpenTelemetry, …) |
| **Portfolio** | 4 student projects, text-only cards, **no AI project** | **Ravin featured card** (Enterprise/On-Prem badges) + curated .NET/AI projects with tech tags & status badges |
| **Contact** | Static links, dead `href="#"` socials, no phone in UI | Phone + email | copy-to-clipboard, clean GitHub/LinkedIn, **account rename discovered & propagated** (`matinsangar` → `MatinAminsabouri`, old handle 404s) |
| **Theme** | 2022 codewithsadee "vCard" template — amber-on-black gradients, heavy drop shadows | **"Obsidian + Electric"** — deep obsidian surfaces, cyan→indigo accent, hairline borders, glassmorphism |

### 1.2 Core Philosophy — the 2026 design language

- **Minimalism with edge definition, not depth.** Elevation is expressed through 1px hairlines
  (3-step slate alpha ladder) + ambient glows, replacing the template's layered drop shadows.
- **Electric accent as a signal language.** Cyan `#22D3EE` = interactive/primary, emerald `#34D399` =
  status/liveness, amber `#FBBF24` = exclusivity flags (Enterprise badge). Three hues, nothing more.
- **"Code-native" typography identity.** JetBrains Mono carries all metadata (tags, labels, badges,
  stats) — the page reads as engineering artifact, not a generic portfolio.
- **Micro-interactions as feedback, not decoration.** Every interactive node has a 150–300 ms
  transition on a single expo-out easing curve; the only perpetual animation is the 2.4 s status pulse.
- **Zero framework, zero build step.** Pure HTML5 + CSS3 (custom properties, `clamp()`, `backdrop-filter`,
  grid) + ES6+ vanilla JS. Deployment = `git push`.

---

## 2. Complete Design System Specifications

### 2.1 Color & Surface Tokens

```css
:root {
  /* surfaces — layered obsidian */
  --bg-0: #070B12;   /* page */
  --bg-1: #0B0F17;   /* primary panels */
  --bg-2: #101725;   /* cards, wells */
  --bg-3: #16202F;   /* raised / hover */

  /* hairline border ladder — slate at 8 / 14 / 22 % alpha */
  --line-1: rgba(148, 163, 184, 0.08);
  --line-2: rgba(148, 163, 184, 0.14);
  --line-3: rgba(148, 163, 184, 0.22);

  /* text ladder */
  --text-1: #E6EDF7;  /* primary */
  --text-2: #94A3B8;  /* secondary */
  --text-3: #7E8B9F;  /* tertiary (mono labels only) — AA on card surfaces */

  /* accent — "electric" cyan → indigo */
  --accent-1: #22D3EE;   /* interactive */
  --accent-2: #38BDF8;   /* mono date accents */
  --accent-3: #6366F1;   /* gradient partner */
  --grad-accent: linear-gradient(135deg, #22D3EE, #6366F1);

  /* status */
  --ok: #34D399;    /* liveness, Open Source */
  --warn: #FBBF24;  /* exclusivity (Enterprise) */
}
```

**Measured contrast (relative luminance, WCAG 2.1):**

| Pair | Ratio | Grade | Usage |
|---|---|---|---|
| `--text-1` on `--bg-0` | ≈ 16.8:1 | AAA | Headings, primary text |
| `--text-2` on `--bg-2` | ≈ 7.0:1 | AAA | Body copy, links |
| `--accent-1` on `--bg-0` | ≈ 10.9:1 | AAA | Interactive accents, chips |
| `--ok` on `--bg-2` | ≈ 9.3:1 | AAA | Status dot/badges |
| `--text-3` on `--bg-2` | ≈ 5.2:1 | AA | Tertiary mono labels — raised `#64748B → #7E8B9F` (v2) |

**Design rationale:** the accent family sits at the cyan/indigo boundary of the cool hue range to
read as "neural/AI" while remaining distinguishable for deuteranopia (cyan–indigo pair separates
by luminance ≈ 0.53 vs 0.23, not by hue alone). Status colors are the only chromatic additions.

### 2.2 Typography System

| Role | Stack | Weights loaded | Usage |
|---|---|---|---|
| Display | **Space Grotesk** | 500/600/700 | `h1`–`h4`, `.article-title`, card titles |
| Body | **Inter** | 400/500/600 | Paragraphs, UI text, buttons |
| Code | **JetBrains Mono** | 400/500 | Chips, badges, labels, stats, dates, Persian caption |

**Fluid scaling — `clamp()` interpolation.** Linear ramp between two viewport extremums:

```
value(vw) = min + ((max − min) × (vw − vw-min) / (vw-max − vw-min))
```

```css
--fs-title:  clamp(1.4rem, 1.10rem + 0.9vw, 1.90rem);  /* 375px → 1.4rem · 1240px+ → 1.9rem */
--fs-heading: clamp(1.05rem, 0.95rem + 0.4vw, 1.30rem);
--fs-sub:     clamp(0.95rem, 0.90rem + 0.2vw, 1.05rem);
--fs-body:    clamp(0.875rem, 0.82rem + 0.22vw, 0.95rem);  /* body stays 14–15 px */
--fs-small:   0.8125rem;   --fs-chip: 0.75rem;   /* fixed below fluid floor */
```

This replaces the template's stepped `--fs-*` overrides at every breakpoint (4 duplicated blocks
deleted). Mono sizes are intentionally fixed (0.625–0.75rem) — metadata must remain compact and
tabular regardless of viewport.

### 2.3 Lighting, Glassmorphism & Elevation

**Ambient page glow** — three `radial-gradient` fields fixed behind content (`z-index: −1`,
`pointer-events: none`), giving the flat `--bg-0` a cinematic vignette instead of texture/noise:

```css
body::before {
  background:
    radial-gradient(52rem 32rem at 12% -8%,  rgba(34, 211, 238, 0.10), transparent 60%),
    radial-gradient(44rem 30rem at 88% 4%,   rgba(99, 102, 241, 0.10), transparent 60%),
    radial-gradient(40rem 34rem at 50% 110%, rgba(52, 211, 153, 0.06), transparent 60%);
}
```

**Glass surfaces** (`.sidebar`, `article`, `.service-item`, `.project-card`, `.skill-group`):

```css
background: var(--glass-bg);                 /* rgba(16,23,37,0.55) */
-webkit-backdrop-filter: blur(14px) saturate(140%);
        backdrop-filter: blur(14px) saturate(140%);
border: 1px solid var(--glass-brd);          /* rgba(148,163,184,0.10) */
box-shadow: 0 24px 48px -24px rgba(2,6,23,0.7);   /* tight low shadow, not depth */
@supports not (backdrop-filter: blur(1px)) { .sidebar, article { background: var(--bg-1); } }
```

**Hover language (v2 — "quiet confidence"):** 1 px hairline escalation — borders step
`--line-2 → --line-3` or a cyan-tinted hairline (30–40% alpha), paired with a neutral dark shadow
(`0 16px 40px -16px rgba(2,6,23,0.8)`) and optional 2–4 px lift. Colored glow survived in exactly two
places: the emerald status pulse (liveness) and the primary CTA (`0 8/12px 24/32px -8px rgba(34,211,238,.5/.65)`).
The `--accent-glow` token was removed in v2 (0 references remain).

**Gradient accents** (no mask-composite dependency — plain layered elements):
- Avatar ring: 2 px `--grad-accent` padding + 3 px `--bg-1` img border (ring illusion, no pseudo).
- `.service-item::before`: 3 px gradient spine, `opacity: 0 → 1` on hover (horizontal reveal).
- `.article-title::after` / `.navbar-link.active::after`: 44 px / underline `scaleX(0→1)` gradient bar.
- `.timeline-item::after`: 9 px cyan dot with `0 0 0 4px rgba(34,211,238,.12)` ring + glow.

---

## 3. Component Breakdown & Technical Implementations

### 3.1 Sidebar / Hero

| Piece | Implementation |
|---|---|
| Avatar | `border-radius: 50%` on figure; gradient padding ring; `object-fit: cover`, 84 px→120 px (≥1024 px) |
| Persian name | JetBrains Mono caption under `h1`, tertiary color (Inline-style removed → token-delegated) |
| Tagline | `background-clip: text` gradient fill, `width: fit-content` |
| Status pulse | 8 px emerald dot, `box-shadow: 0 0 10px rgba(52,211,153,.6)`; `@keyframes pulse` 2.4 s expo-out (opacity 1→0.45 + `scale(.8)`) — the **only** perpetual animation |
| Expand/collapse | `display: grid; grid-template-rows: 0fr → 1fr` on `.sidebar-info_more` + `overflow:hidden; min-height:0` wrapper — replaces the template's `max-height` jump (112→405→584 px) with a smooth, content-height-independent transition; hard-expanded at ≥1024 px |

**Clipboard micro-interaction** (email + phone rows):

```js
const writeClipboard = () => {
  if (navigator.clipboard && window.isSecureContext)      // https / localhost
    return navigator.clipboard.writeText(text);
  const ta = document.createElement("textarea");           // legacy fallback
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  document.execCommand("copy"); document.body.removeChild(ta);
  return Promise.resolve();
};
```

State handling is CSS-driven: both icons are in the DOM, `.copied` class flips
`.copy-ic → none` / `.check-ic → block` and reveals a positioned tooltip; JS only toggles the class
and clears it after 1.6 s (`btn._copyTimer` guard). `aria-label` on buttons; tooltip is `aria-hidden`.

### 3.2 Skills Architecture — bars → categorized chips

Legacy: `<li class="skills-item">` × 6 with `<data value="90">90%</data>` + `width:90%` fill bars —
a false-precision pattern ×6.

Current: 4 glass groups (`.skill-group`), each a `ul.tag-row` of JetBrains Mono `.chip` pills:

```
AI / RAG & Agents            : RAG · AI Agents · MCP · Semantic Search · Vector DBs · PyTorch · Persian NLP · ASR (Sherpa/Gyro)
Backend & Distributed Systems: C# · .NET Core · ASP.NET Core · Python · REST APIs · Microservices · Design Patterns
Data & Databases             : MongoDB · SQL Server · Entity Framework · Data Modeling
DevOps & Observability       : Docker · OpenTelemetry · Grafana · Linux · On-Premise Deployment
```

Chip interaction (v2): informational only — `cursor: default`, no lift, no glow. Hover is a hairline
escalation (`border-color: var(--line-3)`, `color: var(--text-1)`). Group headers carry a 8 px rotated
gradient diamond (`rotate(45deg)`) as an identity glyph. Percentage values and the `.content-card`
45 px padding artifact are gone.

### 3.3 Portfolio & Project Cards

**Dynamic filtering — two synchronized triggers:**

- *Desktop (≥768 px):* `.filter-list` chip buttons (`data-filter-btn`) — active chip flips to solid
  `--grad-accent` with dark text.
- *Mobile (<768 px):* native-look `<select>`-style box (`data-select`) with `data-select-item` options.

**Bug fixed:** the template's JS queried `"[data-selecct-value]"` (triple-c typo) → `null.innerText`
threw a TypeError on every mobile select click; the dropdown was completely broken. Fixed to
`[data-select-value]` (attribute now present in markup) with an additional `if (selectValue)` guard.
Filter matching: selections are lowercased and compared against `data-category`; categories are
`all | ai systems | backend | desktop`, so the case-sensitive `dataset.category` comparison is safe.
Added outside-click close handler.

**Card anatomy** (`.project-card`, `display:flex; flex-direction:column`; `gap:12px`):

```
├─ .project-card-head   → badge-row (● Enterprise ● On-Prem) + mono category label
├─ h3.project-title
├─ p.project-text        → one-line technical description
├─ ul.tag-row            → tech chips (mono, grouped by relevance)
└─ .project-actions      → ghost "View on GitHub →" (btn-arrow translateX on hover)
                          | "case study coming soon" note slot (Ravin)
```

- **Ravin** = `.project-card--featured` — upgraded to a **mini engineering case study** (v2):
  gradient-tinted background (`linear-gradient(160deg, rgba(34,211,238,.07), rgba(99,102,241,.05) 50%, …)`),
  cyan-tinted border, badges `● Enterprise` / `● 100% Air-Gapped`, title `Ravin — On-Premise Municipal AI
  Assistant`, **Challenge & Hard Constraints** block, JetBrains Mono **engineered-pipeline** strip
  (`pre.pipeline`, `white-space: pre-wrap` for mobile), and 3 evidence bullets (Decoupled Execution /
  Zero-Hallucination RAG / Resilient Audio Processing). **Unlinked by design** (on-premise product);
  the action slot carries "Full architecture deep-dive available on request".
- Visibility gating preserved: `.project-item { display:none }` → `.active { display:block }` with a
  `cardIn` entrance keyframe (`translateY(12px) scale(.98) → none`), so JS contracts are unchanged.
- Responsive grid: 1 col → 2 cols (≥768) → 3 cols (≥1250); featured card spans full width
  (`grid-column: 1 / -1`) at both multi-column breakpoints.

### 3.4 Resume Section

- **Timeline spine:** `.timeline-item::before` 1 px gradient line
  (`linear-gradient(180deg, rgba(34,211,238,.35), var(--line-2))`), suppressed on `:last-child`;
  `.timeline-item::after` 9 px cyan dot with 4 px soft ring + glow — "glowing nodes on a fading spine".
- **Dates** render in mono (`--accent-2`); company name as tertiary mono sub-line.
- **Resume actions (v2):** dual CTA pair — `.btn--primary` **View Resume** (`target="_blank"`, arrow
  micro-slide generalized to all `.btn`) + `.btn--ghost` **Download** (with `download` attribute).
  Full-width `flex: 1` pair on mobile, side-by-side auto-width ≥480 px.
- The old inline-styled `<a>` (scattered `style=` attributes) replaced by the token-driven `.btn` system.

---

## 4. Performance, Hygiene & Asset Optimization

### 4.1 Zero-overhead architecture

- **No framework, no bundler, no build step, no package.json.** HTML5 + CSS3 + ES6+ vanilla JS only.
- **Rendering:** 1 `<img>` (avatar), 0 webfont-blocking licensing, fonts via Google Fonts `display=swap`
  + double `preconnect`; SVG icons via the **Ionicons 5.5.2 CDN** (module + nomodule, deferred at end of body).
- **JS:** 135 lines, two event-delegation-free `querySelectorAll` batches, no polyfills required
  (fallback path for clipboard is native `execCommand`).

### 4.2 Asset cleanup

| Metric | Before | After | Δ |
|---|---|---|---|
| Image files in `assets/images/` | 24 | **2** | −22 files |
| Total asset bytes | ≈ 1.2 MB | ≈ 916 KB | −25 % |
| Remaining assets | — | `myPic.jpg` (891 KB), `gear (1).png` favicon (2.9 KB) | — |

Deleted: 22 orphaned template PNGs/SVGs (service icons, social glyphs, testimonial/clients art,
logo variants, unused `project-9.png`). Deletion was safe because **(a)** the new service cards use
ionicons, **(b)** contact/social rows use ionicons, **(c)** testimonial/clients markup was removed.
**Open item:** `myPic.jpg` at 891 KB is disproportionate for a 84–150 px avatar — recommend
re-encoding to WebP/AVIF at ~256 px (≈ 20–60 KB) without changing the filename contract.

### 4.3 CSS modularity & dead-code removal

| Block removed | Legacy footprint |
|---|---|
| `#TESTIMONIALS` + `#TESTIMONIALS-MODAL` (+ responsive echoes) | ≈ 300 lines |
| `#CLIENTS` (+ responsive echoes) | ≈ 60 lines |
| `#BLOG` (+ responsive echoes) | ≈ 100 lines |
| `#CONTACT` (mapbox, form-input, textarea, `.form-btn`) | ≈ 100 lines |
| `.has-scrollbar*`, `.black`, `.cal` hacks, `.content-card` 45 px padding quirk | ≈ 40 lines |
| HTML: testimonial modal container, nested `.about-text` dup | ≈ 25 lines |
| JS: modal handler, contact-form validator | ≈ 55 lines |

New stylesheet organization (section markers 01→11): tokens → reset → base → layout → sidebar →
about → resume → portfolio → motion → a11y → responsive. 190 rules, 190 balanced braces; every rule
is reachable from the live DOM (verified by class/attribute cross-reference).

### 4.4 Quantitative summary

| File | Legacy | Current | Δ |
|---|---|---|---|
| `index.html` | 487 | 556 | +14% (richer semantics; −25 lines dead markup) |
| `assets/css/style.css` | 1,894 | 1,183 | **−37.5%** |
| `assets/js/script.js` | 159 | 135 | −15% (dead handlers removed, features added) |
| **Total** | 2,540 | 1,874 | **−26%** |

---

## 5. Accessibility & Modern Web Affordances

| Affordance | Implementation |
|---|---|
| Motion preference | `@media (prefers-reduced-motion: reduce)` global kill-switch: `animation-duration/transition-duration: 0.01ms !important`, `iteration-count: 1` |
| Keyboard focus | Global `:focus-visible` ring — `2px solid var(--accent-1)`, offset 3 px (only visible keyboard focus, not mouse clicks) |
| ARIA | `aria-current="page"` set/removed by the nav handler; `aria-label` on icon-only controls (copy buttons, social links, sidebar toggle); `aria-hidden` on decorative pulse dot & copy tooltip |
| Semantics | `nav[aria-label]`, `figure/figcaption` semantics on avatar, `address` for location, `ol` for timelines, `<button>` (not `<div>`) for all interactive triggers |
| Color safety | All interactive state changes pair color with border/glow/transform (never color-only); status colors verified for deuteranopia separation |
| OS integration | `meta[name=theme-color]="#070B12"` (mobile chrome), safe-area-inset padding on the fixed bottom nav, thin scrollbar + cyan hover thumb (WebKit *and* Firefox `scrollbar-width/color`), `::selection` inverted to dark-on-cyan |
| Focus trap / overflow | Panels are static (no modal), so no focus-trapping needed; long contact links use `overflow-wrap: anywhere` |
| **Known trade-offs** | `--text-3` at ≈5.2:1 is AA (was AA-large-only pre-v2); `backdrop-filter` GPU cost mitigated by the `@supports` opaque fallback |

---

## 6. Codebase Metrics & Diff Summary

### 6.1 Commit history (this engagement)

| Commit | Change |
|---|---|
| `77b046b` Update portfolio to AI & Backend Engineer profile | `index.html` +121/−84 (content sync: profile, SEO/OG, Ravin, skills, contacts) |
| `4eb702c` Add resume PDF for download | `assets/MatinAminSabouri-Resume.pdf` added |
| *(uncommitted — current working tree)* | Design-system overhaul: `M` index.html, `M` style.css, `M` script.js, `D` 22 images |

### 6.2 Working-tree footprint (overhaul phase)

```
 M index.html             556 lines  (tag-balanced, see below)
 M assets/css/style.css 1,183 lines  (190 rules, braces 190/190)
 M assets/js/script.js    135 lines
 D assets/images/…        22 files   (only myPic.jpg + gear (1).png remain)
```

### 6.3 Structural verification (awk-based)

| Element | open | close | | Element | open | close |
|---|---|---|---|---|---|---|
| section | 6 | 6 | | h4 | 10 | 10 |
| article | 7* | 7 | | p | 24 | 24 |
| ul / ol | 15 / 2 | 15 / 2 | | a | 9 | 9 |
| li | 64 | 64 | | span | 63 | 63 |
| div | 50 | 50 | | button | 15 | 15 |
| h1–h3 | 1 / 3 / 8 | 1 / 3 / 8 | | nav / aside / figure | 1 / 1 / 1 | 1 / 1 / 1 |

*\*article = 3 page panels + 4 project cards.*

### 6.4 JS contract (bindings preserved/injected)

| Hook | Count | Consumer |
|---|---|---|
| `data-nav-link` / `data-page` | 3 / 3 | tab navigation (unchanged contract) |
| `data-sidebar` / `data-sidebar-btn` | 1 / 1 | mobile contacts collapse |
| `data-filter-btn` / `data-select-item` / `data-select-value` | 4 / 4 / 1 | category filter (typo bug fixed) |
| `data-filter-item` + `data-category` | 4 | visibility gating (`all \| ai systems \| backend \| desktop`) |
| `data-copy` | 2 | clipboard micro-interaction (new) |

---

## 7. Open Questions for Peer Review

1. ~~**Tertiary text contrast (≈3.8:1)** — metadata-legible vs. audit-fail trade-off; would you raise
   `--text-3` to `#7C8AA0` (~4.6:1) at the cost of hierarchy depth?~~ **RESOLVED (v2):** raised to `#7E8B9F` (≈5.2:1, AA).
2. **`backdrop-filter` on 9 surfaces** — acceptable GPU load? Would a single blurred layer behind
   `main` (instead of per-card blur) be a better perf architecture?
3. ~~**Chip hover affordance** — chips are informational (no click action); is hover feedback without
   interactivity misleading, and should decorative chips use `cursor: default`?~~ **RESOLVED (v2):**
   `cursor: default`, glow/lift removed, hover reduced to hairline escalation.
4. **Featured-card grid span (`1 / -1`)** — full-width hero card vs. standard cell at ≥1250 px; which
   reads better for a portfolio grid?
5. **CDN strategy** — Ionicons + Google Fonts unpinned builds (only major-version pinned); acceptable
   for GitHub Pages, or should assets be self-hosted for reliability/SRI?
6. **`myPic.jpg` (891 KB)** — compression recommendation (target ≤60 KB) without breaking the `src`.
7. **Fluid type floor** — body copy never exceeds 15 px (`0.95rem` cap); is 15 px sufficient on
   high-density desktop displays, or should the cap rise to 1rem at ≥1600 px?
8. **CSS length (1,183 lines)** — lean per rule, but a candidate for future `@layer`-based
   organization or CSS modules if the project ever gains a build step.

---

## 8. Revision v2 — Principal-Architect Feedback Applied (2026-08-15)

| # | Feedback | Resolution |
|---|---|---|
| 1 | `--text-3` contrast < 4.5:1 | Token raised `#64748B → #7E8B9F` — ≈5.2:1 on `--bg-2`, ≈5.6:1 on `--bg-1` (AA) |
| 2 | Chips read as buttons | `cursor: default`; hover reduced to hairline escalation (border `--line-3`, text `--text-1`); glow + `translateY` lift removed |
| 3 | Excessive neon glow | `--accent-glow` token deleted (0 references). Colored glow now exists only on the emerald status pulse and the primary CTA; all other hovers use 1 px hairlines + neutral dark shadow |
| 4 | Passive Ravin card | Converted to a **mini engineering case study** — Challenge & Hard Constraints block, JetBrains Mono pipeline strip (`pre.pipeline`, `white-space: pre-wrap`), 3 evidence bullets (Decoupled Execution · Zero-Hallucination RAG · Resilient Audio Processing); badges `● Enterprise` + `● 100% Air-Gapped`; title `Ravin — On-Premise Municipal AI Assistant` |
| 5 | Recruiter flow | Resume header now dual-action: `.btn--primary` **View Resume** (`target="_blank"`) + `.btn--ghost` **Download** (`download` attr); arrow micro-slide generalized to all `.btn` (`.btn-arrow`) |
| 6 | Hero positioning | 1-line engineering positioning statement under the tagline (`.positioning`, `--text-2` @ `--fs-small`) |
| 7 | `myPic.jpg` 891 KB | **Advised client:** re-encode to WebP/JPEG ≤ 50 KB at the same path — no markup change required |

**Verified post-v2:** `--accent-glow` references = 0 · CSS braces 200/200 · tag balance maintained
(article 7/7 incl. 4 project cards · `pre` 1/1 · `li` 67/67) · JS contract unchanged (nav 3/3,
filters 4/4, copy 2) · `--text-3` AA on all surfaces.

---

*Report generated from the verified working tree; no files were modified during report generation.*