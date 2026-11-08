/*
 * 3-to'plam funksiyalar:
 *  1. Buyurtma holati kuzatish
 *  2. Mahsulot reytingi (yulduzlar)
 *  3. Aksiya banneri
 *  4. Aksiya taymer (countdown)
 *  5. Oldingi buyurtmalar
 *  6. Tungi rejim (Dark mode)
 *  7. Sovg'a taklifi ("Bular bilan birga oling")
 *  8. PWA — saytni telefonга o'rnatish
 *  9. Aksiya taklifi popup
 * 10. Mahsulot ulashish (share)
 */
(function () {
  'use strict';

  var ORDERS_KEY  = 'asama_orders';
  var RATING_KEY  = 'asama_ratings';
  var DARK_KEY    = 'asama_dark';
  var POPUP_KEY   = 'asama_popup_seen';

  /* ============================================================
   * 5. OLDINGI BUYURTMALAR
   * ============================================================ */
  function saveOrder(orderData) {
    try {
      var orders = getOrders();
      orderData.id    = 'ORD-' + Date.now();
      orderData.date  = new Date().toISOString();
      orderData.status = 'new'; // new | processing | done | cancelled
      orders.unshift(orderData);
      if (orders.length > 20) orders.length = 20;
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {}
    return orderData.id;
  }
  function getOrders() {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch (e) { return []; }
  }
  function getOrder(id) {
    return getOrders().filter(function (o) { return o.id === id; })[0] || null;
  }

  /* ============================================================
   * 2. MAHSULOT REYTINGI
   * ============================================================ */
  function getRatings() {
    try { return JSON.parse(localStorage.getItem(RATING_KEY)) || {}; } catch (e) { return {}; }
  }
  function setRating(sku, stars) {
    var r = getRatings();
    r[sku] = Math.min(5, Math.max(1, parseInt(stars, 10)));
    try { localStorage.setItem(RATING_KEY, JSON.stringify(r)); } catch (e) {}
  }
  function getRating(sku) {
    return getRatings()[sku] || 0;
  }
  function starsHtml(sku, interactive) {
    var current = getRating(sku);
    var html = '<div class="stars' + (interactive ? ' stars-interactive' : '') + '" data-sku="' + sku + '">';
    for (var i = 1; i <= 5; i++) {
      html += '<span class="star' + (i <= current ? ' on' : '') + '" data-star="' + i + '">★</span>';
    }
    html += '</div>';
    return html;
  }
  function bindStars(root) {
    (root || document).querySelectorAll('.stars-interactive').forEach(function (widget) {
      var sku = widget.getAttribute('data-sku');
      widget.querySelectorAll('.star').forEach(function (star) {
        star.addEventListener('mouseenter', function () {
          var n = parseInt(star.getAttribute('data-star'), 10);
          widget.querySelectorAll('.star').forEach(function (s, i) {
            s.classList.toggle('on', i < n);
          });
        });
        star.addEventListener('mouseleave', function () {
          var cur = getRating(sku);
          widget.querySelectorAll('.star').forEach(function (s, i) {
            s.classList.toggle('on', i < cur);
          });
        });
        star.addEventListener('click', function () {
          var n = parseInt(star.getAttribute('data-star'), 10);
          setRating(sku, n);
          widget.querySelectorAll('.star').forEach(function (s, i) {
            s.classList.toggle('on', i < n);
          });
          var msg = widget.nextElementSibling;
          if (msg && msg.classList.contains('rating-saved')) {
            msg.style.display = 'inline';
            setTimeout(function () { msg.style.display = 'none'; }, 2000);
          }
        });
      });
    });
  }

  /* ============================================================
   * 6. TUNGI REJIM
   * ============================================================ */
  function isDark() {
    try { return localStorage.getItem(DARK_KEY) === '1'; } catch (e) { return false; }
  }
  function applyDark(on) {
    document.documentElement.classList.toggle('dark', on);
    try { localStorage.setItem(DARK_KEY, on ? '1' : '0'); } catch (e) {}
    document.querySelectorAll('[data-dark-btn]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(on));
      btn.title = on ? (document.documentElement.lang === 'ru' ? 'Светлая тема' : 'Kunduzgi rejim') : (document.documentElement.lang === 'ru' ? 'Тёмная тема' : 'Tungi rejim');
    });
  }
  function toggleDark() { applyDark(!isDark()); }

  /* ============================================================
   * 3. AKSIYA BANNERI
   * ============================================================ */
  function renderBanner() {
    var cfg = window.SITE_CONFIG;
    if (!cfg || !cfg.banner || !cfg.banner.text) return;
    var existing = document.getElementById('promo-banner');
    if (existing) return;
    var bar = document.createElement('div');
    bar.id = 'promo-banner';
    bar.className = 'promo-banner';
    var closeBtn = '<button type="button" class="banner-close" aria-label="Yopish">✕</button>';
    var countdown = cfg.banner.until ? '<span class="banner-timer" id="banner-timer"></span>' : '';
    bar.innerHTML = '<div class="container banner-inner"><span>' + cfg.banner.text + '</span>' + countdown + closeBtn + '</div>';
    document.body.prepend(bar);
    bar.querySelector('.banner-close').addEventListener('click', function () {
      bar.remove();
    });
    if (cfg.banner.until) startBannerTimer(cfg.banner.until);
  }

  /* ============================================================
   * 4. TAYMER (countdown)
   * ============================================================ */
  function startBannerTimer(until) {
    var target = new Date(until).getTime();
    function tick() {
      var el = document.getElementById('banner-timer');
      if (!el) return;
      var diff = target - Date.now();
      if (diff <= 0) { el.textContent = ''; return; }
      var h = Math.floor(diff / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      var lang = document.documentElement.lang;
      el.textContent = ' — ' + h + (lang === 'ru' ? 'ч ' : 's ') + pad(m) + (lang === 'ru' ? 'м ' : 'daq ') + pad(s) + (lang === 'ru' ? 'с' : 's');
      setTimeout(tick, 1000);
    }
    tick();
  }
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  /* ============================================================
   * 9. POPUP (bir marta ko'rsatiladi)
   * ============================================================ */
  function showPopupIfNeeded() {
    var cfg = window.SITE_CONFIG;
    if (!cfg || !cfg.popup || !cfg.popup.text) return;
    try { if (localStorage.getItem(POPUP_KEY)) return; } catch (e) {}
    setTimeout(function () {
      var overlay = document.createElement('div');
      overlay.id = 'promo-popup';
      overlay.className = 'popup-overlay';
      overlay.innerHTML =
        '<div class="popup-box">' +
          '<button type="button" class="popup-close" aria-label="Yopish">✕</button>' +
          '<div class="popup-body">' + cfg.popup.text + '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      function close() {
        overlay.remove();
        try { localStorage.setItem(POPUP_KEY, '1'); } catch (e) {}
      }
      overlay.querySelector('.popup-close').addEventListener('click', close);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    }, (cfg.popup.delay || 8) * 1000);
  }

  /* ============================================================
   * 10. MAHSULOT ULASHISH (Web Share API)
   * ============================================================ */
  function shareProduct(name, url) {
    if (navigator.share) {
      navigator.share({ title: name, url: url }).catch(function () {});
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          alert((document.documentElement.lang === 'ru' ? 'Ссылка скопирована!' : 'Havola nusxalandi!'));
        });
      }
    }
  }

  /* ============================================================
   * 8. PWA — saytni telefonга o'rnatish
   * ============================================================ */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    document.querySelectorAll('[data-pwa-install]').forEach(function (btn) {
      btn.hidden = false;
    });
  });
  function installPWA() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
  }

  /* ============================================================
   * UMUMIY INIT
   * ============================================================ */
  function init() {
    applyDark(isDark());
    renderBanner();
    showPopupIfNeeded();
  }

  window.NEWF = {
    // Buyurtmalar
    saveOrder: saveOrder,
    getOrders: getOrders,
    getOrder: getOrder,
    // Reyting
    getRating: getRating,
    setRating: setRating,
    starsHtml: starsHtml,
    bindStars: bindStars,
    // Dark mode
    isDark: isDark,
    applyDark: applyDark,
    toggleDark: toggleDark,
    // Ulashish
    shareProduct: shareProduct,
    // PWA
    installPWA: installPWA,
    // Init
    init: init,
  };

  // DOM tayyor bo'lganda ishga tushiramiz
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
