export type Product = {
  id: number;
  slug: string;
  category: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  composition?: string;
  weight?: number;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  badge?: string;
  modalKind?: "simple" | "related" | "addons";
  referenceCard?: "popcorn" | "batat" | "cheese-sticks" | "crab-salmon";
  referenceDetail?: "popcorn" | "wasabi";
  addonGroups?: Array<{
    title: string;
    items: Array<{ id: string; name: string; price: number; image: string }>;
  }>;
};

export type Category = {
  slug: string;
  title: string;
  products: Product[];
};

const images = {
  wasabi: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/1d1309ca7308f503b15c1c0193501642_thumb_75_1152_1152.JPEG",
  green: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/c4cc13964520cb9a68303a797e5875e6_thumb_75_1152_1152.PNG",
  shaurokinawa: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/b005e3217daffde232af4b7ecc77bb5f_thumb_75_1152_1152.JPEG",
  chuka: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/e3f19d21cce0a704dcdb81558f616803_thumb_75_1152_1152.PNG",
  philadelphia: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/076d35e16c38a7eab8f0d60b2c01ef9e_thumb_75_1152_1152.JPEG",
  tomyam: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/eddf5dbd63368315455ae082093feb6c_thumb_75_1152_1152.JPEG",
  rukola: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/a07f24708b66d206908fc7cf2249f169_thumb_75_1152_1152.JPEG",
  bakedShrimp: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/0eaa65e98817c21836327d48f9ae9f2c_thumb_75_1152_1152.JPEG",
  poke: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/0b2eb39305d53bb8fe7e94aaa04a2e16_thumb_75_1152_1152.JPEG",
  sushiShrimp: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/d856982ee7e7931c657ededc79a51534_thumb_75_1152_1152.PNG",
  bakedSet: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/253f9015a6979d6cdff9872775dbe81b_thumb_75_1152_1152.JPEG",
  softCloud: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/8571b69e608894b8c5ac2a9b147da2de_thumb_75_1152_1152.JPEG",
  tempuraSet: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/7333f66c2464e3e4a10f06cce5d9442b_thumb_75_1152_1152.PNG",
  bigSet: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/f17cf848486d6b064621623ad0d201de_thumb_75_1152_1152.JPEG",
  hotSalmonSet: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/17a9ef1b51612ee0d008630befe2ad7f_thumb_75_1152_1152.PNG",
  salmonPasta: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/71821fbe43012935945ef82abb500d5b_thumb_75_1152_1152.PNG",
  cola: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/fbe9f971cb74a4bb9007d643897c654f_thumb_75_1152_1152.JPEG",
  orangeSoda: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/073de08dda9cd7c5522f628ea9318d10_thumb_75_1152_1152.JPEG",
  orangeFresh: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/4a50c8042e487e31922a8d6d3928a31d_thumb_75_1152_1152.JPEG",
  limeSoda: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/2f6bcf5b4bbf1054d9b02575eb002bcb_thumb_75_1152_1152.JPEG",
  shaurdelphia: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/22fca217502b68bc910f314336a0a0d3_thumb_75_1152_1152.JPEG",
  shaurfornia: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/a4d0d6cdf568c18fe9872ea7766e9582_thumb_75_1152_1152.JPEG",
  spicySauce: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/c095783dce334bac117c8f5596c018d0_thumb_75_1152_1152.JPEG",
  shrimpTempura: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/138a8e926f0747d983388b7d0989d5e7_thumb_75_1152_1152.JPEG",
  bakedSalmonTeriyaki: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/ae99483b3180c9b2e4d17d3bfd783fa6_thumb_75_1152_1152.JPEG",
  cheeseSauce: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/4b81766caade92e23b3e55074bb873fb_thumb_75_1152_1152.JPEG",
  garlicSauce: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/a46fa62f6e4383191defd6f538126d47_thumb_75_1152_1152.JPEG",
  sweetChiliSauce: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/40f57dae13f5e0ab02896d2dc34d9904_thumb_75_1152_1152.JPEG",
  caesarSauce: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/7b4657268c5591940895bb7ca0a50c1f_thumb_75_1152_1152.JPEG",
  truffleSauce: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/69c12490d1e4dc0ba898e0ab3cc9bdd8_thumb_75_1152_1152.JPEG",
};

