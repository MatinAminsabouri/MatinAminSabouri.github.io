'use strict';

/*-----------------------------------*\
  script.js — behaviour only.
  ALL copy lives in assets/js/data.js (window.SITE_DATA); markup comes
  from assets/js/render.js so the build script can prerender the exact
  same HTML. This file binds events and owns UI state.
\*-----------------------------------*/

const DATA = window.SITE_DATA;
const I18N = DATA.i18n;
const R = window.SITE_RENDER;

const rootEl = document.documentElement;

const curLang = function () {
  return rootEl.getAttribute("lang") === "fa" ? "fa" : "en";
};

/*-----------------------------------*\
  theme engine (light / dark)
\*-----------------------------------*/

const themeToggle = document.querySelector("[data-theme-toggle]");
const themeMeta = document.querySelector('meta[name="theme-color"]');

const syncThemeToggle = function () {
  if (!themeToggle) return;
  const theme = rootEl.getAttribute("data-theme");
  const t = I18N[curLang()];
  /* aria-pressed reports the state the button switches TO (dark is the
     default surface), so assistive tech announces the action correctly */
  themeToggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
  themeToggle.setAttribute("aria-label", theme === "light" ? t.a_theme_dark : t.a_theme_light);
};

const applyTheme = function (theme) {
  rootEl.setAttribute("data-theme", theme);
  try { localStorage.setItem("theme", theme); } catch (e) { }
  if (themeMeta) themeMeta.setAttribute("content", theme === "light" ? "#F8FAFC" : "#070B12");
  syncThemeToggle();
};

if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    applyTheme(rootEl.getAttribute("data-theme") === "light" ? "dark" : "light");
  });
}

/* follow system preference only while the user hasn't chosen explicitly */
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
  let stored = null;
  try { stored = localStorage.getItem("theme"); } catch (err) { }
  if (!stored) applyTheme(e.matches ? "dark" : "light");
});

/*-----------------------------------*\
  element refs
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
const logsGrid = document.querySelector("[data-logs-grid]");
const logsStatusEl = document.querySelector("[data-logs-status]");

/* interaction state preserved across re-renders (language switches) */
const uiState = { filter: "all", caseOpen: false, page: "about" };

const PAGES = ["about", "resume", "portfolio", "logs"];

/*-----------------------------------*\
  renderers
\*-----------------------------------*/

const renderContacts = function (lang) {
  contactsList.innerHTML = R.renderContacts(DATA, lang, I18N[lang]);
};

const renderSocials = function (lang) {
  socialsList.innerHTML = R.renderSocials(DATA, lang);
};

const renderAbout = function (lang) {
  aboutBody.innerHTML = R.renderAbout(DATA, lang, I18N[lang]);
};

const renderResume = function (lang) {
  resumeBody.innerHTML = R.renderResume(DATA, lang, I18N[lang]);
};

const renderFilters = function (lang) {
  selectList.innerHTML = R.renderSelectOptions(DATA, lang, uiState.filter);
  filterList.innerHTML = R.renderFilterChips(DATA, lang, uiState.filter);

  const active = DATA.filters.find(function (f) { return f.value === uiState.filter; }) || DATA.filters[0];
  selectValue.textContent = R.L(active.label, lang);
};

const renderProjects = function (lang) {
  projectList.innerHTML = R.renderProjects(DATA, lang, I18N[lang], {
    filter: uiState.filter,
    caseOpen: uiState.caseOpen
  });
};

/*-----------------------------------*\
  language engine (EN / FA)
\*-----------------------------------*/

const langBtns = document.querySelectorAll("[data-lang]");

const syncUrl = function (lang) {
  const url = new URL(location.href);
  if (lang === "fa") url.searchParams.set("lang", "fa");
  else url.searchParams.delete("lang");
  url.hash = uiState.page === "about" ? "" : uiState.page;
  history.replaceState({ page: uiState.page, lang: lang }, "", url);
};

