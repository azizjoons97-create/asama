/*
 * Kategoriyalar va mahsulotlar.
 *
 * Maydonlar ERP (savdo-erp) dagi mahsulot jadvaliga mos qilib nomlangan
 * (sku, nameUz, nameRu, categoryId, retailPrice). Keyin ERP ulanganda shu
 * ro'yxat ERP'dan olinadi.
 *
 * Narxlar va mahsulotlar hozircha NAMUNA. O'zingiznikiga almashtiring.
 *
 * Mahsulot maydonlari:
 *   sku          artikul, takrorlanmasligi kerak (sahifa manzilida ishlatiladi)
 *   nameUz/Ru    nomi
 *   categoryId   kategoriya id'si (pastdagi CATEGORIES ro'yxatidan)
 *   unit         'dona' yoki 'metr'
 *   retailPrice  narx, so'mda (faqat raqam)
 *   oldPrice     eski narx (chegirma ko'rsatish uchun, ixtiyoriy)
 *   brand        ishlab chiqaruvchi (ixtiyoriy)
 *   descUz/Ru    tavsif
 *   specs        xususiyatlar: [nomi uz, nomi ru, qiymati]
 *   image        rasm manzili, masalan 'assets/img/products/ppr-20.webp'.
 *                Bo'sh bo'lsa, kategoriya rasmi ko'rsatiladi.
 *   inStock      omborda bormi (true / false)
 *   featured     bosh sahifada ko'rsatilsinmi
 */

window.CATEGORIES = [
  { id: 'ppr-pipes', nameUz: 'PPR trubalar', nameRu: 'Трубы PPR', icon: 'assets/img/cat-pipes.svg' },
  { id: 'ppr-fittings', nameUz: 'PPR fitinglar', nameRu: 'Фитинги PPR', icon: 'assets/img/cat-fittings.svg' },
  { id: 'boilers', nameUz: 'Isitish qozonlari', nameRu: 'Отопительные котлы', icon: 'assets/img/cat-boilers.svg' },
  { id: 'radiators', nameUz: 'Radiatorlar', nameRu: 'Радиаторы', icon: 'assets/img/cat-radiators.svg' },
  { id: 'valves', nameUz: 'Kranlar', nameRu: 'Краны', icon: 'assets/img/cat-valves.svg' },
  { id: 'mixers', nameUz: 'Smesitellar', nameRu: 'Смесители', icon: 'assets/img/cat-mixers.svg' },
];

