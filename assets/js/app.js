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

    $('#site-header').innerHTML =
      '<div class="container header-inner">' +
        '<a class="logo" href="index.html" aria-label="' + esc(CFG.name) + '">' +
          '<img src="assets/img/logo.svg" alt="' + esc(CFG.name) + '" height="40" width="200" style="display:block">' +
        '</a>' +
        '<nav class="main-nav" id="main-nav">' + nav + '</nav>' +
        '<div class="header-actions">' +
          phoneLink('header-phone') +
          '<div class="lang-switch" role="group" aria-label="Til / Язык">' + langs + '</div>' +
          '<a class="cart-link" href="cart.html" aria-label="' + esc(t('nav.cart')) + '"' + (page === 'cart' ? ' aria-current="page"' : '') + '>' +
            '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20.5" r="1.3" fill="currentColor"/><circle cx="17.5" cy="20.5" r="1.3" fill="currentColor"/></svg>' +
            '<span class="badge" data-cart-count hidden>0</span>' +
          '</a>' +
          '<button type="button" class="burger" aria-controls="main-nav" aria-expanded="false" aria-label="' + esc(t('nav.menu')) + '"><span></span><span></span><span></span></button>' +
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
          '<div class="footer-logo"><img src="assets/img/logo-white.svg" alt="' + esc(CFG.name) + '" height="40" width="160" style="display:block;margin-bottom:8px"></div>' +
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

  // ---------- Sahifalar ----------

  function pageHome(app) {
    setMeta('', t('hero.text'));
    var cats = CATS.map(function (c) {
      return '<a class="cat-tile" href="catalog.html?cat=' + encodeURIComponent(c.id) + '">' +
        '<img src="' + esc(c.icon) + '" alt="" width="72" height="72"><span>' + esc(loc(c, 'name')) + '</span></a>';
    }).join('');
    var featured = PRODUCTS.filter(function (p) { return p.featured; }).slice(0, 8).map(productCard).join('');
    var why = ['wholesale', 'delivery', 'advice', 'quality'].map(function (k, i) {
      return '<div class="why-item"><span class="why-num">0' + (i + 1) + '</span><h3>' + esc(t('why.' + k + '.t')) + '</h3><p>' + esc(t('why.' + k + '.d')) + '</p></div>';
    }).join('');
    var tg = CFG.telegram ? '<a class="btn btn-light" href="' + esc(telegramUrl()) + '" target="_blank" rel="noopener">' + esc(t('contact.write')) + '</a>' : '';

    app.innerHTML =
      '<section class="hero"><div class="container hero-inner">' +
        '<div class="hero-text"><h1>' + esc(t('hero.title')) + '</h1><p>' + esc(t('hero.text')) + '</p>' +
          '<div class="hero-buttons"><a class="btn btn-accent" href="catalog.html">' + esc(t('hero.catalog')) + '</a>' +
          phoneLink('btn btn-outline-light', t('hero.call')) + '</div></div>' +
        '<div class="hero-art" aria-hidden="true"><img src="assets/img/cat-radiators.svg" alt=""><img src="assets/img/cat-boilers.svg" alt=""><img src="assets/img/cat-valves.svg" alt=""></div>' +
      '</div></section>' +
      '<section class="container section"><h2>' + esc(t('home.categories')) + '</h2><div class="cat-grid">' + cats + '</div></section>' +
      '<section class="container section"><div class="section-head"><h2>' + esc(t('home.featured')) + '</h2><a href="catalog.html">' + esc(t('home.allProducts')) + '</a></div>' +
        '<div class="product-grid">' + featured + '</div></section>' +
      '<section class="section why"><div class="container"><h2>' + esc(t('home.why')) + '</h2><div class="why-grid">' + why + '</div></div></section>' +
      statsBar() +
      // Telefon ham, Telegram ham bo'lmasa, "Bog'laning" bloki ko'rsatilmaydi
      (CFG.phone || tg ? '<section class="container section"><div class="cta"><div><h2>' + esc(t('home.ctaTitle')) + '</h2><p>' + esc(t('home.ctaText')) + '</p></div>' +
        '<div class="cta-buttons">' + phoneLink('btn btn-accent') + tg + '</div></div></section>' : '');
    bindAddButtons(app);
    if (window.ANIM) window.ANIM.init();
    var store = {
      '@context': 'https://schema.org',
      '@type': 'HardwareStore',
      name: CFG.name,
      description: t('hero.text'),
      url: location.origin + '/',
      address: lang === 'ru' ? CFG.addressRu : CFG.addressUz,
      priceRange: '$$',
    };
    if (CFG.phone) store.telephone = CFG.phoneLink;
    addJsonLd('store-jsonld', store);
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
      if (state.sort === 'priceAsc') list.sort(function (a, b) { return a.retailPrice - b.retailPrice; });
      if (state.sort === 'priceDesc') list.sort(function (a, b) { return b.retailPrice - a.retailPrice; });
      if (state.sort === 'name') list.sort(function (a, b) { return loc(a, 'name').localeCompare(loc(b, 'name'), lang); });

      var c = findCategory(state.cat);
      $('#catalog-title').textContent = c ? loc(c, 'name') : t('catalog.title');
      setMeta(c ? loc(c, 'name') : t('catalog.title'));
      $('#found').textContent = t('catalog.found', { n: list.length });
      $('#grid').innerHTML = list.length ? list.map(productCard).join('') : '<p class="empty">' + esc(t('catalog.empty')) + '</p>';
      bindAddButtons($('#grid'));
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
            '<p>' + esc(loc(p, 'desc')) + '</p>' +
            (specs ? '<h2 class="h3">' + esc(t('product.specs')) + '</h2><table class="specs">' + specs + '</table>' : '') +
          '</div>' +
        '</div>' +
        (related.length ? '<section class="section"><h2>' + esc(t('product.related')) + '</h2><div class="product-grid">' + related.map(productCard).join('') + '</div></section>' : '') +
      '</div>';

    $all('[data-step]', app).forEach(function (b) {
      b.addEventListener('click', function () {
        var input = $('#qty');
        input.value = Math.min(9999, Math.max(1, (parseInt(input.value, 10) || 1) + parseInt(b.getAttribute('data-step'), 10)));
      });
    });
    bindAddButtons(app);
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

  var PAGES = { home: pageHome, catalog: pageCatalog, product: pageProduct, cart: pageCart, about: pageAbout, '404': page404 };

  function render() {
    var page = document.body.getAttribute('data-page');
    document.documentElement.lang = lang;
    renderHeader(page);
    renderFooter();
    (PAGES[page] || page404)($('#app'));
    updateCartBadge();
  }

  // Boshqa oynada savatcha o'zgarsa, belgini yangilash
  window.addEventListener('storage', function (e) { if (e.key === CART_KEY) updateCartBadge(); });

  render();
})();
