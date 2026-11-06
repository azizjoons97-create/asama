/*
 * Animatsiyalar:
 *  1. Scroll: elementlar ko'rinish sohasiga kirganida asta paydo bo'ladi (fade + yuqoriga ko'tarilish)
 *  2. Raqam sanagich: .count-up[data-to="500"] → 0 dan 500 gacha sanaydi
 *  3. Hero: bosh sahifada sarlavha va tugmalar ketma-ket paydo bo'ladi
 *  4. Hover: mahsulot kartochkalari va kategoriya plitkalari ko'tariladi (CSS bilan)
 *
 *  prefers-reduced-motion: animatsiya o'chirilgan bo'lsa, hech narsa o'zgarmaydi.
 */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- IntersectionObserver: scroll animatsiyasi ----------

  // Sahifa yuklanganda bir marta chaqiriladi
  function observeElements() {
    var all = document.querySelectorAll('[data-anim]');

    if (!window.IntersectionObserver || reduced) {
      all.forEach(function (el) { el.classList.add('anim-done'); });
      return;
    }

    // rootMargin katta: viewport'dan 120px pastdagi elementlar ham darhol ko'rinadi
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseFloat(el.getAttribute('data-delay') || '0') * 1000;
        // Maksimal kechikish 300ms: uzoq kutilmaydi
        setTimeout(function () {
          el.classList.add('anim-done');
          if (el.hasAttribute('data-to')) countUp(el);
        }, Math.min(delay, 300));
        io.unobserve(el);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 120px 0px' });

    all.forEach(function (el) { io.observe(el); });

    // Xavfsizlik: 1.5 soniyadan keyin hali ham yashirin elementlarni ko'rsat
    setTimeout(function () {
      document.querySelectorAll('[data-anim]:not(.anim-done)').forEach(function (el) {
        el.classList.add('anim-done');
      });
    }, 1500);
  }

  // ---------- Raqam sanagich ----------

  function countUp(el) {
    if (reduced) { el.textContent = el.getAttribute('data-to'); return; }
    var target = parseInt(el.getAttribute('data-to'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1400;
    var start = performance.now();
    function step(now) {
      var progress = Math.min((now - start) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---------- Hero animatsiyasi ----------

  function animateHero() {
    if (reduced) return;
    var hero = document.querySelector('.hero-text');
    if (!hero) return;
    var children = hero.children;
    Array.prototype.forEach.call(children, function (child, i) {
      child.style.opacity = '0';
      child.style.transform = 'translateY(22px)';
      child.style.transition = 'opacity 0.55s ease ' + (i * 0.13) + 's, transform 0.55s ease ' + (i * 0.13) + 's';
      setTimeout(function () {
        child.style.opacity = '';
        child.style.transform = '';
      }, 60);
    });
  }

  // ---------- data-anim atributlarini avtomatik qo'yish ----------
  // app.js sahifani chizib bo'lgandan keyin chaqiriladi

  function tagElements() {
    // Kategoriya plitkalari
    document.querySelectorAll('.cat-tile').forEach(function (el, i) {
      el.setAttribute('data-anim', 'fade-up');
      el.setAttribute('data-delay', (i * 0.07).toFixed(2));
    });
    // Mahsulot kartalari
    document.querySelectorAll('.card').forEach(function (el, i) {
      el.setAttribute('data-anim', 'fade-up');
      el.setAttribute('data-delay', (i * 0.06).toFixed(2));
    });
    // "Nega bizni" bloklari — kechikish 0.06s gacha qisqartirildi
    document.querySelectorAll('.why-item').forEach(function (el, i) {
      el.setAttribute('data-anim', 'fade-up');
      el.setAttribute('data-delay', (i * 0.06).toFixed(2));
    });
    // CTA bloki
    document.querySelectorAll('.cta').forEach(function (el) {
      el.setAttribute('data-anim', 'fade-up');
    });
    // Mahsulot sahifasi
    document.querySelectorAll('.product-info').forEach(function (el) {
      el.setAttribute('data-anim', 'fade-up');
      el.setAttribute('data-delay', '0.1');
    });
    document.querySelectorAll('.product-img').forEach(function (el) {
      el.setAttribute('data-anim', 'fade-up');
    });
    // Savatcha satrlari
    document.querySelectorAll('.cart-row').forEach(function (el, i) {
      el.setAttribute('data-anim', 'fade-up');
      el.setAttribute('data-delay', (i * 0.06).toFixed(2));
    });
    // Aloqa kartochkasi
    document.querySelectorAll('.contact-card, .prose').forEach(function (el, i) {
      el.setAttribute('data-anim', 'fade-up');
      el.setAttribute('data-delay', (i * 0.1).toFixed(2));
    });
    // H2 sarlavhalar: faqat why, stats blokidagilarga EMAS
    // Bosh sahifa h2 lari ko'p bo'lib, ba'zilari viewport'da darhol ko'rinadi
    // Shuning uchun ularni animatsiyasiz qoldiramiz
    // (category, featured sarlavhalari viewport'da darhol ko'rinyapti)
    // Footer
    document.querySelectorAll('.footer-grid > div').forEach(function (el, i) {
      el.setAttribute('data-anim', 'fade-up');
      el.setAttribute('data-delay', (i * 0.1).toFixed(2));
    });
  }

  // ---------- Statistika bloklari: bosh sahifaga qo'shiladi ----------

  window.ANIM = {
    init: function () {
      tagElements();
      animateHero();
      observeElements();
    },
  };
})();
