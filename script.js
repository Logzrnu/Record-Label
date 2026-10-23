/* ============================================================
   Qrecords — site interactions
   Vanilla JS: nav, scroll effects, reveals, forms, accessibility
   ============================================================ */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky header ---------- */
  var header = document.getElementById("siteHeader");
  var backToTop = document.getElementById("backToTop");

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-solid", y > 40);
    if (backToTop) backToTop.classList.toggle("is-visible", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");

  function closeMenu() {
    if (!navMenu) return;
    navMenu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    }
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var open = navMenu.classList.toggle("is-open");
      document.body.classList.toggle("menu-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    navMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- Scroll-spy for nav links ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
  var spySections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && spySections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (l) {
          l.classList.toggle("is-active", l.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    spySections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { revealer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     Form handling (contact + artist submission)
     DEMO ONLY: no data is sent anywhere. Before production,
     connect these handlers to a secure backend or a form
     service (e.g. Formspree, Netlify Forms, a custom API) and
     never expose secret API keys in frontend code.
     ============================================================ */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var URL_RE = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}([/?#].*)?$/i;

  function setError(field, message) {
    var wrap = field.closest(".form__field");
    if (!wrap) return;
    var err = wrap.querySelector(".form__error");
    wrap.classList.toggle("has-error", Boolean(message));
    if (err) {
      err.textContent = message || "";
      err.hidden = !message;
    }
    field.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validateField(field) {
    var value = field.value.trim();
    var name = field.name;

    if (field.required && !value) {
      setError(field, "This field is required.");
      return false;
    }
    if (!value) { setError(field, ""); return true; }

    if (field.type === "email" && !EMAIL_RE.test(value)) {
      setError(field, "Please enter a valid email address.");
      return false;
    }
    if (field.type === "url" && !URL_RE.test(value)) {
      setError(field, "Please enter a valid URL (e.g. https://...).");
      return false;
    }
    var min = parseInt(field.getAttribute("minlength"), 10);
    if (min && value.length < min) {
      setError(field, "Please enter at least " + min + " characters.");
      return false;
    }
    if (name === "consent" && !field.checked) {
      setError(field, "Please confirm you agree to the privacy notice.");
      return false;
    }
    setError(field, "");
    return true;
  }

  function wireForm(formId) {
    var form = document.getElementById(formId);
    if (!form) return;
    var fields = Array.prototype.slice.call(
      form.querySelectorAll("input, select, textarea")
    );
    var success = form.querySelector(".form__success");

    fields.forEach(function (field) {
      field.addEventListener("blur", function () { validateField(field); });
      field.addEventListener("input", function () {
        if (field.closest(".form__field") && field.closest(".form__field").classList.contains("has-error")) {
          validateField(field);
        }
      });
      if (field.type === "checkbox") {
        field.addEventListener("change", function () { validateField(field); });
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var allValid = true;
      var firstInvalid = null;

      fields.forEach(function (field) {
        if (field.type === "hidden") return;
        var ok = validateField(field);
        if (!ok) {
          allValid = false;
          if (!firstInvalid) firstInvalid = field;
        }
      });

      if (!allValid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Demo submission flow: simulate a network request, then show success.
      form.classList.add("is-sending");

      window.setTimeout(function () {
        form.classList.remove("is-sending");
        if (success) {
          fields.forEach(function (f) {
            if (f.type === "checkbox") { f.checked = false; }
            else { f.value = ""; }
          });
          form.querySelectorAll(".form__field").forEach(function (w) {
            w.classList.remove("has-error");
          });
          success.hidden = false;
          success.setAttribute("tabindex", "-1");
          success.focus({ preventScroll: false });
          success.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
        }
      }, 1200);
    });
  }

  wireForm("contactForm");
  wireForm("submissionForm");

  /* ---------- Animated counters (about stats) ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window && !prefersReducedMotion) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        var suffix = el.textContent.replace(/[0-9]/g, "");
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1200, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { counterObserver.observe(c); });
  }
})();
