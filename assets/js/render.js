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

  const normalizeNote = function (post, lang) {
    const text = String(post.text || '').replace(/\s+/g, ' ').trim();
    const date = new Date(post.date);
    return {
      title: post.title || text.slice(0, 80),
      excerpt: text.length > 220 ? text.slice(0, 220).trimEnd() + '…' : text,
      tags: (post.tags || []).slice(0, 5),
      url: post.url,
      badgeUrl: post.badgeUrl || post.url,
      date: isNaN(date.getTime()) ? null : date,
      reading: readingTime(text),
      lang: post.lang || 'fa'
    };
  };

  const renderNoteCard = function (item, lang, t) {
    const dateHtml = item.date
      ? '<time datetime="' + item.date.toISOString() + '">' + esc(formatNoteDate(item.date, lang)) + '</time>' +
        '<span class="dot" aria-hidden="true"></span>'
      : '';

    const reading = lang === 'fa'
      ? 'مطالعهٔ ' + persianDigits(item.reading) + ' دقیقه‌ای'
      : item.reading + ' min read';

    return '<article class="logs-card">' +
      '<div class="logs-meta">' +
        dateHtml +
        '<span>' + esc(reading) + '</span>' +
        '<a class="logs-badge" href="' + esc(item.badgeUrl || item.url) + '" target="_blank" rel="noopener noreferrer" lang="en">t.me/KhanAcademyy</a>' +
      '</div>' +
      /* notes are Persian source text regardless of the UI language */
      '<h4 class="logs-title" dir="auto" lang="' + esc(item.lang) + '">' + esc(item.title) + '</h4>' +
      '<p class="logs-excerpt" dir="auto" lang="' + esc(item.lang) + '">' + esc(item.excerpt) + '</p>' +
      '<ul class="tag-row">' +
        item.tags.map(function (tag) {
          return '<li><span class="chip" dir="ltr" lang="en">#' + esc(tag) + '</span></li>';
        }).join('') +
      '</ul>' +
      '<div class="logs-card-actions">' +
        '<a class="btn btn--ghost" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">' +
          '<span>' + esc(t.logs_read) + '</span>' +
          icon('arrow-forward-outline', 'btn-arrow') +
        '</a>' +
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
