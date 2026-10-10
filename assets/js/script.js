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
const TELEGRAM_CHANNEL_PREVIEW = "https://t.me/s/KhanAcademyy";

/* RSSHub feed URLs for the channel, tried in order until one resolves.
   The https:// scheme is kept separate so the URL can be rebuilt safely
   even when a hub path already carries its own query string. */
const TELEGRAM_FEED_PATHS = [
  { host: "https://rsshub.rssforever.com", path: "/telegram/channel/KhanAcademyy" },
  { host: "https://rsshub.rssforever.com", path: "/telegram/channel/@KhanAcademyy" },
  { host: "https://rsshub.app", path: "/telegram/channel/KhanAcademyy" },
  { host: "https://rsshub.app", path: "/telegram/channel/@KhanAcademyy" }
];

const logsGrid = document.querySelector("[data-logs-grid]");
const logsRefreshBtn = document.querySelector("[data-logs-refresh]");

const truncateText = function (s, n) {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
};

/* Fallback notes from SITE_DATA.notes — rendered instantly so the tab is
   never empty; a successful live fetch below replaces them automatically. */
const staticNotes = ((DATA.notes && DATA.notes.posts) || []).map(function (p) {
  const text = p.text.replace(/\s+/g, " ").trim();
  const date = new Date(p.date);
  return {
    title: p.title,
    excerpt: truncateText(text, 220),
    tags: p.tags,
    url: p.url,
    badgeUrl: p.url,
    date: isNaN(date.getTime()) ? null : date,
    reading: Math.max(1, Math.round(text.split(/\s+/).length / 200))
  };
});

let logsStatus = staticNotes.length ? "ready" : "loading";   /* "loading" | "ready" | "empty" */
let logsItems = staticNotes;
let lastFetchTime = 0;
const FETCH_COOLDOWN = 30000; // 30 seconds cooldown between manual refreshes

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

  /* first line = title (skipping the channel / "Forwarded From" signature
     lines rsshub prepends, so titles are the post's own first sentence) */
  const titleLines = lines.filter(function (l) {
    return !/^(Khan Academy!|Forwarded From)[:：]/.test(l);
  });
  const title = truncateText((titleLines[0] || lines[0] || fallbackTitle || "Log").trim(), 90);

  const rest = lines.slice(1).join(" ").trim();
  const excerpt = truncateText((rest || text).replace(/\s+/g, " ").slice(0, 220), 220);

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
  badge.href = item.badgeUrl || TELEGRAM_CHANNEL;
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

/* Fetch one RSSHub feed through rss2json and return parsed posts.
   Returns [] when the endpoint resolves but has no readable posts,
   and throws when the endpoint itself failed. */
const tryRssHubFeed = async function (host, path) {
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, 25000);

  try {
    /* cache-bust: timestamp inside rss_url busts both rss2json and RSSHub
       caches. "?" vs "&" is chosen based on the path's own query string —
       a second "?" produces an invalid URL the fetch layer rejects. */
    const feedUrl = host + path +
      (path.indexOf("?") === -1 ? "?" : "&") + "_t=" + Date.now();
    const url = "https://api.rss2json.com/v1/api.json?rss_url=" +
      encodeURIComponent(feedUrl);

    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!data || data.status !== "ok" || !Array.isArray(data.items)) {
      throw new Error("invalid payload: " + (data && data.message ? data.message : "unknown"));
    }

    return data.items.map(parseLogItem).filter(Boolean);
  } finally {
    clearTimeout(timer);
  }
};

const fetchTelegramLogs = async function () {
  let lastError = null;
  let sawEmptyFeed = false;

  for (const feed of TELEGRAM_FEED_PATHS) {
    try {
      const parsed = await tryRssHubFeed(feed.host, feed.path);

      if (parsed.length === 0) {
        console.warn("[Telegram Logs] No readable posts from:", feed.host + feed.path);
        sawEmptyFeed = true;
        continue;   /* try the next feed — a fresher copy may include the posts */
      }

      /* newest first, take latest 10 */
      parsed.sort(function (a, b) {
        return (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0);
      });

      console.log("[Telegram Logs] Successfully fetched", parsed.length, "posts from:", feed.host + feed.path);
      lastFetchTime = Date.now();
      return parsed.slice(0, 10);
    } catch (e) {
      lastError = e;
      console.warn("[Telegram Logs] Feed failed:", feed.host + feed.path, e.message || e);
    }
  }

  /* As a last resort, try scraping the Telegram web preview page directly */
  try {
    const directPosts = await fetchTelegramPreviewDirect();
    if (directPosts && directPosts.length > 0) {
      console.log("[Telegram Logs] Fallback to direct preview worked:", directPosts.length, "posts");
      lastFetchTime = Date.now();
      return directPosts.slice(0, 10);
    }
  } catch (e) {
    console.warn("[Telegram Logs] Direct preview fallback failed:", e.message || e);
  }

  if (sawEmptyFeed) return [];

  throw lastError || new Error("all Telegram feeds failed");
};

