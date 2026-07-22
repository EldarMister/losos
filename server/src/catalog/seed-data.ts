const img = {
  wasabi: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/1d1309ca7308f503b15c1c0193501642_thumb_75_1152_1152.JPEG",
  green: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/c4cc13964520cb9a68303a797e5875e6_thumb_75_1152_1152.PNG",
  shaurokinawa: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/b005e3217daffde232af4b7ecc77bb5f_thumb_75_1152_1152.JPEG",
  chuka: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/e3f19d21cce0a704dcdb81558f616803_thumb_75_1152_1152.PNG",
  philadelphia: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/076d35e16c38a7eab8f0d60b2c01ef9e_thumb_75_1152_1152.JPEG",
  tomyam: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/eddf5dbd63368315455ae082093feb6c_thumb_75_1152_1152.JPEG",
  rukola: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/a07f24708b66d206908fc7cf2249f169_thumb_75_1152_1152.JPEG",
  baked: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/0eaa65e98817c21836327d48f9ae9f2c_thumb_75_1152_1152.JPEG",
  poke: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/0b2eb39305d53bb8fe7e94aaa04a2e16_thumb_75_1152_1152.JPEG",
};

type SeedProduct = { id: number; slug: string; name: string; price: number; image: string; description: string; weight: number; calories: number; protein: number; fat: number; carbs: number; badge: string | null };
const product = (id: number, name: string, price: number, image: string, badge: string | null = null): SeedProduct => ({ id, slug: name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/(^-|-$)/g, ""), name, price, image, description: "Свежие ингредиенты, яркий вкус и фирменная подача Много лосося.", weight: 260, calories: 460, protein: 14, fat: 13, carbs: 69, badge });

export const seedCategories = [
  { slug: "novinki", title: "Новинки", products: [product(12001, "Соус сладкий васаби", 90, img.wasabi, "new"), product(12002, "Зелёный", 590, img.green, "new")] },
  { slug: "hity-prodaz-2", title: "Хиты продаж", products: [product(11301, "Шаурокинава", 405, img.shaurokinawa, "🌶️"), product(11155, "Чука с ореховым соусом", 395, img.chuka), product(11021, "Филадельфия с лососем", 850, img.philadelphia), product(11202, "Том Ям с кальмаром и креветками", 635, img.tomyam), product(11355, "Ролл Рукола-креветка", 585, img.rukola), product(11277, "Запечённый с креветками", 690, img.baked), product(11402, "Поке с лососем в тобико", 830, img.poke)] },
  { slug: "rolly-2", title: "Роллы", products: [product(11022, "Снежная калифорния", 630, img.philadelphia), product(11023, "Филадельфия лайт", 720, img.philadelphia), product(11356, "Филадельфия с креветкой", 645, img.rukola), product(11354, "Ролл Гуакамоле", 595, img.green), product(11064, "Угорь и лосось", 935, img.philadelphia), product(11049, "Аляска", 595, img.baked)] },
  { slug: "saurolly-3", title: "Шауроллы", products: [product(11302, "Шаурдельфия", 849, img.philadelphia), product(11303, "Шаурфорния", 530, img.rukola)] },
  { slug: "tempura-i-zapecennye-rolly-3", title: "Темпура и запеченные роллы", products: [product(11501, "Темпура с креветками спайси", 620, img.baked), product(11504, "Запеченная калифорния", 595, img.baked)] },
  { slug: "sety-2", title: "Сеты", products: [product(11601, "Сет из просто роллов", 1350, img.philadelphia), product(11603, "На двоих", 2730, img.baked)] },
  { slug: "poke-2", title: "Поке", products: [product(11701, "Поке с креветками", 780, img.poke), product(11702, "Поке спайси с лососем", 890, img.poke)] },
  { slug: "salaty-3", title: "Салаты", products: [product(11901, "Зелёный", 590, img.green), product(11902, "Цезарь с креветками", 735, img.poke)] },
  { slug: "supy-3", title: "Супы", products: [product(12011, "Том Ям с креветками", 680, img.tomyam), product(12012, "Том Ям с кальмаром и креветками", 635, img.tomyam)] },
  { slug: "toppingi-9", title: "Топпинги", products: [product(12201, "Соус сладкий васаби", 90, img.wasabi), product(12204, "Соус спайси", 90, img.tomyam)] },
];
