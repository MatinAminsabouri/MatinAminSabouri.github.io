'use strict';

/*-----------------------------------*\
  script.js — logic only.
  ALL copy lives in assets/js/data.js (window.SITE_DATA); this file
  reads from it and renders. index.html carries structure + data-i18n
  KEYS with empty bodies — never put visible text back into the HTML.
\*-----------------------------------*/

const DATA = window.SITE_DATA;
const I18N = DATA.i18n;

const rootEl = document.documentElement;

const curLang = function () {
  return rootEl.getAttribute("lang") === "fa" ? "fa" : "en";
};

/* resolve a content field: plain string (same in both languages)
   or bilingual object { en, fa } */
const L = function (field, lang) {
  return typeof field === "string" ? field : field[lang];
};

/*-----------------------------------*\
  theme engine (light / dark)
\*-----------------------------------*/

const themeToggle = document.querySelector("[data-theme-toggle]");
const themeMeta = document.querySelector('meta[name="theme-color"]');

const applyTheme = function (theme) {
  rootEl.setAttribute("data-theme", theme);
  try { localStorage.setItem("theme", theme); } catch (e) { }
  if (themeMeta) themeMeta.setAttribute("content", theme === "light" ? "#F8FAFC" : "#070B12");
};

themeToggle.addEventListener("click", function () {
  const next = rootEl.getAttribute("data-theme") === "light" ? "dark" : "light";
  applyTheme(next);
});

/* follow system preference only while the user hasn't chosen explicitly */
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
  let stored = null;
  try { stored = localStorage.getItem("theme"); } catch (err) { }
  if (!stored) applyTheme(e.matches ? "dark" : "light");
});

/*-----------------------------------*\
  renderers — content sections built from SITE_DATA

  TRUST: SITE_DATA is author-written static content, so these renderers
  use innerHTML intentionally. Never feed remote or model-generated
  strings through them without escaping first.
\*-----------------------------------*/

const contactsList = document.querySelector("[data-contacts]");
const socialsList = document.querySelector("[data-socials]");
const aboutBody = document.querySelector("[data-about-body]");
const resumeBody = document.querySelector("[data-resume-body]");
const select = document.querySelector("[data-select]");
const selectValue = document.querySelector("[data-select-value]");
const selectList = document.querySelector("[data-select-list]");
const filterList = document.querySelector("[data-filter-list]");
const projectList = document.querySelector("[data-project-list]");

/* interaction state preserved across re-renders (language switches) */
const uiState = { filter: "all", caseOpen: false };

const chipRow = function (tags) {
  return '<ul class="tag-row">' +
    tags.map(function (t) { return '<li><span class="chip">' + t + "</span></li>"; }).join("") +
    "</ul>";
};

const renderContacts = function (lang) {
  const t = I18N[lang];

  contactsList.innerHTML = DATA.profile.contacts.map(function (c) {
    const valueHtml = c.href
      ? '<a href="' + c.href + '" class="contact-link">' + c.text + "</a>"
      : "<address>" + L(c.address, lang) + "</address>";

    const copyHtml = c.copy
      ? '<button class="copy-btn" data-copy="' + c.copy + '" aria-label="' + t.a_copy_email + '">' +
          '<ion-icon name="copy-outline" class="copy-ic"></ion-icon>' +
          '<ion-icon name="checkmark-outline" class="check-ic"></ion-icon>' +
          '<span class="copy-tooltip" aria-hidden="true">' + t.copy_done + "</span>" +
        "</button>"
      : "";

    return '<li class="contact-item">' +
      '<div class="icon-box"><ion-icon name="' + c.icon + '"></ion-icon></div>' +
      '<div class="contact-info">' +
        '<p class="contact-title">' + L(c.label, lang) + "</p>" +
        valueHtml +
      "</div>" +
      copyHtml +
      "</li>";
  }).join("");
};

const renderSocials = function (lang) {
  socialsList.innerHTML = DATA.profile.socials.map(function (s) {
    return '<li class="social-item">' +
      '<a href="' + s.href + '" class="social-link" aria-label="' + L(s.label, lang) + '">' +
        '<ion-icon name="' + s.icon + '"></ion-icon>' +
      "</a>" +
      "</li>";
  }).join("");
};

