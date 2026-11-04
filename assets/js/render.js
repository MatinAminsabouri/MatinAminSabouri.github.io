'use strict';

/*-----------------------------------*\
  render.js — pure renderers (no DOM, no events).

  Shared by two consumers so the markup can never drift:
    - browser: script.js calls these, then binds behaviour
    - build:   scripts/build.mjs calls these to prerender index.html

  TRUST BOUNDARY
  - SITE_DATA strings are author-written and may contain intentional
    <strong>/<a> markup → rendered as HTML on purpose.
  - Remote text (Telegram notes) is untrusted → always through esc().
\*-----------------------------------*/

(function (global) {
  'use strict';

  const esc = function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  /* resolve a content field: plain string (same in both languages)
     or bilingual object { en, fa } */
  const L = function (field, lang) {
    return typeof field === 'string' ? field : field[lang];
  };

  const icon = function (name, className) {
    return '<svg class="icon' + (className ? ' ' + className : '') +
      '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
  };

  /* the Telegram channel the notes are synced from */
  const CHANNEL_URL = 'https://t.me/KhanAcademyy';

  const chipRow = function (tags) {
    return '<ul class="tag-row">' +
      tags.map(function (t) { return '<li><span class="chip">' + esc(t) + '</span></li>'; }).join('') +
      '</ul>';
  };

  /*-----------------------------------*\
    sidebar
  \*-----------------------------------*/

  const renderContacts = function (data, lang, t) {
    return data.profile.contacts.map(function (c) {
      const valueHtml = c.href
        ? '<a href="' + esc(c.href) + '" class="contact-link">' + esc(c.text) + '</a>'
        : '<address>' + esc(L(c.address, lang)) + '</address>';

      const copyHtml = c.copy
        ? '<button class="copy-btn" type="button" data-copy="' + esc(c.copy) + '" aria-label="' + esc(t.a_copy_email) + '">' +
            icon('copy-outline', 'copy-ic') +
            icon('checkmark-outline', 'check-ic') +
            '<span class="copy-tooltip" aria-hidden="true">' + esc(t.copy_done) + '</span>' +
          '</button>'
        : '';

      return '<li class="contact-item">' +
        '<div class="icon-box">' + icon(c.icon) + '</div>' +
        '<div class="contact-info">' +
          '<p class="contact-title">' + esc(L(c.label, lang)) + '</p>' +
          valueHtml +
        '</div>' +
        copyHtml +
        '</li>';
    }).join('');
  };

  const renderSocials = function (data, lang) {
    return data.profile.socials.map(function (s) {
      return '<li class="social-item">' +
        '<a href="' + esc(s.href) + '" class="social-link" aria-label="' + esc(L(s.label, lang)) + '" rel="me">' +
          icon(s.icon) +
        '</a>' +
        '</li>';
    }).join('');
  };

  /*-----------------------------------*\
    about
  \*-----------------------------------*/

  const renderAbout = function (data, lang, t) {
    const a = data.about;
    const email = (data.profile.contacts.find(function (c) { return c.copy; }) || {}).href || "mailto:";

    return '<section class="about-text">' +
        a.bio.map(function (b) { return '<p>' + L(b, lang) + '</p>'; }).join('') +
      '</section>' +

      /* direct call to action: on mobile the contacts live behind an
         accordion, so the two things a recruiter wants are one tap away */
      '<div class="about-cta">' +
        '<a class="btn btn--primary" href="' + esc(email) + '">' +
          icon('mail-outline') +
          '<span>' + esc(t.about_cta_email) + '</span>' +
        '</a>' +
        '<a class="btn btn--ghost" href="./assets/MatinAminSabouri-Resume.pdf" target="_blank" rel="noopener noreferrer">' +
          icon('download-outline') +
          '<span>' + esc(t.about_cta_resume) + '</span>' +
        '</a>' +
      '</div>' +

      '<div class="stats">' +
        a.stats.map(function (s) {
          return '<div class="stat">' +
            '<span class="stat-value">' + L(s.value, lang) + '</span>' +
            '<span class="stat-label">' + esc(L(s.label, lang)) + '</span>' +
            '</div>';
        }).join('') +
      '</div>' +

      '<section class="service">' +
        '<h3 class="service-title">' + esc(t.doing_title) + '</h3>' +
        '<ul class="service-list">' +
          a.services.map(function (s) {
            return '<li class="service-item">' +
              '<div class="service-icon-box">' + icon(s.icon) + '</div>' +
              '<div class="service-content-box">' +
                '<h4 class="service-item-title">' + esc(L(s.title, lang)) + '</h4>' +
                '<p class="service-item-text">' + esc(L(s.text, lang)) + '</p>' +
              '</div>' +
              '</li>';
          }).join('') +
        '</ul>' +
      '</section>';
  };

  /*-----------------------------------*\
    resume
  \*-----------------------------------*/

  const renderResume = function (data, lang, t) {
    const r = data.resume;

    const timeline = function (iconName, title, itemsHtml) {
      return '<section class="timeline">' +
        '<div class="title-wrapper">' +
          '<div class="icon-box">' + icon(iconName) + '</div>' +
          '<h3 class="timeline-title">' + esc(title) + '</h3>' +
        '</div>' +
        '<ol class="timeline-list">' + itemsHtml + '</ol>' +
        '</section>';
    };

    const eduItems = r.education.map(function (e) {
      return '<li class="timeline-item">' +
        '<h4 class="timeline-item-title">' + esc(L(e.title, lang)) + '</h4>' +
        '<span>' + esc(e.period) + '</span>' +
        '<p class="timeline-text">' + esc(L(e.desc, lang)) + '</p>' +
        '</li>';
    }).join('');

    const expItems = r.experience.map(function (e) {
      return '<li class="timeline-item">' +
        '<h4 class="timeline-item-title">' + esc(L(e.role, lang)) + '</h4>' +
        '<span>' + esc(e.period) + '</span>' +
        '<p class="timeline-company">' + esc(L(e.company, lang)) + '</p>' +
        e.bullets.map(function (b) { return '<p class="timeline-text">' + L(b, lang) + '</p>'; }).join('') +
        '</li>';
    }).join('');

    const skills =
      '<section class="skills">' +
        '<h3 class="skills-title">' + esc(t.skills_title) + '</h3>' +
        r.skills.map(function (g) {
          return '<div class="skill-group">' +
            '<h4 class="skill-group-title">' + esc(L(g.title, lang)) + '</h4>' +
            chipRow(g.tags) +
            '</div>';
        }).join('') +
      '</section>';

    return timeline('book-outline', t.edu_title, eduItems) +
      timeline('briefcase-outline', t.exp_title, expItems) +
      skills;
  };

  /*-----------------------------------*\
    portfolio
  \*-----------------------------------*/

  const renderFilterChips = function (data, lang, active) {
    return data.filters.map(function (f) {
      const isActive = f.value === active;
      return '<li class="filter-item">' +
        '<button type="button" class="' + (isActive ? 'active' : '') + '" data-filter-btn data-filter-value="' + esc(f.value) + '"' +
          (isActive ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
          esc(L(f.label, lang)) +
        '</button>' +
        '</li>';
    }).join('');
  };

  const renderSelectOptions = function (data, lang, active) {
    return data.filters.map(function (f) {
      const isActive = f.value === active;
      return '<li class="select-item">' +
        '<button type="button" data-select-item data-filter-value="' + esc(f.value) + '"' +
          (isActive ? ' aria-current="true"' : '') + '>' + esc(L(f.label, lang)) + '</button>' +
        '</li>';
    }).join('');
  };

  const buildProjectCard = function (p, lang, t, caseOpen) {
    const badges = p.badges && p.badges.length
      ? '<div class="badge-row">' +
          p.badges.map(function (b) {
            return '<span class="badge badge--' + esc(b.tone) + '">' + esc(L(b.label, lang)) + '</span>';
          }).join('') +
        '</div>'
      : '';

    const head =
      '<div class="project-card-head">' +
        badges +
        '<span class="project-category">' + esc(L(p.category_label, lang)) + '</span>' +
      '</div>';

    let caseStudyHtml = '';
    let toggleHtml = '';

    if (p.case_study) {
      const cs = p.case_study;

      const blocks = cs.blocks.map(function (b) {
        if (b.type === 'pipeline') {
          return '<div class="case-block">' +
            '<h4 class="case-title">' + esc(L(b.title, lang)) + '</h4>' +
            '<pre class="pipeline">' + esc(b.text) + '</pre>' +
            '</div>';
        }
        if (b.type === 'decisions') {
          return '<div class="case-block">' +
            '<h4 class="case-title">' + esc(L(b.title, lang)) + '</h4>' +
            '<ul class="case-list">' +
              b.items.map(function (i) {
                return '<li>' +
                  '<span class="case-dec">' + esc(L(i.title, lang)) + '</span>' +
                  '<span class="case-desc">' + esc(L(i.desc, lang)) + '</span>' +
                  '</li>';
              }).join('') +
            '</ul>' +
            '</div>';
        }
        /* type: "text" */
        return '<div class="case-block">' +
          '<h4 class="case-title">' + esc(L(b.title, lang)) + '</h4>' +
          '<p class="case-text">' + L(b.html, lang) + '</p>' +
          '</div>';
      }).join('');

      caseStudyHtml =
        '<div class="case-study" id="' + esc(cs.id) + '" data-case-study>' +
          '<div class="case-study-inner">' + blocks + '</div>' +
        '</div>';

      toggleHtml =
        '<button class="btn btn--ghost case-toggle" type="button" data-case-toggle ' +
          'aria-expanded="' + (caseOpen ? 'true' : 'false') + '" aria-controls="' + esc(cs.id) + '">' +
          '<span class="case-toggle-label">' + esc(caseOpen ? t.case_show_less : t.case_read_more) + '</span>' +
          icon('chevron-down', 'case-toggle-icon') +
        '</button>';
    }

    let linkHtml = '';
    if (p.link) {
      linkHtml =
        '<a href="' + esc(p.link) + '" target="_blank" rel="noopener noreferrer" class="btn btn--ghost">' +
          icon('logo-github') +
          '<span>' + esc(t.view_github) + '</span>' +
          icon('arrow-forward-outline', 'btn-arrow') +
        '</a>';
    }

    const noteHtml = p.note ? '<span class="project-note">' + esc(L(p.note, lang)) + '</span>' : '';

    return '<article class="project-card' +
        (p.featured ? ' project-card--featured' : '') +
        (caseOpen && p.case_study ? ' open' : '') +
      '">' +
      head +
      '<h3 class="project-title">' + esc(L(p.title, lang)) + '</h3>' +
      '<p class="project-text">' + esc(L(p.desc, lang)) + '</p>' +
      caseStudyHtml +
      chipRow(p.tags) +
      '<div class="project-actions">' + toggleHtml + linkHtml + noteHtml + '</div>' +
      '</article>';
  };

  const renderProjects = function (data, lang, t, options) {
    const filter = (options && options.filter) || 'all';
    const caseOpen = !!(options && options.caseOpen);

    return data.projects.map(function (p) {
      const visible = filter === 'all' || filter === p.category;
      return '<li class="project-item' + (visible ? ' active' : '') + '" data-filter-item data-category="' + esc(p.category) + '">' +
        buildProjectCard(p, lang, t, caseOpen) +
        '</li>';
    }).join('');
  };

  /*-----------------------------------*\
    notes

    Notes arrive either from assets/data/notes.json (build-time sync) or
    from SITE_DATA.notes (offline fallback). Both are shaped here into a
    card. Every field is untrusted → escaped.
  \*-----------------------------------*/

  const readingTime = function (text) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  };

  const persianDigits = function (s) {
    const map = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(s).replace(/\d/g, function (d) { return map[d]; });
  };

  const formatNoteDate = function (date, lang) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';

    /* Format in UTC on purpose. The page is prerendered by CI, so any
       dependence on the machine's timezone makes the build output differ
       between a local run and the runner — and a post at 20:40 UTC would
       flip calendar days. Notes are published timestamps, not events
       relative to the reader. */
    if (lang === 'fa') {
      const parts = date.toLocaleDateString('fa-IR', {
        year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC'
      }).split('/').map(function (s) { return s.trim(); });
      const monthName = date.toLocaleDateString('fa-IR', { month: 'long', timeZone: 'UTC' })
        .replace(/\s*\d+.*$/, '');
      return persianDigits(parts[2]) + ' ' + monthName + ' ' + persianDigits(parts[0]);
    }

    return date.toLocaleDateString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
    });
  };

  /* Telegram CDN photo URLs are signed, expire within hours, and
     cdn4.telesco.pe is unreachable from some networks (Iran). wsrv.nl is
     a free image proxy on Cloudflare: it fetches the Telegram origin and
     serves the bytes from Cloudflare's edge, which is reachable where
     Telegram's CDN is not. w/q keep the transfer small for the card and
     the popup slot. notes.json still stores the original URLs — the
     proxy is applied in this rendering layer only. */
  const IMAGE_PROXY = 'https://wsrv.nl/?url=';
  const proxiedImage = function (url) {
    return IMAGE_PROXY + encodeURIComponent(url) + '&w=1280&q=85';
  };

  const normalizeNote = function (post, lang) {
    /* Two input schemas feed the same renderer:
       - the raw sync schema (notes.json): scraped title/text/photos;
       - the curated card schema (notes.cards.json, written by
         scripts/build-notes-cards.mjs): authored title/excerpt,
         full_content, media{url, alt}, precomputed reading time.
       Cards are detected by full_content/published_at and mapped onto the
       same internal shape, so the markup below never forks. */
    const isCard = post && (post.full_content != null || post.published_at != null);

    /* full text keeps its line breaks — the popup renders it pre-line like
       Telegram; the card excerpt is collapsed separately */
    const text = String(isCard ? post.full_content : post.text || '').trim();
    const date = new Date(isCard ? (post.published_at && post.published_at.iso) || post.date : post.date);

    const title = post.title || text.replace(/\s+/g, ' ').slice(0, 80);

    let body = text;
    let excerpt = '';

    if (isCard) {
      /* title and body are authored independently — no duplicated first
         line to strip */
      excerpt = String(post.excerpt || '').trim() || body.replace(/\s+/g, ' ').trim();
    } else {
      /* A synced Telegram post repeats its title as the first line of the body,
         so the card printed the same sentence twice. The sync truncates the
         title at 110 chars (appending "…"), which broke exact-prefix matching —
         compare the collapsed first line against the title prefix instead and
         drop the whole first line when they refer to the same sentence. */
      const lines = text.split('\n');
      const firstLine = (lines.find(function (l) { return l.trim(); }) || '').replace(/\s+/g, ' ').trim();
      const titleCore = title.replace(/\s+/g, ' ').trim().replace(/…$/, '');
      const dropsFirstLine = titleCore && firstLine &&
        (firstLine === titleCore || firstLine.indexOf(titleCore) === 0 || titleCore.indexOf(firstLine) === 0);
      body = dropsFirstLine ? lines.slice(1).join('\n').trim() : text;
      excerpt = body.replace(/\s+/g, ' ').trim();
    }

    const collapsedBody = excerpt.length > 220 ? excerpt.slice(0, 220).trimEnd() + '…' : excerpt;

    /* cards ship "3 min read" precomputed; fall back to computing it */
    const readingMatch = isCard && /^(\d+)\s*min\b/.exec(String(post.reading_time || ''));
    const reading = readingMatch ? Number(readingMatch[1]) : readingTime(text);

    const cardUrl = isCard && post.channel && post.channel.post_url ? post.channel.post_url : post.url;
    const mediaUrl = isCard && post.media && /^https?:\/\//.test(String(post.media.url || ''))
      ? String(post.media.url)
      : null;

    return {
      id: post.id,
      title: title,
      /* body without its duplicated title line — shown in full in the popup */
      text: body,
      excerpt: collapsedBody,
      tags: (post.tags || []).slice(0, 5),
      url: cardUrl,
      badgeUrl: post.badgeUrl || cardUrl,
      date: isNaN(date.getTime()) ? null : date,
      reading: reading,
      photos: (mediaUrl ? [mediaUrl] : isCard ? [] : Array.isArray(post.photos) ? post.photos : [])
        .filter(function (u) { return typeof u === 'string' && /^https?:\/\//.test(u); })
        .slice(0, 8)
        .map(proxiedImage),
      photoAlts: mediaUrl && post.media.alt ? [String(post.media.alt)] : [],
      audio: (typeof post.audio === 'string' && /^https?:\/\//.test(post.audio)) ? post.audio : null,
      lang: post.lang || 'fa'
    };
  };

  const renderNoteCard = function (item, lang, t) {
    /* X-timeline row: avatar column, then head (name @handle · time ·
       reading), body, media, tags, action row. The whole card still opens
       the post popup; the head links and action row navigate for real. */
    const dateHtml = item.date
      ? '<span class="dot" aria-hidden="true"></span>' +
        '<time datetime="' + item.date.toISOString() + '">' + esc(formatNoteDate(item.date, lang)) + '</time>'
      : '';

    const reading = lang === 'fa'
      ? 'مطالعهٔ ' + persianDigits(item.reading) + ' دقیقه‌ای'
      : item.reading + ' min read';

    /* a one-line reaction or a photo meme has no meaningful reading time */
    const readingHtml = String(item.text || '').length > 200
      ? '<span class="dot" aria-hidden="true"></span><span>' + esc(reading) + '</span>'
      : '';

    const head =
      '<div class="logs-meta">' +
        '<span class="post-name">' + esc(t.logs_author) + '</span>' +
        '<a class="post-handle" href="' + esc(CHANNEL_URL) + '" target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">@KhanAcademyy</a>' +
        dateHtml +
        readingHtml +
      '</div>';

    /* a note whose body is nothing but its title has no excerpt left to show */
    const excerptHtml = item.excerpt
      ? '<p class="logs-excerpt" dir="auto" lang="' + esc(item.lang) + '">' + esc(item.excerpt) + '</p>'
      : '';

    /* a photo-bearing note shows its first image as a thumbnail; clicking
       the card opens the post popup with the full gallery. An album badge
       hints the rest of the gallery; the shimmer/error states come from
       the .is-loading/.is-error wrappers (script.js settles them). */
    const photoCount = item.photos ? item.photos.length : 0;
    const countLabel = t.logs_photo_count.replace('{n}', lang === 'fa' ? persianDigits(photoCount) : photoCount);
    const photoHtml = photoCount
      ? '<div class="logs-photo is-loading" data-error="' + esc(t.logs_photo_error) + '">' +
        '<img src="' + esc(item.photos[0]) + '" class="logs-thumb" alt="' +
          esc((item.photoAlts && item.photoAlts[0]) || '') + '" loading="lazy">' +
        (photoCount > 1
          ? '<span class="logs-photo-count" dir="ltr" aria-label="' + esc(countLabel) + '">' +
            (lang === 'fa' ? persianDigits(photoCount) : photoCount) + '</span>'
          : '') +
      '</div>'
      : '';

    /* action row: reply opens the post on Telegram, share hands it to
       Telegram's native share sheet with the title prefilled */
    const shareUrl = 'https://t.me/share/url?url=' + encodeURIComponent(item.url) +
      '&text=' + encodeURIComponent(item.title || '');

    const actionsHtml =
      '<div class="post-actions">' +
        '<a class="post-action" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer"' +
          ' aria-label="' + esc(t.logs_reply) + '" title="' + esc(t.logs_reply) + '">' +
          icon('chatbubble-ellipses-outline') +
        '</a>' +
        '<a class="post-action" href="' + esc(shareUrl) + '" target="_blank" rel="noopener noreferrer"' +
          ' aria-label="' + esc(t.logs_share) + '" title="' + esc(t.logs_share) + '">' +
          icon('arrow-redo-outline') +
        '</a>' +
      '</div>';

    return '<article class="logs-card" data-post-id="' + esc(item.id != null ? item.id : '') + '" tabindex="0" role="button" aria-haspopup="dialog">' +
      '<div class="post-avatar" aria-hidden="true"><img src="./assets/images/myPic.jpg" alt="" loading="lazy"></div>' +
      '<div class="post-main">' +
        head +
        /* notes are Persian source text regardless of the UI language */
        '<h4 class="logs-title" dir="auto" lang="' + esc(item.lang) + '">' + esc(item.title) + '</h4>' +
        excerptHtml +
        photoHtml +
        '<ul class="tag-row">' +
          item.tags.map(function (tag) {
            return '<li><span class="chip" dir="ltr" lang="en">#' + esc(tag) + '</span></li>';
          }).join('') +
        '</ul>' +
        actionsHtml +
      '</div>' +
    '</article>';
  };

  const renderNotes = function (posts, lang, t) {
    if (!posts || !posts.length) {
      return '<p class="logs-empty">' + esc(t.logs_empty) + '</p>';
    }
    return posts.map(function (p) {
      return renderNoteCard(normalizeNote(p, lang), lang, t);
    }).join('');
  };

  const api = {
    esc: esc,
    L: L,
    icon: icon,
    chipRow: chipRow,
    renderContacts: renderContacts,
    renderSocials: renderSocials,
    renderAbout: renderAbout,
    renderResume: renderResume,
    renderFilterChips: renderFilterChips,
    renderSelectOptions: renderSelectOptions,
    buildProjectCard: buildProjectCard,
    renderProjects: renderProjects,
    normalizeNote: normalizeNote,
    renderNoteCard: renderNoteCard,
    renderNotes: renderNotes,
    readingTime: readingTime,
    persianDigits: persianDigits,
    formatNoteDate: formatNoteDate
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.SITE_RENDER = api;

})(typeof window !== 'undefined' ? window : globalThis);