const popcornAddons: Product["addonGroups"] = [
  {
    title: "Основной соус",
    items: [
      { id: "cheese", name: "Сырный Heinz", price: 0, image: images.cheeseSauce },
      { id: "garlic", name: "Чесночный", price: 0, image: images.garlicSauce },
    ],
  },
  {
    title: "Дополнительный соус",
    items: [
      { id: "sweet-chili", name: "Сладкий чили", price: 100, image: images.sweetChiliSauce },
      { id: "caesar", name: "Цезарь", price: 180, image: images.caesarSauce },
      { id: "truffle", name: "Трюфельный", price: 180, image: images.truffleSauce },
    ],
  },
];

const shaurokinawaComposition = `рис заправленный, сыр творожный, огурец, креветка темпурная, икра тобико, соус спайс, нори, соевый соус, имбирь маринованный, васаби.

Состав: рис заправленный (рис, соус сушидзу (сахар, вода питьевая, уксус рисовый (вода питьевая, рис))), сыр творожный (Сливки нормализованные пастеризованные; закваска состоящая из мезофильных молочнокислых лактококков; ферментный препарат животного происхождения - пепсин, химозин; комплексная пищевая добавка (пищевые волокна; стабилизаторы - камедь рожкового дерева, каррагинан); соль (содержит агент антислеживающий - ферроцианид калия)), огурцы длинноплодные свежие, креветка темпурная (креветки замороженные (креветка Ваннамей (Litopenaeus vannamei), лёд, антиокислитель пиросульфит натрия E223), кляр (вода, мука темпурная (мука пшеничная хлебопекарная высший сорт, мука рисовая, мука кукурузная, крахмал кукурузный, комплексная пищевая добавка: пекарский порошок (разрыхлители: E500ii, E450i, E341i), соль пищевая)), масло фритюрное (масло подсолнечное рафинированное дезодорированное вымороженное, антиокислители Е 319, Е 330)), икра тобико замороженная (икра сельди атлантической, икра сельди тихоокеанской, икра летучей рыбы стрижехвоста пятнистого, соль, регуляторы кислотности: цитрат натрия 3-замещенный, лимонная кислота; усилители вкуса и аромата: Е621, Е631, Е627; антиокислитель глюконо-дельта-лактон, сахар, консерванты: сорбат калия, бензоат натрия, консерванты: сорбиновая кислота, бензоат натрия; ароматизатор, загустители: Е407а, Е417, Е415; красители: Е110, Е129), соус спайс (майонез (масло подсолнечное рафинированное дезодорированное, вода, яичный желток, соль, загуститель E1414, регуляторы кислотности (уксусная кислота, лимонная кислота), натуральные стабилизаторы (ксантановая камедь, гуаровая камедь), консерванты (сорбат калия, бензоат натрия), ароматизатор «Горчица», подсластитель E954, краситель бета-каротин), соус кимчи (вода, паста перца чили, сахар, соль, паприка красная молотая, чеснок сушеный молотый, соус рыбный (рыба,соль) уксус яблочный, уксус натуральный, арматизатр, загустители: модиффицированный крахмал и ксантановая камедь; усилители вкуса и аромата Е627 и Е631; регулятор кислотности лимонная кислота, имбирь молотый, консервант сорбат калия), перец кайенский молотый), морские водоросли нори порфира (Porphyra), соус соевый (вода, соя, пшеница, соль, сахар, консервант: бензоат натрия), имбирь маринованный (имбирь, питьевая вода, соль поваренная, регуляторы кислотности: лимонная кислота Е330, уксусная кислота Е260; подсластители: сахарин Е954, аспартам Е951; консервант: сорбат калия Е202, усилитель вкуса и аромата: глутамат натрия Е621), васаби (порошок горчичный, приправа сухая на основе хрена (хрен сушеный молотый, крахмал кукурузный), мука кукурузная, крахмал кукурузный, антислеживающий агент Е551, антиокислители аскорбиновая кислота и Е224, красители – Е102, Е133).

Продукт произведен из мороженого сырья.
Продукция производится на предприятии, где используются аллергены: яйца, молоко, соя, рыба, сельдерей, злаки содержащие глютен, горчица, орехи, арахис, кунжут, ракообразные, моллюски, диоксид серы и сульфиты и продукты, аспартам, люпин. Содержит краситель (красители), который (которые) может (могут) оказывать отрицательное влияние на активность и внимание детей.

Срок годности не более 3х часов (в оригинальной невскрытой упаковке) при хранении и транспортировке от +15 до +25 °С.

ТУ 10.85.12-004-41745829-2021
Продукт готов к употреблению. Употребить сразу после вскрытия упаковки.
Масса нетто: 260/30/10/5 г.`;