const renderAbout = function (lang) {
  const a = DATA.about;
  const t = I18N[lang];

  aboutBody.innerHTML =
    '<section class="about-text">' +
      a.bio.map(function (b) { return "<p>" + L(b, lang) + "</p>"; }).join("") +
    "</section>" +

    '<div class="stats">' +
      a.stats.map(function (s) {
        return '<div class="stat">' +
          '<span class="stat-value">' + L(s.value, lang) + "</span>" +
          '<span class="stat-label">' + L(s.label, lang) + "</span>" +
          "</div>";
      }).join("") +
    "</div>" +

    '<section class="service">' +
      '<h3 class="service-title">' + t.doing_title + "</h3>" +
      '<ul class="service-list">' +
        a.services.map(function (s) {
          return '<li class="service-item">' +
            '<div class="service-icon-box"><ion-icon name="' + s.icon + '"></ion-icon></div>' +
            '<div class="service-content-box">' +
              '<h4 class="service-item-title">' + L(s.title, lang) + "</h4>" +
              '<p class="service-item-text">' + L(s.text, lang) + "</p>" +
            "</div>" +
            "</li>";
        }).join("") +
      "</ul>" +
    "</section>";
};

const renderResume = function (lang) {
  const r = DATA.resume;
  const t = I18N[lang];

  const timeline = function (icon, title, itemsHtml) {
    return '<section class="timeline">' +
      '<div class="title-wrapper">' +
        '<div class="icon-box"><ion-icon name="' + icon + '"></ion-icon></div>' +
        '<h3 class="timeline-title">' + title + "</h3>" +
      "</div>" +
      '<ol class="timeline-list">' + itemsHtml + "</ol>" +
      "</section>";
  };

  const eduItems = r.education.map(function (e) {
    return '<li class="timeline-item">' +
      '<h4 class="timeline-item-title">' + L(e.title, lang) + "</h4>" +
      "<span>" + e.period + "</span>" +
      '<p class="timeline-text">' + L(e.desc, lang) + "</p>" +
      "</li>";
  }).join("");

  const expItems = r.experience.map(function (e) {
    return '<li class="timeline-item">' +
      '<h4 class="timeline-item-title">' + L(e.role, lang) + "</h4>" +
      "<span>" + e.period + "</span>" +
      '<p class="timeline-company">' + L(e.company, lang) + "</p>" +
      e.bullets.map(function (b) { return '<p class="timeline-text">' + L(b, lang) + "</p>"; }).join("") +
      "</li>";
  }).join("");

  const skills =
    '<section class="skills">' +
      '<h3 class="skills-title">' + t.skills_title + "</h3>" +
      r.skills.map(function (g) {
        return '<div class="skill-group">' +
          '<h4 class="skill-group-title">' + L(g.title, lang) + "</h4>" +
          chipRow(g.tags) +
          "</div>";
      }).join("") +
    "</section>";

  resumeBody.innerHTML =
    timeline("book-outline", t.edu_title, eduItems) +
    timeline("briefcase-outline", t.exp_title, expItems) +
    skills;
};

const renderFilters = function (lang) {
  const filters = DATA.filters;
  const active = filters.find(function (f) { return f.value === uiState.filter; }) || filters[0];

  selectList.innerHTML = filters.map(function (f) {
    return '<li class="select-item">' +
      '<button data-select-item data-filter-value="' + f.value + '">' + L(f.label, lang) + "</button>" +
      "</li>";
  }).join("");

  filterList.innerHTML = filters.map(function (f) {
    const isActive = f.value === uiState.filter;
    return '<li class="filter-item">' +
      '<button class="' + (isActive ? "active" : "") + '" data-filter-btn data-filter-value="' + f.value + '">' +
        L(f.label, lang) +
      "</button>" +
      "</li>";
  }).join("");

  selectValue.textContent = L(active.label, lang);
};

