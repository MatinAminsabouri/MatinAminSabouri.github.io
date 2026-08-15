'use strict';

/*-----------------------------------*\
  sidebar toggle (mobile)
\*-----------------------------------*/

const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

sidebarBtn.addEventListener("click", function () {
  sidebar.classList.toggle("active");
});

/*-----------------------------------*\
  page navigation (About / Resume / Portfolio)
\*-----------------------------------*/

const navLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

navLinks.forEach(function (link) {
  link.addEventListener("click", function () {

    const target = link.textContent.trim().toLowerCase();

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
\*-----------------------------------*/

const select = document.querySelector("[data-select]");
const selectValue = document.querySelector("[data-select-value]");
const selectItems = document.querySelectorAll("[data-select-item]");
const filterBtns = document.querySelectorAll("[data-filter-btn]");
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterBy = function (value) {
  filterItems.forEach(function (item) {
    item.classList.toggle("active", value === "all" || value === item.dataset.category);
  });
};

select.addEventListener("click", function () {
  select.classList.toggle("active");
});

selectItems.forEach(function (item) {
  item.addEventListener("click", function () {

    const value = item.textContent.trim().toLowerCase();
    if (selectValue) selectValue.textContent = item.textContent.trim();

    select.classList.remove("active");
    filterBy(value);

  });
});

filterBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {

    const value = btn.textContent.trim().toLowerCase();

    filterBtns.forEach(function (b) {
      b.classList.toggle("active", b === btn);
    });

    if (selectValue) selectValue.textContent = btn.textContent.trim();

    filterBy(value);

  });
});

/* close mobile select on outside click */
document.addEventListener("click", function (event) {
  if (select.classList.contains("active") && !select.parentElement.contains(event.target)) {
    select.classList.remove("active");
  }
});

/*-----------------------------------*\
  copy-to-clipboard micro-interaction
\*-----------------------------------*/

const copyBtns = document.querySelectorAll("[data-copy]");

copyBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {

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
});