window.PRODUCTS = [
  // --- PPR trubalar ---
  {
    sku: 'PPR-PIPE-20', categoryId: 'ppr-pipes', unit: 'metr', retailPrice: 8000, featured: true, inStock: true,
    nameUz: 'PPR truba 20 mm, PN20', nameRu: 'Труба PPR 20 мм, PN20',
    descUz: "Issiq va sovuq suv hamda isitish tizimlari uchun polipropilen truba. 4 metrlik bo'laklarda sotiladi.",
    descRu: 'Полипропиленовая труба для горячего и холодного водоснабжения и отопления. Продаётся отрезками по 4 метра.',
    specs: [['Diametr', 'Диаметр', '20 mm'], ['Bosim', 'Давление', 'PN20'], ['Devor qalinligi', 'Толщина стенки', '3,4 mm'], ['Maks. harorat', 'Макс. температура', '95 °C']],
  },
  {
    sku: 'PPR-PIPE-25', categoryId: 'ppr-pipes', unit: 'metr', retailPrice: 12000, inStock: true,
    nameUz: 'PPR truba 25 mm, PN20', nameRu: 'Труба PPR 25 мм, PN20',
    descUz: "Issiq va sovuq suv hamda isitish tizimlari uchun polipropilen truba. 4 metrlik bo'laklarda sotiladi.",
    descRu: 'Полипропиленовая труба для горячего и холодного водоснабжения и отопления. Продаётся отрезками по 4 метра.',
    specs: [['Diametr', 'Диаметр', '25 mm'], ['Bosim', 'Давление', 'PN20'], ['Devor qalinligi', 'Толщина стенки', '4,2 mm'], ['Maks. harorat', 'Макс. температура', '95 °C']],
  },
  {
    sku: 'PPR-PIPE-32', categoryId: 'ppr-pipes', unit: 'metr', retailPrice: 19000, inStock: true,
    nameUz: 'PPR truba 32 mm, PN20', nameRu: 'Труба PPR 32 мм, PN20',
    descUz: "Magistral quvurlar va isitish tizimlari uchun polipropilen truba.",
    descRu: 'Полипропиленовая труба для магистральных трубопроводов и систем отопления.',
    specs: [['Diametr', 'Диаметр', '32 mm'], ['Bosim', 'Давление', 'PN20'], ['Devor qalinligi', 'Толщина стенки', '5,4 mm'], ['Maks. harorat', 'Макс. температура', '95 °C']],
  },
  {
    sku: 'PPR-PIPE-20-FB', categoryId: 'ppr-pipes', unit: 'metr', retailPrice: 14000, oldPrice: 16000, featured: true, inStock: true,
    nameUz: 'PPR truba 20 mm, shisha tolali', nameRu: 'Труба PPR 20 мм, армированная стекловолокном',
    descUz: "Shisha tola bilan mustahkamlangan truba. Qizdirilganda kam cho'ziladi, isitish tizimi uchun mos.",
    descRu: 'Труба, армированная стекловолокном. Меньше удлиняется при нагреве, подходит для отопления.',
    specs: [['Diametr', 'Диаметр', '20 mm'], ['Bosim', 'Давление', 'PN25'], ['Armatura', 'Армирование', 'Shisha tola / Стекловолокно'], ['Maks. harorat', 'Макс. температура', '95 °C']],
  },

  // --- PPR fitinglar ---
  {
    sku: 'PPR-ELBOW-20', categoryId: 'ppr-fittings', unit: 'dona', retailPrice: 1500, inStock: true,
    nameUz: 'PPR burchak 90°, 20 mm', nameRu: 'Угол PPR 90°, 20 мм',
    descUz: "Trubani 90 gradusga burish uchun. Payvandlash orqali ulanadi.", descRu: 'Для поворота трубы на 90 градусов. Соединяется сваркой.',
    specs: [['Diametr', 'Диаметр', '20 mm'], ['Burchak', 'Угол', '90°']],
  },
  {
    sku: 'PPR-TEE-20', categoryId: 'ppr-fittings', unit: 'dona', retailPrice: 2000, inStock: true,
    nameUz: 'PPR uchlik (troynik), 20 mm', nameRu: 'Тройник PPR, 20 мм',
    descUz: "Trubadan tarmoq chiqarish uchun.", descRu: 'Для ответвления от трубопровода.',
    specs: [['Diametr', 'Диаметр', '20 mm']],
  },
  {
    sku: 'PPR-COUPLING-20-MF', categoryId: 'ppr-fittings', unit: 'dona', retailPrice: 9000, featured: true, inStock: true,
    nameUz: "PPR mufta, 20 mm × 1/2\" ichki rezba", nameRu: 'Муфта PPR, 20 мм × 1/2" внутренняя резьба',
    descUz: "PPR trubani rezbali kran, smesitel yoki hisoblagichga ulash uchun. Latun qo'shimchali.",
    descRu: 'Для подключения трубы PPR к резьбовому крану, смесителю или счётчику. С латунной вставкой.',
    specs: [['Diametr', 'Диаметр', '20 mm'], ['Rezba', 'Резьба', '1/2" ichki / внутр.']],
  },
  {
    sku: 'PPR-COUPLING-25', categoryId: 'ppr-fittings', unit: 'dona', retailPrice: 1800, inStock: true,
    nameUz: 'PPR mufta, 25 mm', nameRu: 'Муфта PPR, 25 мм',
    descUz: "Ikkita trubani to'g'ri ulash uchun.", descRu: 'Для прямого соединения двух труб.',
    specs: [['Diametr', 'Диаметр', '25 mm']],
  },

  // --- Isitish qozonlari ---
  {
    sku: 'BOILER-GAS-24', categoryId: 'boilers', unit: 'dona', retailPrice: 6500000, featured: true, inStock: true,
    nameUz: 'Gaz qozoni, devorga osiladigan, 24 kVt, ikki konturli', nameRu: 'Газовый котёл настенный, 24 кВт, двухконтурный',
    descUz: "Uyni isitish va issiq suv uchun. 240 m² gacha bo'lgan uyga mos. Yopiq yonish kamerasi.",
    descRu: 'Для отопления и горячего водоснабжения. Подходит для дома до 240 м². Закрытая камера сгорания.',
    specs: [['Quvvat', 'Мощность', '24 kVt / кВт'], ['Konturlar', 'Контуры', '2'], ['Maydon', 'Площадь', '240 m² gacha / до 240 м²'], ['Yoqilg\'i', 'Топливо', 'Tabiiy gaz / Природный газ']],
  },
  {
    sku: 'BOILER-GAS-32', categoryId: 'boilers', unit: 'dona', retailPrice: 8200000, inStock: true,
    nameUz: 'Gaz qozoni, devorga osiladigan, 32 kVt, ikki konturli', nameRu: 'Газовый котёл настенный, 32 кВт, двухконтурный',
    descUz: "Katta uylar uchun. 320 m² gacha. Yopiq yonish kamerasi, elektron boshqaruv.",
    descRu: 'Для больших домов, до 320 м². Закрытая камера сгорания, электронное управление.',
    specs: [['Quvvat', 'Мощность', '32 kVt / кВт'], ['Konturlar', 'Контуры', '2'], ['Maydon', 'Площадь', '320 m² gacha / до 320 м²']],
  },
  {
    sku: 'BOILER-ELEC-9', categoryId: 'boilers', unit: 'dona', retailPrice: 3400000, inStock: false,
    nameUz: 'Elektr qozoni, 9 kVt', nameRu: 'Электрокотёл, 9 кВт',
    descUz: "Gaz bo'lmagan joylar uchun. 90 m² gacha.", descRu: 'Для мест без газа. До 90 м².',
    specs: [['Quvvat', 'Мощность', '9 kVt / кВт'], ['Kuchlanish', 'Напряжение', '380 V'], ['Maydon', 'Площадь', '90 m² gacha / до 90 м²']],
  },

  // --- Radiatorlar ---
  {
    sku: 'RAD-AL-500', categoryId: 'radiators', unit: 'dona', retailPrice: 85000, featured: true, inStock: true,
    nameUz: 'Alyumin radiator seksiyasi, 500 mm', nameRu: 'Секция алюминиевого радиатора, 500 мм',
    descUz: "Narx bitta seksiya uchun. Tez qiziydi, yengil. Xona uchun kerakli seksiyalar sonini hisoblab beramiz.",
    descRu: 'Цена за одну секцию. Быстро нагревается, лёгкий. Поможем рассчитать нужное количество секций.',
    specs: [['Markazlararo masofa', 'Межосевое расстояние', '500 mm'], ['Issiqlik berishi', 'Теплоотдача', '190 Vt / Вт'], ['Ish bosimi', 'Рабочее давление', '16 bar']],
  },
  {
    sku: 'RAD-BM-500', categoryId: 'radiators', unit: 'dona', retailPrice: 120000, inStock: true,
    nameUz: 'Bimetall radiator seksiyasi, 500 mm', nameRu: 'Секция биметаллического радиатора, 500 мм',
    descUz: "Narx bitta seksiya uchun. Po'lat yadro, yuqori bosimga chidamli. Ko'p qavatli uylar uchun.",
    descRu: 'Цена за одну секцию. Стальной сердечник, выдерживает высокое давление. Для многоэтажных домов.',
    specs: [['Markazlararo masofa', 'Межосевое расстояние', '500 mm'], ['Issiqlik berishi', 'Теплоотдача', '180 Vt / Вт'], ['Ish bosimi', 'Рабочее давление', '25 bar']],
  },
  {
    sku: 'RAD-PANEL-22-500-1000', categoryId: 'radiators', unit: 'dona', retailPrice: 950000, oldPrice: 1050000, featured: true, inStock: true,
    nameUz: "Po'lat panelli radiator, 22-tur, 500×1000 mm", nameRu: 'Стальной панельный радиатор, тип 22, 500×1000 мм',
    descUz: "Ikki panelli, ikki konvektorli. Mahkamlagichlari bilan.", descRu: 'Две панели, два конвектора. С кронштейнами.',
    specs: [['Turi', 'Тип', '22'], ['O\'lchami', 'Размер', '500×1000 mm'], ['Issiqlik berishi', 'Теплоотдача', '1840 Vt / Вт']],
  },

  // --- Kranlar ---
  {
    sku: 'VALVE-BALL-12', categoryId: 'valves', unit: 'dona', retailPrice: 55000, featured: true, inStock: true,
    nameUz: "Sharli kran, latun, 1/2\"", nameRu: 'Кран шаровый латунный, 1/2"',
    descUz: "Suv va isitish tizimlari uchun. Ichki-ichki rezba, kapalak dastak.",
    descRu: 'Для водоснабжения и отопления. Внутренняя-внутренняя резьба, ручка-бабочка.',
    specs: [['Rezba', 'Резьба', '1/2"'], ['Material', 'Материал', 'Latun / Латунь'], ['Ish bosimi', 'Рабочее давление', '25 bar']],
  },
  {
    sku: 'VALVE-BALL-34', categoryId: 'valves', unit: 'dona', retailPrice: 78000, inStock: true,
    nameUz: "Sharli kran, latun, 3/4\"", nameRu: 'Кран шаровый латунный, 3/4"',
    descUz: "Suv va isitish tizimlari uchun. Ichki-ichki rezba, uzun dastak.",
    descRu: 'Для водоснабжения и отопления. Внутренняя-внутренняя резьба, длинная ручка.',
    specs: [['Rezba', 'Резьба', '3/4"'], ['Material', 'Материал', 'Latun / Латунь'], ['Ish bosimi', 'Рабочее давление', '25 bar']],
  },
  {
    sku: 'VALVE-PPR-20', categoryId: 'valves', unit: 'dona', retailPrice: 45000, inStock: true,
    nameUz: 'PPR sharli kran, 20 mm', nameRu: 'Кран шаровый PPR, 20 мм',
    descUz: "PPR trubaga to'g'ridan-to'g'ri payvandlanadi.", descRu: 'Приваривается непосредственно к трубе PPR.',
    specs: [['Diametr', 'Диаметр', '20 mm']],
  },

  // --- Smesitellar ---
  {
    sku: 'MIXER-KITCHEN-01', categoryId: 'mixers', unit: 'dona', retailPrice: 350000, featured: true, inStock: true,
    nameUz: 'Oshxona smesiteli, bitta dastakli', nameRu: 'Смеситель для кухни, однорычажный',
    descUz: "Baland aylanuvchi jo'mrak, keramik kartrij. Ulash shlanglari bilan.",
    descRu: 'Высокий поворотный излив, керамический картридж. С подводкой.',
    specs: [['Kartrij', 'Картридж', '35 mm, keramik / керамический'], ['Material', 'Материал', 'Latun / Латунь']],
  },
  {
    sku: 'MIXER-BATH-01', categoryId: 'mixers', unit: 'dona', retailPrice: 420000, inStock: true,
    nameUz: 'Vanna smesiteli, dush bilan', nameRu: 'Смеситель для ванны с душем',
    descUz: "Uzun jo'mrak, dush shlangi va leykasi bilan.", descRu: 'Длинный излив, в комплекте душевой шланг и лейка.',
    specs: [['Jo\'mrak uzunligi', 'Длина излива', '350 mm'], ['Material', 'Материал', 'Latun / Латунь']],
  },
];
