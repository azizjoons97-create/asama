/*
 * Do'kon ma'lumotlari. Shu faylni o'zgartirsangiz, saytning hamma sahifasida yangilanadi.
 * Qiymatlar hozircha namuna: o'zingiznikiga almashtiring.
 */
window.SITE_CONFIG = {
  name: 'ASAMA',
  sloganUz: 'Santexnika va isitish uskunalari',
  sloganRu: 'Сантехника и отопительное оборудование',

  // Hozircha bo'sh: to'ldirilmaguncha telefon tugmalari ko'rinmaydi.
  // Telefon: "phone" ko'rsatish uchun, "phoneLink" qo'ng'iroq havolasi uchun (faqat raqamlar, + bilan)
  phone: '',
  phoneLink: '',
  phone2: '',
  phone2Link: '',

  // Telegram username, @ belgisisiz. Bo'sh qoldirsangiz, Telegram tugmasi ko'rinmaydi.
  telegram: '',
  instagram: '',

  addressUz: "Toshkent sh., manzilni kiriting",
  addressRu: 'г. Ташкент, укажите адрес',
  // Google Maps havolasi (xaritadan "Ulashish" → havolani nusxalash)
  mapLink: '',

  hoursUz: 'Du–Sha: 09:00–19:00, Yakshanba: dam olish',
  hoursRu: 'Пн–Сб: 09:00–19:00, Воскресенье: выходной',

  currencyUz: "so'm",
  currencyRu: 'сум',

  // Buyurtma yuboriladigan PHP fayl. Hosting PHP'ni qo'llamasa, sayt mijozga
  // buyurtmani Telegram yoki telefon orqali yuborishni taklif qiladi.
  orderEndpoint: 'order.php',
};
