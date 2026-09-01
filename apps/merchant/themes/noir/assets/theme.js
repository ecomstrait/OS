/**
 * EcomStrait theme behaviour.
 *
 * Everything here is progressive: the markup works without it (links navigate,
 * forms submit, the first variant is selectable), and this makes it pleasant.
 * The one exception is the mobile menu, which is genuinely unreachable without
 * JS — so the toggle button is rendered by this file rather than sitting inert
 * in the markup for people who never get it.
 *
 * No framework and no build step. It is served as a plain asset and parsed
 * before anything renders, so it stays small and dependency-free on purpose.
 */
(function () {
  "use strict";

  var on = function (el, ev, fn) { if (el) el.addEventListener(ev, fn); };
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------- nav --
   * The drawer is a sibling of the header rather than a child, so a sticky
   * header with backdrop-filter doesn't become its containing block and trap
   * the overlay behind it.
   */
  function initNav() {
    var toggle = $("[data-nav-toggle]");
    var drawer = $("[data-nav-drawer]");
    if (!toggle || !drawer) return;

    var close = function () {
      drawer.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.documentElement.classList.remove("nav-locked");
    };
    var open = function () {
      drawer.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      // Scroll lock on <html>: iOS ignores overflow:hidden on <body> alone.
      document.documentElement.classList.add("nav-locked");
      var first = drawer.querySelector("a, button");
      if (first) first.focus();
    };

    on(toggle, "click", function () {
      if (drawer.classList.contains("is-open")) close(); else open();
    });
    on($("[data-nav-close]"), "click", close);
    on(drawer, "click", function (e) { if (e.target === drawer) close(); });
    on(document, "keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* ------------------------------------------------------------ variants --
   * Without this the option selects are decorative: the form posts whatever
   * variant id was rendered server-side, so picking "Large / Blue" adds the
   * small red one. The selects carry the option position so the lookup does
   * not depend on their order in the DOM.
   */
  function initVariants() {
    var root = $("[data-product]");
    if (!root) return;
    var data = $("[data-variants]", root);
    if (!data) return;

    var variants;
    try { variants = JSON.parse(data.textContent); } catch { return; }
    if (!variants || !variants.length) return;

    var selects = $$("[data-option-index]", root);
    var idInput = $("[data-variant-id]", root);
    var button = $("[data-add-button]", root);
    var priceEl = $("[data-price]", root);
    var mainImg = $("[data-gallery-main]", root);

    function match() {
      var chosen = [];
      selects.forEach(function (s) { chosen[parseInt(s.dataset.optionIndex, 10)] = s.value; });
      for (var i = 0; i < variants.length; i++) {
        var v = variants[i], ok = true;
        for (var j = 0; j < chosen.length; j++) {
          if (chosen[j] !== undefined && v.options[j] !== chosen[j]) { ok = false; break; }
        }
        if (ok) return v;
      }
      return null;
    }

    function apply() {
      var v = match();
      // No such combination: disable rather than silently adding something
      // else. A shopper told "unavailable" can try another size; one who
      // receives the wrong variant finds out after it ships.
      if (!v) {
        if (button) { button.disabled = true; button.textContent = "Unavailable"; }
        return;
      }
      if (idInput) idInput.value = v.id;
      if (button) {
        button.disabled = !v.available;
        button.textContent = v.available ? button.dataset.labelAdd : button.dataset.labelSoldOut;
      }
      if (priceEl && v.price_formatted) priceEl.innerHTML = v.price_formatted;
      if (mainImg && v.image) { mainImg.src = v.image; mainImg.srcset = ""; }
    }

    selects.forEach(function (s) { on(s, "change", apply); });
    apply();
  }

  /* ------------------------------------------------------------- gallery --
   * Thumbnails swap the main image. Plain <img> swapping rather than a slider:
   * it needs no library, keeps every image in the DOM for crawlers, and
   * degrades to a column of images if this never runs.
   */
  function initGallery() {
    var main = $("[data-gallery-main]");
    if (!main) return;
    var thumbs = $$("[data-gallery-thumb]");
    if (thumbs.length < 2) return;

    thumbs.forEach(function (btn) {
      on(btn, "click", function () {
        main.src = btn.dataset.full || btn.dataset.src;
        main.srcset = "";
        main.alt = btn.dataset.alt || main.alt;
        thumbs.forEach(function (t) { t.classList.remove("is-active"); t.setAttribute("aria-current", "false"); });
        btn.classList.add("is-active");
        btn.setAttribute("aria-current", "true");
      });
    });
  }

  /* ------------------------------------------------------------ quantity -- */
  function initQuantity() {
    $$("[data-qty]").forEach(function (wrap) {
      var input = $("input", wrap);
      if (!input) return;
      $$("[data-qty-step]", wrap).forEach(function (btn) {
        on(btn, "click", function () {
          var next = (parseInt(input.value, 10) || 1) + parseInt(btn.dataset.qtyStep, 10);
          input.value = Math.max(1, next);
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });
      });
    });
  }

  /* ------------------------------------------------------------- filters --
   * The sidebar is a real GET form, so it works submitted. With JS, changing a
   * control submits immediately, which is what shoppers expect from a filter.
   * The Apply button is removed here rather than hidden in CSS, so it is still
   * there for anyone this script never reaches.
   */
  function initFilters() {
    var form = $("[data-filter-form]");
    if (!form) return;
    $$("select, input[type=checkbox]", form).forEach(function (el) {
      on(el, "change", function () { form.submit(); });
    });
    var apply = $("[data-filter-apply]", form);
    if (apply) apply.remove();
  }

  /* --------------------------------------------------------- hero carousel --
   * Every hero already renders at least one `.hero__slide` (see hero.liquid),
   * even the single-image/video case — this only does anything once there's
   * more than one, so a merchant with just one slide gets identical behaviour
   * to before this existed.
   */
  function initHeroCarousel() {
    var hero = $("[data-hero]");
    if (!hero) return;
    var slides = $$("[data-hero-slide]", hero);
    if (slides.length < 2) return;
    var dots = $$("[data-hero-dot]", hero);
    var active = 0;
    var timer = null;

    function show(i) {
      active = i;
      slides.forEach(function (s, idx) { s.classList.toggle("is-active", idx === i); });
      dots.forEach(function (d, idx) { d.classList.toggle("is-active", idx === i); });
    }

    dots.forEach(function (d, idx) {
      on(d, "click", function () {
        show(idx);
        if (timer) { clearInterval(timer); timer = null; }
      });
    });

    if (!window.matchMedia || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timer = setInterval(function () { show((active + 1) % slides.length); }, 5500);
    }
  }

  /* ----------------------------------------------------------- newsletter --
   * Posts straight to the merchant app's own API (see settingsFromPlan /
   * newsletter route) — the store's Shopify domain is a different origin
   * from where that API lives, hence fetch() rather than a same-site form.
   */
  function initNewsletter() {
    var wrap = $("[data-newsletter]");
    if (!wrap) return;
    var form = $("[data-newsletter-form]", wrap);
    var message = $("[data-newsletter-message]", wrap);
    var storeId = wrap.dataset.storeId;
    var apiOrigin = wrap.dataset.apiOrigin;
    if (!form || !storeId || !apiOrigin) return;

    function setMessage(text, isError) {
      if (!message) return;
      message.hidden = false;
      message.textContent = text;
      message.classList.toggle("is-error", Boolean(isError));
    }

    on(form, "submit", function (e) {
      e.preventDefault();
      var email = form.email ? form.email.value : "";
      var button = $("button", form);
      if (button) button.disabled = true;

      fetch(apiOrigin + "/api/storefront/" + storeId + "/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            return { ok: res.ok, body: body };
          });
        })
        .then(function (result) {
          if (result.ok) {
            setMessage("You're on the list.", false);
            form.reset();
          } else {
            setMessage((result.body && result.body.error) || "That didn't go through.", true);
          }
        })
        .catch(function () {
          setMessage("That didn't go through — try again in a moment.", true);
        })
        .finally(function () {
          if (button) button.disabled = false;
        });
    });
  }

  function init() {
    initNav();
    initVariants();
    initGallery();
    initQuantity();
    initFilters();
    initHeroCarousel();
    initNewsletter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
