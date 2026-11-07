/*
 * 2-to'plam funksiyalar:
 *  1. Shtrix-kod / artikul bo'yicha tezkor qidiruv (kamera yoki matn)
 *  2. QR kod generatsiya (mahsulot sahifasida)
 *  3. Mahsulot varaqasini chop etish
 *  4. Hajm kalkulyatori (xona → radiator/truba miqdori)
 *  5. "Kelganda xabar bering" (Telegramga keladi)
 *  6. WhatsApp / Telegram orqali savatcha yuborish
 *  7. Promo kod (chegirma)
 *  8. Google Maps iframe (manzil kiritilgan bo'lsa)
 */
(function () {
  'use strict';

  /* ============================================================
   * 7. PROMO KOD
   * ============================================================ */
  var PROMO_KEY = 'asama_promo';

  // Promo kodlar: { KOD: foiz }
  // config.js da SITE_CONFIG.promoCodes qo'shish mumkin
  var PROMO_CODES = (window.SITE_CONFIG && window.SITE_CONFIG.promoCodes) || {
    'ASAMA10': 10,
    'YANGI5':  5,
  };

  function getActivePromo() {
    try { return JSON.parse(localStorage.getItem(PROMO_KEY)) || null; } catch (e) { return null; }
  }
  function applyPromo(code) {
    var clean = (code || '').trim().toUpperCase();
    var disc = PROMO_CODES[clean];
    if (!disc) return null;
    try { localStorage.setItem(PROMO_KEY, JSON.stringify({ code: clean, discount: disc })); } catch (e) {}
    return disc;
  }
  function removePromo() {
    try { localStorage.removeItem(PROMO_KEY); } catch (e) {}
  }
  function calcDiscount(total) {
    var p = getActivePromo();
    if (!p) return 0;
    return Math.round(total * p.discount / 100);
  }

  /* ============================================================
   * 6. WHATSAPP / TELEGRAM ORQALI SAVATCHA YUBORISH
   * ============================================================ */
  function cartToShareText(lines, total, lang, t, formatPrice, unitLabel) {
    var out = [];
    out.push(lang === 'ru' ? '🛒 Заказ из ASAMA:' : '🛒 ASAMA dan buyurtma:');
    lines.forEach(function (l, i) {
      var name = lang === 'ru' ? (l.product.nameRu || l.product.nameUz) : l.product.nameUz;
      out.push((i + 1) + '. ' + name);
      out.push('   ' + l.qty + ' ' + unitLabel(l.product) + ' × ' + formatPrice(l.product.retailPrice) + ' = ' + formatPrice(l.sum));
    });
    var promo = getActivePromo();
    if (promo) {
      var disc = calcDiscount(total);
      out.push('');
      out.push((lang === 'ru' ? '🏷 Промокод: ' : '🏷 Promo kod: ') + promo.code + ' (−' + promo.discount + '%)');
      out.push((lang === 'ru' ? 'Скидка: ' : 'Chegirma: ') + formatPrice(disc));
      out.push((lang === 'ru' ? 'Итого: ' : 'Jami: ') + formatPrice(total - disc));
    } else {
      out.push('');
      out.push((lang === 'ru' ? 'Итого: ' : 'Jami: ') + formatPrice(total));
    }
    return out.join('\n');
  }

  function whatsappUrl(text, phone) {
    var url = 'https://wa.me/';
    if (phone) url += phone.replace(/\D/g, '');
    return url + '?text=' + encodeURIComponent(text);
  }

  /* ============================================================
   * 1. SHTRIX-KOD / ARTIKUL TEZKOR QIDIRUV
   * ============================================================ */
  function searchByBarcode(value, products) {
    var v = (value || '').trim();
    if (!v) return null;
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      if (p.barcode === v || p.sku === v || p.sku.toLowerCase() === v.toLowerCase()) return p;
    }
    return null;
  }

  /* ============================================================
   * 2. QR KOD (mahsulot URL uchun — tashqi xizmat API)
   * ============================================================ */
  function qrImgUrl(url) {
    // QRServer.com — bepul, maxfiy kalit kerak emas
    return 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' + encodeURIComponent(url);
  }

  /* ============================================================
   * 4. HAJM KALKULYATORI
   * ============================================================ */
  /**
   * Xona hajmidan:
   * - Radiator seksiyalari: har 10 m² uchun ~ 1 kVt, 1 seksiya ~ 0.18 kVt
   * - Truba metraj: perimetr × 2 (issiq + sovuq) + 20% zapas
   */
  function calcRadiators(areaM2, ceilHeight, tempDiff) {
    var heatLoad = areaM2 * ceilHeight * (tempDiff || 40) / 10; // Vt
    var sections = Math.ceil(heatLoad / 180); // 1 seksiya ~ 180 Vt
    return { heatLoad: Math.round(heatLoad), sections: sections };
  }

  function calcPipe(areaM2) {
    // Taxminan: sqrt(area) ~ bir tomonning uzunligi
    var side = Math.sqrt(areaM2);
    var perimeter = side * 4;
    var hotPipe  = Math.ceil(perimeter * 1.2); // m, issiq suv
    var coldPipe = Math.ceil(perimeter * 1.2); // m, sovuq suv
    return { hot: hotPipe, cold: coldPipe };
  }

  /* ============================================================
   * UMUMIY EXPORT
   * ============================================================ */
  window.MORE = {
    // Promo
    getActivePromo: getActivePromo,
    applyPromo: applyPromo,
    removePromo: removePromo,
    calcDiscount: calcDiscount,
    PROMO_CODES: PROMO_CODES,

    // Ulashish
    cartToShareText: cartToShareText,
    whatsappUrl: whatsappUrl,

    // Qidiruv
    searchByBarcode: searchByBarcode,

    // QR
    qrImgUrl: qrImgUrl,

    // Hajm kalkulyatori
    calcRadiators: calcRadiators,
    calcPipe: calcPipe,
  };
})();