const applyLang = function (lang, options) {
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
  renderLogs();
  setLogsStatus(logsStatusText(lang));

  document.title = dict.meta_title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc && dict.meta_desc) desc.setAttribute("content", dict.meta_desc);

  syncThemeToggle();
  if (!options || options.updateUrl !== false) syncUrl(lang);

  try { localStorage.setItem("lang", lang); } catch (e) { }
};

langBtns.forEach(function (b) {
  b.addEventListener("click", function () { applyLang(b.dataset.lang); });
});

/*-----------------------------------*\
  notes — local JSON, synced at build time

  assets/data/notes.json is written by `npm run sync:notes` (a GitHub
  Action runs it on a schedule). Loading it locally means: no CORS, no
  third-party RSS proxy, no 20s hang when Telegram is unreachable.
  If the file is missing or empty, SITE_DATA.notes is used.
\*-----------------------------------*/

const NOTES_URL = "./assets/data/notes.json";

const staticNotes = ((DATA.notes && DATA.notes.posts) || []).map(function (p) {
  return R.normalizeNote(p, curLang());
});

let logsItems = staticNotes;
let logsSource = staticNotes.length ? "fallback" : "empty";   /* fallback | live | empty */
let logsBusy = false;
let logsSyncedAt = null;   /* ISO timestamp from notes.json */
let logsFromFallback = false;

const setLogsStatus = function (message) {
  if (logsStatusEl) logsStatusEl.textContent = message || "";
};

/* "synced 12 minutes ago" is the honest signal here: the file is
   regenerated by CI, so the status line can only say how fresh the
   published copy is, not fetch Telegram itself. */
const describeAge = function (iso, lang) {
  const when = new Date(iso);
  if (isNaN(when.getTime())) return "";

  const t = I18N[lang];
  const num = function (n) { return lang === "fa" ? R.persianDigits(n) : String(n); };
  const pick = function (key, n) { return t[key].replace("{n}", num(n)); };

  const minutes = Math.max(0, Math.round((Date.now() - when.getTime()) / 60000));

  if (minutes < 2) return t.logs_synced_just_now;
  if (minutes < 60) return pick("logs_synced_min", minutes);

  const hours = Math.round(minutes / 60);
  if (hours < 24) return pick(hours === 1 ? "logs_synced_hour" : "logs_synced_hours", hours);

  const days = Math.round(hours / 24);
  return pick(days === 1 ? "logs_synced_day" : "logs_synced_days", days);
};

const renderLogs = function () {
  if (!logsGrid) return;

  if (!logsItems.length) {
    logsGrid.innerHTML = '<p class="logs-empty">' + R.esc(I18N[curLang()].logs_empty) + "</p>";
    return;
  }

  logsGrid.innerHTML = logsItems.map(function (item) {
    return R.renderNoteCard(item, curLang(), I18N[curLang()]);
  }).join("");
};

/* Fallback copies of notes.json, tried only when the local file has never
   been synced. This exists for local development: the dev machine may be
   behind a network that blocks Telegram, while CI regenerates the published
   file hourly. On the live site the local file IS the published file, so no
   cross-origin request is ever made there.

   raw.githubusercontent sends Access-Control-Allow-Origin: *, so this works
   cross-origin. */
const NOTES_REMOTE_URLS = [
  "https://raw.githubusercontent.com/MatinAminsabouri/MatinAminSabouri.github.io/main/assets/data/notes.json",
  "https://matinaminsabouri.github.io/assets/data/notes.json"
];

const IS_PRODUCTION = /(^|\.)matinaminsabouri\.github\.io$/.test(location.hostname);

const parseNotesPayload = function (data) {
  const posts = Array.isArray(data) ? data : (data && data.posts);
  if (!Array.isArray(posts) || !posts.length) throw new Error("empty notes file");

  /* "source" tells the UI whether this data ever came from Telegram:
     "fallback" means it was seeded from data.js and never synced, so we
     must not claim freshness */
  const source = (data && data.source) || "telegram";
  return {
    posts: posts,
    syncedAt: source === "fallback" ? null : ((data && data.updated) || null),
    fromFallback: source === "fallback"
  };
};

