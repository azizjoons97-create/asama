/*
 * Saytning asosiy kodi: til, savatcha, sahifalarni chizish va buyurtma yuborish.
 * Har bir HTML sahifada <body data-page="..."> bor, shu bo'yicha kerakli sahifa chiziladi.
 */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG;
  var CATS = window.CATEGORIES;
  var PRODUCTS = window.PRODUCTS;
  var LANGS = ['uz', 'ru'];
  var CART_KEY = 'asama_cart';
  var LANG_KEY = 'asama_lang';
  var DRAFT_KEY = 'asama_order_draft';

  // ---------- Yordamchi funksiyalar ----------

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function storageGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function storageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* xotira to'la yoki taqiqlangan */ }
  }

  function param(name) { return new URLSearchParams(location.search).get(name); }

  // ---------- Til ----------

  var lang = (function () {
    var fromUrl = param('lang');
    if (LANGS.indexOf(fromUrl) !== -1) { storageSet(LANG_KEY, fromUrl); return fromUrl; }
    var saved = storageGet(LANG_KEY, null);
    return LANGS.indexOf(saved) !== -1 ? saved : 'uz';
  })();

  function t(key, vars) {
    var s = (window.I18N[lang] && window.I18N[lang][key]) || window.I18N.uz[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }

  /** Obyektdan joriy tildagi maydonni oladi: loc(p, 'name') → p.nameUz yoki p.nameRu */
  function loc(obj, field) {
    var suffix = lang === 'ru' ? 'Ru' : 'Uz';
    return obj[field + suffix] || obj[field + 'Uz'] || '';
  }

  function setLang(next) {
    if (LANGS.indexOf(next) === -1 || next === lang) return;
    lang = next;
    storageSet(LANG_KEY, lang);
    render();
  }

  // ---------- Narx ----------

  function formatNumber(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  }
  function formatPrice(n) {
    return formatNumber(n) + '\u00a0' + (lang === 'ru' ? CFG.currencyRu : CFG.currencyUz);
  }
  function unitLabel(p) { return t('unit.' + p.unit); }

  // ---------- Ma'lumotlar ----------

  function findProduct(sku) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].sku === sku) return PRODUCTS[i];
    return null;
  }
  function findCategory(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i];
    return null;
  }
  function productImage(p) {
    if (p.image) return p.image;
    var c = findCategory(p.categoryId);
    return c ? c.icon : 'favicon.svg';
  }
  function productUrl(p) { return 'product.html?sku=' + encodeURIComponent(p.sku); }

  // ---------- Savatcha ----------

  /** Savatcha: { sku: miqdor } */
  function getCart() {
    var raw = storageGet(CART_KEY, {});
    var clean = {};
    Object.keys(raw || {}).forEach(function (sku) {
      var q = parseInt(raw[sku], 10);
      if (findProduct(sku) && q > 0) clean[sku] = Math.min(q, 9999);
    });
    return clean;
  }
  function saveCart(cart) { storageSet(CART_KEY, cart); updateCartBadge(); }
  function addToCart(sku, qty) {
    var cart = getCart();
    cart[sku] = Math.min((cart[sku] || 0) + qty, 9999);
    saveCart(cart);
    // Badge "pop" animatsiyasi
    var badge = document.querySelector('[data-cart-count]');
    if (badge) {
      badge.classList.remove('pop');
      void badge.offsetWidth; // reflow
      badge.classList.add('pop');
    }
  }
  function setCartQty(sku, qty) {
    var cart = getCart();
    if (qty > 0) cart[sku] = Math.min(qty, 9999); else delete cart[sku];
    saveCart(cart);
  }
  function cartLines() {
    var cart = getCart();
    return Object.keys(cart).map(function (sku) {
      var p = findProduct(sku);
      return { product: p, qty: cart[sku], sum: p.retailPrice * cart[sku] };
    });
  }
  function cartCount() {
    var cart = getCart();
    return Object.keys(cart).length;
  }
  function cartTotal(lines) { return lines.reduce(function (s, l) { return s + l.sum; }, 0); }

  function updateCartBadge() {
    $all('[data-cart-count]').forEach(function (el) {
      var n = cartCount();
      el.textContent = n;
      el.hidden = n === 0;
    });
  }

  // ---------- Umumiy bloklar ----------

  function telegramUrl() { return CFG.telegram ? 'https://t.me/' + encodeURIComponent(CFG.telegram) : ''; }

  function renderHeader(page) {
    var links = [
      ['home', 'index.html', 'nav.home'],
      ['catalog', 'catalog.html', 'nav.catalog'],
      ['about', 'about.html', 'nav.about'],
    ];
    var nav = links.map(function (l) {
      return '<a href="' + l[1] + '"' + (page === l[0] ? ' aria-current="page"' : '') + '>' + esc(t(l[2])) + '</a>';
    }).join('');
    var langs = LANGS.map(function (code) {
      return '<button type="button" data-lang="' + code + '" aria-pressed="' + (code === lang) + '">' + code.toUpperCase() + '</button>';
    }).join('');

    var phoneTop = CFG.phone
      ? '<a href="tel:' + esc(CFG.phoneLink) + '" class="header-phone-nav">' + esc(CFG.phone) + '</a>'
      : '';
    var tgIcon = CFG.telegram
      ? '<a href="https://t.me/' + esc(encodeURIComponent(CFG.telegram)) + '" class="header-social" target="_blank" rel="noopener" aria-label="Telegram">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.038 9.593c-.15.668-.543.832-1.1.517l-3.037-2.237-1.465 1.41c-.162.162-.298.298-.61.298l.217-3.088 5.62-5.073c.244-.217-.053-.337-.378-.12L7.27 14.482l-2.99-.934c-.65-.203-.663-.65.136-.962l11.67-4.502c.542-.196 1.017.12.476.164z"/></svg>' +
        '</a>'
      : '';

    $('#site-header').innerHTML =
      '<div class="header-top">' +
        '<div class="container header-top-inner">' +
          '<a class="logo" href="index.html" aria-label="' + esc(CFG.name) + '">' +
            '<img src="assets/img/logo-mark.svg" alt="" height="44" width="56" style="display:block;flex-shrink:0">' +
            '<span class="logo-text">ASAMA</span>' +
          '</a>' +
          '<div class="header-search">' +
            '<input type="search" id="header-search-input" placeholder="' + esc(t('catalog.search')) + '" aria-label="' + esc(t('catalog.search')) + '">' +
            '<button type="button" aria-label="Qidiruv">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="header-top-right">' +
            tgIcon +
            '<a class="header-icon-link" href="wishlist.html" aria-label="' + esc(t('wish.title')) + '">' +
              '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
              '<span class="badge" data-wish-count hidden>0</span>' +
            '</a>' +
            '<a class="header-icon-link" href="compare.html" aria-label="' + esc(t('compare.title')) + '">' +
              '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>' +
              '<span class="badge" data-cmp-count hidden>0</span>' +
            '</a>' +
            '<div class="lang-switch" role="group" aria-label="Til / Язык">' + langs + '</div>' +
            '<a class="cart-link" href="cart.html"' + (page === 'cart' ? ' aria-current="page"' : '') + ' aria-label="' + esc(t('nav.cart')) + '">' +
              '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="17.5" cy="20.5" r="1.3" fill="currentColor" stroke="none"/></svg>' +
              '<span class="badge" data-cart-count hidden>0</span>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="header-nav-bar">' +
        '<div class="container header-nav-inner">' +
          '<nav class="main-nav" id="main-nav">' + nav + '</nav>' +
          '<div style="display:flex;align-items:center;gap:16px">' +
            (CFG.phone ? '<span class="header-phone-nav"><a href="tel:' + esc(CFG.phoneLink) + '">' + esc(CFG.phone) + '</a></span>' : '') +
            '<button type="button" class="burger" aria-controls="main-nav" aria-expanded="false" aria-label="' + esc(t('nav.menu')) + '"><span></span><span></span><span></span></button>' +
          '</div>' +
        '</div>' +
      '</div>';

    $all('[data-lang]').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    });
    var burger = $('.burger');
    burger.addEventListener('click', function () {
      var open = $('#main-nav').classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });

    // Header qidiruv
    var searchInput = $('#header-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          location.href = 'catalog.html?q=' + encodeURIComponent(searchInput.value.trim());
        }
      });
      var searchBtn = searchInput.nextElementSibling;
      if (searchBtn) {
        searchBtn.addEventListener('click', function () {
          if (searchInput.value.trim()) {
            location.href = 'catalog.html?q=' + encodeURIComponent(searchInput.value.trim());
          }
        });
      }
    }
  }

  /** Qo'ng'iroq tugmasi. config.js da telefon bo'sh bo'lsa, hech narsa chizilmaydi. */
  function phoneLink(cls, label) {
    if (!CFG.phone) return '';
    return '<a class="' + cls + '" href="tel:' + esc(CFG.phoneLink) + '">' + esc(label || CFG.phone) + '</a>';
  }

  function contactList() {
    var items = [];
    var phones = [];
    if (CFG.phone) phones.push('<a href="tel:' + esc(CFG.phoneLink) + '">' + esc(CFG.phone) + '</a>');
    if (CFG.phone2) phones.push('<a href="tel:' + esc(CFG.phone2Link) + '">' + esc(CFG.phone2) + '</a>');
    if (phones.length) items.push([t('contact.phone'), phones.join('<br>')]);
    if (CFG.telegram) items.push([t('contact.telegram'), '<a href="' + esc(telegramUrl()) + '" target="_blank" rel="noopener">@' + esc(CFG.telegram) + '</a>']);
    if (CFG.instagram) items.push([t('contact.instagram'), '<a href="https://instagram.com/' + esc(encodeURIComponent(CFG.instagram)) + '" target="_blank" rel="noopener">@' + esc(CFG.instagram) + '</a>']);
    var addr = esc(lang === 'ru' ? CFG.addressRu : CFG.addressUz);
    if (CFG.mapLink) addr += '<br><a href="' + esc(CFG.mapLink) + '" target="_blank" rel="noopener">' + esc(t('contact.map')) + '</a>';
    items.push([t('contact.address'), addr]);
    items.push([t('contact.hours'), esc(lang === 'ru' ? CFG.hoursRu : CFG.hoursUz)]);
    return '<dl class="contact-list">' + items.map(function (i) {
      return '<div><dt>' + esc(i[0]) + '</dt><dd>' + i[1] + '</dd></div>';
    }).join('') + '</dl>';
  }

  function renderFooter() {
    var cats = CATS.map(function (c) {
      return '<li><a href="catalog.html?cat=' + encodeURIComponent(c.id) + '">' + esc(loc(c, 'name')) + '</a></li>';
    }).join('');
    $('#site-footer').innerHTML =
      '<div class="container footer-grid">' +
        '<div>' +
          '<div class="footer-logo">' +
            '<a class="logo logo-footer" href="index.html" aria-label="' + esc(CFG.name) + '">' +
              '<img src="assets/img/logo-mark-white.svg" alt="" height="40" width="50" style="display:block;flex-shrink:0">' +
              '<span class="logo-text">ASAMA</span>' +
            '</a>' +
          '</div>' +
          '<p>' + esc(lang === 'ru' ? CFG.sloganRu : CFG.sloganUz) + '</p>' +
        '</div>' +
        '<div><h3>' + esc(t('nav.catalog')) + '</h3><ul>' + cats + '</ul></div>' +
        '<div><h3>' + esc(t('contact.title')) + '</h3>' + contactList() + '</div>' +
      '</div>' +
      '<div class="container footer-bottom">© ' + new Date().getFullYear() + ' ' + esc(CFG.name) + '. ' + esc(t('footer.rights')) + '</div>';
  }

  function setMeta(title, description) {
    document.title = title ? title + ' | ' + CFG.name : CFG.name + ' | ' + (lang === 'ru' ? CFG.sloganRu : CFG.sloganUz);
    var m = $('meta[name="description"]');
    if (m && description) m.setAttribute('content', description);
  }

  // ---------- Mahsulot kartochkasi ----------

  function stockBadge(p) {
    return p.inStock
      ? '<span class="stock in">' + esc(t('product.inStock')) + '</span>'
      : '<span class="stock out">' + esc(t('product.outOfStock')) + '</span>';
  }

  function priceBlock(p) {
    var html = '<span class="price">' + formatPrice(p.retailPrice) + '<small> ' + esc(t('per')) + ' ' + esc(unitLabel(p)) + '</small></span>';
    if (p.oldPrice && p.oldPrice > p.retailPrice) html += '<s class="old-price">' + formatPrice(p.oldPrice) + '</s>';
    return html;
  }

  function productCard(p) {
    var url = productUrl(p);
    var discount = p.oldPrice && p.oldPrice > p.retailPrice
      ? '<span class="tag-sale">−' + Math.round((1 - p.retailPrice / p.oldPrice) * 100) + '%</span>' : '';
    return '<article class="card">' +
      '<a class="card-img" href="' + url + '">' + discount +
        '<img src="' + esc(productImage(p)) + '" alt="' + esc(loc(p, 'name')) + '" loading="lazy" width="160" height="160">' +
      '</a>' +
      '<div class="card-body">' +
        '<div class="card-actions">' +
          '<button type="button" class="card-icon-btn wish-btn" data-wish-btn="' + esc(p.sku) + '" aria-pressed="false" title="' + esc(t('wish.add')) + '">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
          '</button>' +
          '<button type="button" class="card-icon-btn cmp-btn" data-cmp-btn="' + esc(p.sku) + '" aria-pressed="false" title="' + esc(t('compare.add')) + '">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>' +
          '</button>' +
        '</div>' +
        stockBadge(p) +
        '<h3 class="card-title"><a href="' + url + '">' + esc(loc(p, 'name')) + '</a></h3>' +
        '<div class="card-price">' + priceBlock(p) + '</div>' +
        '<button type="button" class="btn btn-primary btn-block" data-add="' + esc(p.sku) + '">' + esc(t('product.add')) + '</button>' +
      '</div>' +
    '</article>';
  }

  function bindAddButtons(root) {
    $all('[data-add]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var qtyInput = btn.getAttribute('data-qty-input') ? $(btn.getAttribute('data-qty-input')) : null;
        var qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
        addToCart(btn.getAttribute('data-add'), qty);
        var label = t('product.add');
        btn.textContent = t('product.added');
        btn.classList.add('added');
        setTimeout(function () { btn.textContent = label; btn.classList.remove('added'); }, 1300);
      });
    });
  }

  function bindCardFeatures(root) {
    if (!window.FEAT) return;
    $all('[data-wish-btn]', root).forEach(function (btn) {
      if (FEAT.inWish(btn.getAttribute('data-wish-btn'))) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      }
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var active = FEAT.toggleWish(btn.getAttribute('data-wish-btn'));
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
    });
    $all('[data-cmp-btn]', root).forEach(function (btn) {
      if (FEAT.inCompare(btn.getAttribute('data-cmp-btn'))) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      }
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var sku = btn.getAttribute('data-cmp-btn');
        var result = FEAT.toggleCompare(sku);
        if (result === 'max') {
          alert(t('compare.max'));
          return;
        }
        btn.classList.toggle('active', result);
        btn.setAttribute('aria-pressed', String(result));
        showCompareBar();
      });
    });
  }

  function showCompareBar() {
    if (!window.FEAT) return;
    var bar = document.getElementById('compare-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'compare-bar';
      bar.className = 'compare-bar';
      document.body.appendChild(bar);
    }
    var skus = FEAT.getCompare();
    bar.hidden = skus.length === 0;
    if (skus.length === 0) return;
    var names = skus.map(function (s) {
      var p = findProduct(s);
      return p ? '<span>' + esc(loc(p, 'name').substring(0, 28)) + (loc(p, 'name').length > 28 ? '…' : '') + '</span>' : '';
    }).join('');
    bar.innerHTML = '<div class="compare-bar-inner container">' +
      '<strong>' + esc(t('compare.title')) + ' (' + skus.length + '):</strong> ' + names +
      '<a class="btn btn-accent btn-sm" href="compare.html">' + esc(t('compare.go')) + '</a>' +
      '<button type="button" class="link-btn" id="cmp-clear">' + esc(t('compare.clear')) + '</button>' +
    '</div>';
    var clearBtn = document.getElementById('cmp-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        FEAT.saveCompare([]);
        bar.hidden = true;
      });
    }
  }

  // ---------- Sahifalar ----------

  function pageHome(app) {
    setMeta('', t('hero.text'));

    // Slider ma'lumotlari
    var slides = [
      {
        titleUz: 'Santexnika va isitish uchun hamma narsa bir joyda',
        titleRu: 'Всё для сантехники и отопления в одном месте',
        textUz: 'PPR truba va fitinglar, isitish qozonlari, radiatorlar, kranlar va smesitellar.',
        textRu: 'Трубы и фитинги PPR, котлы, радиаторы, краны и смесители.',
        img: 'assets/img/cat-radiators.svg',
        btnUz: 'Katalogni ko\'rish',
        btnRu: 'Смотреть каталог',
        btnLink: 'catalog.html',
      },
      {
        titleUz: 'PPR truba va fitinglar',
        titleRu: 'Трубы и фитинги PPR',
        textUz: 'PN20 va PN25 bosimli PPR trubalar, barcha o\'lchamlardagi fitinglar. Issiq va sovuq suv uchun.',
        textRu: 'Трубы PPR PN20 и PN25, фитинги всех размеров. Для горячего и холодного водоснабжения.',
        img: 'assets/img/cat-pipes.svg',
        btnUz: 'PPR trubalar',
        btnRu: 'Трубы PPR',
        btnLink: 'catalog.html?cat=ppr-pipes',
      },
      {
        titleUz: 'Isitish qozonlari',
        titleRu: 'Отопительные котлы',
        textUz: 'Gaz va elektr qozonlari. Kichik xonadan katta binogacha har xil quvvat.',
        textRu: 'Газовые и электрические котлы. Для небольших комнат и крупных объектов.',
        img: 'assets/img/cat-boilers.svg',
        btnUz: 'Qozonlarni ko\'rish',
        btnRu: 'Смотреть котлы',
        btnLink: 'catalog.html?cat=boilers',
      },
    ];

    var curSlide = 0;

    function slideHtml(i) {
      var s = slides[i];
      var title = lang === 'ru' ? s.titleRu : s.titleUz;
      var text  = lang === 'ru' ? s.textRu  : s.textUz;
      var btn   = lang === 'ru' ? s.btnRu   : s.btnUz;
      return '<div class="hero-text" data-slide="' + i + '">' +
        '<h1>' + esc(title) + '</h1>' +
        '<p>' + esc(text) + '</p>' +
        '<div class="hero-buttons">' +
          '<a class="btn btn-accent" href="' + s.btnLink + '">' + esc(btn) + '</a>' +
          phoneLink('btn btn-outline-light', t('hero.call')) +
        '</div>' +
      '</div>' +
      '<div class="hero-img">' +
        '<img src="' + esc(s.img) + '" alt="' + esc(title) + '" width="320" height="280">' +
      '</div>';
    }

    function dotsHtml() {
      return slides.map(function (_, i) {
        return '<button type="button" class="hero-dot' + (i === curSlide ? ' active' : '') + '" aria-label="Slide ' + (i+1) + '"></button>';
      }).join('');
    }

    var advItems = [
      { iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', titleUz: 'Eksklyuziv distributor', titleRu: 'Эксклюзивный дистрибьютор', textUz: "De Dietrich, Caleffi, MADAS va Aquasystem brendlarining O'zbekistondagi rasmiy vakili.", textRu: 'Официальный представитель De Dietrich, Caleffi, MADAS и Aquasystem в Узбекистане.' },
      { iconPath: 'M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z', titleUz: 'Rasmiy servis markazi', titleRu: 'Официальный сервис', textUz: "2007 yildan: qozonlar va MAS gaz uskunalariga diagnostika, ta'mirlash va kafolat.", textRu: 'С 2007 года: диагностика, ремонт и гарантийное обслуживание котлов и газового оборудования.' },
      { iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', titleUz: '5 yilgacha kafolat', titleRu: 'Гарантия до 5 лет', textUz: "Ishlab chiqaruvchining rasmiy brend va ulgurji narx bo'yicha hamkorlik.", textRu: 'Официальная гарантия производителя и партнёрские оптовые цены.' },
      { iconPath: 'M5 8h14M5 8a2 2 0 1 0 0-4h14a2 2 0 0 0 0-4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8m-9 4h4', titleUz: 'Bepul yetkazib berish', titleRu: 'Бесплатная доставка', textUz: "Toshkent shahri bo'ylab mahsulot turidan va so'miga qarab bepul yetkazib berish.", textRu: 'Бесплатная доставка по Ташкенту в зависимости от вида и суммы заказа.' },
    ];

    var adv = advItems.map(function (a) {
      return '<div class="adv-item">' +
        '<div class="adv-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + a.iconPath + '"/></svg></div>' +
        '<div><p class="adv-title">' + esc(lang === 'ru' ? a.titleRu : a.titleUz) + '</p>' +
        '<p class="adv-text">' + esc(lang === 'ru' ? a.textRu : a.textUz) + '</p></div>' +
      '</div>';
    }).join('');

    var cats = CATS.map(function (c) {
      return '<a class="cat-tile" href="catalog.html?cat=' + encodeURIComponent(c.id) + '">' +
        '<img src="' + esc(c.icon) + '" alt="" width="60" height="60">' +
        '<span>' + esc(loc(c, 'name')) + '</span></a>';
    }).join('');

    var featured = PRODUCTS.filter(function (p) { return p.featured; }).slice(0, 8).map(productCard).join('');

    var why = ['wholesale', 'delivery', 'advice', 'quality'].map(function (k, i) {
      return '<div class="why-item"><span class="why-num">0' + (i + 1) + '</span><h3>' + esc(t('why.' + k + '.t')) + '</h3><p>' + esc(t('why.' + k + '.d')) + '</p></div>';
    }).join('');

    var tg = CFG.telegram ? '<a class="btn btn-light" href="' + esc(telegramUrl()) + '" target="_blank" rel="noopener">' + esc(t('contact.write')) + '</a>' : '';

    app.innerHTML =
      // HERO SLIDER
      '<section class="hero" id="hero-section" style="position:relative">' +
        '<div class="container hero-inner" id="hero-inner">' +
          slideHtml(curSlide) +
        '</div>' +
        '<div class="hero-dots" id="hero-dots">' + dotsHtml() + '</div>' +
        '<button type="button" class="hero-prev" id="hero-prev" aria-label="Oldingi">&#8249;</button>' +
        '<button type="button" class="hero-next" id="hero-next" aria-label="Keyingi">&#8250;</button>' +
      '</section>' +

      // AFZALLIKLAR
      '<section class="advantages"><div class="container"><div class="adv-grid">' + adv + '</div></div></section>' +

      // KATEGORIYALAR
      '<section class="container section"><h2>' + esc(t('home.categories')) + '</h2><div class="cat-grid">' + cats + '</div></section>' +

      // OMMABOP MAHSULOTLAR
      '<section class="container section">' +
        '<div class="section-head"><h2>' + esc(t('home.featured')) + '</h2><a href="catalog.html">' + esc(t('home.allProducts')) + '</a></div>' +
        '<div class="product-grid">' + featured + '</div>' +
      '</section>' +

      // NEGA BIZNI
      '<section class="section why"><div class="container"><h2 style="margin-bottom:24px">' + esc(t('home.why')) + '</h2><div class="why-grid">' + why + '</div></div></section>' +

      // STATISTIKA
      statsBar() +

      // CTA
      (CFG.phone || tg
        ? '<section class="container section"><div class="cta"><div><h2>' + esc(t('home.ctaTitle')) + '</h2><p>' + esc(t('home.ctaText')) + '</p></div>' +
          '<div class="cta-buttons">' + phoneLink('btn btn-accent') + tg + '</div></div></section>'
        : '');

    bindAddButtons(app);
    bindCardFeatures(app);
    if (window.ANIM) window.ANIM.init();

    // Slider logikasi
    var heroInner = $('#hero-inner');
    var heroDots = $('#hero-dots');

    function goSlide(n) {
      curSlide = (n + slides.length) % slides.length;
      heroInner.innerHTML = slideHtml(curSlide);
      heroDots.innerHTML = dotsHtml();
      bindSliderDots();
      bindAddButtons(heroInner);
      bindCardFeatures(heroInner);
    }

    function bindSliderDots() {
      $all('.hero-dot', heroDots).forEach(function (dot, i) {
        dot.addEventListener('click', function () { goSlide(i); });
      });
    }

    bindSliderDots();
    $('#hero-prev').addEventListener('click', function () { goSlide(curSlide - 1); });
    $('#hero-next').addEventListener('click', function () { goSlide(curSlide + 1); });

    // Avtomatik slider: 5 soniyada
    var sliderTimer = setInterval(function () { goSlide(curSlide + 1); }, 5000);
    app.addEventListener('click', function () { clearInterval(sliderTimer); }, { once: true });

    addJsonLd('store-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'HardwareStore',
      name: CFG.name,
      description: t('hero.text'),
      url: location.origin + '/',
      address: lang === 'ru' ? CFG.addressRu : CFG.addressUz,
      priceRange: '$$',
    });
  }

  function statsBar() {
    var stats = [
      { to: PRODUCTS.length, suffix: '+', labelUz: "Mahsulot turi", labelRu: 'Видов товара' },
      { to: 5, suffix: '+', labelUz: 'Yil bozorda', labelRu: 'Лет на рынке' },
      { to: 500, suffix: '+', labelUz: 'Bajarilgan loyiha', labelRu: 'Выполненных проектов' },
      { to: 100, suffix: '%', labelUz: 'Sifat kafolati', labelRu: 'Гарантия качества' },
    ];
    var items = stats.map(function (s) {
      return '<div class="stat-item">' +
        '<span class="stat-num count-up" data-anim="fade-up" data-to="' + s.to + '" data-suffix="' + s.suffix + '">0' + s.suffix + '</span>' +
        '<span class="stat-label">' + esc(lang === 'ru' ? s.labelRu : s.labelUz) + '</span>' +
      '</div>';
    }).join('');
    return '<section class="stats-bar"><div class="container"><div class="stats-grid">' + items + '</div></div></section>';
  }

  function addJsonLd(id, data) {
    var old = document.getElementById(id);
    if (old) old.remove();
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = id;
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  function pageCatalog(app) {
    var state = {
      cat: findCategory(param('cat')) ? param('cat') : '',
      q: param('q') || '',
      sort: param('sort') || 'default',
      stock: param('stock') === '1',
    };
    var cat = findCategory(state.cat);
    setMeta(cat ? loc(cat, 'name') : t('catalog.title'), t('hero.text'));

    var chips = [['', t('catalog.all')]].concat(CATS.map(function (c) { return [c.id, loc(c, 'name')]; }))
      .map(function (c) {
        return '<button type="button" class="chip" data-cat="' + esc(c[0]) + '" aria-pressed="' + (state.cat === c[0]) + '">' + esc(c[1]) + '</button>';
      }).join('');
    var sorts = ['default', 'priceAsc', 'priceDesc', 'name'].map(function (s) {
      return '<option value="' + s + '"' + (state.sort === s ? ' selected' : '') + '>' + esc(t('catalog.sort.' + s)) + '</option>';
    }).join('');

    app.innerHTML =
      '<div class="container section">' +
        '<h1 id="catalog-title"></h1>' +
        '<div class="chips" role="group">' + chips + '</div>' +
        '<div class="filters">' +
          '<input type="search" id="q" placeholder="' + esc(t('catalog.search')) + '" value="' + esc(state.q) + '" aria-label="' + esc(t('catalog.search')) + '">' +
          '<label class="check"><input type="checkbox" id="stock"' + (state.stock ? ' checked' : '') + '> ' + esc(t('catalog.inStockOnly')) + '</label>' +
          '<select id="sort" aria-label="' + esc(t('catalog.sort')) + '">' + sorts + '</select>' +
          '<div class="price-filter">' +
            '<label class="price-filter-label">' + esc(t('filter.price')) + ':</label>' +
            '<input type="number" id="price-min" placeholder="' + esc(t('filter.from')) + '" min="0" style="width:110px">' +
            '<span>—</span>' +
            '<input type="number" id="price-max" placeholder="' + esc(t('filter.to')) + '" min="0" style="width:110px">' +
            '<button type="button" class="btn btn-primary btn-sm" id="price-apply">' + esc(t('filter.apply')) + '</button>' +
            '<button type="button" class="link-btn" id="price-reset">' + esc(t('filter.reset')) + '</button>' +
          '</div>' +
        '</div>' +
        '<p class="muted" id="found"></p>' +
        '<div class="product-grid" id="grid"></div>' +
      '</div>';

    function apply() {
      var q = state.q.trim().toLowerCase();
      var list = PRODUCTS.filter(function (p) {
        if (state.cat && p.categoryId !== state.cat) return false;
        if (state.stock && !p.inStock) return false;
        if (q) {
          var hay = (p.nameUz + ' ' + (p.nameRu || '') + ' ' + p.sku + ' ' + (p.brand || '')).toLowerCase();
          return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
        }
        return true;
      });
      var priceMin = parseInt($('#price-min') && $('#price-min').value, 10) || 0;
      var priceMax = parseInt($('#price-max') && $('#price-max').value, 10) || 0;
      if (priceMin > 0) list = list.filter(function (p) { return p.retailPrice >= priceMin; });
      if (priceMax > 0) list = list.filter(function (p) { return p.retailPrice <= priceMax; });
      if (state.sort === 'priceAsc') list.sort(function (a, b) { return a.retailPrice - b.retailPrice; });
      if (state.sort === 'priceDesc') list.sort(function (a, b) { return b.retailPrice - a.retailPrice; });
      if (state.sort === 'name') list.sort(function (a, b) { return loc(a, 'name').localeCompare(loc(b, 'name'), lang); });

      var c = findCategory(state.cat);
      $('#catalog-title').textContent = c ? loc(c, 'name') : t('catalog.title');
      setMeta(c ? loc(c, 'name') : t('catalog.title'));
      $('#found').textContent = t('catalog.found', { n: list.length });
      $('#grid').innerHTML = list.length ? list.map(productCard).join('') : '<p class="empty">' + esc(t('catalog.empty')) + '</p>';
      bindAddButtons($('#grid'));
      bindCardFeatures($('#grid'));
    if (window.ANIM) window.ANIM.init();
      $all('.chip', app).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-cat') === state.cat)); });

      var sp = new URLSearchParams();
      if (state.cat) sp.set('cat', state.cat);
      if (state.q) sp.set('q', state.q);
      if (state.sort !== 'default') sp.set('sort', state.sort);
      if (state.stock) sp.set('stock', '1');
      var qs = sp.toString();
      history.replaceState(null, '', 'catalog.html' + (qs ? '?' + qs : ''));
    }

    $all('.chip', app).forEach(function (b) {
      b.addEventListener('click', function () { state.cat = b.getAttribute('data-cat'); apply(); });
    });
    $('#q').addEventListener('input', function (e) { state.q = e.target.value; apply(); });
    $('#sort').addEventListener('change', function (e) { state.sort = e.target.value; apply(); });
    $('#stock').addEventListener('change', function (e) { state.stock = e.target.checked; apply(); });
    var priceApply = $('#price-apply');
    var priceReset = $('#price-reset');
    if (priceApply) priceApply.addEventListener('click', apply);
    if (priceReset) {
      priceReset.addEventListener('click', function () {
        if ($('#price-min')) $('#price-min').value = '';
        if ($('#price-max')) $('#price-max').value = '';
        apply();
      });
    }
    apply();
  }

  function pageProduct(app) {
    var p = findProduct(param('sku'));
    if (!p) {
      setMeta(t('product.notFound'));
      app.innerHTML = '<div class="container section center"><h1>' + esc(t('product.notFound')) + '</h1>' +
        '<a class="btn btn-primary" href="catalog.html">' + esc(t('product.backToCatalog')) + '</a></div>';
      return;
    }
    var c = findCategory(p.categoryId);
    setMeta(loc(p, 'name'), loc(p, 'desc'));

    var specs = (p.specs || []).map(function (s) {
      return '<tr><th>' + esc(lang === 'ru' ? s[1] : s[0]) + '</th><td>' + esc(s[2]) + '</td></tr>';
    }).join('');
    var related = PRODUCTS.filter(function (x) { return x.categoryId === p.categoryId && x.sku !== p.sku; }).slice(0, 4);

    app.innerHTML =
      '<div class="container section">' +
        '<nav class="breadcrumbs" aria-label="breadcrumb"><a href="index.html">' + esc(t('nav.home')) + '</a> / <a href="catalog.html">' + esc(t('nav.catalog')) + '</a>' +
          (c ? ' / <a href="catalog.html?cat=' + encodeURIComponent(c.id) + '">' + esc(loc(c, 'name')) + '</a>' : '') + '</nav>' +
        '<div class="product">' +
          '<div class="product-img"><img src="' + esc(productImage(p)) + '" alt="' + esc(loc(p, 'name')) + '" width="320" height="320"></div>' +
          '<div class="product-info">' +
            '<h1>' + esc(loc(p, 'name')) + '</h1>' +
            '<p class="muted">' + esc(t('product.sku')) + ': ' + esc(p.sku) + (p.brand ? ' · ' + esc(t('product.brand')) + ': ' + esc(p.brand) : '') + '</p>' +
            stockBadge(p) +
            '<div class="product-price">' + priceBlock(p) + '</div>' +
            '<p class="muted small">' + esc(t('product.wholesaleNote')) + '</p>' +
            '<div class="buy-row">' +
              '<label class="qty"><span class="sr-only">' + esc(t('product.qty')) + '</span>' +
                '<button type="button" data-step="-1" aria-label="−">−</button>' +
                '<input type="number" id="qty" min="1" max="9999" value="1" inputmode="numeric">' +
                '<button type="button" data-step="1" aria-label="+">+</button></label>' +
              '<button type="button" class="btn btn-primary" data-add="' + esc(p.sku) + '" data-qty-input="#qty">' + esc(t('product.add')) + '</button>' +
            '</div>' +
            '<div class="product-extra-actions">' +
              '<button type="button" class="btn btn-light btn-sm wish-btn" data-wish-btn="' + esc(p.sku) + '">' +
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> ' + esc(t('wish.add')) +
              '</button>' +
              '<button type="button" class="btn btn-light btn-sm cmp-btn" data-cmp-btn="' + esc(p.sku) + '">' +
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> ' + esc(t('compare.add')) +
              '</button>' +
            '</div>' +
            '<p>' + esc(loc(p, 'desc')) + '</p>' +
            (specs ? '<h2 class="h3">' + esc(t('product.specs')) + '</h2><table class="specs">' + specs + '</table>' : '') +
          '</div>' +
        '</div>' +
        (related.length ? '<section class="section"><h2>' + esc(t('product.related')) + '</h2><div class="product-grid">' + related.map(productCard).join('') + '</div></section>' : '') +
        '<section class="section container">' +
          '<div class="calc-box">' +
            '<h2>' + esc(t('calc.title')) + ': ' + esc(loc(p, 'name')) + '</h2>' +
            '<div class="calc-row">' +
              '<label class="qty"><span>' + esc(t('calc.qty')) + ':</span>' +
                '<button type="button" data-step="-1" class="calc-step">−</button>' +
                '<input type="number" id="calc-qty" min="1" max="9999" value="1" inputmode="numeric">' +
                '<button type="button" data-step="1" class="calc-step">+</button>' +
              '</label>' +
              '<div class="calc-result">' + esc(t('calc.total')) + ': <strong id="calc-total">' + formatPrice(p.retailPrice) + '</strong>' +
                '<small> ' + esc(t('per')) + ' ' + esc(unitLabel(p)) + '</small>' +
              '</div>' +
            '</div>' +
            '<p class="muted small">' + esc(t('calc.note')) + '</p>' +
          '</div>' +
        '</section>' +
      '</div>';

    // Mahsulotni ko'rilganlarga qo'sh
    if (window.FEAT) FEAT.addRecent(p.sku);
    if (window.FEAT) FEAT.trackVisit('product', p.sku);

    // Ko'rilgan mahsulotlar
    if (window.FEAT) {
      var recentSkus = FEAT.getRecent().filter(function (s) { return s !== p.sku; }).slice(0, 4);
      var recentProds = recentSkus.map(findProduct).filter(Boolean);
      if (recentProds.length) {
        var recentSec = document.createElement('section');
        recentSec.className = 'section container';
        recentSec.innerHTML = '<h2>' + esc(t('recent.title')) + '</h2><div class="product-grid">' + recentProds.map(productCard).join('') + '</div>';
        $('#app').appendChild(recentSec);
        bindAddButtons(recentSec);
        bindCardFeatures(recentSec);
      }
    }

    $all('[data-step]', app).forEach(function (b) {
      b.addEventListener('click', function () {
        var input = $('#qty');
        input.value = Math.min(9999, Math.max(1, (parseInt(input.value, 10) || 1) + parseInt(b.getAttribute('data-step'), 10)));
      });
    });

    // Kalkulyator
    var calcQty = $('#calc-qty');
    var calcTotal = $('#calc-total');
    function updateCalc() {
      if (!calcQty || !calcTotal) return;
      var qty = Math.max(1, parseInt(calcQty.value, 10) || 1);
      calcTotal.textContent = formatPrice(p.retailPrice * qty);
    }
    if (calcQty) {
      calcQty.addEventListener('input', updateCalc);
      $all('.calc-step', app).forEach(function (b) {
        b.addEventListener('click', function () {
          if (!calcQty) return;
          calcQty.value = Math.min(9999, Math.max(1, (parseInt(calcQty.value, 10) || 1) + parseInt(b.getAttribute('data-step'), 10)));
          updateCalc();
        });
      });
    }

    bindAddButtons(app);
    // Wish va compare tugmalarini bind qilish (mahsulot sahifasida)
    bindCardFeatures(app);
    if (window.ANIM) window.ANIM.init();
    addProductJsonLd(p);
  }

  function addProductJsonLd(p) {
    var data = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: loc(p, 'name'),
      sku: p.sku,
      description: loc(p, 'desc'),
      image: new URL(productImage(p), location.href).href,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'UZS',
        price: p.retailPrice,
        availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      },
    };
    if (p.brand) data.brand = { '@type': 'Brand', name: p.brand };
    addJsonLd('product-jsonld', data);
  }

  // ---------- Savatcha va buyurtma ----------

  function normalizePhone(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (d.length === 9) d = '998' + d;
    return /^998\d{9}$/.test(d) ? '+' + d : null;
  }

  function orderText(data, lines) {
    var out = [];
    out.push(lang === 'ru' ? 'Новый заказ с сайта' : 'Saytdan yangi buyurtma');
    out.push('');
    lines.forEach(function (l, i) {
      out.push((i + 1) + '. ' + loc(l.product, 'name') + ' (' + l.product.sku + ')');
      out.push('   ' + l.qty + ' ' + unitLabel(l.product) + ' × ' + formatPrice(l.product.retailPrice) + ' = ' + formatPrice(l.sum));
    });
    out.push('');
    out.push(t('cart.total') + ': ' + formatPrice(cartTotal(lines)));
    out.push('');
    out.push(t('order.name') + ': ' + data.name);
    out.push(t('order.phone') + ': ' + data.phone);
    out.push(t('order.delivery') + ': ' + (data.delivery === 'courier' ? t('order.courier') : t('order.pickup')));
    if (data.delivery === 'courier') out.push(t('order.address') + ': ' + data.address);
    if (data.comment) out.push(t('order.comment').replace(/\s*\(.*\)$/, '') + ': ' + data.comment);
    return out.join('\n');
  }

  function pageCart(app) {
    setMeta(t('cart.title'));
    var lines = cartLines();

    if (!lines.length) {
      app.innerHTML = '<div class="container section center"><h1>' + esc(t('cart.title')) + '</h1><p>' + esc(t('cart.empty')) + '</p>' +
        '<a class="btn btn-primary" href="catalog.html">' + esc(t('cart.goCatalog')) + '</a></div>';
      return;
    }

    var draft = storageGet(DRAFT_KEY, {}) || {};
    var rows = lines.map(function (l) {
      var p = l.product;
      return '<li class="cart-row">' +
        '<a href="' + productUrl(p) + '" class="cart-img"><img src="' + esc(productImage(p)) + '" alt="" width="64" height="64"></a>' +
        '<div class="cart-name"><a href="' + productUrl(p) + '">' + esc(loc(p, 'name')) + '</a><small>' + formatPrice(p.retailPrice) + ' ' + esc(t('per')) + ' ' + esc(unitLabel(p)) + '</small></div>' +
        '<div class="qty">' +
          '<button type="button" data-cart-step="-1" data-sku="' + esc(p.sku) + '" aria-label="−">−</button>' +
          '<input type="number" min="1" max="9999" value="' + l.qty + '" data-cart-qty="' + esc(p.sku) + '" aria-label="' + esc(t('product.qty')) + '">' +
          '<button type="button" data-cart-step="1" data-sku="' + esc(p.sku) + '" aria-label="+">+</button>' +
        '</div>' +
        '<div class="cart-sum">' + formatPrice(l.sum) + '</div>' +
        '<button type="button" class="link-btn" data-remove="' + esc(p.sku) + '">' + esc(t('cart.remove')) + '</button>' +
      '</li>';
    }).join('');

    var courier = draft.delivery === 'courier';
    app.innerHTML =
      '<div class="container section">' +
        '<h1>' + esc(t('cart.title')) + '</h1>' +
        '<div class="cart-layout">' +
          '<div>' +
            '<ul class="cart-list">' + rows + '</ul>' +
            '<div class="cart-total"><span>' + esc(t('cart.total')) + ':</span> <strong>' + formatPrice(cartTotal(lines)) + '</strong></div>' +
            '<p class="muted small">' + esc(t('cart.priceNote')) + '</p>' +
            '<button type="button" class="link-btn" id="clear-cart">' + esc(t('cart.clear')) + '</button>' +
          '</div>' +
          '<form class="order-form" id="order-form" novalidate>' +
            '<h2>' + esc(t('order.title')) + '</h2>' +
            '<label>' + esc(t('order.name')) + '<input name="name" autocomplete="name" maxlength="80" required value="' + esc(draft.name) + '"></label>' +
            '<label>' + esc(t('order.phone')) + '<input name="phone" type="tel" autocomplete="tel" maxlength="20" placeholder="+998 90 123 45 67" required value="' + esc(draft.phone) + '"></label>' +
            '<fieldset><legend>' + esc(t('order.delivery')) + '</legend>' +
              '<label class="check"><input type="radio" name="delivery" value="pickup"' + (courier ? '' : ' checked') + '> ' + esc(t('order.pickup')) + '</label>' +
              '<label class="check"><input type="radio" name="delivery" value="courier"' + (courier ? ' checked' : '') + '> ' + esc(t('order.courier')) + '</label>' +
            '</fieldset>' +
            '<label id="address-field"' + (courier ? '' : ' hidden') + '>' + esc(t('order.address')) + '<input name="address" autocomplete="street-address" maxlength="200" value="' + esc(draft.address) + '"></label>' +
            '<label>' + esc(t('order.comment')) + '<textarea name="comment" rows="3" maxlength="500">' + esc(draft.comment) + '</textarea></label>' +
            // Botlar uchun tuzoq: odam bu maydonni ko'rmaydi
            '<label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>' +
            '<p class="form-error" id="form-error" role="alert" hidden></p>' +
            '<button type="submit" class="btn btn-accent btn-block">' + esc(t('order.submit')) + '</button>' +
          '</form>' +
        '</div>' +
      '</div>';

    // Savatcha sahifasi
    function refresh() { render(); }

    $all('[data-cart-step]', app).forEach(function (b) {
      b.addEventListener('click', function () {
        var sku = b.getAttribute('data-sku');
        var cart = getCart();
        setCartQty(sku, Math.max(1, (cart[sku] || 1) + parseInt(b.getAttribute('data-cart-step'), 10)));
        refresh();
      });
    });
    $all('[data-cart-qty]', app).forEach(function (input) {
      input.addEventListener('change', function () {
        setCartQty(input.getAttribute('data-cart-qty'), Math.max(1, parseInt(input.value, 10) || 1));
        refresh();
      });
    });
    $all('[data-remove]', app).forEach(function (b) {
      b.addEventListener('click', function () { setCartQty(b.getAttribute('data-remove'), 0); refresh(); });
    });
    $('#clear-cart').addEventListener('click', function () { saveCart({}); refresh(); });

    var form = $('#order-form');
    if (window.ANIM) window.ANIM.init();
    function readForm() {
      var fd = new FormData(form);
      return {
        name: String(fd.get('name') || '').trim(),
        phone: String(fd.get('phone') || '').trim(),
        delivery: fd.get('delivery') === 'courier' ? 'courier' : 'pickup',
        address: String(fd.get('address') || '').trim(),
        comment: String(fd.get('comment') || '').trim(),
        website: String(fd.get('website') || ''),
      };
    }
    form.addEventListener('input', function () {
      var d = readForm();
      $('#address-field').hidden = d.delivery !== 'courier';
      storageSet(DRAFT_KEY, { name: d.name, phone: d.phone, delivery: d.delivery, address: d.address, comment: d.comment });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = readForm();
      var errorEl = $('#form-error');
      var error = '';
      var phone = normalizePhone(d.phone);
      if (!d.name) error = t('order.errName');
      else if (!phone) error = t('order.errPhone');
      else if (d.delivery === 'courier' && !d.address) error = t('order.errAddress');
      if (error) { errorEl.textContent = error; errorEl.hidden = false; return; }
      errorEl.hidden = true;
      d.phone = phone;

      var lines = cartLines();
      var text = orderText(d, lines);
      var payload = {
        name: d.name, phone: d.phone, delivery: d.delivery, address: d.address, comment: d.comment,
        website: d.website, lang: lang,
        items: lines.map(function (l) { return { sku: l.product.sku, qty: l.qty }; }),
        text: text,
      };

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = t('order.sending');

      fetch(CFG.orderEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && j.ok; }); })
        .catch(function () { return false; })
        .then(function (ok) {
          if (ok) {
            saveCart({});
            storageSet(DRAFT_KEY, {});
            app.innerHTML = '<div class="container section center"><div class="success-icon" aria-hidden="true">✓</div><h1>' + esc(t('order.success')) + '</h1>' +
              '<a class="btn btn-primary" href="catalog.html">' + esc(t('cart.goCatalog')) + '</a></div>';
            window.scrollTo(0, 0);
          } else {
            btn.disabled = false;
            btn.textContent = t('order.submit');
            showFallback(text);
          }
        });
    });
  }

  /** Server buyurtmani qabul qila olmasa: matnni nusxalash va Telegram/telefon orqali yuborish. */
  function showFallback(text) {
    var old = $('#fallback');
    if (old) old.remove();
    var box = document.createElement('div');
    box.id = 'fallback';
    box.className = 'fallback';
    box.innerHTML = '<h3>' + esc(t('order.fallbackTitle')) + '</h3><p>' + esc(t('order.fallbackText')) + '</p>' +
      '<textarea readonly rows="8">' + esc(text) + '</textarea>' +
      '<div class="fallback-buttons"><button type="button" class="btn btn-primary" id="copy-order">' + esc(t('order.copy')) + '</button>' +
      (CFG.telegram ? '<a class="btn btn-light" href="' + esc(telegramUrl()) + '" target="_blank" rel="noopener">' + esc(t('order.sendTelegram')) + '</a>' : '') +
      phoneLink('btn btn-light') + '</div>';
    $('#order-form').appendChild(box);
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });

    $('#copy-order').addEventListener('click', function () {
      var btn = this;
      var area = box.querySelector('textarea');
      function done() { btn.textContent = t('order.copied'); }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { area.select(); document.execCommand('copy'); done(); });
      } else {
        area.select(); document.execCommand('copy'); done();
      }
    });
  }

  function pageAbout(app) {
    setMeta(t('about.title'), t('about.p1'));
    var tg = CFG.telegram ? '<a class="btn btn-primary" href="' + esc(telegramUrl()) + '" target="_blank" rel="noopener">' + esc(t('contact.write')) + '</a>' : '';
    app.innerHTML =
      '<div class="container section">' +
        '<h1>' + esc(t('about.title')) + '</h1>' +
        '<div class="about-grid">' +
          '<div class="prose"><p>' + esc(t('about.p1')) + '</p><p>' + esc(t('about.p2')) + '</p></div>' +
          '<div class="contact-card" id="contact"><h2>' + esc(t('contact.title')) + '</h2>' + contactList() +
            '<div class="cta-buttons">' + phoneLink('btn btn-accent', t('hero.call')) + tg + '</div></div>' +
        '</div>' +
      '</div>';
    if (window.ANIM) window.ANIM.init();
  }

  function page404(app) {
    setMeta(t('notFound.title'));
    app.innerHTML = '<div class="container section center"><h1>' + esc(t('notFound.title')) + '</h1><p>' + esc(t('notFound.text')) + '</p>' +
      '<a class="btn btn-primary" href="index.html">' + esc(t('nav.home')) + '</a></div>';
  }

  var PAGES = { home: pageHome, catalog: pageCatalog, product: pageProduct, cart: pageCart, about: pageAbout, wishlist: pageWishlist, compare: pageCompare, wholesale: pageWholesale, 'room-calc': pageRoomCalc, '404': page404 };

  // ========== SEVIMLILAR ==========
  function pageWishlist(app) {
    setMeta(t('wish.title'));
    var skus = window.FEAT ? FEAT.getWish() : [];
    var prods = skus.map(findProduct).filter(Boolean);
    if (!prods.length) {
      app.innerHTML = '<div class="container section"><h1>' + esc(t('wish.title')) + '</h1>' +
        '<div class="wish-empty">' +
          '<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" style="display:block;margin:0 auto 12px;opacity:.3"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
          '<p>' + esc(t('wish.empty')) + '</p>' +
          '<a class="btn btn-primary" href="catalog.html">' + esc(t('catalog.title')) + '</a>' +
        '</div></div>';
      return;
    }
    app.innerHTML = '<div class="container section"><h1>' + esc(t('wish.title')) + ' (' + prods.length + ')</h1>' +
      '<div class="product-grid">' + prods.map(productCard).join('') + '</div></div>';
    bindAddButtons(app);
    bindCardFeatures(app);
    if (window.ANIM) window.ANIM.init();
  }

  // ========== SOLISHTIRISH ==========
  function pageCompare(app) {
    setMeta(t('compare.title'));
    var skus = window.FEAT ? FEAT.getCompare() : [];
    var prods = skus.map(findProduct).filter(Boolean);
    if (!prods.length) {
      app.innerHTML = '<div class="container section"><h1>' + esc(t('compare.title')) + '</h1>' +
        '<div class="compare-empty">' +
          '<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" style="display:block;margin:0 auto 12px;opacity:.3"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>' +
          '<p>' + esc(t('compare.empty')) + '</p>' +
          '<a class="btn btn-primary" href="catalog.html">' + esc(t('catalog.title')) + '</a>' +
        '</div></div>';
      return;
    }
    var allSpecs = {};
    prods.forEach(function (p) {
      (p.specs || []).forEach(function (s) {
        var key = lang === 'ru' ? s[1] : s[0];
        allSpecs[key] = true;
      });
    });
    var specKeys = Object.keys(allSpecs);
    var cols = prods.map(function (p) {
      return '<td>' +
        '<a href="' + productUrl(p) + '"><img style="width:100px;height:100px;object-fit:contain;background:#f0f4fc;border-radius:8px;padding:8px;display:block" src="' + esc(productImage(p)) + '" alt="' + esc(loc(p, 'name')) + '"></a>' +
        '<p style="font-weight:700;margin:8px 0 4px"><a href="' + productUrl(p) + '">' + esc(loc(p, 'name')) + '</a></p>' +
        '<button type="button" class="compare-remove" data-cmp-remove="' + esc(p.sku) + '">' + esc(t('compare.remove')) + '</button>' +
      '</td>';
    }).join('');
    var priceRow = '<tr><th>' + esc(lang === 'ru' ? 'Цена' : 'Narx') + '</th>' +
      prods.map(function (p) { return '<td style="font-size:1.2rem;font-weight:800;color:var(--blue-dark)">' + priceBlock(p) + '</td>'; }).join('') + '</tr>';
    var stockRow = '<tr><th>' + esc(lang === 'ru' ? 'Наличие' : 'Mavjudlik') + '</th>' +
      prods.map(function (p) { return '<td>' + stockBadge(p) + '</td>'; }).join('') + '</tr>';
    var addRow = '<tr><th></th>' +
      prods.map(function (p) { return '<td><button class="btn btn-primary btn-sm btn-block" type="button" data-add="' + esc(p.sku) + '">' + esc(t('product.add')) + '</button></td>'; }).join('') + '</tr>';
    var specRows = specKeys.map(function (key) {
      return '<tr><th>' + esc(key) + '</th>' +
        prods.map(function (p) {
          var sp = (p.specs || []).filter(function (s) { return (lang === 'ru' ? s[1] : s[0]) === key; })[0];
          return '<td>' + (sp ? esc(sp[2]) : '<span style="color:var(--border)">—</span>') + '</td>';
        }).join('') + '</tr>';
    }).join('');
    app.innerHTML = '<div class="container section">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap;margin-bottom:20px">' +
        '<h1>' + esc(t('compare.title')) + ' (' + prods.length + ')</h1>' +
        '<button type="button" class="link-btn" id="cmp-clear-all">' + esc(t('compare.clear')) + '</button>' +
      '</div>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;background:var(--white);border:1px solid var(--border);border-radius:var(--radius)">' +
        '<thead><tr><th style="background:var(--bg);padding:12px 16px;width:160px;font-size:.88rem;color:var(--muted)"></th>' + cols + '</tr></thead>' +
        '<tbody>' + priceRow + stockRow + specRows + addRow + '</tbody>' +
      '</table></div></div>';
    bindAddButtons(app);
    var clearAll = $('#cmp-clear-all');
    if (clearAll) clearAll.addEventListener('click', function () { if (window.FEAT) { FEAT.saveCompare([]); render(); } });
    $all('[data-cmp-remove]', app).forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!window.FEAT) return;
        var newSkus = FEAT.getCompare().filter(function (s) { return s !== btn.getAttribute('data-cmp-remove'); });
        FEAT.saveCompare(newSkus);
        render();
      });
    });
  }

  // ========== ULGURJI SO'ROV ==========
  function pageWholesale(app) {
    setMeta(t('wholesale.title'));
    app.innerHTML = '<div class="container section">' +
      '<h1>' + esc(t('wholesale.title')) + '</h1>' +
      '<p class="muted" style="max-width:600px;margin-bottom:28px">' +
        esc(lang === 'ru'
          ? 'Для крупных заказов, строительных организаций и мастеров. Заполните форму — свяжемся в течение рабочего дня.'
          : "Yirik buyurtmalar, qurilish tashkilotlari va ustalar uchun. Formani to'ldiring — ish kuni ichida bog'lanamiz.") +
      '</p>' +
      '<form class="wholesale-form" id="wholesale-form" novalidate>' +
        '<label>' + esc(t('wholesale.company')) + ' <span class="muted small">(' + esc(lang === 'ru' ? 'необязательно' : 'ixtiyoriy') + ')</span><input name="company" maxlength="120" autocomplete="organization"></label>' +
        '<label>' + esc(t('wholesale.name')) + ' *<input name="wh-name" required maxlength="80" autocomplete="name"></label>' +
        '<label>' + esc(t('wholesale.phone')) + ' *<input name="wh-phone" type="tel" required maxlength="20" placeholder="+998 90 123 45 67" autocomplete="tel"></label>' +
        '<label>' + esc(t('wholesale.items')) + ' *<textarea name="items" required maxlength="1000" rows="5"></textarea></label>' +
        '<label>' + esc(t('order.comment')) + '<textarea name="comment" maxlength="500" rows="3"></textarea></label>' +
        '<label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>' +
        '<p class="form-error" id="wh-error" role="alert" hidden></p>' +
        '<button type="submit" class="btn btn-accent btn-block">' + esc(t('wholesale.submit')) + '</button>' +
      '</form></div>';
    var form = $('#wholesale-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var name  = String(fd.get('wh-name')  || '').trim();
      var phone = String(fd.get('wh-phone') || '').trim();
      var items = String(fd.get('items')    || '').trim();
      var website = String(fd.get('website') || '');
      var errEl = $('#wh-error');
      var d = phone.replace(/\D/g, '');
      if (d.length === 9) d = '998' + d;
      var normPhone = /^998\d{9}$/.test(d) ? '+' + d : null;
      if (website) { errEl.hidden = true; return; }
      var err = !name ? t('order.errName') : !normPhone ? t('order.errPhone') : !items ? (lang === 'ru' ? 'Укажите нужные товары.' : "Kerakli mahsulotlarni kiriting.") : '';
      if (err) { errEl.textContent = err; errEl.hidden = false; return; }
      errEl.hidden = true;
      var text = (lang === 'ru' ? 'Оптовый запрос с сайта' : "Saytdan ulgurji so'rov") + '\n' +
        (lang === 'ru' ? 'Компания' : 'Kompaniya') + ': ' + (String(fd.get('company') || '').trim() || '—') + '\n' +
        t('wholesale.name') + ': ' + name + '\n' + t('wholesale.phone') + ': ' + normPhone + '\n\n' +
        t('wholesale.items') + ':\n' + items +
        (String(fd.get('comment') || '').trim() ? '\n\n' + (lang === 'ru' ? 'Комментарий' : 'Izoh') + ': ' + String(fd.get('comment') || '').trim() : '');
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = t('order.sending');
      fetch(CFG.orderEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, phone: normPhone, text: text, items: [] }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && j.ok; }); })
        .catch(function () { return false; })
        .then(function (ok) {
          if (ok) {
            app.innerHTML = '<div class="container section center"><div class="success-icon">✓</div><h1>' + esc(t('wholesale.success')) + '</h1><a class="btn btn-primary" href="catalog.html">' + esc(t('catalog.title')) + '</a></div>';
          } else {
            btn.disabled = false; btn.textContent = t('wholesale.submit');
            errEl.textContent = lang === 'ru' ? 'Ошибка. Напишите нам напрямую.' : "Xato. Bizga to'g'ridan-to'g'ri yozing.";
            errEl.hidden = false;
          }
        });
    });
  }

  // ========== XONA KALKULYATORI ==========
  function pageRoomCalc(app) {
    setMeta(t('calc.room.title'));
    app.innerHTML = '<div class="container section">' +
      '<h1>' + esc(t('calc.room.title')) + '</h1>' +
      '<p class="muted" style="max-width:600px;margin-bottom:24px">' + esc(t('calc.room.desc')) + '</p>' +
      '<div class="room-calc">' +
        '<div class="room-inputs">' +
          '<label>' + esc(t('calc.room.length')) + '<input type="number" id="rc-length" min="1" max="100" value="5" step="0.5"></label>' +
          '<label>' + esc(t('calc.room.width'))  + '<input type="number" id="rc-width"  min="1" max="100" value="4" step="0.5"></label>' +
          '<label>' + esc(t('calc.room.height')) + '<input type="number" id="rc-height" min="2" max="6"   value="2.7" step="0.1"></label>' +
        '</div>' +
        '<button type="button" class="btn btn-primary" id="rc-calc">' + esc(t('calc.room.btn')) + '</button>' +
        '<div class="room-result" id="rc-result">' +
          '<h3>' + esc(t('calc.room.result')) + '</h3>' +
          '<div class="room-result-grid">' +
            '<div class="room-result-item"><div class="r-num" id="rc-sections">—</div><div class="r-label">' + esc(t('calc.room.radiators')) + '</div><div class="r-note">' + esc(lang === 'ru' ? 'секций (500 мм, алюминий)' : 'seksiya (500 mm, alyumin)') + '</div></div>' +
            '<div class="room-result-item"><div class="r-num" id="rc-heat">—</div><div class="r-label">' + esc(t('calc.room.heat')) + '</div><div class="r-note">Вт / Vt</div></div>' +
            '<div class="room-result-item"><div class="r-num" id="rc-hot">—</div><div class="r-label">' + esc(t('calc.room.pipe.hot')) + '</div><div class="r-note">' + esc(lang === 'ru' ? 'метров, PPR PN20' : 'metr, PPR PN20') + '</div></div>' +
            '<div class="room-result-item"><div class="r-num" id="rc-cold">—</div><div class="r-label">' + esc(t('calc.room.pipe.cold')) + '</div><div class="r-note">' + esc(lang === 'ru' ? 'метров, PPR PN20' : 'metr, PPR PN20') + '</div></div>' +
          '</div>' +
          '<p class="muted small">' + esc(t('calc.room.note')) + '</p>' +
          '<a class="btn btn-accent" href="catalog.html?cat=radiators" style="margin-top:8px">' + esc(lang === 'ru' ? 'Смотреть радиаторы' : 'Radiatorlarni ko\'rish') + '</a>' +
        '</div>' +
      '</div></div>';
    function calc() {
      var L = parseFloat($('#rc-length').value) || 5;
      var W = parseFloat($('#rc-width').value)  || 4;
      var H = parseFloat($('#rc-height').value) || 2.7;
      var area = L * W;
      var heatLoad = Math.round(area * H * 40);
      var sections = Math.ceil(heatLoad / 180);
      var perimeter = 2 * (L + W);
      var pipe = Math.ceil(perimeter * 1.2);
      $('#rc-sections').textContent = sections;
      $('#rc-heat').textContent = heatLoad + ' Vt';
      $('#rc-hot').textContent = pipe + ' m';
      $('#rc-cold').textContent = pipe + ' m';
      $('#rc-result').classList.add('visible');
    }
    $('#rc-calc').addEventListener('click', calc);
    calc();
  }

  function render() {
    var page = document.body.getAttribute('data-page');
    document.documentElement.lang = lang;
    renderHeader(page);
    renderFooter();
    (PAGES[page] || page404)($('#app'));
    updateCartBadge();
    if (window.FEAT) FEAT.init();
    if (window.FEAT) showCompareBar();
    renderFloatingBtn();
  }

  function renderFloatingBtn() {
    var existing = document.getElementById('floating-btn');
    if (existing) existing.remove();
    if (!CFG.telegram && !CFG.phone) return;
    var btn = document.createElement('div');
    btn.id = 'floating-btn';
    btn.className = 'floating-btn';
    var inner = '';
    if (CFG.telegram) {
      inner += '<a href="https://t.me/' + encodeURIComponent(CFG.telegram) + '" target="_blank" rel="noopener" class="float-item float-tg" aria-label="Telegram">' +
        '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.038 9.593c-.15.668-.543.832-1.1.517l-3.037-2.237-1.465 1.41c-.162.162-.298.298-.61.298l.217-3.088 5.62-5.073c.244-.217-.053-.337-.378-.12L7.27 14.482l-2.99-.934c-.65-.203-.663-.65.136-.962l11.67-4.502c.542-.196 1.017.12.476.164z"/></svg>' +
      '</a>';
    }
    if (CFG.phone) {
      inner += '<a href="tel:' + encodeURIComponent(CFG.phoneLink) + '" class="float-item float-phone" aria-label="' + esc(CFG.phone) + '">' +
        '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>' +
      '</a>';
    }
    btn.innerHTML = inner;
    document.body.appendChild(btn);
  }

  // Boshqa oynada savatcha o'zgarsa, belgini yangilash
  window.addEventListener('storage', function (e) { if (e.key === CART_KEY) updateCartBadge(); });

  render();
})();

  // ========== SEVIMLILAR SAHIFASI ==========
  function pageWishlist(app) {
    setMeta(t('wish.title'));
    var skus = window.FEAT ? FEAT.getWish() : [];
    var prods = skus.map(findProduct).filter(Boolean);
    if (!prods.length) {
      app.innerHTML = '<div class="container section"><h1>' + esc(t('wish.title')) + '</h1>' +
        '<div class="wish-empty"><svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '<p>' + esc(t('wish.empty')) + '</p>' +
        '<a class="btn btn-primary" href="catalog.html">' + esc(t('catalog.title')) + '</a></div></div>';
      return;
    }
    app.innerHTML = '<div class="container section"><h1>' + esc(t('wish.title')) + ' (' + prods.length + ')</h1>' +
      '<div class="product-grid">' + prods.map(productCard).join('') + '</div></div>';
    bindAddButtons(app);
    bindCardFeatures(app);
    if (window.ANIM) window.ANIM.init();
  }

  // ========== SOLISHTIRISH SAHIFASI ==========
  function pageCompare(app) {
    setMeta(t('compare.title'));
    var skus = window.FEAT ? FEAT.getCompare() : [];
    var prods = skus.map(findProduct).filter(Boolean);
    if (!prods.length) {
      app.innerHTML = '<div class="container section"><h1>' + esc(t('compare.title')) + '</h1>' +
        '<div class="compare-empty"><svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>' +
        '<p>' + esc(t('compare.empty')) + '</p>' +
        '<a class="btn btn-primary" href="catalog.html">' + esc(t('catalog.title')) + '</a></div></div>';
      return;
    }

    // Barcha xususiyatlar ro'yxati
    var allSpecs = {};
    prods.forEach(function (p) {
      (p.specs || []).forEach(function (s) {
        var key = lang === 'ru' ? s[1] : s[0];
        allSpecs[key] = true;
      });
    });
    var specKeys = Object.keys(allSpecs);

    // Mahsulot ustunlari
    var headerCells = prods.map(function (p) {
      return '<td>' +
        '<a href="' + productUrl(p) + '"><img class="compare-img" src="' + esc(productImage(p)) + '" alt="' + esc(loc(p, 'name')) + '"></a>' +
        '<p class="compare-name"><a href="' + productUrl(p) + '">' + esc(loc(p, 'name')) + '</a></p>' +
        '<button type="button" class="compare-remove" data-cmp-remove="' + esc(p.sku) + '">' + esc(t('compare.remove')) + '</button>' +
      '</td>';
    }).join('');

    var priceRow = '<tr><th>' + esc(lang === 'ru' ? 'Цена' : 'Narx') + '</th>' +
      prods.map(function (p) { return '<td class="compare-price">' + priceBlock(p) + '</td>'; }).join('') + '</tr>';

    var stockRow = '<tr><th>' + esc(lang === 'ru' ? 'Наличие' : 'Mavjudlik') + '</th>' +
      prods.map(function (p) { return '<td>' + stockBadge(p) + '</td>'; }).join('') + '</tr>';

    var addRow = '<tr><th></th>' +
      prods.map(function (p) { return '<td><button type="button" class="btn btn-primary btn-sm btn-block" data-add="' + esc(p.sku) + '">' + esc(t('product.add')) + '</button></td>'; }).join('') + '</tr>';

    var specRows = specKeys.map(function (key) {
      return '<tr><th>' + esc(key) + '</th>' +
        prods.map(function (p) {
          var spec = (p.specs || []).find(function (s) { return (lang === 'ru' ? s[1] : s[0]) === key; });
          return '<td>' + (spec ? esc(spec[2]) : '<span style="color:var(--border)">—</span>') + '</td>';
        }).join('') +
      '</tr>';
    }).join('');

    app.innerHTML = '<div class="container section">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap;margin-bottom:20px">' +
        '<h1>' + esc(t('compare.title')) + ' (' + prods.length + ')</h1>' +
        '<button type="button" class="link-btn" id="cmp-clear-all">' + esc(t('compare.clear')) + '</button>' +
      '</div>' +
      '<div class="compare-table-wrap">' +
        '<table class="compare-table">' +
          '<thead><tr><th></th>' + headerCells + '</tr></thead>' +
          '<tbody>' + priceRow + stockRow + specRows + addRow + '</tbody>' +
        '</table>' +
      '</div></div>';

    bindAddButtons(app);
    var clearAll = $('#cmp-clear-all');
    if (clearAll) {
      clearAll.addEventListener('click', function () {
        if (window.FEAT) { FEAT.saveCompare([]); render(); }
      });
    }
    $all('[data-cmp-remove]', app).forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.FEAT) {
          var skus = FEAT.getCompare().filter(function (s) { return s !== btn.getAttribute('data-cmp-remove'); });
          FEAT.saveCompare(skus);
          render();
        }
      });
    });
  }

  // ========== ULGURJI SO'ROV SAHIFASI ==========
  function pageWholesale(app) {
    setMeta(t('wholesale.title'));
    app.innerHTML = '<div class="container section">' +
      '<h1>' + esc(t('wholesale.title')) + '</h1>' +
      '<p class="muted" style="max-width:600px;margin-bottom:28px">' +
        esc(lang === 'ru'
          ? 'Для крупных заказов, строительных организаций и мастеров. Заполните форму — мы свяжемся с вами в течение рабочего дня.'
          : "Yirik buyurtmalar, qurilish tashkilotlari va ustalar uchun. Formani to'ldiring — biz siz bilan ish kuni davomida bog'lanamiz.") +
      '</p>' +
      '<form class="wholesale-form" id="wholesale-form" novalidate>' +
        '<label>' + esc(t('wholesale.company')) + ' <span class="muted small">(' + esc(lang === 'ru' ? 'необязательно' : 'ixtiyoriy') + ')</span>' +
          '<input name="company" maxlength="120" autocomplete="organization">' +
        '</label>' +
        '<label>' + esc(t('wholesale.name')) + ' *<input name="name" required maxlength="80" autocomplete="name"></label>' +
        '<label>' + esc(t('wholesale.phone')) + ' *<input name="phone" type="tel" required maxlength="20" placeholder="+998 90 123 45 67" autocomplete="tel"></label>' +
        '<label>' + esc(t('wholesale.items')) + ' *<textarea name="items" required maxlength="1000" rows="5"></textarea></label>' +
        '<label>' + esc(t('order.comment')) + '<textarea name="comment" maxlength="500" rows="3"></textarea></label>' +
        '<label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>' +
        '<p class="form-error" id="wh-error" role="alert" hidden></p>' +
        '<button type="submit" class="btn btn-accent btn-block">' + esc(t('wholesale.submit')) + '</button>' +
      '</form></div>';

    var form = $('#wholesale-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var name  = (fd.get('name')  || '').toString().trim();
      var phone = (fd.get('phone') || '').toString().trim();
      var items = (fd.get('items') || '').toString().trim();
      var website = (fd.get('website') || '').toString();
      var errEl = $('#wh-error');

      var normPhone = (function(raw) {
        var d = raw.replace(/\D/g, '');
        if (d.length === 9) d = '998' + d;
        return /^998\d{9}$/.test(d) ? '+' + d : null;
      })(phone);

      if (website) { errEl.hidden = true; return; }
      var err = !name ? t('order.errName') : !normPhone ? t('order.errPhone') : !items ? t('wholesale.items') + ' ' + (lang === 'ru' ? 'обязательно' : 'majburiy') : '';
      if (err) { errEl.textContent = err; errEl.hidden = false; return; }
      errEl.hidden = true;

      var text = (lang === 'ru' ? 'Оптовый запрос с сайта' : "Saytdan ulgurji so'rov") + '\n\n' +
        (lang === 'ru' ? 'Компания' : 'Kompaniya') + ': ' + ((fd.get('company') || '').toString().trim() || '—') + '\n' +
        t('wholesale.name') + ': ' + name + '\n' +
        t('wholesale.phone') + ': ' + normPhone + '\n\n' +
        t('wholesale.items') + ':\n' + items +
        ((fd.get('comment') || '').toString().trim() ? '\n\n' + (lang === 'ru' ? 'Комментарий' : 'Izoh') + ': ' + (fd.get('comment') || '').toString().trim() : '');

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = t('order.sending');

      fetch(CFG.orderEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, phone: normPhone, text: text, items: [], website: website }),
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && j.ok; }); })
        .catch(function () { return false; })
        .then(function (ok) {
          if (ok) {
            app.innerHTML = '<div class="container section center">' +
              '<div class="success-icon">✓</div><h1>' + esc(t('wholesale.success')) + '</h1>' +
              '<a class="btn btn-primary" href="catalog.html">' + esc(t('catalog.title')) + '</a></div>';
          } else {
            btn.disabled = false; btn.textContent = t('wholesale.submit');
            var tgUrl = CFG.telegram ? 'https://t.me/' + encodeURIComponent(CFG.telegram) : '';
            errEl.textContent = lang === 'ru' ? 'Ошибка отправки. Напишите нам напрямую.' : "Yuborishda xato. Bizga to'g'ridan-to'g'ri yozing.";
            errEl.hidden = false;
            if (tgUrl) {
              var tgLink = document.createElement('a');
              tgLink.href = tgUrl; tgLink.target = '_blank'; tgLink.rel = 'noopener';
              tgLink.textContent = ' Telegram'; tgLink.className = 'btn btn-light btn-sm';
              tgLink.style.marginTop = '8px';
              errEl.parentNode.insertBefore(tgLink, errEl.nextSibling);
            }
          }
        });
    });
  }