const buildProjectCard = function (p, lang) {
  const t = I18N[lang];

  const badges = p.badges.length
    ? '<div class="badge-row">' +
        p.badges.map(function (b) {
          return '<span class="badge badge--' + b.tone + '">' + L(b.label, lang) + "</span>";
        }).join("") +
      "</div>"
    : "";

  const head =
    '<div class="project-card-head">' +
      badges +
      '<span class="project-category">' + L(p.category_label, lang) + "</span>" +
    "</div>";

  let caseStudyHtml = "";
  let toggleHtml = "";

  if (p.case_study) {
    const cs = p.case_study;

    const blocks = cs.blocks.map(function (b) {
      if (b.type === "pipeline") {
        return '<div class="case-block">' +
          '<h4 class="case-title">' + L(b.title, lang) + "</h4>" +
          '<pre class="pipeline">' + b.text + "</pre>" +
          "</div>";
      }
      if (b.type === "decisions") {
        return '<div class="case-block">' +
          '<h4 class="case-title">' + L(b.title, lang) + "</h4>" +
          '<ul class="case-list">' +
            b.items.map(function (i) {
              return "<li>" +
                '<span class="case-dec">' + L(i.title, lang) + "</span>" +
                '<span class="case-desc">' + L(i.desc, lang) + "</span>" +
                "</li>";
            }).join("") +
          "</ul>" +
          "</div>";
      }
      /* type: "text" */
      return '<div class="case-block">' +
        '<h4 class="case-title">' + L(b.title, lang) + "</h4>" +
        '<p class="case-text">' + L(b.html, lang) + "</p>" +
        "</div>";
    }).join("");

    caseStudyHtml =
      '<div class="case-study" id="' + cs.id + '" data-case-study>' +
        '<div class="case-study-inner">' + blocks + "</div>" +
      "</div>";

    toggleHtml =
      '<button class="btn btn--ghost case-toggle" data-case-toggle ' +
        'aria-expanded="' + (uiState.caseOpen ? "true" : "false") + '" aria-controls="' + cs.id + '">' +
        '<span class="case-toggle-label">' + (uiState.caseOpen ? t.case_show_less : t.case_read_more) + "</span>" +
        '<ion-icon name="chevron-down" class="case-toggle-icon"></ion-icon>' +
      "</button>";
  }

  let linkHtml = "";
  if (p.link) {
    linkHtml =
      '<a href="' + p.link + '" target="_blank" rel="noopener noreferrer" class="btn btn--ghost">' +
        '<ion-icon name="logo-github"></ion-icon>' +
        "<span>" + t.view_github + "</span>" +
        '<ion-icon name="arrow-forward-outline" class="btn-arrow"></ion-icon>' +
      "</a>";
  }

  const noteHtml = p.note ? '<span class="project-note">' + L(p.note, lang) + "</span>" : "";

  return '<article class="project-card' +
      (p.featured ? " project-card--featured" : "") +
      (uiState.caseOpen && p.case_study ? " open" : "") +
    '">' +
    head +
    '<h3 class="project-title">' + L(p.title, lang) + "</h3>" +
    '<p class="project-text">' + L(p.desc, lang) + "</p>" +
    caseStudyHtml +
    chipRow(p.tags) +
    '<div class="project-actions">' + toggleHtml + linkHtml + noteHtml + "</div>" +
    "</article>";
};

const renderProjects = function (lang) {
  projectList.innerHTML = DATA.projects.map(function (p) {
    const visible = uiState.filter === "all" || uiState.filter === p.category;
    return '<li class="project-item' + (visible ? " active" : "") + '" data-filter-item data-category="' + p.category + '">' +
      buildProjectCard(p, lang) +
      "</li>";
  }).join("");
};

/*-----------------------------------*\
  language engine (EN / FA)
\*-----------------------------------*/

const langBtns = document.querySelectorAll("[data-lang]");

const applyLang = function (lang) {
  const dict = I18N[lang];

  rootEl.setAttribute("lang", lang);
  rootEl.setAttribute("dir", lang === "fa" ? "rtl" : "ltr");

  /* chrome strings: elements hold data-i18n KEYS with empty bodies */
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    const key = el.dataset.i18n;
    if (dict[key] != null) el.innerHTML = dict[key];
  });

  document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
    const key = el.dataset.i18nAria;
    if (dict[key]) el.setAttribute("aria-label", dict[key]);
  });

  langBtns.forEach(function (b) {
    const active = b.dataset.lang === lang;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", active ? "true" : "false");
  });

  /* content sections (state-aware: filter + case-study open survive) */
  renderContacts(lang);
  renderSocials(lang);
  renderAbout(lang);
  renderResume(lang);
  renderFilters(lang);
  renderProjects(lang);

  /* re-render the engineering logs in the current language */
  renderLogs();

  document.title = dict.meta_title;

  try { localStorage.setItem("lang", lang); } catch (e) { }
};

langBtns.forEach(function (b) {
  b.addEventListener("click", function () { applyLang(b.dataset.lang); });
});

/*-----------------------------------*\
  engineering logs (Telegram feed)
\*-----------------------------------*/

const TELEGRAM_CHANNEL = "https://t.me/KhanAcademyy";