const fetchJson = async function (url) {
  const res = await fetch(url + (url.indexOf("?") === -1 ? "?" : "&") + "_t=" + Date.now(), {
    cache: "no-store"
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
};

const loadNotes = async function () {
  const local = await fetchJson(NOTES_URL);
  const parsed = parseNotesPayload(local);

  /* a local fallback copy means "never synced". Only a development origin
     may reach for the published file; the live site never makes an extra
     request, so it stays dependency-free and console-clean. */
  if (!parsed.fromFallback || IS_PRODUCTION) return parsed;

  for (const url of NOTES_REMOTE_URLS) {
    try {
      const remote = parseNotesPayload(await fetchJson(url));
      if (!remote.fromFallback) {
        console.info("[Notes] local copy is unsynced; using published notes from", new URL(url).host);
        return remote;
      }
    } catch (e) {
      console.info("[Notes] published notes not available at", new URL(url).host);
    }
  }

  return parsed;
};

const applyNotes = function (parsed) {
  logsItems = parsed.posts.map(function (p) { return R.normalizeNote(p, curLang()); });
  logsSyncedAt = parsed.syncedAt;
  logsFromFallback = parsed.fromFallback;
  logsSource = logsItems.length ? "live" : "empty";
};

const logsStatusText = function (lang) {
  const t = I18N[lang];
  if (logsSource === "empty") return t.logs_empty;

  if (logsFromFallback) return t.logs_static;

  const age = logsSyncedAt ? describeAge(logsSyncedAt, lang) : "";
  return age || t.logs_live;
};

const loadLogs = async function () {
  if (logsBusy) return;
  logsBusy = true;

  try {
    applyNotes(await loadNotes());
  } catch (e) {
    logsSource = staticNotes.length ? "fallback" : "empty";
    logsSyncedAt = null;
    logsFromFallback = true;
  } finally {
    logsBusy = false;
    setLogsStatus(logsStatusText(curLang()));
    renderLogs();
  }
};

/* Keep the tab honest about *when* it was last synced: the page can only
   show the published JSON it was built with, so the age of the data is
   always on screen. */
const refreshLogsStatusClock = function () {
  if (!logsStatusEl || !logsSyncedAt) return;
  logsStatusEl.textContent = logsStatusText(curLang());
};

setInterval(refreshLogsStatusClock, 60000);

/*-----------------------------------*\
  sidebar toggle (mobile)
\*-----------------------------------*/

const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

if (sidebarBtn) {
  sidebarBtn.addEventListener("click", function () {
    const open = sidebar.classList.toggle("active");
    sidebarBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

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
/* body width changes whenever the viewport crosses the breakpoint —
   ResizeObserver fires even where window/matchMedia events don't */
new ResizeObserver(placeControls).observe(document.body);

/*-----------------------------------*\
  page navigation (About / Resume / Portfolio / Logs)

  Pages are addressable: #resume, #portfolio, #logs. Browser back/forward
  work, links can be shared, and each page exposes its own title.
\*-----------------------------------*/

const navLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

const pageFromHash = function () {
  const h = (location.hash || "").replace("#", "");
  return PAGES.indexOf(h) !== -1 ? h : "about";
};

const showPage = function (page, options) {
  uiState.page = page;

  navLinks.forEach(function (l) {
    const isActive = l.dataset.navTarget === page;
    l.classList.toggle("active", isActive);
    if (isActive) {
      l.setAttribute("aria-current", "page");
    } else {
      l.removeAttribute("aria-current");
    }
  });

  pages.forEach(function (p) {
    p.classList.toggle("active", p.dataset.page === page);
  });

  const lang = curLang();
  document.title = I18N[lang].meta_title;

  if (!options || options.scroll !== false) {
    window.scrollTo(0, 0);
  }

  if (!options || options.focus !== false) {
    const article = document.querySelector('article[data-page="' + page + '"]');
    if (article) article.focus({ preventScroll: true });
  }

  if (!options || options.history !== false) {
    const url = new URL(location.href);
    url.hash = page === "about" ? "" : page;
    history.pushState({ page: page }, "", url);
  }

  syncUrl(lang);
};

navLinks.forEach(function (link) {
  link.addEventListener("click", function () {
    const target = link.dataset.navTarget;
    if (target === uiState.page) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    showPage(target);
  });
});

window.addEventListener("popstate", function (event) {
  const page = (event.state && event.state.page) || pageFromHash();
  showPage(page, { history: false, focus: false });
});

/*-----------------------------------*\
  portfolio filtering (mobile select + desktop chips)
\*-----------------------------------*/

const closeSelect = function () {
  if (!select) return;
  select.classList.remove("active");
  select.setAttribute("aria-expanded", "false");
};

const setFilter = function (value) {
  uiState.filter = value;
  renderFilters(curLang());

  projectList.querySelectorAll("[data-filter-item]").forEach(function (item) {
    item.classList.toggle("active", value === "all" || value === item.dataset.category);
  });
};

if (select) {
  select.addEventListener("click", function () {
    const open = select.classList.toggle("active");
    select.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

/* delegated: filter option nodes are re-created on every language switch */
selectList.addEventListener("click", function (event) {
  const btn = event.target.closest("[data-select-item]");
  if (!btn) return;
  setFilter(btn.dataset.filterValue || "all");
  closeSelect();
  if (select) select.focus();
});

filterList.addEventListener("click", function (event) {
  const btn = event.target.closest("[data-filter-btn]");
  if (!btn) return;
  setFilter(btn.dataset.filterValue || "all");
});

/* close mobile select on outside click / Escape */
document.addEventListener("click", function (event) {
  if (select && select.classList.contains("active") && !select.parentElement.contains(event.target)) {
    closeSelect();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && select && select.classList.contains("active")) {
    closeSelect();
    select.focus();
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
  lightbox — avatar enlargement
\*-----------------------------------*/

const avatarTrigger = document.querySelector("[data-avatar-trigger]");
const lightbox = document.getElementById("avatarLightbox");
const lightboxImg = lightbox ? lightbox.querySelector(".lightbox-img") : null;
const lightboxCaption = lightbox ? lightbox.querySelector(".lightbox-caption") : null;
const lightboxClose = lightbox ? lightbox.querySelector(".lightbox-close") : null;
const lightboxBackdrop = lightbox ? lightbox.querySelector(".lightbox-backdrop") : null;

let lastFocusedElement = null;

const handleLightboxKeydown = function (event) {
  if (event.key === "Escape") {
    closeLightbox();
    return;
  }

  /* focus trap - Tab and Shift+Tab */
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

const openLightbox = function () {
  if (!lightbox || !lightboxImg || !avatarTrigger) return;

  lastFocusedElement = document.activeElement;

  const img = avatarTrigger.querySelector("img");
  lightboxImg.src = img.currentSrc || img.src;
  lightboxImg.alt = img.alt || "";
  lightboxCaption.textContent = img.alt || "";

  lightbox.hidden = false;
  document.body.style.overflow = "hidden";

  /* focus the close button synchronously: a timer here loses the race with
     the visibility transition and focus silently stays behind the dialog */
  if (lightboxClose) lightboxClose.focus();

  document.addEventListener("keydown", handleLightboxKeydown);
};

function closeLightbox() {
  if (!lightbox) return;

  lightbox.hidden = true;
  document.body.style.overflow = "";
  lightboxImg.removeAttribute("src");

  document.removeEventListener("keydown", handleLightboxKeydown);

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

if (avatarTrigger && lightbox) {
  avatarTrigger.addEventListener("click", openLightbox);
}

if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
if (lightboxBackdrop) lightboxBackdrop.addEventListener("click", closeLightbox);

if (lightbox) {
  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) closeLightbox();
  });
}

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

/*-----------------------------------*\
  boot — sync UI with the URL/boot-time language, then hydrate notes
\*-----------------------------------*/

applyLang(curLang(), { updateUrl: false });
showPage(pageFromHash(), { history: false, focus: false, scroll: false });
loadLogs(false);
