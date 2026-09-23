/* ==========================================================================
   Fanja's Portfolio — main.js
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Theme (light / dark) — persisted in localStorage
     ------------------------------------------------------------------- */
  const THEME_KEY = "fanja-theme";
  const LANG_KEY = "fanja-lang";

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function setStoredTheme(value) {
    try { localStorage.setItem(THEME_KEY, value); } catch (e) { /* ignore */ }
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.querySelector("[data-theme-toggle]");
    if (btn) btn.setAttribute("aria-pressed", theme === "dark");
  }
  function initTheme() {
    const stored = getStoredTheme();
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(stored || (prefersDark ? "dark" : "light"));

    const btn = document.querySelector("[data-theme-toggle]");
    if (btn) {
      btn.addEventListener("click", function () {
        const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
        const next = current === "dark" ? "light" : "dark";
        applyTheme(next);
        setStoredTheme(next);
      });
    }
  }

  /* ---------------------------------------------------------------------
     Language (EN / FR) — persisted, applied via data-i18n attributes
     ------------------------------------------------------------------- */
  function getStoredLang() {
    try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; }
  }
  function setStoredLang(value) {
    try { localStorage.setItem(LANG_KEY, value); } catch (e) { /* ignore */ }
  }
  function translate(lang) {
    const dict = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || {};
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
    });
    document.documentElement.setAttribute("lang", lang);
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === lang);
    });
  }
  function initLang() {
    const stored = getStoredLang();
    const browserLang = (navigator.language || "en").slice(0, 2);
    const lang = stored || (browserLang === "fr" ? "fr" : "en");
    translate(lang);

    document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const chosen = btn.getAttribute("data-lang");
        translate(chosen);
        setStoredLang(chosen);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Header: scroll shadow + mobile nav toggle
     ------------------------------------------------------------------- */
  function initHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    window.addEventListener("scroll", function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }, { passive: true });

    const toggle = header.querySelector(".nav-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        const isOpen = header.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", isOpen);
      });
      header.querySelectorAll(".nav-links a").forEach(function (a) {
        a.addEventListener("click", function () {
          header.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  }
  /* ---------------------------------------------------------------------
     Measure the real header height and expose it as a CSS variable,
     so section anchors scroll to the exact right offset.
     ------------------------------------------------------------------- */
  function initHeaderOffset() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    function update() {
      document.documentElement.style.setProperty("--header-offset", header.offsetHeight + "px");
    }
    update();
    window.addEventListener("resize", update);
  }
  /* ---------------------------------------------------------------------
     Single-page nav: highlight the current section's menu link
     while scrolling down through the page
     ------------------------------------------------------------------- */
  function initScrollSpy() {
    const links = document.querySelectorAll("[data-nav-link]");
    if (!links.length) return;
    const sections = Array.from(links)
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);
    if (!sections.length) return;

    const byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (a) { a.removeAttribute("aria-current"); });
          const link = byId[entry.target.id];
          if (link) link.setAttribute("aria-current", "page");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ---------------------------------------------------------------------
     Home: welcome overlay + hero entrance
     ------------------------------------------------------------------- */
  function initWelcome() {
    const overlay = document.querySelector("[data-welcome-overlay]");
    const hero = document.querySelector("[data-hero-content]");
    if (!overlay) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduceMotion ? 0 : 2400;

    window.setTimeout(function () {
      overlay.classList.add("is-hidden");
      console.log("WELCOME CACHÉ");

      if (hero) hero.classList.add("is-visible");
    }, delay);

    overlay.addEventListener("click", function () {
      overlay.classList.add("is-hidden");
      if (hero) hero.classList.add("is-visible");
    });
  }
    /* ---------------------------------------------------------------------
     Home: subtle mouse-tilt effect on the portrait frame
     ------------------------------------------------------------------- */
  function initPortraitTilt() {
    const frame = document.querySelector("[data-tilt]");
    if (!frame) return;
    const maxTilt = 8;
    const baseRotate = 4;

    frame.addEventListener("mousemove", function (e) {
      const rect = frame.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - y) * maxTilt * 2;
      frame.style.transform =
        "rotate(" + baseRotate + "deg) rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg)";
    });

    frame.addEventListener("mouseleave", function () {
      frame.style.transform = "rotate(" + baseRotate + "deg)";
    });
  }

  /* ---------------------------------------------------------------------
     Skills: accordion cards
     ------------------------------------------------------------------- */
  function initSkillsAccordion() {
  const cards = document.querySelectorAll("[data-skill-card]");
  if (!cards.length) return;
  cards.forEach(function (card) {
    const btn = card.querySelector(".skill-toggle");

    if (!btn) return;

    btn.addEventListener("click", function () {
      const isOpen = card.getAttribute("data-open") === "true";

      card.setAttribute("data-open", String(!isOpen));
      btn.setAttribute("aria-expanded", String(!isOpen));
      });
    });
  }

  /* ---------------------------------------------------------------------
     Experience: auto-switch every 15s + swipe
     ------------------------------------------------------------------- */
  function initExperience() {
    const track = document.querySelector("[data-exp-track]");
    if (!track) return;
    const dots = document.querySelectorAll("[data-exp-dots] button");
    let index = 0;
    let timer = null;

    function render() {
      track.style.transform = "translateX(-" + (index * 50) + "%)";
      dots.forEach(function (d, i) { d.setAttribute("aria-current", String(i === index)); });
    }
    function goTo(i) {
      index = (i + dots.length) % dots.length;
      render();
      restart();
    }
    function restart() {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(function () { goTo(index + 1); }, 15000);
    }

    dots.forEach(function (d, i) {
      d.addEventListener("click", function () { goTo(i); });
    });

    let startX = null;
    const wrap = document.querySelector("[data-exp-wrap]");
    if (wrap) {
      wrap.addEventListener("touchstart", function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
      wrap.addEventListener("touchend", function (e) {
        if (startX === null) return;
        const delta = e.changedTouches[0].clientX - startX;
        if (Math.abs(delta) > 40) goTo(index + (delta < 0 ? 1 : -1));
        startX = null;
      }, { passive: true });
    }

    render();
    restart();
  }

  /* ---------------------------------------------------------------------
     Library: carousel + lightbox
     ------------------------------------------------------------------- */
  function initLibrary() {
    const viewport = document.querySelector("[data-carousel-viewport]");
    const track = document.querySelector("[data-carousel-track]");
    if (!viewport || !track) return;

    const slides = Array.from(track.children);
    const dotsWrap = document.querySelector("[data-carousel-dots]");
    const prevBtn = document.querySelector("[data-carousel-prev]");
    const nextBtn = document.querySelector("[data-carousel-next]");
    let perView = 3;
    let index = 0;
    let autoplay = null;

    function computePerView() {
      const w = window.innerWidth;
      if (w <= 720) return 1;
      if (w <= 980) return 2;
      return 3;
    }
    function maxIndex() { return Math.max(0, slides.length - perView); }

    function render() {
      const offset = index * (slides[0].offsetWidth + 24);
      track.style.transform = "translateX(-" + offset + "px)";
      if (dotsWrap) {
        Array.from(dotsWrap.children).forEach(function (d, i) {
          d.setAttribute("aria-current", String(i === index));
        });
      }
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      const count = maxIndex() + 1;
      for (let i = 0; i < count; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Go to slide " + (i + 1));
        b.addEventListener("click", function () { goTo(i); });
        dotsWrap.appendChild(b);
      }
    }

    function goTo(i) {
      index = Math.min(Math.max(0, i), maxIndex());
      render();
    }

    function refresh() {
      perView = computePerView();
      buildDots();
      goTo(Math.min(index, maxIndex()));
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); resetAutoplay(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); resetAutoplay(); });

    function resetAutoplay() {
      if (autoplay) window.clearInterval(autoplay);
      autoplay = window.setInterval(function () {
        goTo(index + 1 > maxIndex() ? 0 : index + 1);
      }, 5000);
    }
    viewport.addEventListener("mouseenter", function () { if (autoplay) window.clearInterval(autoplay); });
    viewport.addEventListener("mouseleave", resetAutoplay);

    window.addEventListener("resize", refresh);
    refresh();
    resetAutoplay();

   const lightbox = document.querySelector("[data-lightbox]");