/* RSSHub instances, tried in order until one resolves.
   rsshub.app is rate-limiting public usage (403 since 2026-08);
   rsshub.rssforever.com verified reachable 2026-09-25 (HTTP 200). */
const TELEGRAM_RSS_HUBS = [
  "https://rsshub.rssforever.com/telegram/channel/KhanAcademyy",
  "https://rsshub.rssforever.com/telegram/channel/KhanAcademyy?limit=10",
  "https://rsshub.app/telegram/channel/KhanAcademyy"
];

const logsGrid = document.querySelector("[data-logs-grid]");

let logsStatus = "loading";   /* "loading" | "ready" | "empty" */
let logsItems = [];

/* only *.t.me links are acceptable post targets */
const normalizeTelegramUrl = function (link) {
  try {
    const u = new URL(link);
    if (!u.hostname.endsWith("t.me") && !u.hostname.endsWith("telegram.me")) {
      return TELEGRAM_CHANNEL;
    }
    return u.href.replace("/s/", "/");
  } catch (e) {
    return TELEGRAM_CHANNEL;
  }
};

const parseLogItem = function (item) {
  const rawDesc = item.description || item.content || "";

  /* quoted replies carry the ORIGINAL post inside .rsshub-quote — drop it so
     the card title/excerpt come from the reply text, not the quoted post */
  const html = rawDesc
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<div class="rsshub-quote">[\s\S]*?<\/div>/gi, "");
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = div.textContent.replace(/ /g, " ").trim();

  /* no strict hashtag filter — every post with readable text is a log;
     drop only fully empty / media-only entries */
  const fallbackTitle = (item.title || "").trim();
  if (!text && !fallbackTitle) return null;

  /* strip rsshub media markers, then split into lines */
  const lines = text.split("\n")
    .map(function (l) { return l.replace(/^(Photo|Video)\s+/i, "").trim(); })
    .filter(Boolean);

  const truncate = function (s, n) {
    return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
  };

  /* first line = title (skipping the channel / "Forwarded From" signature
     lines rsshub prepends, so titles are the post's own first sentence) */
  const titleLines = lines.filter(function (l) {
    return !/^(Khan Academy!|Forwarded From)[:：]/.test(l);
  });
  const title = truncate((titleLines[0] || lines[0] || fallbackTitle || "Log").trim(), 90);

  const rest = lines.slice(1).join(" ").trim();
  const excerpt = truncate((rest || text).replace(/\s+/g, " ").slice(0, 220), 220);

  /* hashtags → chips; default #Log chip when the post has none */
  const hashtags = (text + " " + fallbackTitle).match(/#[\p{L}\p{N}_]+/gu) || [];
  const uniqueTags = Array.from(new Set(hashtags.map(function (t) { return t.replace(/^#/, ""); })));
  const tags = uniqueTags.length > 0 ? uniqueTags.slice(0, 5) : ["Log"];

  /* rss2json pubDate is "YYYY-MM-DD HH:MM:SS" (no timezone) — Safari's
     Date parser rejects the space separator, so normalize to ISO "T" */
  const rawDate = String(item.pubDate || "").trim().replace(" ", "T");
  const date = new Date(rawDate);
  const reading = Math.max(1, Math.round(text.split(/\s+/).length / 200));

  /* media-only posts ("Photo" / "Video" with no readable body) are dropped */
  if (!excerpt && /^(photo|video)$/i.test(title.trim())) return null;

  return {
    title: title,
    excerpt: excerpt,
    tags: tags,
    url: normalizeTelegramUrl(item.link),
    date: isNaN(date.getTime()) ? null : date,
    reading: reading
  };
};

const buildLogCard = function (item, lang) {
  const dict = I18N[lang];
  const card = document.createElement("article");
  card.className = "logs-card";

  const meta = document.createElement("div");
  meta.className = "logs-meta";

  if (item.date) {
    const time = document.createElement("time");
    time.dateTime = item.date.toISOString();

    if (lang === "fa") {
      /* Manual Jalali formatting: extract day/month/year separately so the
         output is always day-month-year with proper Persian numerals,
         regardless of browser locale ordering quirks. */
      const parts = item.date.toLocaleDateString("fa-IR", {
        year: "numeric", month: "numeric", day: "numeric"
      }).split("/").map(function (s) { return s.trim(); });
      const monthName = item.date.toLocaleDateString("fa-IR", { month: "long" })
        .replace(/\s*\d+.*$/, "");       /* strip trailing digits if any */
      const persianDigits = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
      var toFa = function (s) {
        return String(s).replace(/\d/g, function (d) { return persianDigits[d]; });
      };
      time.textContent = toFa(parts[2]) + " " + monthName + " " + toFa(parts[0]);
    } else {
      time.textContent = item.date.toLocaleDateString("en-GB", {
        year: "numeric", month: "short", day: "numeric"
      });
    }

    meta.appendChild(time);
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.setAttribute("aria-hidden", "true");
    meta.appendChild(dot);
  }

  const reading = document.createElement("span");
  reading.textContent = lang === "fa"
    ? "مطالعهٔ " + item.reading + " دقیقه‌ای"
    : item.reading + " min read";
  meta.appendChild(reading);

  const badge = document.createElement("a");
  badge.className = "logs-badge";
  badge.href = TELEGRAM_CHANNEL;
  badge.target = "_blank";
  badge.rel = "noopener noreferrer";
  badge.textContent = "t.me/KhanAcademyy";
  meta.appendChild(badge);

  const title = document.createElement("h4");
  title.className = "logs-title";
  title.setAttribute("dir", "auto");   /* Persian → RTL, English snippets → LTR */
  title.textContent = item.title;

  const excerpt = document.createElement("p");
  excerpt.className = "logs-excerpt";
  excerpt.setAttribute("dir", "auto");   /* Persian → RTL, English snippets → LTR */
  excerpt.textContent = item.excerpt;

  const tags = document.createElement("ul");
  tags.className = "tag-row";
  item.tags.forEach(function (t) {
    const li = document.createElement("li");
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = "#" + t;
    li.appendChild(chip);
    tags.appendChild(li);
  });

  const actions = document.createElement("div");
  actions.className = "logs-card-actions";
  const btn = document.createElement("a");
  btn.className = "btn btn--ghost";
  btn.href = item.url;
  btn.target = "_blank";
  btn.rel = "noopener noreferrer";
  const label = document.createElement("span");
  label.textContent = dict.logs_read;
  const arrow = document.createElement("ion-icon");
  arrow.setAttribute("name", "arrow-forward-outline");
  arrow.className = "btn-arrow";
  btn.appendChild(label);
  btn.appendChild(arrow);
  actions.appendChild(btn);

  card.appendChild(meta);
  card.appendChild(title);
  card.appendChild(excerpt);
  card.appendChild(tags);
  card.appendChild(actions);

  return card;
};

const renderLogs = function () {
  if (!logsGrid) return;
  const lang = curLang();
  logsGrid.textContent = "";

  if (logsStatus === "loading") {
    for (let i = 0; i < 4; i++) {
      const s = document.createElement("div");
      s.className = "skeleton-card";
      s.setAttribute("aria-hidden", "true");
      s.innerHTML =
        '<div class="skel skel-meta" style="width:45%"></div>' +
        '<div class="skel skel-title" style="width:75%"></div>' +
        '<div class="skel skel-line"></div>' +
        '<div class="skel skel-line" style="width:85%"></div>' +
        '<div class="skel skel-line" style="width:55%"></div>' +
        '<div class="skel skel-chips" style="width:60%"></div>';
      logsGrid.appendChild(s);
    }
    return;
  }

  if (logsStatus === "empty") {
    const empty = document.createElement("p");
    empty.className = "logs-empty";
    empty.textContent = I18N[lang].logs_empty;
    logsGrid.appendChild(empty);
    return;
  }

  logsItems.forEach(function (item) {
    logsGrid.appendChild(buildLogCard(item, lang));
  });
};

const fetchTelegramLogs = async function () {
  let lastError = null;
  let lastEmpty = null;   /* first successful payload even if it had 0 matches */

  for (const hub of TELEGRAM_RSS_HUBS) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, 20000);

    try {
      /* cache-bust: rss2json rejects unknown TOP-LEVEL params (422), so the
         timestamp goes INSIDE rss_url — it also busts the RSSHub instance's
         own cache key, forcing a fresh Telegram scrape per load */
      const url = "https://api.rss2json.com/v1/api.json?rss_url=" +
        encodeURIComponent(hub + "?_t=" + Date.now());

      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (!data || data.status !== "ok" || !Array.isArray(data.items)) {
        throw new Error("invalid payload from " + hub);
      }

      const parsed = data.items.map(parseLogItem).filter(Boolean);

      if (parsed.length === 0) {
        console.warn("[Telegram Logs] No readable posts in this copy — the feed layer may still be catching up.");
        lastEmpty = parsed;
        continue;   /* try the next hub — a fresher copy may include the posts */
      }

      /* newest first */
      parsed.sort(function (a, b) {
        return (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0);
      });

      return parsed;
    } catch (e) {
      lastError = e;
      console.warn("[Telegram Logs] Hub failed:", hub, e);
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastEmpty) return lastEmpty;

  throw lastError || new Error("all RSS hubs failed");
};

const loadLogs = async function () {
  logsStatus = "loading";
  renderLogs();
  try {
    logsItems = await fetchTelegramLogs();   /* already parsed: readable posts, newest first */
    logsStatus = logsItems.length > 0 ? "ready" : "empty";
  } catch (e) {
    console.warn("[Telegram Logs] Feed unavailable — showing empty state:", e);
    logsStatus = "empty";
  }
  renderLogs();
};

loadLogs();

/*-----------------------------------*\
  sidebar toggle (mobile)
\*-----------------------------------*/

const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

sidebarBtn.addEventListener("click", function () {
  sidebar.classList.toggle("active");
});

/*-----------------------------------*\
  page navigation (About / Resume / Portfolio / Logs)
\*-----------------------------------*/

const navLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

navLinks.forEach(function (link) {
  link.addEventListener("click", function () {

    const target = link.dataset.navTarget;

    navLinks.forEach(function (l) {
      const isActive = (l === link);
      l.classList.toggle("active", isActive);
      if (isActive) {
        l.setAttribute("aria-current", "page");
      } else {
        l.removeAttribute("aria-current");
      }
    });

    pages.forEach(function (p) {
      p.classList.toggle("active", p.dataset.page === target);
    });

    window.scrollTo(0, 0);

  });
});

/*-----------------------------------*\
  portfolio filtering (mobile select + desktop chips)
  Options are rendered from DATA.filters into both UIs — one source,
  so the mobile select and desktop chips can never drift apart.
\*-----------------------------------*/

const setFilter = function (value) {
  uiState.filter = value;
  renderFilters(curLang());

  projectList.querySelectorAll("[data-filter-item]").forEach(function (item) {
    item.classList.toggle("active", value === "all" || value === item.dataset.category);
  });
};

select.addEventListener("click", function () {
  select.classList.toggle("active");
});

/* delegated: filter option nodes are re-created on every language switch */
selectList.addEventListener("click", function (event) {
  const btn = event.target.closest("[data-select-item]");
  if (!btn) return;
  setFilter(btn.dataset.filterValue || "all");
  select.classList.remove("active");
});

filterList.addEventListener("click", function (event) {
  const btn = event.target.closest("[data-filter-btn]");
  if (!btn) return;
  setFilter(btn.dataset.filterValue || "all");
});

/* close mobile select on outside click */
document.addEventListener("click", function (event) {
  if (select.classList.contains("active") && !select.parentElement.contains(event.target)) {
    select.classList.remove("active");
  }
});

/*-----------------------------------*\
  copy-to-clipboard micro-interaction (delegated — contacts re-render on lang switch)
\*-----------------------------------*/

contactsList.addEventListener("click", function (event) {
  const btn = event.target.closest("[data-copy]");
  if (!btn) return;

  const text = btn.dataset.copy;

  const writeClipboard = function () {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // fallback for older browsers / non-secure contexts (e.g. local files)
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return Promise.resolve();
  };

  writeClipboard().then(function () {
    btn.classList.add("copied");
    clearTimeout(btn._copyTimer);
    btn._copyTimer = setTimeout(function () {
      btn.classList.remove("copied");
    }, 1600);
  });

});

/*-----------------------------------*\
  collapsible case study (Ravin "Read More", delegated)
\*-----------------------------------*/

projectList.addEventListener("click", function (event) {
  const toggle = event.target.closest("[data-case-toggle]");
  if (!toggle) return;

  uiState.caseOpen = !uiState.caseOpen;

  const card = toggle.closest(".project-card");
  card.classList.toggle("open", uiState.caseOpen);
  toggle.setAttribute("aria-expanded", uiState.caseOpen ? "true" : "false");
  toggle.querySelector(".case-toggle-label").textContent =
    I18N[curLang()][uiState.caseOpen ? "case_show_less" : "case_read_more"];
});

/* sync UI with the boot-time language (from the inline <head> script).
   Runs last so every renderer above (incl. the logs engine) is initialized. */
applyLang(curLang());
