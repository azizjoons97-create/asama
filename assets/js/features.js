/*
 * Qo'shimcha funksiyalar:
 *  1. Sevimlilar (Wishlist)
 *  2. Solishtirish (Compare) — max 3 mahsulot
 *  3. Yaqinda ko'rilgan mahsulotlar
 *  4. Narx kalkulyatori
 *  5. Ulgurji so'rov formasi
 *  6. Suzuvchi Telegram/telefon tugmasi
 *  7. Narx filtri (oraliq slider)
 *  8. Oddiy tashriflar statistikasi (localStorage)
 */
(function () {
  'use strict';

  /* ============================================================
   *  1. SEVIMLILAR
   * ============================================================ */
  var WISH_KEY = 'asama_wish';

  function getWish() {
    try { return JSON.parse(localStorage.getItem(WISH_KEY)) || []; } catch (e) { return []; }
  }
  function saveWish(arr) {
    try { localStorage.setItem(WISH_KEY, JSON.stringify(arr)); } catch (e) {}
    updateWishBadge();
  }
  function inWish(sku) { return getWish().indexOf(sku) !== -1; }
  function toggleWish(sku) {
    var arr = getWish();
    var idx = arr.indexOf(sku);
    if (idx === -1) arr.push(sku); else arr.splice(idx, 1);
    saveWish(arr);
    return arr.indexOf(sku) !== -1;
  }
  function updateWishBadge() {
    var n = getWish().length;
    document.querySelectorAll('[data-wish-count]').forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
    // Sayt bo'ylab yurak tugmalarini yangilash
    document.querySelectorAll('[data-wish-btn]').forEach(function (btn) {
      var sku = btn.getAttribute('data-wish-btn');
      btn.classList.toggle('active', inWish(sku));
      btn.setAttribute('aria-pressed', String(inWish(sku)));
    });
  }

  /* ============================================================
   *  2. SOLISHTIRISH
   * ============================================================ */
  var CMP_KEY = 'asama_compare';
  var CMP_MAX = 3;

  function getCompare() {
    try { return JSON.parse(localStorage.getItem(CMP_KEY)) || []; } catch (e) { return []; }
  }
  function saveCompare(arr) {
    try { localStorage.setItem(CMP_KEY, JSON.stringify(arr)); } catch (e) {}
    updateCompareBadge();
  }
  function inCompare(sku) { return getCompare().indexOf(sku) !== -1; }
  function toggleCompare(sku) {
    var arr = getCompare();
    var idx = arr.indexOf(sku);
    if (idx !== -1) { arr.splice(idx, 1); saveCompare(arr); return false; }
    if (arr.length >= CMP_MAX) return 'max';
    arr.push(sku); saveCompare(arr); return true;
  }
  function updateCompareBadge() {
    var n = getCompare().length;
    document.querySelectorAll('[data-cmp-count]').forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
    document.querySelectorAll('[data-cmp-btn]').forEach(function (btn) {
      var sku = btn.getAttribute('data-cmp-btn');
      btn.classList.toggle('active', inCompare(sku));
      btn.setAttribute('aria-pressed', String(inCompare(sku)));
    });
    var bar = document.getElementById('compare-bar');
    if (bar) bar.hidden = n === 0;
  }

  /* ============================================================
   *  3. YAQINDA KO'RILGAN
   * ============================================================ */
  var RECENT_KEY = 'asama_recent';
  var RECENT_MAX = 8;

  function addRecent(sku) {
    try {
      var arr = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
      arr = arr.filter(function (s) { return s !== sku; });
      arr.unshift(sku);
      if (arr.length > RECENT_MAX) arr.length = RECENT_MAX;
      localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
    } catch (e) {}
  }
  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) { return []; }
  }

  /* ============================================================
   *  8. TASHRIFLAR STATISTIKASI
   * ============================================================ */
  var STAT_KEY = 'asama_stats';

  function trackVisit(page, sku) {
    try {
      var s = JSON.parse(localStorage.getItem(STAT_KEY)) || { visits: 0, pages: {} };
      s.visits = (s.visits || 0) + 1;
      s.pages[page] = (s.pages[page] || 0) + 1;
      if (sku) s.pages['product:' + sku] = (s.pages['product:' + sku] || 0) + 1;
      s.last = new Date().toISOString();
      localStorage.setItem(STAT_KEY, JSON.stringify(s));
    } catch (e) {}
  }

  /* ============================================================
   *  UMUMIY INIT
   * ============================================================ */
  window.FEAT = {
    // Sevimlilar
    getWish: getWish,
    inWish: inWish,
    toggleWish: toggleWish,
    updateWishBadge: updateWishBadge,

    // Solishtirish
    getCompare: getCompare,
    inCompare: inCompare,
    toggleCompare: toggleCompare,
    saveCompare: saveCompare,
    updateCompareBadge: updateCompareBadge,
    CMP_MAX: CMP_MAX,

    // Ko'rilganlar
    addRecent: addRecent,
    getRecent: getRecent,

    // Sevimlilar tozalash
    clearWish: function() { saveWish([]); },
    // Solishtirish tozalash
    clearCompare: function() { saveCompare([]); },

    // Statistika
    trackVisit: trackVisit,

    // Barcha badgelarni yangilash
    init: function () {
      updateWishBadge();
      updateCompareBadge();
    },
  };
})();