if (lightbox) {
  const imageEl = lightbox.querySelector("[data-lightbox-image]");
  const titleEl = lightbox.querySelector("[data-lightbox-title]");
  const metaEl = lightbox.querySelector("[data-lightbox-meta]");
  const descEl = lightbox.querySelector("[data-lightbox-desc]");
  const closeBtn = lightbox.querySelector("[data-lightbox-close]");

  slides.forEach(function (slide) {
    const fig = slide.querySelector("[data-lib-figure]");
    if (!fig) return;
    fig.addEventListener("click", function () {
      const imgSrc = fig.getAttribute("data-img") || fig.querySelector("img")?.getAttribute("src");
      if (imageEl) imageEl.src = imgSrc || "";
      if (titleEl) titleEl.textContent = fig.getAttribute("data-title") || "";
      if (metaEl) metaEl.textContent = fig.getAttribute("data-place") || "";
      if (descEl) descEl.textContent = fig.getAttribute("data-desc") || "";
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
      if (closeBtn) closeBtn.focus();
    });
  });
  function close() { 
    lightbox.classList.remove("is-open"); 
    document.body.style.overflow = "";
  }
  if (closeBtn) closeBtn.addEventListener("click", close);
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
}
  }

  /* ---------------------------------------------------------------------
     Contact: simple client-side form handling
     ------------------------------------------------------------------- */
  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;
    const status = form.querySelector("[data-form-status]");

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const lang = document.documentElement.getAttribute("lang") || "en";
      const dict = window.TRANSLATIONS[lang];
      const data = new FormData(form);
      const name = (data.get("name") || "").toString().trim();
      const email = (data.get("email") || "").toString().trim();
      const subject = (data.get("subject") || "").toString().trim();
      const message = (data.get("message") || "").toString().trim();

      if (!name || !email || !subject || !message) {
        status.textContent = dict["contact.form.error"];
        status.className = "form-status error";
        return;
      }

      const response = await fetch("https://api.web3forms.com/submit", {
  method: "POST",
  body: data
});

const result = await response.json();

if (result.success) {
  status.textContent = dict["contact.form.success"];
  status.className = "form-status success";
  form.reset();
} else {
  status.textContent = dict["contact.form.error"];
  status.className = "form-status error";
}
    });
  }

  /* ---------------------------------------------------------------------
     Init
     ------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initLang();
    initHeader();
    initHeaderOffset();
    initScrollSpy();
    initWelcome();
    initPortraitTilt();
    initSkillsAccordion();
    initExperience();
    initLibrary();
    initContactForm();
  });
})();
lucide.createIcons();