/* Direct fetch from Telegram web preview (t.me/s/channel) — no API key needed.
   Parses the HTML for message bubbles. Used as last-resort fallback. */
const fetchTelegramPreviewDirect = async function () {
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, 20000);

  try {
    const res = await fetch(TELEGRAM_CHANNEL_PREVIEW + "?_t=" + Date.now(), {
      signal: controller.signal,
      headers: { "Accept": "text/html,application/xhtml+xml" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const html = await res.text();

    /* Parse message bubbles from t.me/s/channel HTML */
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const messages = doc.querySelectorAll(".tgme_widget_message_wrap, .tgme_widget_message");

    const posts = [];
    messages.forEach(function (msgWrap) {
      const msg = msgWrap.querySelector(".tgme_widget_message") || msgWrap;
      const textEl = msg.querySelector(".tgme_widget_message_text");
      const dateEl = msg.querySelector(".tgme_widget_message_date time, .tgme_widget_message_date a time");
      const linkEl = msg.querySelector(".tgme_widget_message_date a, .tgme_widget_message_owner a");

      if (!textEl) return;

      const text = textEl.textContent.trim().replace(/\s+/g, " ");
      if (!text || text.length < 10) return; // skip very short/empty

      const dateStr = dateEl?.getAttribute("datetime") || dateEl?.textContent?.trim();
      const date = dateStr ? new Date(dateStr) : null;

      const link = linkEl?.href || TELEGRAM_CHANNEL;

      /* Extract hashtags */
      const hashtags = text.match(/#[\p{L}\p{N}_]+/gu) || [];
      const uniqueTags = Array.from(new Set(hashtags.map(function (t) { return t.replace(/^#/, ""); })));
      const tags = uniqueTags.length > 0 ? uniqueTags.slice(0, 5) : ["Log"];

      /* Title = first line, excerpt = rest */
      const lines = text.split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
      const title = truncateText(lines[0] || "Log", 90);
      const rest = lines.slice(1).join(" ").trim();
      const excerpt = truncateText((rest || text).slice(0, 220), 220);

      const reading = Math.max(1, Math.round(text.split(/\s+/).length / 200));

      posts.push({
        title: title,
        excerpt: excerpt,
        tags: tags,
        url: normalizeTelegramUrl(link),
        date: (date && !isNaN(date.getTime())) ? date : null,
        reading: reading
      });
    });

    return posts;
  } catch (e) {
    throw e;
  } finally {
    clearTimeout(timer);
  }
};

const loadLogs = async function (isManualRefresh = false) {
  /* Respect cooldown for manual refresh */
  if (isManualRefresh) {
    const now = Date.now();
    if (now - lastFetchTime < FETCH_COOLDOWN) {
      console.log("[Telegram Logs] Refresh cooldown active, skipping");
      return;
    }
    lastFetchTime = now;
  }

  const hasFallback = logsItems.length > 0;
  if (!hasFallback && !isManualRefresh) {
    logsStatus = "loading";
    renderLogs();
  }

  if (isManualRefresh && logsRefreshBtn) {
    logsRefreshBtn.classList.add("refreshing");
    logsRefreshBtn.disabled = true;
  }

  try {
    const live = await fetchTelegramLogs();
    if (live.length) {
      logsItems = live;
      logsStatus = "ready";
    } else if (hasFallback) {
      /* keep fallback if live fetch returned nothing */
      logsStatus = "ready";
    } else {
      logsStatus = "empty";
    }
  } catch (e) {
    console.warn("[Telegram Logs] Feed unavailable — keeping fallback notes:", e.message || e);
    if (hasFallback) logsStatus = "ready";
    else logsStatus = "empty";
  }

  if (isManualRefresh && logsRefreshBtn) {
    logsRefreshBtn.classList.remove("refreshing");
    logsRefreshBtn.disabled = false;
  }

  renderLogs();
};

/* Initial load */
loadLogs();

/* Expose manual refresh for the refresh button */
window.refreshTelegramLogs = function () { loadLogs(true); };

/*-----------------------------------*\
  sidebar toggle (mobile)
\*-----------------------------------*/

const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

sidebarBtn.addEventListener("click", function () {
  sidebar.classList.toggle("active");
});

/*-----------------------------------*\
  preferences placement — theme/lang controls join the nav pill on
  desktop (one cohesive header unit) and sit inside the sidebar card
  on mobile, so they never float alone as an island.
  Moving the node keeps its listeners, so buttons stay wired.
\*-----------------------------------*/

const controlsEl = document.querySelector(".controls");
const sidebarInfoEl = document.querySelector(".sidebar-info");
const desktopMQ = window.matchMedia("(min-width: 1024px)");

const placeControls = function () {
  if (!controlsEl || !sidebarInfoEl) return;
  const target = desktopMQ.matches
    ? document.querySelector(".navbar")
    : sidebarInfoEl;
  if (!target || controlsEl.parentElement === target) return;
  if (target === sidebarInfoEl) {
    target.insertBefore(controlsEl, sidebarBtn);   /* above "Show Contacts" */
  } else {
    target.appendChild(controlsEl);                /* after the nav list */
  }
};

placeControls();
desktopMQ.addEventListener("change", placeControls);
window.addEventListener("resize", placeControls);
/* body width changes whenever the viewport crosses the breakpoint —
   ResizeObserver fires even where window/matchMedia events don't */
new ResizeObserver(placeControls).observe(document.body);
/* belt-and-braces: some embedded webviews suppress every resize event;
   the check is a cheap no-op when nothing changed */
setInterval(placeControls, 1000);

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
  lightbox — Avatar enlargement
\*-----------------------------------*/

const avatarTrigger = document.querySelector("[data-avatar-trigger]");
const lightbox = document.getElementById("avatarLightbox");
const lightboxImg = lightbox ? lightbox.querySelector(".lightbox-img") : null;
const lightboxCaption = lightbox ? lightbox.querySelector(".lightbox-caption") : null;
const lightboxClose = lightbox ? lightbox.querySelector(".lightbox-close") : null;
const lightboxBackdrop = lightbox ? lightbox.querySelector(".lightbox-backdrop") : null;

let lastFocusedElement = null;

const openLightbox = function () {
  if (!lightbox || !lightboxImg) return;
  
  lastFocusedElement = document.activeElement;
  
  lightboxImg.src = avatarTrigger.src;
  lightboxImg.alt = avatarTrigger.alt;
  lightboxCaption.textContent = avatarTrigger.alt || "Profile picture";
  
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  
  // Focus management for accessibility
  setTimeout(function () {
    lightboxClose?.focus();
  }, 50);
  
  // Trap focus
  document.addEventListener("keydown", handleLightboxKeydown);
};

const closeLightbox = function () {
  if (!lightbox) return;
  
  lightbox.hidden = true;
  document.body.style.overflow = "";
  lightboxImg.src = "";
  
  document.removeEventListener("keydown", handleLightboxKeydown);
  
  // Restore focus
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
};

const handleLightboxKeydown = function (event) {
  if (event.key === "Escape") {
    closeLightbox();
  }
  
  // Focus trap - Tab and Shift+Tab
  if (event.key === "Tab") {
    const focusableElements = lightbox.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
};

// Event listeners
if (avatarTrigger && lightbox) {
  avatarTrigger.addEventListener("click", openLightbox);
  avatarTrigger.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox();
    }
  });
}

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

if (lightboxBackdrop) {
  lightboxBackdrop.addEventListener("click", closeLightbox);
}

// Close on backdrop click (outside the figure)
if (lightbox) {
  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
}

/*-----------------------------------*\
  logs refresh button (delegated — logs re-render on lang switch)
\*-----------------------------------*/

document.addEventListener("click", function (event) {
  const refreshBtn = event.target.closest("[data-logs-refresh]");
  if (refreshBtn) {
    window.refreshTelegramLogs();
  }
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