const p = (
  id: number,
  category: string,
  name: string,
  price: number,
  image: string,
  extra: Partial<Product> = {},
): Product => ({
  id,
  slug: name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/(^-|-$)/g, ""),
  category,
  name,
  price,
  image,
  weight: 260,
  calories: 460,
  protein: 14,
  fat: 13,
  carbs: 69,
  description: "Свежие ингредиенты, яркий вкус и фирменная подача Много лосося.",
  modalKind: "related",
  ...extra,
});

export const categories: Category[] = [
  {
    slug: "novinki",
    title: "Новинки",
    products: [
      p(12001, "novinki", "Соус сладкий васаби", 90, images.wasabi, {
        weight: 40,
        calories: 33,
        protein: 0,
        fat: 0,
        carbs: 7,
        description: "",
        composition: "Соус на основе сладкого васаби. Продукция производится на предприятии, где используются аллергены.",
        modalKind: "simple",
        referenceDetail: "wasabi",
      }),
      p(12002, "novinki", "Куриный попкорн", 345, "", {
        weight: 150,
        calories: 497,
        protein: 14,
        fat: 31,
        carbs: 38,
        description: "Щёлк-щёлк! Предупреждаем. Эта хрустящая закуска разлетается так быстро, что лучше заказать сразу две порции. А ещё лучше дополнить любимым соусом.",
        composition: "Куриное филе, панировка, масло фритюрное, соль, специи. Продукт готов к употреблению.",
        modalKind: "addons",
        referenceCard: "popcorn",
        referenceDetail: "popcorn",
        addonGroups: popcornAddons,
      }),
      p(12003, "novinki", "Батат фри", 320, "", { referenceCard: "batat", modalKind: "simple" }),
      p(12004, "novinki", "Сырные палочки с моцареллой", 360, "", { referenceCard: "cheese-sticks", modalKind: "simple" }),
      p(12005, "novinki", "Краб и лосось", 2850, "", { referenceCard: "crab-salmon", modalKind: "simple" }),
    ],
  },
  {
    slug: "hity-prodaz-2",
    title: "Хиты продаж",
    products: [
      p(11301, "hity-prodaz-2", "Шаурокинава", 405, images.shaurokinawa, {
        description: "Ещё один представитель Шауролловых. Любите обострять ситуацию и обедать на бегу? Тогда это точно для вас! В меру острая и такая любимая Окинава в удобном формате.",
        composition: shaurokinawaComposition,
        modalKind: "related",
      }),
      p(11155, "hity-prodaz-2", "Чука с ореховым соусом", 395, images.chuka, { weight: 190, badge: "🍃" }),
      p(11021, "hity-prodaz-2", "Филадельфия с лососем", 850, images.philadelphia),
      p(11202, "hity-prodaz-2", "Том Ям с кальмаром и креветками", 635, images.tomyam, { badge: "🌶️" }),
      p(11355, "hity-prodaz-2", "Ролл Рукола-креветка", 585, images.rukola),
      p(11277, "hity-prodaz-2", "Запечённый с креветками", 690, images.bakedShrimp, {
        description: "Румяные креветки. В рисовых пышках с огурцом, сливочным сыром и запеченным соусом.",
        weight: 260,
        calories: 567,
        protein: 19,
        fat: 31,
        carbs: 51,
      }),
      p(11402, "hity-prodaz-2", "Поке с лососем в тобико", 830, images.poke),
    ],
  },
  {
    slug: "rolly-2",
    title: "Роллы",
    products: [
      p(11022, "rolly-2", "Снежная калифорния", 630, images.philadelphia),
      p(11023, "rolly-2", "Филадельфия лайт", 720, images.philadelphia),
      p(11356, "rolly-2", "Филадельфия с креветкой", 645, images.rukola),
      p(11354, "rolly-2", "Ролл Гуакамоле", 595, images.green),
      p(11355, "rolly-2", "Ролл Рукола-креветка", 585, images.rukola),
      p(11064, "rolly-2", "Угорь и лосось", 935, images.philadelphia),
      p(11049, "rolly-2", "Аляска", 595, images.bakedShrimp),
      p(11058, "rolly-2", "Даку 2.0", 695, images.chuka),
      p(11051, "rolly-2", "Калифорния с креветкой спайси", 640, images.rukola),
      p(11060, "rolly-2", "Калифорния с тунцом спайси", 705, images.philadelphia),
      p(11062, "rolly-2", "Канада", 820, images.bakedShrimp),
      p(11025, "rolly-2", "Креветка с тамаго и авокадо", 530, images.rukola),
      p(11046, "rolly-2", "Окинава", 405, images.shaurokinawa),
      p(11070, "rolly-2", "Просто авокадо", 270, images.green),
      p(11065, "rolly-2", "Просто креветка", 350, images.rukola),
      p(11067, "rolly-2", "Просто лосось", 465, images.philadelphia),
      p(11066, "rolly-2", "Просто лосось БИГ", 750, images.philadelphia),
      p(11071, "rolly-2", "Просто огурец", 270, images.green),
      p(11072, "rolly-2", "Просто тунец", 345, images.chuka),
      p(11073, "rolly-2", "Просто угорь", 430, images.bakedShrimp),
      p(11074, "rolly-2", "Ролл с трюфельным соусом", 550, images.rukola),
      p(11075, "rolly-2", "Сяке темпура", 835, images.bakedShrimp),
      p(11076, "rolly-2", "Филадельфия с лососем", 850, images.philadelphia),
      p(11077, "rolly-2", "Филадельфия с угрём", 830, images.bakedShrimp),
      p(11078, "rolly-2", "Хрустящий лосось", 695, images.philadelphia),
      p(11079, "rolly-2", "Сливочная креветка и тобико", 630, images.rukola),
      p(11080, "rolly-2", "Хрустящая креветка и соус аригато", 495, images.rukola),
      p(11081, "rolly-2", "Креветка Спайс", 530, images.rukola, { badge: "🌶️" }),
      p(11082, "rolly-2", "Лосось спайси", 580, images.philadelphia, { badge: "🌶️" }),
      p(11083, "rolly-2", "Унаги и опалённый лосось", 765, images.bakedShrimp),
      p(11084, "rolly-2", "Опалённый лосось и креветка", 825, images.rukola),
      p(11085, "rolly-2", "Калифорния с лососем", 760, images.philadelphia),
    ],
  },
  {
    slug: "saurolly-3",
    title: "Шауроллы",
    products: [
      p(11301, "saurolly-3", "Шаурокинава", 405, images.shaurokinawa, {
        description: "Ещё один представитель Шауролловых. Любите обострять ситуацию и обедать на бегу? Тогда это точно для вас! В меру острая и такая любимая Окинава в удобном формате.",
        composition: shaurokinawaComposition,
      }),
      p(11302, "saurolly-3", "Шаурдельфия", 849, images.shaurdelphia),
      p(11303, "saurolly-3", "Шаурфорния", 530, images.shaurfornia),
    ],
  },
  {
    slug: "tempura-i-zapecennye-rolly-3",
    title: "Темпура и запеченные роллы",
    products: [
      p(11501, "tempura-i-zapecennye-rolly-3", "Темпура с креветками спайси", 620, images.shrimpTempura, { badge: "🌶️" }),
      p(11502, "tempura-i-zapecennye-rolly-3", "Темпура с тунцом", 530, images.chuka),
      p(11503, "tempura-i-zapecennye-rolly-3", "Огненный фурай", 650, images.tomyam),
      p(11504, "tempura-i-zapecennye-rolly-3", "Запеченная калифорния", 595, images.bakedShrimp),
      p(11505, "tempura-i-zapecennye-rolly-3", "Киото", 595, images.philadelphia),
      p(11506, "tempura-i-zapecennye-rolly-3", "Запечённый с кальмаром и пармезаном", 490, images.tomyam),
      p(11507, "tempura-i-zapecennye-rolly-3", "Темпура с лососем терияки", 645, images.bakedShrimp),
      p(11508, "tempura-i-zapecennye-rolly-3", "Темпура с лососем", 610, images.philadelphia),
      p(11509, "tempura-i-zapecennye-rolly-3", "Запечённый с лососем", 635, images.bakedShrimp),
      p(11510, "tempura-i-zapecennye-rolly-3", "Запечённый с лососем терияки", 520, images.bakedSalmonTeriyaki),
      p(11511, "tempura-i-zapecennye-rolly-3", "Запечённый с креветками", 690, images.bakedShrimp, {
        description: "Румяные креветки. В рисовых пышках с огурцом, сливочным сыром и запеченным соусом.",
        weight: 260,
        calories: 567,
        protein: 19,
        fat: 31,
        carbs: 51,
      }),
      p(11512, "tempura-i-zapecennye-rolly-3", "Рисовый сэндвич с лососем (темпура)", 690, images.rukola),
    ],
  },
  {
    slug: "susi-i-sasimi-2",
    title: "Суши и сашими",
    products: [
      p(11551, "susi-i-sasimi-2", "Суши с креветкой", 415, images.sushiShrimp),
    ],
  },
  {
    slug: "sety-2",
    title: "Сеты",
    products: [
      p(11601, "sety-2", "Сет из просто роллов", 1350, images.philadelphia),
      p(11602, "sety-2", "Лайт сет", 2590, images.rukola),
      p(11603, "sety-2", "На двоих", 2730, images.bakedShrimp),
      p(11604, "sety-2", "Сетик", 2520, images.chuka),
      p(11607, "sety-2", "Собери свой сет", 1460, images.tempuraSet),
      p(11605, "sety-2", "На компанию", 4950, images.philadelphia),
      p(11608, "sety-2", "Хитовый", 2990, images.bakedSet),
      p(11606, "sety-2", "Филадельфия сет", 2950, images.philadelphia),
    ],
  },
  {
    slug: "tempurnye-i-zapecennye-sety-2",
    title: "Темпурные и запеченные сеты",
    products: [
      p(11651, "tempurnye-i-zapecennye-sety-2", "Запечённый сет", 1850, images.bakedSet),
      p(11652, "tempurnye-i-zapecennye-sety-2", "Мягкое облако", 2295, images.softCloud),
      p(11653, "tempurnye-i-zapecennye-sety-2", "Темпура сет", 2350, images.tempuraSet),
      p(11654, "tempurnye-i-zapecennye-sety-2", "Сет Большой", 3950, images.bigSet),
      p(11655, "tempurnye-i-zapecennye-sety-2", "Жаркий лосось", 2350, images.hotSalmonSet),
    ],
  },
  {
    slug: "poke-2",
    title: "Поке",
    products: [
      p(11701, "poke-2", "Поке с креветками", 780, images.poke),
      p(11702, "poke-2", "Поке спайси с лососем", 890, images.poke),
      p(11703, "poke-2", "Поке с тунцом", 795, images.poke),
      p(11704, "poke-2", "Собери своё поке", 220, images.green),
      p(11705, "poke-2", "Поке с лососем", 890, images.poke),
      p(11706, "poke-2", "Поке с лососем в тобико", 830, images.poke),
    ],
  },
  {
    slug: "zakuski-4",
    title: "Закуски",
    products: [
      p(11801, "zakuski-4", "Картофель фри", 275, images.green),
      p(11802, "zakuski-4", "Креветки васаби", 695, images.rukola),
      p(11803, "zakuski-4", "Чипсы креветочные", 150, images.wasabi),
      p(11804, "zakuski-4", "Наггетсы куриные", 285, images.bakedShrimp),
    ],
  },
  {
    slug: "salaty-3",
    title: "Салаты",
    products: [
      p(11901, "salaty-3", "Зелёный", 590, images.green),
      p(11902, "salaty-3", "Цезарь с креветками", 735, images.poke),
      p(11903, "salaty-3", "Цезарь с опалённым лососем", 820, images.poke),
      p(11906, "salaty-3", "Цезарь с курицей", 635, images.poke),
      p(11904, "salaty-3", "Битые огурцы", 350, images.green),
      p(11905, "salaty-3", "Чука с ореховым соусом", 395, images.chuka),
    ],
  },
  {
    slug: "supy-3",
    title: "Супы",
    products: [
      p(12011, "supy-3", "Том Ям с креветками", 680, images.tomyam),
      p(12012, "supy-3", "Том Ям с кальмаром и креветками", 635, images.tomyam),
      p(12013, "supy-3", "Том ям с лососем", 690, images.tomyam),
      p(12015, "supy-3", "Том Ям с курицей", 565, images.tomyam),
      p(12014, "supy-3", "Мисо-суп с лососем", 590, images.tomyam),
      p(12016, "supy-3", "Мисо-суп классический", 390, images.tomyam),
    ],
  },
  {
    slug: "goracie-bluda",
    title: "Горячие блюда",
    products: [
      p(12051, "goracie-bluda", "Паста с лососем в сливочном соусе", 750, images.salmonPasta),
    ],
  },
  {
    slug: "dla-kotika-2",
    title: "Для котика",
    products: [
      p(12101, "dla-kotika-2", "Креветки для котика", 240, images.rukola),
      p(12102, "dla-kotika-2", "Тунец для котика", 240, images.philadelphia),
      p(12103, "dla-kotika-2", "Комбо тунец и креветки для котика", 450, images.poke),
    ],
  },
  {
    slug: "toppingi-9",
    title: "Топпинги",
    products: [
      p(12201, "toppingi-9", "Соус сладкий васаби", 90, images.wasabi),
      p(12202, "toppingi-9", "Васаби", 70, images.green),
      p(12203, "toppingi-9", "Имбирь маринованный", 70, images.rukola),
      p(12204, "toppingi-9", "Соус Цезарь", 180, images.wasabi),
      p(12205, "toppingi-9", "Соус кимчи", 120, images.tomyam),
      p(12206, "toppingi-9", "Соус ореховый", 90, images.wasabi),
      p(12207, "toppingi-9", "Соус поке", 70, images.green),
      p(12208, "toppingi-9", "Соус сладкий чили", 100, images.tomyam),
      p(12209, "toppingi-9", "Соус соевый", 70, images.wasabi),
      p(12210, "toppingi-9", "Соус спайси", 90, images.spicySauce),
      p(12211, "toppingi-9", "Соус терияки", 90, images.wasabi),
      p(12212, "toppingi-9", "Соус трюфельный", 180, images.wasabi),
      p(12213, "toppingi-9", "Соус унаги", 90, images.wasabi),
      p(12214, "toppingi-9", "Соус чесночный", 100, images.wasabi),
      p(12215, "toppingi-9", "Сырный соус Heinz", 90, images.wasabi),
    ],
  },
  {
    slug: "napitki-4",
    title: "Напитки",
    products: [
      p(12301, "napitki-4", "Добрый Кола", 170, images.cola),
      p(12302, "napitki-4", "Добрый Апельсин с витамином С", 170, images.orangeSoda),
      p(12303, "napitki-4", "Апельсиновый фреш", 470, images.orangeFresh),
      p(12304, "napitki-4", "Добрый Лимон-лайм", 170, images.limeSoda),
    ],
  },
];

export const promoCards = [
  { alt: "Скидка студентам", src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/promo/104b14d17af4e66ab32a1f99bfa9cb23_resize_in_box_1104_1104.jpg" },
  { alt: "Telegram: промокоды и мемы", src: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/promo/f28303d1312d58d8023742cc7c75a57a_resize_in_box_1104_1104.jpg" },
  { alt: "Много лосося — удовольствие есть", src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/promo/43ddb99861e8cfbedf08f2a313738c4b_resize_in_box_1104_1104.jpg" },
  { alt: "Всё вкусное — детям!", src: "/reference-main.png", referenceCrop: "kids" as const },
  { alt: "Кешбэк до 100%", src: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/promo/c9d2f34588567ee37d2fa4a7c937821a_resize_in_box_1104_1104.jpg" },
  { alt: "Мноооого палочки?", src: "/reference-main.png", referenceCrop: "sticks" as const },
  { alt: "Помогаем котикам вместе", src: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/promo/9ad2dfc2bfc46d092fcf9d868b4ae85d_resize_in_box_1104_1104.jpg" },
];

export const allProducts = categories.flatMap((category) => category.products);
