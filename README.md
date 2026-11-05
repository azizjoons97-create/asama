# asama.uz: santexnika do'koni sayti

Oddiy statik sayt: HTML, CSS va JavaScript. Hech qanday dastur o'rnatish yoki "build" qilish kerak emas. Fayllarni hostingga yuklasangiz, sayt ishlaydi. Hajmi 150 KB atrofida, 36 MB'li hostingga bemalol sig'adi.

## Imkoniyatlar

- Bosh sahifa, katalog, mahsulot sahifasi, savatcha, "Biz haqimizda va aloqa"
- Katalogda kategoriya, qidiruv, "faqat mavjudlari" filtri va saralash
- Savatcha brauzerda saqlanadi, sahifa yopilsa ham yo'qolmaydi
- Buyurtma Telegram botga keladi (`order.php`). Hosting PHP'ni qo'llamasa yoki bot sozlanmagan bo'lsa, mijozga buyurtma matnini nusxalab Telegramga yuborish yoki qo'ng'iroq qilish taklif qilinadi. Buyurtma yo'qolmaydi.
- O'zbek va rus tillari
- Telefon, planshet va kompyuterga moslashgan
- SEO: sahifa sarlavhalari, tavsiflar, `sitemap.xml`, `robots.txt`, Google uchun mahsulot va do'kon ma'lumotlari (schema.org)

## Fayllar

| Fayl | Nima uchun |
|---|---|
| `assets/js/config.js` | Do'kon nomi, telefon, Telegram, manzil, ish vaqti |
| `assets/js/products.js` | Kategoriyalar va mahsulotlar (nom, narx, tavsif, xususiyatlar, rasm) |
| `assets/js/i18n.js` | Saytdagi barcha yozuvlar, o'zbek va rus tilida |
| `assets/js/app.js` | Saytning ishlash kodi |
| `assets/css/style.css` | Dizayn |
| `assets/img/` | Rasmlar. Mahsulot rasmlari `assets/img/products/` ga qo'yiladi |
| `order.php` | Buyurtmani Telegramga yuboradi |
| `order-config.example.php` | Telegram bot sozlamalari namunasi |
| `.htaccess` | Apache hosting sozlamalari: 404 sahifa, kesh, maxfiy fayllarni yopish |
| `tools/sitemap.mjs` | `sitemap.xml` ni mahsulotlar ro'yxatidan qayta yaratadi (hostingga yuklanmaydi) |

## Hostingga yuklash

1. Hosting paneliga kiring (cPanel, ISPmanager yoki boshqa) va **Fayl menejeri**ni oching.
2. `public_html` (yoki `www`, `htdocs`) papkasiga kiring. Eski sayt fayllarini zaxira uchun yuklab oling, keyin o'chiring.
3. `asama-site.zip` arxivini yuklang va **Extract / Распаковать** ni bosing.
4. `asama.uz` ni brauzerda oching.

## Telegram botni ulash

1. Telegramda [@BotFather](https://t.me/BotFather) ga `/newbot` deb yozing, bot nomini bering. U **token** beradi.
2. O'z botingizga `/start` deb yozing. Buyurtmalar guruhga kelishini xohlasangiz, botni guruhga qo'shing va guruhga biror xabar yozing.
3. Brauzerda `https://api.telegram.org/bot<TOKEN>/getUpdates` ni oching (`<TOKEN>` o'rniga tokenni qo'ying). Javobdagi `"chat":{"id": ...}` raqami sizning **chat_id**ingiz.
4. Hostingda `order-config.example.php` dan nusxa olib, uni `order-config.php` deb nomlang. Ichiga token va chat_id ni yozing.
5. Saytda sinov buyurtmasi bering.

`order-config.php` ni GitHub'ga qo'ymang: repozitoriy ochiq, token esa maxfiy. `.gitignore` uni avtomatik chetlab o'tadi.

## Mahsulot qo'shish yoki narxni o'zgartirish

`assets/js/products.js` faylini oching. Har bir mahsulot `{ ... }` ichida yozilgan. Yangi mahsulot uchun mavjudidan nusxa olib, `sku` (takrorlanmas artikul), nom, narx va tavsifni o'zgartiring. Rasm qo'shish uchun uni `assets/img/products/` ga yuklang va `image: 'assets/img/products/fayl.webp'` deb yozing. Rasmlarni `.webp` formatida va 100 KB dan kichik qilib yuklang, shunda hosting joyi tejaladi va sayt tez ochiladi.

O'zgartirgandan keyin HTML fayllardagi `?v=1` ni `?v=2` ga o'zgartirsangiz, mijozlar brauzeri yangi faylni darhol yuklaydi.

## ERP bilan ulash (keyinroq)

`products.js` dagi maydonlar `savdo-erp` dagi mahsulot jadvali bilan bir xil nomlangan (`sku`, `nameUz`, `nameRu`, `categoryId`, `retailPrice`). ERP internetga (VPS) chiqqanda katalog ERP API'dan olinadi, buyurtmalar esa ERP'ga tushadi. Sayt kodining qolgan qismi o'zgarmaydi.

## Lokal ko'rish

```bash
python3 -m http.server 8000
# http://localhost:8000
```
