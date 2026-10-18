// Shared interface wording with the Losos mobile app; website-specific messages are included below.
export const messages: Record<string, Record<"ru" | "ky" | "en" | "uz" | "kk", string>> = {
  "Сервер вернул ошибку {0}": {
    "ru": "Сервер вернул ошибку {0}",
    "ky": "Сервер {0} катасын кайтарды",
    "en": "The server returned error {0}",
    "uz": "Server {0} xatosini qaytardi",
    "kk": "Сервер {0} қатесін қайтарды"
  },
  "Сервер долго не отвечает. Попробуйте ещё раз.": {
    "ru": "Сервер долго не отвечает. Попробуйте ещё раз.",
    "ky": "Серверден жооп жок. Кайра аракет кылыңыз.",
    "en": "The server is taking too long to respond. Please try again.",
    "uz": "Serverdan javob kelmayapti. Qayta urinib ko‘ring.",
    "kk": "Сервер ұзақ уақыт жауап бермей жатыр. Қайталап көріңіз."
  },
  "Соус соевый": {
    "ru": "Соус соевый",
    "ky": "Соя соусу",
    "en": "Soy sauce",
    "uz": "Soya sousi",
    "kk": "Соя тұздығы"
  },
  "Васаби": {
    "ru": "Васаби",
    "ky": "Васаби",
    "en": "Wasabi",
    "uz": "Vasabi",
    "kk": "Васаби"
  },
  "Имбирь": {
    "ru": "Имбирь",
    "ky": "Имбирь",
    "en": "Ginger",
    "uz": "Zanjabil",
    "kk": "Зімбір"
  },
  "Проверка истекла. Пройдите её ещё раз.": {
    "ru": "Проверка истекла. Пройдите её ещё раз.",
    "ky": "Текшерүүнүн мөөнөтү бүттү. Кайра өтүңүз.",
    "en": "Verification expired. Please verify again.",
    "uz": "Tekshiruv muddati tugadi. Qaytadan tekshiruvdan o‘ting.",
    "kk": "Тексеру мерзімі аяқталды. Қайта тексеруден өтіңіз."
  },
  "Не удалось пройти проверку. Попробуйте ещё раз.": {
    "ru": "Не удалось пройти проверку. Попробуйте ещё раз.",
    "ky": "Текшерүүдөн өтүү мүмкүн болгон жок. Кайра аракет кылыңыз.",
    "en": "Verification failed. Please try again.",
    "uz": "Tekshiruvdan o‘tib bo‘lmadi. Qayta urinib ko‘ring.",
    "kk": "Тексеруден өту мүмкін болмады. Қайталап көріңіз."
  },
  "Проверка безопасности": {
    "ru": "Проверка безопасности",
    "ky": "Коопсуздукту текшерүү",
    "en": "Security check",
    "uz": "Xavfsizlik tekshiruvi",
    "kk": "Қауіпсіздікті тексеру"
  },
  "Подтвердите, что запрос отправляет человек": {
    "ru": "Подтвердите, что запрос отправляет человек",
    "ky": "Сурамды адам жөнөтүп жатканын ырастаңыз",
    "en": "Confirm that you are a person",
    "uz": "So‘rovni inson yuborayotganini tasdiqlang",
    "kk": "Сұрауды адам жіберіп жатқанын растаңыз"
  },
  "Отменить проверку": {
    "ru": "Отменить проверку",
    "ky": "Текшерүүнү токтотуу",
    "en": "Cancel verification",
    "uz": "Tekshiruvni bekor qilish",
    "kk": "Тексеруден бас тарту"
  },
  "Проверка, что вы человек": {
    "ru": "Проверка, что вы человек",
    "ky": "Адам экениңизди текшерүү",
    "en": "Human verification",
    "uz": "Inson ekanligingizni tekshirish",
    "kk": "Адам екеніңізді тексеру"
  },
  "Не удалось загрузить проверку. Проверьте интернет и попробуйте ещё раз.": {
    "ru": "Не удалось загрузить проверку. Проверьте интернет и попробуйте ещё раз.",
    "ky": "Текшерүү жүктөлгөн жок. Интернетти текшерип, кайра аракет кылыңыз.",
    "en": "Could not load verification. Check your connection and try again.",
    "uz": "Tekshiruvni yuklab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.",
    "kk": "Тексеруді жүктеу мүмкін болмады. Интернетті тексеріп, қайталап көріңіз."
  },
  "Сервис проверки временно недоступен. Попробуйте ещё раз.": {
    "ru": "Сервис проверки временно недоступен. Попробуйте ещё раз.",
    "ky": "Текшерүү кызматы убактылуу жеткиликсиз. Кайра аракет кылыңыз.",
    "en": "Verification is temporarily unavailable. Please try again.",
    "uz": "Tekshiruv xizmati vaqtincha ishlamayapti. Qayta urinib ko‘ring.",
    "kk": "Тексеру қызметі уақытша қолжетімсіз. Қайталап көріңіз."
  },
  "Очистить корзину?": {
    "ru": "Очистить корзину?",
    "ky": "Себетти тазалайсызбы?",
    "en": "Clear your cart?",
    "uz": "Savatni tozalaysizmi?",
    "kk": "Себетті тазалайсыз ба?"
  },
  "Все выбранные блюда и добавки будут удалены.": {
    "ru": "Все выбранные блюда и добавки будут удалены.",
    "ky": "Тандалган бардык тамактар жана кошумчалар өчүрүлөт.",
    "en": "All selected dishes and extras will be removed.",
    "uz": "Tanlangan barcha taomlar va qo‘shimchalar olib tashlanadi.",
    "kk": "Таңдалған барлық тағамдар мен қосымшалар жойылады."
  },
  "Отмена": {
    "ru": "Отмена",
    "ky": "Жокко чыгаруу",
    "en": "Cancel",
    "uz": "Bekor qilish",
    "kk": "Бас тарту"
  },
  "Очистить": {
    "ru": "Очистить",
    "ky": "Тазалоо",
    "en": "Clear",
    "uz": "Tozalash",
    "kk": "Тазалау"
  },
  "без приборов": {
    "ru": "без приборов",
    "ky": "ашкана шаймандарысыз",
    "en": "no cutlery",
    "uz": "ovqatlanish anjomlarisiz",
    "kk": "ас құралдарынсыз"
  },
  "комплект": {
    "ru": "комплект",
    "ky": "топтом",
    "en": "set",
    "uz": "to‘plam",
    "kk": "жиынтық"
  },
  "комплекта": {
    "ru": "комплекта",
    "ky": "топтом",
    "en": "sets",
    "uz": "to‘plam",
    "kk": "жиынтық"
  },
  "Кухня закрыта.": {
    "ru": "Кухня закрыта.",
    "ky": "Ашкана жабык.",
    "en": "The kitchen is closed.",
    "uz": "Oshxona yopiq.",
    "kk": "Асүй жабық."
  },
  "Самовывоз из выбранной кухни": {
    "ru": "Самовывоз из выбранной кухни",
    "ky": "Тандалган ашканадан алып кетүү",
    "en": "Pick up from the selected kitchen",
    "uz": "Tanlangan oshxonadan olib ketish",
    "kk": "Таңдалған асүйден алып кету"
  },
  "Доставка": {
    "ru": "Доставка",
    "ky": "Жеткирүү",
    "en": "Delivery",
    "uz": "Yetkazib berish",
    "kk": "Жеткізу"
  },
  "• До бесплатной": {
    "ru": "• До бесплатной",
    "ky": "• Акысыз жеткирүүгө чейин",
    "en": "• Until free delivery",
    "uz": "• Bepul yetkazib berishgacha",
    "kk": "• Тегін жеткізуге дейін"
  },
  "Доставка • Бесплатно": {
    "ru": "Доставка • Бесплатно",
    "ky": "Жеткирүү • Акысыз",
    "en": "Delivery • Free",
    "uz": "Yetkazib berish • Bepul",
    "kk": "Жеткізу • Тегін"
  },
  "К оформлению, {0}": {
    "ru": "К оформлению, {0}",
    "ky": "Буйрутманы тариздөө, {0}",
    "en": "Checkout, {0}",
    "uz": "Buyurtmani rasmiylashtirish, {0}",
    "kk": "Тапсырысты рәсімдеу, {0}"
  },
  "Сумма корзины: {0}": {
    "ru": "Сумма корзины: {0}",
    "ky": "Себеттин суммасы: {0}",
    "en": "Cart total: {0}",
    "uz": "Savat jami: {0}",
    "kk": "Себет сомасы: {0}"
  },
  "К оформлению": {
    "ru": "К оформлению",
    "ky": "Буйрутманы тариздөө",
    "en": "Checkout",
    "uz": "Rasmiylashtirish",
    "kk": "Тапсырысты рәсімдеу"
  },
  "Кухня закрыта": {
    "ru": "Кухня закрыта",
    "ky": "Ашкана жабык",
    "en": "Kitchen closed",
    "uz": "Oshxona yopiq",
    "kk": "Асүй жабық"
  },
  "Самовывоз": {
    "ru": "Самовывоз",
    "ky": "Өзү алып кетүү",
    "en": "Pickup",
    "uz": "Olib ketish",
    "kk": "Өзіңіз алып кету"
  },
  "Корзина": {
    "ru": "Корзина",
    "ky": "Себет",
    "en": "Cart",
    "uz": "Savat",
    "kk": "Себет"
  },
  "Очистить корзину": {
    "ru": "Очистить корзину",
    "ky": "Себетти тазалоо",
    "en": "Clear cart",
    "uz": "Savatni tozalash",
    "kk": "Себетті тазалау"
  },
  "Пока пусто": {
    "ru": "Пока пусто",
    "ky": "Азырынча бош",
    "en": "Your cart is empty",
    "uz": "Hozircha bo‘sh",
    "kk": "Әзірге бос"
  },
  "Добавьте блюда из каталога — всё появится здесь.": {
    "ru": "Добавьте блюда из каталога — всё появится здесь.",
    "ky": "Каталогдон тамактарды кошуңуз — алар ушул жерге чыгат.",
    "en": "Add dishes from the menu and they will appear here.",
    "uz": "Menyudan taom qo‘shing — ular shu yerda ko‘rinadi.",
    "kk": "Мәзірден тағам қосыңыз — бәрі осында көрсетіледі."
  },
  "Вернуться в каталог": {
    "ru": "Вернуться в каталог",
    "ky": "Каталогго кайтуу",
    "en": "Back to menu",
    "uz": "Menyuga qaytish",
    "kk": "Мәзірге оралу"
  },
  "Стандартная комплектация": {
    "ru": "Стандартная комплектация",
    "ky": "Стандарттык топтом",
    "en": "Standard extras",
    "uz": "Standart qo‘shimchalar",
    "kk": "Стандартты жиынтық"
  },
  "Комплектация": {
    "ru": "Комплектация",
    "ky": "Буйрутмага кошумчалар",
    "en": "Order extras",
    "uz": "Buyurtma qo‘shimchalari",
    "kk": "Тапсырыс қосымшалары"
  },
  "Управлять": {
    "ru": "Управлять",
    "ky": "Өзгөртүү",
    "en": "Edit",
    "uz": "O‘zgartirish",
    "kk": "Өзгерту"
  },
  "Промокод": {
    "ru": "Промокод",
    "ky": "Промокод",
    "en": "Promo code",
    "uz": "Promokod",
    "kk": "Промокод"
  },
  "или скидка": {
    "ru": "или скидка",
    "ky": "же арзандатуу",
    "en": "or discount",
    "uz": "yoki chegirma",
    "kk": "немесе жеңілдік"
  },
  "Промокоды пока недоступны": {
    "ru": "Промокоды пока недоступны",
    "ky": "Промокоддор азырынча жеткиликсиз",
    "en": "Promo codes are not available yet",
    "uz": "Promokodlar hozircha mavjud emas",
    "kk": "Промокодтар әзірге қолжетімсіз"
  },
  "Промокоды скоро появятся": {
    "ru": "Промокоды скоро появятся",
    "ky": "Промокоддор жакында пайда болот",
    "en": "Promo codes are coming soon",
    "uz": "Promokodlar tez orada paydo bo‘ladi",
    "kk": "Промокодтар жақында пайда болады"
  },
  "Сейчас промокод не применяется и не меняет стоимость заказа.": {
    "ru": "Сейчас промокод не применяется и не меняет стоимость заказа.",
    "ky": "Азыр промокод колдонулбайт жана буйрутманын баасын өзгөртпөйт.",
    "en": "Promo codes cannot be applied yet and will not change your order total.",
    "uz": "Hozir promokod qo‘llanmaydi va buyurtma narxini o‘zgartirmaydi.",
    "kk": "Қазір промокод қолданылмайды және тапсырыс құнын өзгертпейді."
  },
  "Ввести": {
    "ru": "Ввести",
    "ky": "Киргизүү",
    "en": "Enter",
    "uz": "Kiritish",
    "kk": "Енгізу"
  },
  "Добавить к заказу?": {
    "ru": "Добавить к заказу?",
    "ky": "Буйрутмага кошосузбу?",
    "en": "Add to your order?",
    "uz": "Buyurtmaga qo‘shasizmi?",
    "kk": "Тапсырысқа қосасыз ба?"
  },
  "Добавить {0}": {
    "ru": "Добавить {0}",
    "ky": "{0} кошуу",
    "en": "Add {0}",
    "uz": "{0} qo‘shish",
    "kk": "{0} қосу"
  },
  "Бесплатно": {
    "ru": "Бесплатно",
    "ky": "Акысыз",
    "en": "Free",
    "uz": "Bepul",
    "kk": "Тегін"
  },
  "шт": {
    "ru": "шт",
    "ky": "даана",
    "en": "pcs",
    "uz": "dona",
    "kk": "дана"
  },
  "Приборы": {
    "ru": "Приборы",
    "ky": "Ашкана шаймандары",
    "en": "Cutlery",
    "uz": "Ovqatlanish anjomlari",
    "kk": "Ас құралдары"
  },
  "Без приборов": {
    "ru": "Без приборов",
    "ky": "Ашкана шаймандарысыз",
    "en": "No cutlery",
    "uz": "Ovqatlanish anjomlarisiz",
    "kk": "Ас құралдарынсыз"
  },
  "Палочки": {
    "ru": "Палочки",
    "ky": "Таякчалар",
    "en": "Chopsticks",
    "uz": "Tayoqchalar",
    "kk": "Таяқшалар"
  },
  "0 шт": {
    "ru": "0 шт",
    "ky": "0 даана",
    "en": "0 pcs",
    "uz": "0 dona",
    "kk": "0 дана"
  },
  "и салфетки": {
    "ru": "и салфетки",
    "ky": "жана майлыктар",
    "en": "and napkins",
    "uz": "va salfetkalar",
    "kk": "және майлықтар"
  },
  "Добавить приборы": {
    "ru": "Добавить приборы",
    "ky": "Ашкана шаймандарын кошуу",
    "en": "Add cutlery",
    "uz": "Ovqatlanish anjomlarini qo‘shish",
    "kk": "Ас құралдарын қосу"
  },
  "Дополнительно": {
    "ru": "Дополнительно",
    "ky": "Кошумча",
    "en": "Extras",
    "uz": "Qo‘shimcha",
    "kk": "Қосымша"
  },
  "Топпинги": {
    "ru": "Топпинги",
    "ky": "Топпингдер",
    "en": "Toppings",
    "uz": "Toppinglar",
    "kk": "Топпингтер"
  },
  "и прочее": {
    "ru": "и прочее",
    "ky": "жана башкалар",
    "en": "and more",
    "uz": "va boshqalar",
    "kk": "және басқалар"
  },
  "Открыть дополнения": {
    "ru": "Открыть дополнения",
    "ky": "Кошумчаларды ачуу",
    "en": "View extras",
    "uz": "Qo‘shimchalarni ochish",
    "kk": "Қосымшаларды ашу"
  },
  "Сохранить выбор": {
    "ru": "Сохранить выбор",
    "ky": "Тандоону сактоо",
    "en": "Save selection",
    "uz": "Tanlovni saqlash",
    "kk": "Таңдауды сақтау"
  },
  "Будет сразу добавлено в корзину": {
    "ru": "Будет сразу добавлено в корзину",
    "ky": "Дароо себетке кошулат",
    "en": "Added straight to your cart",
    "uz": "Darhol savatga qo‘shiladi",
    "kk": "Бірден себетке қосылады"
  },
  "Назад": {
    "ru": "Назад",
    "ky": "Артка",
    "en": "Back",
    "uz": "Orqaga",
    "kk": "Артқа"
  },
  "Подробные условия доставки": {
    "ru": "Подробные условия доставки",
    "ky": "Жеткирүүнүн толук шарттары",
    "en": "Full delivery terms",
    "uz": "Yetkazib berishning batafsil shartlari",
    "kk": "Жеткізудің толық шарттары"
  },
  "Самовывоз • бесплатно ›": {
    "ru": "Самовывоз • бесплатно ›",
    "ky": "Өзү алып кетүү • акысыз ›",
    "en": "Pickup • free ›",
    "uz": "Olib ketish • bepul ›",
    "kk": "Өзіңіз алып кету • тегін ›"
  },
  "До бесплатной": {
    "ru": "До бесплатной",
    "ky": "Акысыз жеткирүүгө чейин",
    "en": "Until free delivery",
    "uz": "Bepul yetkazib berishgacha",
    "kk": "Тегін жеткізуге дейін"
  },
  "Бесплатная доставка": {
    "ru": "Бесплатная доставка",
    "ky": "Акысыз жеткирүү",
    "en": "Free delivery",
    "uz": "Bepul yetkazib berish",
    "kk": "Тегін жеткізу"
  },
  "Открыть корзину, {0}": {
    "ru": "Открыть корзину, {0}",
    "ky": "Себетти ачуу, {0}",
    "en": "Open cart, {0}",
    "uz": "Savatni ochish, {0}",
    "kk": "Себетті ашу, {0}"
  },
  "Закрыто": {
    "ru": "Закрыто",
    "ky": "Жабык",
    "en": "Closed",
    "uz": "Yopiq",
    "kk": "Жабық"
  },
  "Адрес пока не выбран": {
    "ru": "Адрес пока не выбран",
    "ky": "Дарек азырынча тандалган жок",
    "en": "No address selected yet",
    "uz": "Manzil hali tanlanmagan",
    "kk": "Мекенжай әлі таңдалмаған"
  },
  "Понятно": {
    "ru": "Понятно",
    "ky": "Түшүнүктүү",
    "en": "Got it",
    "uz": "Tushunarli",
    "kk": "Түсінікті"
  },
  "Самовывоз бесплатно": {
    "ru": "Самовывоз бесплатно",
    "ky": "Өзү алып кетүү акысыз",
    "en": "Free pickup",
    "uz": "Olib ketish bepul",
    "kk": "Алып кету тегін"
  },
  "Доставка бесплатно": {
    "ru": "Доставка бесплатно",
    "ky": "Жеткирүү акысыз",
    "en": "Free delivery",
    "uz": "Yetkazib berish bepul",
    "kk": "Жеткізу тегін"
  },
  "До бесплатной ещё": {
    "ru": "До бесплатной ещё",
    "ky": "Акысыз жеткирүүгө дагы",
    "en": "More to spend for free delivery",
    "uz": "Bepul yetkazib berish uchun yana",
    "kk": "Тегін жеткізу үшін тағы"
  },
  "Закрыто ·": {
    "ru": "Закрыто ·",
    "ky": "Жабык ·",
    "en": "Closed ·",
    "uz": "Yopiq ·",
    "kk": "Жабық ·"
  },
  "Время доставки": {
    "ru": "Время доставки",
    "ky": "Жеткирүү убактысы",
    "en": "Delivery time",
    "uz": "Yetkazib berish vaqti",
    "kk": "Жеткізу уақыты"
  },
  "Минимальный заказ": {
    "ru": "Минимальный заказ",
    "ky": "Эң аз буйрутма",
    "en": "Minimum order",
    "uz": "Eng kam buyurtma",
    "kk": "Ең аз тапсырыс"
  },
  "Максимальный заказ": {
    "ru": "Максимальный заказ",
    "ky": "Эң көп буйрутма",
    "en": "Maximum order",
    "uz": "Eng ko‘p buyurtma",
    "kk": "Ең көп тапсырыс"
  },
  "Стоимость доставки": {
    "ru": "Стоимость доставки",
    "ky": "Жеткирүү акысы",
    "en": "Delivery fee",
    "uz": "Yetkazib berish narxi",
    "kk": "Жеткізу құны"
  },
  "При заказе до {0}": {
    "ru": "При заказе до {0}",
    "ky": "{0} чейинки буйрутмада",
    "en": "For orders under {0}",
    "uz": "{0} gacha bo‘lgan buyurtmalar uchun",
    "kk": "{0} дейінгі тапсырысқа"
  },
  "При заказе от {0}": {
    "ru": "При заказе от {0}",
    "ky": "{0} башталган буйрутмада",
    "en": "For orders from {0}",
    "uz": "{0} dan boshlangan buyurtmalar uchun",
    "kk": "{0} бастап тапсырысқа"
  },
  "Политика конфиденциальности": {
    "ru": "Политика конфиденциальности",
    "ky": "Купуялык саясаты",
    "en": "Privacy policy",
    "uz": "Maxfiylik siyosati",
    "kk": "Құпиялылық саясаты"
  },
  "Условия использования": {
    "ru": "Условия использования",
    "ky": "Колдонуу шарттары",
    "en": "Terms of use",
    "uz": "Foydalanish shartlari",
    "kk": "Пайдалану шарттары"
  },
  "Удаление аккаунта и данных": {
    "ru": "Удаление аккаунта и данных",
    "ky": "Аккаунтту жана маалыматтарды өчүрүү",
    "en": "Account and data deletion",
    "uz": "Hisob va ma’lumotlarni o‘chirish",
    "kk": "Тіркелгі мен деректерді жою"
  },
  "Закрыть документ": {
    "ru": "Закрыть документ",
    "ky": "Документти жабуу",
    "en": "Close document",
    "uz": "Hujjatni yopish",
    "kk": "Құжатты жабу"
  },
  "Кухня": {
    "ru": "Кухня",
    "ky": "Ашкана",
    "en": "Kitchen",
    "uz": "Oshxona",
    "kk": "Асүй"
  },
  "Часы работы уточняются": {
    "ru": "Часы работы уточняются",
    "ky": "Иш убактысы такталууда",
    "en": "Opening hours to be confirmed",
    "uz": "Ish vaqti aniqlashtirilmoqda",
    "kk": "Жұмыс уақыты нақтылануда"
  },
  "{0} м": {
    "ru": "{0} м",
    "ky": "{0} м",
    "en": "{0} m",
    "uz": "{0} m",
    "kk": "{0} м"
  },
  "{0} км": {
    "ru": "{0} км",
    "ky": "{0} км",
    "en": "{0} km",
    "uz": "{0} km",
    "kk": "{0} км"
  },
  "Сейчас для самовывоза нет доступных кухонь. Загляните сюда немного позже.": {
    "ru": "Сейчас для самовывоза нет доступных кухонь. Загляните сюда немного позже.",
    "ky": "Азыр өзү алып кетүүгө ылайыктуу ашканалар жок. Бир аздан кийин кайра текшериңиз.",
    "en": "No kitchens are available for pickup right now. Please check back later.",
    "uz": "Hozir olib ketish uchun mavjud oshxonalar yo‘q. Birozdan keyin qayta tekshiring.",
    "kk": "Қазір алып кетуге болатын асүйлер жоқ. Біраздан кейін қайта тексеріңіз."
  },
  "кухне": {
    "ru": "кухне",
    "ky": "ашканада",
    "en": "kitchen",
    "uz": "oshxonada",
    "kk": "асүйде"
  },
  "кухнях": {
    "ru": "кухнях",
    "ky": "ашканада",
    "en": "kitchens",
    "uz": "oshxonada",
    "kk": "асүйде"
  },
  "Сейчас самовывоз доступен в {0} {1}. Вы можете выбрать кухню на карте или из списка.": {
    "ru": "Сейчас самовывоз доступен в {0} {1}. Вы можете выбрать кухню на карте или из списка.",
    "ky": "Азыр {0} {1} өзү алып кетүүгө болот. Ашкананы картадан же тизмеден тандаңыз.",
    "en": "Pickup is currently available at {0} {1}. Choose a kitchen on the map or from the list.",
    "uz": "Hozir {0} {1} olib ketish mumkin. Oshxonani xarita yoki ro‘yxatdan tanlang.",
    "kk": "Қазір {0} {1} тапсырысты өзіңіз алып кете аласыз. Асүйді картадан немесе тізімнен таңдаңыз."
  },
  "Ничего не нашли. Уточните улицу и номер дома.": {
    "ru": "Ничего не нашли. Уточните улицу и номер дома.",
    "ky": "Эч нерсе табылган жок. Көчөнү жана үйдүн номерин тактаңыз.",
    "en": "No results. Please enter the street and house number.",
    "uz": "Hech narsa topilmadi. Ko‘cha va uy raqamini aniqlashtiring.",
    "kk": "Ештеңе табылмады. Көше мен үй нөмірін нақтылаңыз."
  },
  "Не удалось найти адрес": {
    "ru": "Не удалось найти адрес",
    "ky": "Дарек табылган жок",
    "en": "Could not find the address",
    "uz": "Manzil topilmadi",
    "kk": "Мекенжай табылмады"
  },
  "Этот адрес находится вне зоны доставки": {
    "ru": "Этот адрес находится вне зоны доставки",
    "ky": "Бул дарек жеткирүү аймагынан тышкары",
    "en": "This address is outside the delivery area",
    "uz": "Bu manzil yetkazib berish hududidan tashqarida",
    "kk": "Бұл мекенжай жеткізу аймағынан тыс орналасқан"
  },
  "Не удалось выбрать адрес": {
    "ru": "Не удалось выбрать адрес",
    "ky": "Даректи тандоо мүмкүн болгон жок",
    "en": "Could not select the address",
    "uz": "Manzilni tanlab bo‘lmadi",
    "kk": "Мекенжайды таңдау мүмкін болмады"
  },
  "Выберите адрес из списка.": {
    "ru": "Выберите адрес из списка.",
    "ky": "Тизмеден даректи тандаңыз.",
    "en": "Select an address from the list.",
    "uz": "Ro‘yxatdan manzil tanlang.",
    "kk": "Тізімнен мекенжай таңдаңыз."
  },
  "Разрешите геопозицию в настройках телефона.": {
    "ru": "Разрешите геопозицию в настройках телефона.",
    "ky": "Телефондун жөндөөлөрүнөн жайгашкан жериңизге уруксат бериңиз.",
    "en": "Allow location access in your phone settings.",
    "uz": "Telefon sozlamalarida joylashuvga ruxsat bering.",
    "kk": "Телефон баптауларында геолокацияға рұқсат беріңіз."
  },
  "Определяем адрес…": {
    "ru": "Определяем адрес…",
    "ky": "Даректи аныктап жатабыз…",
    "en": "Finding the address…",
    "uz": "Manzil aniqlanmoqda…",
    "kk": "Мекенжай анықталуда…"
  },
  "Не удалось определить местоположение. Укажите адрес вручную.": {
    "ru": "Не удалось определить местоположение. Укажите адрес вручную.",
    "ky": "Жайгашкан жериңизди аныктоо мүмкүн болгон жок. Даректи өзүңүз киргизиңиз.",
    "en": "Could not find your location. Enter your address manually.",
    "uz": "Joylashuvingizni aniqlab bo‘lmadi. Manzilni qo‘lda kiriting.",
    "kk": "Орналасқан жеріңізді анықтау мүмкін болмады. Мекенжайды қолмен енгізіңіз."
  },
  "Определяем ваше местоположение…": {
    "ru": "Определяем ваше местоположение…",
    "ky": "Жайгашкан жериңизди аныктап жатабыз…",
    "en": "Finding your location…",
    "uz": "Joylashuvingiz aniqlanmoqda…",
    "kk": "Орналасқан жеріңіз анықталуда…"
  },
  "Использовать текущее местоположение": {
    "ru": "Использовать текущее местоположение",
    "ky": "Учурдагы жайгашкан жерди колдонуу",
    "en": "Use current location",
    "uz": "Joriy joylashuvdan foydalanish",
    "kk": "Қазіргі орналасқан жерді пайдалану"
  },
  "Адрес доставки": {
    "ru": "Адрес доставки",
    "ky": "Жеткирүү дареги",
    "en": "Delivery address",
    "uz": "Yetkazib berish manzili",
    "kk": "Жеткізу мекенжайы"
  },
  "Город {0}": {
    "ru": "Город {0}",
    "ky": "{0} шаары",
    "en": "City: {0}",
    "uz": "Shahar: {0}",
    "kk": "{0} қаласы"
  },
  "Введите адрес доставки": {
    "ru": "Введите адрес доставки",
    "ky": "Жеткирүү дарегин киргизиңиз",
    "en": "Enter delivery address",
    "uz": "Yetkazib berish manzilini kiriting",
    "kk": "Жеткізу мекенжайын енгізіңіз"
  },
  "Далее": {
    "ru": "Далее",
    "ky": "Кийинки",
    "en": "Next",
    "uz": "Keyingi",
    "kk": "Келесі"
  },
  "Уточнить адрес": {
    "ru": "Уточнить адрес",
    "ky": "Даректи тактоо",
    "en": "Specify address",
    "uz": "Manzilni aniqlashtirish",
    "kk": "Мекенжайды нақтылау"
  },
  "от вас": {
    "ru": "от вас",
    "ky": "сизден",
    "en": "away",
    "uz": "sizdan",
    "kk": "сізден"
  },
  "Заберу здесь": {
    "ru": "Заберу здесь",
    "ky": "Ушул жерден алам",
    "en": "Pick up here",
    "uz": "Shu yerdan olib ketaman",
    "kk": "Осы жерден аламын"
  },
  "Маршрут": {
    "ru": "Маршрут",
    "ky": "Багыт",
    "en": "Directions",
    "uz": "Yo‘nalish",
    "kk": "Бағыт"
  },
  "Отменить": {
    "ru": "Отменить",
    "ky": "Жокко чыгаруу",
    "en": "Cancel",
    "uz": "Bekor qilish",
    "kk": "Бас тарту"
  },
  "Корзина самовывоза": {
    "ru": "Корзина самовывоза",
    "ky": "Өзү алып кетүү үчүн себет",
    "en": "Pickup cart",
    "uz": "Olib ketish savati",
    "kk": "Алып кету себеті"
  },
  "Список": {
    "ru": "Список",
    "ky": "Тизме",
    "en": "List",
    "uz": "Ro‘yxat",
    "kk": "Тізім"
  },
  "Закрыть список кухонь": {
    "ru": "Закрыть список кухонь",
    "ky": "Ашканалардын тизмесин жабуу",
    "en": "Close kitchen list",
    "uz": "Oshxonalar ro‘yxatini yopish",
    "kk": "Асүйлер тізімін жабу"
  },
  "Выберите кухню для самовывоза": {
    "ru": "Выберите кухню для самовывоза",
    "ky": "Өзү алып кетүү үчүн ашкананы тандаңыз",
    "en": "Choose a pickup kitchen",
    "uz": "Olib ketish uchun oshxona tanlang",
    "kk": "Алып кету үшін асүй таңдаңыз"
  },
  "Закрыто · {0}": {
    "ru": "Закрыто · {0}",
    "ky": "Жабык · {0}",
    "en": "Closed · {0}",
    "uz": "Yopiq · {0}",
    "kk": "Жабық · {0}"
  },
  "Выбрать": {
    "ru": "Выбрать",
    "ky": "Тандоо",
    "en": "Select",
    "uz": "Tanlash",
    "kk": "Таңдау"
  },
  "Закрыть ввод адреса": {
    "ru": "Закрыть ввод адреса",
    "ky": "Дарек киргизүүнү жабуу",
    "en": "Close address entry",
    "uz": "Manzil kiritishni yopish",
    "kk": "Мекенжай енгізуді жабу"
  },
  "Введите адрес": {
    "ru": "Введите адрес",
    "ky": "Даректи киргизиңиз",
    "en": "Enter address",
    "uz": "Manzilni kiriting",
    "kk": "Мекенжайды енгізіңіз"
  },
  "Очистить поиск": {
    "ru": "Очистить поиск",
    "ky": "Издөөнү тазалоо",
    "en": "Clear search",
    "uz": "Qidiruvni tozalash",
    "kk": "Іздеуді тазалау"
  },
  "Ищем адрес…": {
    "ru": "Ищем адрес…",
    "ky": "Даректи издеп жатабыз…",
    "en": "Searching for an address…",
    "uz": "Manzil qidirilmoqda…",
    "kk": "Мекенжай ізделуде…"
  },
  "Поддержка": {
    "ru": "Поддержка",
    "ky": "Колдоо кызматы",
    "en": "Support",
    "uz": "Yordam",
    "kk": "Қолдау"
  },
  "О нас": {
    "ru": "О нас",
    "ky": "Биз жөнүндө",
    "en": "About us",
    "uz": "Biz haqimizda",
    "kk": "Біз туралы"
  },
  "Закрыть меню": {
    "ru": "Закрыть меню",
    "ky": "Менюну жабуу",
    "en": "Close menu",
    "uz": "Menyuni yopish",
    "kk": "Мәзірді жабу"
  },
  "Привет!": {
    "ru": "Привет!",
    "ky": "Салам!",
    "en": "Hello!",
    "uz": "Salom!",
    "kk": "Сәлем!"
  },
  "Выйти из аккаунта": {
    "ru": "Выйти из аккаунта",
    "ky": "Аккаунттан чыгуу",
    "en": "Sign out of your account",
    "uz": "Hisobdan chiqish",
    "kk": "Тіркелгіден шығу"
  },
  "Выйти": {
    "ru": "Выйти",
    "ky": "Чыгуу",
    "en": "Sign out",
    "uz": "Chiqish",
    "kk": "Шығу"
  },
  "Мои заказы": {
    "ru": "Мои заказы",
    "ky": "Менин буйрутмаларым",
    "en": "My orders",
    "uz": "Buyurtmalarim",
    "kk": "Менің тапсырыстарым"
  },
  "Настройки": {
    "ru": "Настройки",
    "ky": "Жөндөөлөр",
    "en": "Settings",
    "uz": "Sozlamalar",
    "kk": "Баптаулар"
  },
  "Вход в личный кабинет": {
    "ru": "Вход в личный кабинет",
    "ky": "Жеке кабинетке кирүү",
    "en": "Sign in to your account",
    "uz": "Shaxsiy kabinetga kirish",
    "kk": "Жеке кабинетке кіру"
  },
  "Накта суши": {
    "ru": "Накта суши",
    "ky": "Накта суши",
    "en": "Nakta Sushi",
    "uz": "Nakta Sushi",
    "kk": "Накта суши"
  },
  "Правовая информация": {
    "ru": "Правовая информация",
    "ky": "Укуктук маалымат",
    "en": "Legal information",
    "uz": "Huquqiy ma’lumot",
    "kk": "Құқықтық ақпарат"
  },
  "Версия": {
    "ru": "Версия",
    "ky": "Версия",
    "en": "Version",
    "uz": "Versiya",
    "kk": "Нұсқа"
  },
  "«Накта суши» запрашивает разрешение на отправку уведомлений": {
    "ru": "«Накта суши» запрашивает разрешение на отправку уведомлений",
    "ky": "«Накта суши» билдирмелерди жөнөтүүгө уруксат сурайт",
    "en": "Nakta Sushi would like to send you notifications",
    "uz": "«Nakta Sushi» bildirishnomalar yuborishga ruxsat so‘ramoqda",
    "kk": "«Накта суши» хабарландыру жіберуге рұқсат сұрайды"
  },
  "Уведомления сообщат об изменении статуса заказа.": {
    "ru": "Уведомления сообщат об изменении статуса заказа.",
    "ky": "Билдирмелер буйрутманын абалы өзгөргөндө кабарлайт.",
    "en": "Notifications let you know when your order status changes.",
    "uz": "Bildirishnomalar buyurtma holati o‘zgarganda xabar beradi.",
    "kk": "Хабарландырулар тапсырыс күйі өзгергенде хабар береді."
  },
  "Не разрешать уведомления": {
    "ru": "Не разрешать уведомления",
    "ky": "Билдирмелерге уруксат бербөө",
    "en": "Do not allow notifications",
    "uz": "Bildirishnomalarga ruxsat bermaslik",
    "kk": "Хабарландыруларға рұқсат бермеу"
  },
  "Не разрешать": {
    "ru": "Не разрешать",
    "ky": "Уруксат бербөө",
    "en": "Do not allow",
    "uz": "Ruxsat bermaslik",
    "kk": "Рұқсат бермеу"
  },
  "Разрешить уведомления": {
    "ru": "Разрешить уведомления",
    "ky": "Билдирмелерге уруксат берүү",
    "en": "Allow notifications",
    "uz": "Bildirishnomalarga ruxsat berish",
    "kk": "Хабарландыруларға рұқсат беру"
  },
  "Подождите…": {
    "ru": "Подождите…",
    "ky": "Күтө туруңуз…",
    "en": "Please wait…",
    "uz": "Kuting…",
    "kk": "Күте тұрыңыз…"
  },
  "Разрешить": {
    "ru": "Разрешить",
    "ky": "Уруксат берүү",
    "en": "Allow",
    "uz": "Ruxsat berish",
    "kk": "Рұқсат беру"
  },
  "Номер телефона": {
    "ru": "Номер телефона",
    "ky": "Телефон номери",
    "en": "Phone number",
    "uz": "Telefon raqami",
    "kk": "Телефон нөмірі"
  },
  "Открыть {0}": {
    "ru": "Открыть {0}",
    "ky": "{0} ачуу",
    "en": "Open {0}",
    "uz": "{0} ochish",
    "kk": "{0} ашу"
  },
  "Фото {0}": {
    "ru": "Фото {0}",
    "ky": "{0} сүрөтү",
    "en": "Photo of {0}",
    "uz": "{0} rasmi",
    "kk": "{0} фотосы"
  },
  "Уменьшить количество {0}": {
    "ru": "Уменьшить количество {0}",
    "ky": "{0} санын азайтуу",
    "en": "Decrease quantity of {0}",
    "uz": "{0} miqdorini kamaytirish",
    "kk": "{0} санын азайту"
  },
  "Количество: {0}": {
    "ru": "Количество: {0}",
    "ky": "Саны: {0}",
    "en": "Quantity: {0}",
    "uz": "Miqdori: {0}",
    "kk": "Саны: {0}"
  },
  "Увеличить количество {0}": {
    "ru": "Увеличить количество {0}",
    "ky": "{0} санын көбөйтүү",
    "en": "Increase quantity of {0}",
    "uz": "{0} miqdorini ko‘paytirish",
    "kk": "{0} санын көбейту"
  },
  "Состав": {
    "ru": "Состав",
    "ky": "Курамы",
    "en": "Ingredients",
    "uz": "Tarkibi",
    "kk": "Құрамы"
  },
  "Состав уточняется.": {
    "ru": "Состав уточняется.",
    "ky": "Курамы такталууда.",
    "en": "Ingredients to be confirmed.",
    "uz": "Tarkibi aniqlashtirilmoqda.",
    "kk": "Құрамы нақтылануда."
  },
  "Добавить, {0}": {
    "ru": "Добавить, {0}",
    "ky": "Кошуу, {0}",
    "en": "Add, {0}",
    "uz": "Qo‘shish, {0}",
    "kk": "Қосу, {0}"
  },
  "Выберите модификации": {
    "ru": "Выберите модификации",
    "ky": "Тамактын варианттарын тандаңыз",
    "en": "Choose options",
    "uz": "Taom variantlarini tanlang",
    "kk": "Тағам нұсқаларын таңдаңыз"
  },
  "Добавить": {
    "ru": "Добавить",
    "ky": "Кошуу",
    "en": "Add",
    "uz": "Qo‘shish",
    "kk": "Қосу"
  },
  "Стоимость: {0}": {
    "ru": "Стоимость: {0}",
    "ky": "Баасы: {0}",
    "en": "Price: {0}",
    "uz": "Narxi: {0}",
    "kk": "Бағасы: {0}"
  },
  "грамм": {
    "ru": "грамм",
    "ky": "грамм",
    "en": "grams",
    "uz": "gramm",
    "kk": "грамм"
  },
  "ккал": {
    "ru": "ккал",
    "ky": "ккал",
    "en": "kcal",
    "uz": "kkal",
    "kk": "ккал"
  },
  "белки": {
    "ru": "белки",
    "ky": "белоктор",
    "en": "protein",
    "uz": "oqsil",
    "kk": "ақуыздар"
  },
  "жиры": {
    "ru": "жиры",
    "ky": "майлар",
    "en": "fat",
    "uz": "yog‘",
    "kk": "майлар"
  },
  "углеводы": {
    "ru": "углеводы",
    "ky": "углеводдор",
    "en": "carbs",
    "uz": "uglevod",
    "kk": "көмірсулар"
  },
  "Открыть состав": {
    "ru": "Открыть состав",
    "ky": "Курамын ачуу",
    "en": "View ingredients",
    "uz": "Tarkibini ko‘rish",
    "kk": "Құрамын ашу"
  },
  "Открыть комплектацию": {
    "ru": "Открыть комплектацию",
    "ky": "Буйрутмага кошумчаларды ачуу",
    "en": "View order extras",
    "uz": "Buyurtma qo‘shimchalarini ochish",
    "kk": "Тапсырыс қосымшаларын ашу"
  },
  "Не выбирать: {0}": {
    "ru": "Не выбирать: {0}",
    "ky": "Тандабоо: {0}",
    "en": "No selection: {0}",
    "uz": "Tanlamaslik: {0}",
    "kk": "Таңдамау: {0}"
  },
  "Не выбран": {
    "ru": "Не выбран",
    "ky": "Тандалган жок",
    "en": "Not selected",
    "uz": "Tanlanmagan",
    "kk": "Таңдалмаған"
  },
  "Убрать": {
    "ru": "Убрать",
    "ky": "Алып салуу",
    "en": "Remove",
    "uz": "Olib tashlash",
    "kk": "Алып тастау"
  },
  "Без доплаты": {
    "ru": "Без доплаты",
    "ky": "Кошумча акысыз",
    "en": "No extra charge",
    "uz": "Qo‘shimcha to‘lovsiz",
    "kk": "Қосымша төлемсіз"
  },
  "Вместе вкуснее": {
    "ru": "Вместе вкуснее",
    "ky": "Бирге даамдуураак",
    "en": "Better together",
    "uz": "Birga yanada mazali",
    "kk": "Бірге дәмдірек"
  },
  "Фото: {0}": {
    "ru": "Фото: {0}",
    "ky": "Сүрөт: {0}",
    "en": "Photo: {0}",
    "uz": "Rasm: {0}",
    "kk": "Фото: {0}"
  },
  "Изображение акции: {0}": {
    "ru": "Изображение акции: {0}",
    "ky": "Акциянын сүрөтү: {0}",
    "en": "Promotion image: {0}",
    "uz": "Aksiya rasmi: {0}",
    "kk": "Акция суреті: {0}"
  },
  "Закрыть акцию": {
    "ru": "Закрыть акцию",
    "ky": "Акцияны жабуу",
    "en": "Close promotion",
    "uz": "Aksiyani yopish",
    "kk": "Акцияны жабу"
  },
  "Предыдущая акция": {
    "ru": "Предыдущая акция",
    "ky": "Мурунку акция",
    "en": "Previous promotion",
    "uz": "Oldingi aksiya",
    "kk": "Алдыңғы акция"
  },
  "Следующая акция": {
    "ru": "Следующая акция",
    "ky": "Кийинки акция",
    "en": "Next promotion",
    "uz": "Keyingi aksiya",
    "kk": "Келесі акция"
  },
  "Уменьшить количество": {
    "ru": "Уменьшить количество",
    "ky": "Санын азайтуу",
    "en": "Decrease quantity",
    "uz": "Miqdorini kamaytirish",
    "kk": "Санын азайту"
  },
  "Увеличить количество": {
    "ru": "Увеличить количество",
    "ky": "Санын көбөйтүү",
    "en": "Increase quantity",
    "uz": "Miqdorini ko‘paytirish",
    "kk": "Санын көбейту"
  },
  "Поиск не сработал": {
    "ru": "Поиск не сработал",
    "ky": "Издөө иштеген жок",
    "en": "Search failed",
    "uz": "Qidiruv ishlamadi",
    "kk": "Іздеу орындалмады"
  },
  "Поиск по блюдам": {
    "ru": "Поиск по блюдам",
    "ky": "Тамактарды издөө",
    "en": "Search dishes",
    "uz": "Taomlarni qidirish",
    "kk": "Тағамдарды іздеу"
  },
  "Ищем…": {
    "ru": "Ищем…",
    "ky": "Издеп жатабыз…",
    "en": "Searching…",
    "uz": "Qidirilmoqda…",
    "kk": "Ізделуде…"
  },
  "Ничего не нашли": {
    "ru": "Ничего не нашли",
    "ky": "Эч нерсе табылган жок",
    "en": "No results",
    "uz": "Hech narsa topilmadi",
    "kk": "Ештеңе табылмады"
  },
  "Попробуйте другое название блюда.": {
    "ru": "Попробуйте другое название блюда.",
    "ky": "Тамактын башка атын киргизип көрүңүз.",
    "en": "Try a different dish name.",
    "uz": "Taomning boshqa nomini kiritib ko‘ring.",
    "kk": "Тағамның басқа атауын енгізіп көріңіз."
  },
  "Закрыть окно": {
    "ru": "Закрыть окно",
    "ky": "Терезени жабуу",
    "en": "Close window",
    "uz": "Oynani yopish",
    "kk": "Терезені жабу"
  },
  "Не удалось загрузить Yandex MapKit. Проверьте интернет и повторите.": {
    "ru": "Не удалось загрузить Yandex MapKit. Проверьте интернет и повторите.",
    "ky": "Yandex MapKit жүктөлгөн жок. Интернетти текшерип, кайра аракет кылыңыз.",
    "en": "Could not load Yandex MapKit. Check your connection and try again.",
    "uz": "Yandex MapKit yuklanmadi. Internetni tekshirib, qayta urinib ko‘ring.",
    "kk": "Yandex MapKit жүктелмеді. Интернетті тексеріп, қайталап көріңіз."
  },
  "Не задан ключ Yandex MapKit": {
    "ru": "Не задан ключ Yandex MapKit",
    "ky": "Yandex MapKit ачкычы көрсөтүлгөн эмес",
    "en": "Yandex MapKit key is missing",
    "uz": "Yandex MapKit kaliti ko‘rsatilmagan",
    "kk": "Yandex MapKit кілті көрсетілмеген"
  },
  "Не задан ключ Yandex MapKit для мобильного приложения.": {
    "ru": "Не задан ключ Yandex MapKit для мобильного приложения.",
    "ky": "Мобилдик колдонмо үчүн Yandex MapKit ачкычы көрсөтүлгөн эмес.",
    "en": "The mobile app's Yandex MapKit key is missing.",
    "uz": "Mobil ilova uchun Yandex MapKit kaliti ko‘rsatilmagan.",
    "kk": "Мобильді қолданбаға арналған Yandex MapKit кілті көрсетілмеген."
  },
  "Не удалось запустить Yandex MapKit": {
    "ru": "Не удалось запустить Yandex MapKit",
    "ky": "Yandex MapKit ишке кирген жок",
    "en": "Could not start Yandex MapKit",
    "uz": "Yandex MapKit ishga tushmadi",
    "kk": "Yandex MapKit іске қосылмады"
  },
  "Карта загружается слишком долго. Проверьте интернет-соединение.": {
    "ru": "Карта загружается слишком долго. Проверьте интернет-соединение.",
    "ky": "Карта өтө жай жүктөлүүдө. Интернет байланышын текшериңиз.",
    "en": "The map is taking too long to load. Check your internet connection.",
    "uz": "Xarita juda sekin yuklanmoqda. Internet aloqasini tekshiring.",
    "kk": "Карта тым ұзақ жүктелуде. Интернет байланысын тексеріңіз."
  },
  "Доставка недоступна в вашем городе.": {
    "ru": "Доставка недоступна в вашем городе.",
    "ky": "Шаарыңызда жеткирүү жеткиликсиз.",
    "en": "Delivery is not available in your city.",
    "uz": "Shahringizda yetkazib berish mavjud emas.",
    "kk": "Қалаңызда жеткізу қолжетімсіз."
  },
  "Адрес не найден": {
    "ru": "Адрес не найден",
    "ky": "Дарек табылган жок",
    "en": "Address not found",
    "uz": "Manzil topilmadi",
    "kk": "Мекенжай табылмады"
  },
  "Не удалось определить адрес. Передвиньте метку ближе к дому.": {
    "ru": "Не удалось определить адрес. Передвиньте метку ближе к дому.",
    "ky": "Даректи аныктоо мүмкүн болгон жок. Белгини үйгө жакыныраак жылдырыңыз.",
    "en": "Could not find the address. Move the pin closer to the house.",
    "uz": "Manzilni aniqlab bo‘lmadi. Belgini uyga yaqinroq suring.",
    "kk": "Мекенжайды анықтау мүмкін болмады. Белгіні үйге жақынырақ жылжытыңыз."
  },
  "Сервис адресов временно недоступен. Попробуйте ещё раз.": {
    "ru": "Сервис адресов временно недоступен. Попробуйте ещё раз.",
    "ky": "Дарек кызматы убактылуу жеткиликсиз. Кайра аракет кылыңыз.",
    "en": "The address service is temporarily unavailable. Please try again.",
    "uz": "Manzil xizmati vaqtincha ishlamayapti. Qayta urinib ko‘ring.",
    "kk": "Мекенжай қызметі уақытша қолжетімсіз. Қайталап көріңіз."
  },
  "Загружаем Яндекс Карту…": {
    "ru": "Загружаем Яндекс Карту…",
    "ky": "Яндекс Картасын жүктөп жатабыз…",
    "en": "Loading Yandex Maps…",
    "uz": "Yandex xaritasi yuklanmoqda…",
    "kk": "Яндекс картасы жүктелуде…"
  },
  "Карта временно недоступна": {
    "ru": "Карта временно недоступна",
    "ky": "Карта убактылуу жеткиликсиз",
    "en": "Map temporarily unavailable",
    "uz": "Xarita vaqtincha mavjud emas",
    "kk": "Карта уақытша қолжетімсіз"
  },
  "Яндекс Карта выбора адреса": {
    "ru": "Яндекс Карта выбора адреса",
    "ky": "Дарек тандоо үчүн Яндекс Картасы",
    "en": "Yandex address selection map",
    "uz": "Manzil tanlash uchun Yandex xaritasi",
    "kk": "Мекенжай таңдау үшін Яндекс картасы"
  },
  "Бишкек": {
    "ru": "Бишкек",
    "ky": "Бишкек",
    "en": "Bishkek",
    "uz": "Bishkek",
    "kk": "Бішкек"
  },
  "Ош": {
    "ru": "Ош",
    "ky": "Ош",
    "en": "Osh",
    "uz": "O‘sh",
    "kk": "Ош"
  },
  "Отуз-Адыр": {
    "ru": "Отуз-Адыр",
    "ky": "Отуз-Адыр",
    "en": "Otuz-Adyr",
    "uz": "O‘ttiz-Adir",
    "kk": "Отыз-Адыр"
  },
  "в воскресенье": {
    "ru": "в воскресенье",
    "ky": "жекшембиде",
    "en": "on Sunday",
    "uz": "yakshanba kuni",
    "kk": "жексенбіде"
  },
  "в понедельник": {
    "ru": "в понедельник",
    "ky": "дүйшөмбүдө",
    "en": "on Monday",
    "uz": "dushanba kuni",
    "kk": "дүйсенбіде"
  },
  "во вторник": {
    "ru": "во вторник",
    "ky": "шейшембиде",
    "en": "on Tuesday",
    "uz": "seshanba kuni",
    "kk": "сейсенбіде"
  },
  "в среду": {
    "ru": "в среду",
    "ky": "шаршембиде",
    "en": "on Wednesday",
    "uz": "chorshanba kuni",
    "kk": "сәрсенбіде"
  },
  "в четверг": {
    "ru": "в четверг",
    "ky": "бейшембиде",
    "en": "on Thursday",
    "uz": "payshanba kuni",
    "kk": "бейсенбіде"
  },
  "в пятницу": {
    "ru": "в пятницу",
    "ky": "жума күнү",
    "en": "on Friday",
    "uz": "juma kuni",
    "kk": "жұмада"
  },
  "в субботу": {
    "ru": "в субботу",
    "ky": "ишембиде",
    "en": "on Saturday",
    "uz": "shanba kuni",
    "kk": "сенбіде"
  },
  "Кухня открыта": {
    "ru": "Кухня открыта",
    "ky": "Ашкана ачык",
    "en": "Kitchen open",
    "uz": "Oshxona ochiq",
    "kk": "Асүй ашық"
  },
  "сегодня": {
    "ru": "сегодня",
    "ky": "бүгүн",
    "en": "today",
    "uz": "bugun",
    "kk": "бүгін"
  },
  "завтра": {
    "ru": "завтра",
    "ky": "эртең",
    "en": "tomorrow",
    "uz": "ertaga",
    "kk": "ертең"
  },
  "Откроемся {0} в {1}": {
    "ru": "Откроемся {0} в {1}",
    "ky": "{0} саат {1} ачылабыз",
    "en": "We open {0} at {1}",
    "uz": "{0} soat {1} da ochilamiz",
    "kk": "{0} сағат {1} ашыламыз"
  },
  "Кухня временно закрыта": {
    "ru": "Кухня временно закрыта",
    "ky": "Ашкана убактылуу жабык",
    "en": "Kitchen temporarily closed",
    "uz": "Oshxona vaqtincha yopiq",
    "kk": "Асүй уақытша жабық"
  },
  "~{0} мин": {
    "ru": "~{0} мин",
    "ky": "~{0} мүн",
    "en": "~{0} min",
    "uz": "~{0} daq",
    "kk": "~{0} мин"
  },
  "Ежедневно, без выходных": {
    "ru": "Ежедневно, без выходных",
    "ky": "Күн сайын, дем алышсыз",
    "en": "Every day",
    "uz": "Har kuni",
    "kk": "Күн сайын, демалыссыз"
  },
  "Вс": {
    "ru": "Вс",
    "ky": "Жк",
    "en": "Sun",
    "uz": "Yak",
    "kk": "Жс"
  },
  "Пн": {
    "ru": "Пн",
    "ky": "Дш",
    "en": "Mon",
    "uz": "Du",
    "kk": "Дс"
  },
  "Вт": {
    "ru": "Вт",
    "ky": "Шш",
    "en": "Tue",
    "uz": "Se",
    "kk": "Сс"
  },
  "Ср": {
    "ru": "Ср",
    "ky": "Шр",
    "en": "Wed",
    "uz": "Chor",
    "kk": "Ср"
  },
  "Чт": {
    "ru": "Чт",
    "ky": "Бш",
    "en": "Thu",
    "uz": "Pay",
    "kk": "Бс"
  },
  "Пт": {
    "ru": "Пт",
    "ky": "Жм",
    "en": "Fri",
    "uz": "Ju",
    "kk": "Жм"
  },
  "Сб": {
    "ru": "Сб",
    "ky": "Иш",
    "en": "Sat",
    "uz": "Sha",
    "kk": "Сб"
  },
  "Нет рабочих дней": {
    "ru": "Нет рабочих дней",
    "ky": "Иш күндөрү жок",
    "en": "No opening days",
    "uz": "Ish kunlari yo‘q",
    "kk": "Жұмыс күндері жоқ"
  },
  "{0}\nКруглосуточно": {
    "ru": "{0}\nКруглосуточно",
    "ky": "{0}\nКүнү-түнү",
    "en": "{0}\nOpen 24 hours",
    "uz": "{0}\nKecha-yu kunduz",
    "kk": "{0}\nТәулік бойы"
  },
  "Сервис адресов временно недоступен": {
    "ru": "Сервис адресов временно недоступен",
    "ky": "Дарек кызматы убактылуу жеткиликсиз",
    "en": "The address service is temporarily unavailable",
    "uz": "Manzil xizmati vaqtincha ishlamayapti",
    "kk": "Мекенжай қызметі уақытша қолжетімсіз"
  },
  "Не удалось определить координаты адреса. Выберите другой вариант.": {
    "ru": "Не удалось определить координаты адреса. Выберите другой вариант.",
    "ky": "Даректин координаттарын аныктоо мүмкүн болгон жок. Башка вариантты тандаңыз.",
    "en": "Could not find the address coordinates. Choose another result.",
    "uz": "Manzil koordinatalarini aniqlab bo‘lmadi. Boshqa variantni tanlang.",
    "kk": "Мекенжай координаталарын анықтау мүмкін болмады. Басқа нұсқаны таңдаңыз."
  },
  "{0} С": {
    "ru": "{0} С",
    "ky": "{0} С",
    "en": "{0} KGS",
    "uz": "{0} KGS",
    "kk": "{0} С"
  },
  "Статусы заказов": {
    "ru": "Статусы заказов",
    "ky": "Буйрутмалардын абалы",
    "en": "Order updates",
    "uz": "Buyurtma holatlari",
    "kk": "Тапсырыс күйлері"
  },
  "Заказ принят": {
    "ru": "Заказ принят",
    "ky": "Буйрутма кабыл алынды",
    "en": "Order received",
    "uz": "Buyurtma qabul qilindi",
    "kk": "Тапсырыс қабылданды"
  },
  "Мы получили заказ и скоро подтвердим его.": {
    "ru": "Мы получили заказ и скоро подтвердим его.",
    "ky": "Буйрутмаңызды алдык. Жакында ырастайбыз.",
    "en": "We have received your order and will confirm it shortly.",
    "uz": "Buyurtmangizni oldik va tez orada tasdiqlaymiz.",
    "kk": "Тапсырысыңызды алдық, жақында растаймыз."
  },
  "Заказ подтверждён": {
    "ru": "Заказ подтверждён",
    "ky": "Буйрутма ырасталды",
    "en": "Order confirmed",
    "uz": "Buyurtma tasdiqlandi",
    "kk": "Тапсырыс расталды"
  },
  "Кухня уже видит ваш заказ.": {
    "ru": "Кухня уже видит ваш заказ.",
    "ky": "Ашкана буйрутмаңызды алды.",
    "en": "The kitchen has your order.",
    "uz": "Oshxona buyurtmangizni oldi.",
    "kk": "Асүй тапсырысыңызды алды."
  },
  "Начали готовить": {
    "ru": "Начали готовить",
    "ky": "Даярдап баштадык",
    "en": "Cooking has started",
    "uz": "Tayyorlashni boshladik",
    "kk": "Дайындай бастадық"
  },
  "Ваш заказ готовится.": {
    "ru": "Ваш заказ готовится.",
    "ky": "Буйрутмаңыз даярдалууда.",
    "en": "Your order is being prepared.",
    "uz": "Buyurtmangiz tayyorlanmoqda.",
    "kk": "Тапсырысыңыз дайындалуда."
  },
  "Заказ готов": {
    "ru": "Заказ готов",
    "ky": "Буйрутма даяр",
    "en": "Order ready",
    "uz": "Buyurtma tayyor",
    "kk": "Тапсырыс дайын"
  },
  "Можно забирать заказ или ждать курьера.": {
    "ru": "Можно забирать заказ или ждать курьера.",
    "ky": "Буйрутманы алып кетсеңиз болот же курьерди күтүңүз.",
    "en": "Your order is ready for pickup or delivery.",
    "uz": "Buyurtmani olib ketishingiz yoki kuryerni kutishingiz mumkin.",
    "kk": "Тапсырысты алып кетуге болады немесе курьерді күтіңіз."
  },
  "Заказ в пути": {
    "ru": "Заказ в пути",
    "ky": "Буйрутма жолдо",
    "en": "Order on the way",
    "uz": "Buyurtma yo‘lda",
    "kk": "Тапсырыс жолда"
  },
  "Курьер уже направляется к вам.": {
    "ru": "Курьер уже направляется к вам.",
    "ky": "Курьер сизге бара жатат.",
    "en": "Your courier is on the way.",
    "uz": "Kuryer siz tomon yo‘lga chiqdi.",
    "kk": "Курьер сізге келе жатыр."
  },
  "Приятного аппетита!": {
    "ru": "Приятного аппетита!",
    "ky": "Тамагыңыз таттуу болсун!",
    "en": "Enjoy your meal!",
    "uz": "Yoqimli ishtaha!",
    "kk": "Асыңыз дәмді болсын!"
  },
  "Заказ завершён. Спасибо, что выбрали Накта суши.": {
    "ru": "Заказ завершён. Спасибо, что выбрали Накта суши.",
    "ky": "Буйрутма аткарылды. Накта сушини тандаганыңыз үчүн рахмат.",
    "en": "Order completed. Thank you for choosing Nakta Sushi.",
    "uz": "Buyurtma bajarildi. Nakta Sushi’ni tanlaganingiz uchun rahmat.",
    "kk": "Тапсырыс орындалды. Накта сушиді таңдағаныңызға рақмет."
  },
  "Заказ отменён": {
    "ru": "Заказ отменён",
    "ky": "Буйрутма жокко чыгарылды",
    "en": "Order cancelled",
    "uz": "Buyurtma bekor qilindi",
    "kk": "Тапсырыс тоқтатылды"
  },
  "Откройте приложение, чтобы посмотреть детали.": {
    "ru": "Откройте приложение, чтобы посмотреть детали.",
    "ky": "Толук маалымат үчүн колдонмону ачыңыз.",
    "en": "Open the app to view the details.",
    "uz": "Tafsilotlarni ko‘rish uchun ilovani oching.",
    "kk": "Толық ақпаратты көру үшін қолданбаны ашыңыз."
  },
  "Условия доставки и оплаты": {
    "ru": "Условия доставки и оплаты",
    "ky": "Жеткирүү жана төлөө шарттары",
    "en": "Delivery and payment terms",
    "uz": "Yetkazib berish va to‘lov shartlari",
    "kk": "Жеткізу және төлем шарттары"
  },
  "Нажимая «Получить код», вы соглашаетесь с": {
    "ru": "Нажимая «Получить код», вы соглашаетесь с",
    "ky": "«Код алуу» баскычын басуу менен төмөнкүлөргө макул болосуз:",
    "en": "By tapping “Get code”, you agree to:",
    "uz": "«Kodni olish» tugmasini bosish orqali quyidagilarga rozilik bildirasiz:",
    "kk": "«Код алу» түймесін басу арқылы төмендегілермен келісесіз:"
  },
  "Согласие на обработку данных": {
    "ru": "Согласие на обработку данных",
    "ky": "Маалыматтарды иштетүүгө макулдук",
    "en": "Consent to data processing",
    "uz": "Ma’lumotlarni qayta ishlashga rozilik",
    "kk": "Деректерді өңдеуге келісім"
  },
  "Согласием на обработку персональных данных": {
    "ru": "Согласием на обработку персональных данных",
    "ky": "Жеке маалыматтарды иштетүүгө макулдук",
    "en": "Consent to personal data processing",
    "uz": "Shaxsiy ma’lumotlarni qayta ishlashga rozilik",
    "kk": "Жеке деректерді өңдеуге келісім"
  },
  "Политикой конфиденциальности": {
    "ru": "Политикой конфиденциальности",
    "ky": "Купуялык саясаты",
    "en": "Privacy policy",
    "uz": "Maxfiylik siyosati",
    "kk": "Құпиялылық саясаты"
  },
  "Условиями использования": {
    "ru": "Условиями использования",
    "ky": "Колдонуу шарттары",
    "en": "Terms of use",
    "uz": "Foydalanish shartlari",
    "kk": "Пайдалану шарттары"
  },
  "Не удалось отправить код. Попробуйте ещё раз.": {
    "ru": "Не удалось отправить код. Попробуйте ещё раз.",
    "ky": "Код жөнөтүлгөн жок. Кайра аракет кылыңыз.",
    "en": "Could not send the code. Please try again.",
    "uz": "Kodni yuborib bo‘lmadi. Qayta urinib ko‘ring.",
    "kk": "Кодты жіберу мүмкін болмады. Қайталап көріңіз."
  },
  "Не удалось проверить код. Попробуйте ещё раз.": {
    "ru": "Не удалось проверить код. Попробуйте ещё раз.",
    "ky": "Кодду текшерүү мүмкүн болгон жок. Кайра аракет кылыңыз.",
    "en": "Could not verify the code. Please try again.",
    "uz": "Kodni tekshirib bo‘lmadi. Qayta urinib ko‘ring.",
    "kk": "Кодты тексеру мүмкін болмады. Қайталап көріңіз."
  },
  "WhatsApp-вход сейчас недоступен": {
    "ru": "WhatsApp-вход сейчас недоступен",
    "ky": "WhatsApp аркылуу кирүү азыр жеткиликсиз",
    "en": "WhatsApp sign-in is currently unavailable",
    "uz": "WhatsApp orqali kirish hozir ishlamayapti",
    "kk": "WhatsApp арқылы кіру қазір қолжетімсіз"
  },
  "Ссылка истекла. Запросите вход ещё раз.": {
    "ru": "Ссылка истекла. Запросите вход ещё раз.",
    "ky": "Шилтеменин мөөнөтү бүттү. Кирүүнү кайра сураңыз.",
    "en": "The link has expired. Request a new sign-in link.",
    "uz": "Havolaning muddati tugadi. Kirish havolasini qayta so‘rang.",
    "kk": "Сілтеменің мерзімі аяқталды. Кіру сілтемесін қайта сұраңыз."
  },
  "Не удалось проверить вход": {
    "ru": "Не удалось проверить вход",
    "ky": "Кирүүнү текшерүү мүмкүн болгон жок",
    "en": "Could not verify sign-in",
    "uz": "Kirishni tekshirib bo‘lmadi",
    "kk": "Кіруді тексеру мүмкін болмады"
  },
  "Повторно через {0} сек.": {
    "ru": "Повторно через {0} сек.",
    "ky": "{0} секунддан кийин кайра",
    "en": "Try again in {0} sec",
    "uz": "{0} soniyadan keyin qayta",
    "kk": "{0} секундтан кейін қайталау"
  },
  "Получить код": {
    "ru": "Получить код",
    "ky": "Код алуу",
    "en": "Get code",
    "uz": "Kodni olish",
    "kk": "Код алу"
  },
  "НАКТА": {
    "ru": "НАКТА",
    "ky": "НАКТА",
    "en": "NAKTA",
    "uz": "NAKTA",
    "kk": "НАКТА"
  },
  "СУШИ": {
    "ru": "СУШИ",
    "ky": "СУШИ",
    "en": "SUSHI",
    "uz": "SUSHI",
    "kk": "СУШИ"
  },
  "Введите код": {
    "ru": "Введите код",
    "ky": "Кодду киргизиңиз",
    "en": "Enter code",
    "uz": "Kodni kiriting",
    "kk": "Кодты енгізіңіз"
  },
  "Подтвердите вход": {
    "ru": "Подтвердите вход",
    "ky": "Кирүүнү ырастаңыз",
    "en": "Confirm sign-in",
    "uz": "Kirishni tasdiqlang",
    "kk": "Кіруді растаңыз"
  },
  "Войдите или зарегистрируйтесь": {
    "ru": "Войдите или зарегистрируйтесь",
    "ky": "Кириңиз же катталыңыз",
    "en": "Sign in or register",
    "uz": "Kiring yoki ro‘yxatdan o‘ting",
    "kk": "Кіріңіз немесе тіркеліңіз"
  },
  "Код отправлен на {0}": {
    "ru": "Код отправлен на {0}",
    "ky": "Код {0} номерине жөнөтүлдү",
    "en": "Code sent to {0}",
    "uz": "Kod {0} raqamiga yuborildi",
    "kk": "Код {0} нөміріне жіберілді"
  },
  "Отправьте подготовленное сообщение в WhatsApp и вернитесь в приложение": {
    "ru": "Отправьте подготовленное сообщение в WhatsApp и вернитесь в приложение",
    "ky": "Даяр билдирүүнү WhatsApp аркылуу жөнөтүп, колдонмого кайтыңыз",
    "en": "Send the prepared message in WhatsApp, then return to the app",
    "uz": "Tayyor xabarni WhatsApp orqali yuboring, so‘ng ilovaga qayting",
    "kk": "Дайын хабарламаны WhatsApp арқылы жіберіп, қолданбаға оралыңыз"
  },
  "Введите номер телефона, чтобы войти в личный кабинет": {
    "ru": "Введите номер телефона, чтобы войти в личный кабинет",
    "ky": "Жеке кабинетиңизге кирүү үчүн телефон номериңизди киргизиңиз",
    "en": "Enter your phone number to sign in to your account",
    "uz": "Shaxsiy kabinetga kirish uchun telefon raqamingizni kiriting",
    "kk": "Жеке кабинетке кіру үшін телефон нөміріңізді енгізіңіз"
  },
  "Введите 9 цифр после +996": {
    "ru": "Введите 9 цифр после +996",
    "ky": "+996 кодунан кийин 9 сан киргизиңиз",
    "en": "Enter 9 digits after +996",
    "uz": "+996 dan keyin 9 ta raqam kiriting",
    "kk": "+996 кодынан кейін 9 цифр енгізіңіз"
  },
  "Войти через WhatsApp": {
    "ru": "Войти через WhatsApp",
    "ky": "WhatsApp аркылуу кирүү",
    "en": "Sign in with WhatsApp",
    "uz": "WhatsApp orqali kirish",
    "kk": "WhatsApp арқылы кіру"
  },
  "Код из SMS": {
    "ru": "Код из SMS",
    "ky": "SMS коду",
    "en": "SMS code",
    "uz": "SMS kodi",
    "kk": "SMS коды"
  },
  "Подтвердить": {
    "ru": "Подтвердить",
    "ky": "Ырастоо",
    "en": "Confirm",
    "uz": "Tasdiqlash",
    "kk": "Растау"
  },
  "Отправить код повторно через {0} сек.": {
    "ru": "Отправить код повторно через {0} сек.",
    "ky": "Кодду {0} секунддан кийин кайра жөнөтүү",
    "en": "Resend code in {0} sec",
    "uz": "Kodni {0} soniyadan keyin qayta yuborish",
    "kk": "Кодты {0} секундтан кейін қайта жіберу"
  },
  "Отправить код повторно": {
    "ru": "Отправить код повторно",
    "ky": "Кодду кайра жөнөтүү",
    "en": "Resend code",
    "uz": "Kodni qayta yuborish",
    "kk": "Кодты қайта жіберу"
  },
  "Ждём подтверждение номера…": {
    "ru": "Ждём подтверждение номера…",
    "ky": "Номердин ырасталышын күтүп жатабыз…",
    "en": "Waiting for phone verification…",
    "uz": "Raqam tasdiqlanishini kutyapmiz…",
    "kk": "Нөмірдің расталуын күтіп жатырмыз…"
  },
  "Открыть WhatsApp ещё раз": {
    "ru": "Открыть WhatsApp ещё раз",
    "ky": "WhatsApp'ты кайра ачуу",
    "en": "Open WhatsApp again",
    "uz": "WhatsApp’ni qayta ochish",
    "kk": "WhatsApp-ты қайта ашу"
  },
  "Изменить номер": {
    "ru": "Изменить номер",
    "ky": "Номерди өзгөртүү",
    "en": "Change number",
    "uz": "Raqamni o‘zgartirish",
    "kk": "Нөмірді өзгерту"
  },
  "Не удалось загрузить каталог": {
    "ru": "Не удалось загрузить каталог",
    "ky": "Каталог жүктөлгөн жок",
    "en": "Could not load the menu",
    "uz": "Menyuni yuklab bo‘lmadi",
    "kk": "Мәзірді жүктеу мүмкін болмады"
  },
  "Открыть меню": {
    "ru": "Открыть меню",
    "ky": "Менюну ачуу",
    "en": "Open menu",
    "uz": "Menyuni ochish",
    "kk": "Мәзірді ашу"
  },
  "Открыть информацию о доставке": {
    "ru": "Открыть информацию о доставке",
    "ky": "Жеткирүү жөнүндө маалыматты ачуу",
    "en": "View delivery information",
    "uz": "Yetkazib berish ma’lumotini ochish",
    "kk": "Жеткізу туралы ақпаратты ашу"
  },
  "Выбрать адрес": {
    "ru": "Выбрать адрес",
    "ky": "Даректи тандоо",
    "en": "Choose address",
    "uz": "Manzil tanlash",
    "kk": "Мекенжай таңдау"
  },
  "Укажите адрес": {
    "ru": "Укажите адрес",
    "ky": "Даректи көрсөтүңүз",
    "en": "Set your address",
    "uz": "Manzilni ko‘rsating",
    "kk": "Мекенжайды көрсетіңіз"
  },
  "Загружаем вкусное…": {
    "ru": "Загружаем вкусное…",
    "ky": "Даамдуу тамактарды жүктөп жатабыз…",
    "en": "Loading something delicious…",
    "uz": "Mazali taomlar yuklanmoqda…",
    "kk": "Дәмді тағамдар жүктелуде…"
  },
  "Каталог пока не загрузился": {
    "ru": "Каталог пока не загрузился",
    "ky": "Каталог азырынча жүктөлгөн жок",
    "en": "The menu has not loaded yet",
    "uz": "Menyu hali yuklanmadi",
    "kk": "Мәзір әлі жүктелмеді"
  },
  "Попробовать снова": {
    "ru": "Попробовать снова",
    "ky": "Кайра аракет кылуу",
    "en": "Try again",
    "uz": "Qayta urinish",
    "kk": "Қайталап көру"
  },
  "Мы откроемся": {
    "ru": "Мы откроемся",
    "ky": "Биз ачылабыз",
    "en": "We will open",
    "uz": "Biz ochilamiz",
    "kk": "Біз ашыламыз"
  },
  "Сейчас кухня не работает. Немного отдохнём и откроемся снова.": {
    "ru": "Сейчас кухня не работает. Немного отдохнём и откроемся снова.",
    "ky": "Азыр ашкана иштебейт. Бир аз эс алып, кайра ачылабыз.",
    "en": "The kitchen is closed right now. We will be back after a short break.",
    "uz": "Hozir oshxona ishlamayapti. Biroz dam olib, yana ochilamiz.",
    "kk": "Қазір асүй жұмыс істемейді. Аздап демалып, қайта ашыламыз."
  },
  "График работы": {
    "ru": "График работы",
    "ky": "Иш убактысы",
    "en": "Opening hours",
    "uz": "Ish vaqti",
    "kk": "Жұмыс кестесі"
  },
  "Поиск": {
    "ru": "Поиск",
    "ky": "Издөө",
    "en": "Search",
    "uz": "Qidiruv",
    "kk": "Іздеу"
  },
  "Домофон": {
    "ru": "Домофон",
    "ky": "Домофон",
    "en": "Intercom",
    "uz": "Domofon",
    "kk": "Домофон"
  },
  "Укажите имя получателя": {
    "ru": "Укажите имя получателя",
    "ky": "Алуучунун атын көрсөтүңүз",
    "en": "Enter the recipient's name",
    "uz": "Qabul qiluvchining ismini kiriting",
    "kk": "Алушының атын енгізіңіз"
  },
  "Проверьте номер телефона": {
    "ru": "Проверьте номер телефона",
    "ky": "Телефон номерин текшериңиз",
    "en": "Check the phone number",
    "uz": "Telefon raqamini tekshiring",
    "kk": "Телефон нөмірін тексеріңіз"
  },
  "Выберите адрес доставки": {
    "ru": "Выберите адрес доставки",
    "ky": "Жеткирүү дарегин тандаңыз",
    "en": "Choose a delivery address",
    "uz": "Yetkazib berish manzilini tanlang",
    "kk": "Жеткізу мекенжайын таңдаңыз"
  },
  "Корзина пуста": {
    "ru": "Корзина пуста",
    "ky": "Себет бош",
    "en": "Your cart is empty",
    "uz": "Savat bo‘sh",
    "kk": "Себет бос"
  },
  "Войдите по номеру телефона заново": {
    "ru": "Войдите по номеру телефона заново",
    "ky": "Телефон номериңиз менен кайра кириңиз",
    "en": "Sign in again with your phone number",
    "uz": "Telefon raqamingiz bilan qayta kiring",
    "kk": "Телефон нөміріңізбен қайта кіріңіз"
  },
  "Кухня сейчас закрыта. {0}.": {
    "ru": "Кухня сейчас закрыта. {0}.",
    "ky": "Азыр ашкана жабык. {0}.",
    "en": "The kitchen is closed right now. {0}.",
    "uz": "Hozir oshxona yopiq. {0}.",
    "kk": "Қазір асүй жабық. {0}."
  },
  "Оставить у двери": {
    "ru": "Оставить у двери",
    "ky": "Эшиктин алдына калтыруу",
    "en": "Leave at the door",
    "uz": "Eshik oldida qoldirish",
    "kk": "Есіктің алдына қалдыру"
  },
  "Сервер не подтвердил сохранение заказа. Корзина сохранена — попробуйте ещё раз.": {
    "ru": "Сервер не подтвердил сохранение заказа. Корзина сохранена — попробуйте ещё раз.",
    "ky": "Сервер буйрутманын сакталганын ырастаган жок. Себетиңиз сакталды — кайра аракет кылыңыз.",
    "en": "The server did not confirm your order. Your cart has been saved — please try again.",
    "uz": "Server buyurtma saqlanganini tasdiqlamadi. Savatingiz saqlandi — qayta urinib ko‘ring.",
    "kk": "Сервер тапсырыстың сақталғанын растаған жоқ. Себетіңіз сақталды — қайталап көріңіз."
  },
  "Не удалось оформить заказ": {
    "ru": "Не удалось оформить заказ",
    "ky": "Буйрутманы тариздөө мүмкүн болгон жок",
    "en": "Could not place your order",
    "uz": "Buyurtmani rasmiylashtirib bo‘lmadi",
    "kk": "Тапсырысты рәсімдеу мүмкін болмады"
  },
  "Назад в корзину": {
    "ru": "Назад в корзину",
    "ky": "Себетке кайтуу",
    "en": "Back to cart",
    "uz": "Savatga qaytish",
    "kk": "Себетке оралу"
  },
  "Куда": {
    "ru": "Куда",
    "ky": "Кайда",
    "en": "Where to",
    "uz": "Qayerga",
    "kk": "Қайда"
  },
  "Выбрать адрес на карте": {
    "ru": "Выбрать адрес на карте",
    "ky": "Картадан даректи тандоо",
    "en": "Choose address on map",
    "uz": "Xaritadan manzil tanlash",
    "kk": "Картадан мекенжай таңдау"
  },
  "Улица и дом": {
    "ru": "Улица и дом",
    "ky": "Көчө жана үй",
    "en": "Street and house",
    "uz": "Ko‘cha va uy",
    "kk": "Көше және үй"
  },
  "Адрес кухни": {
    "ru": "Адрес кухни",
    "ky": "Ашкананын дареги",
    "en": "Kitchen address",
    "uz": "Oshxona manzili",
    "kk": "Асүй мекенжайы"
  },
  "Подъезд": {
    "ru": "Подъезд",
    "ky": "Кире бериш",
    "en": "Entrance",
    "uz": "Kirish yo‘lagi",
    "kk": "Кіреберіс"
  },
  "Этаж": {
    "ru": "Этаж",
    "ky": "Кабат",
    "en": "Floor",
    "uz": "Qavat",
    "kk": "Қабат"
  },
  "Квартира": {
    "ru": "Квартира",
    "ky": "Батир",
    "en": "Apartment",
    "uz": "Xonadon",
    "kk": "Пәтер"
  },
  "Добавить комментарий к заказу": {
    "ru": "Добавить комментарий к заказу",
    "ky": "Буйрутмага комментарий кошуу",
    "en": "Add an order comment",
    "uz": "Buyurtmaga izoh qo‘shish",
    "kk": "Тапсырысқа түсініктеме қосу"
  },
  "Комментарий к заказу": {
    "ru": "Комментарий к заказу",
    "ky": "Буйрутмага комментарий",
    "en": "Order comment",
    "uz": "Buyurtmaga izoh",
    "kk": "Тапсырысқа түсініктеме"
  },
  "Имя": {
    "ru": "Имя",
    "ky": "Аты",
    "en": "Name",
    "uz": "Ism",
    "kk": "Аты"
  },
  "Телефон получателя": {
    "ru": "Телефон получателя",
    "ky": "Алуучунун телефону",
    "en": "Recipient's phone",
    "uz": "Qabul qiluvchining telefoni",
    "kk": "Алушының телефоны"
  },
  "Телефон": {
    "ru": "Телефон",
    "ky": "Телефон",
    "en": "Phone",
    "uz": "Telefon",
    "kk": "Телефон"
  },
  "Введите номер Кыргызстана или России полностью.": {
    "ru": "Введите номер Кыргызстана или России полностью.",
    "ky": "Кыргызстандын же Россиянын телефон номерин толук киргизиңиз.",
    "en": "Enter a full Kyrgyzstan or Russia phone number.",
    "uz": "Qirg‘iziston yoki Rossiya telefon raqamini to‘liq kiriting.",
    "kk": "Қырғызстан немесе Ресей телефон нөмірін толық енгізіңіз."
  },
  "Оплата": {
    "ru": "Оплата",
    "ky": "Төлөм",
    "en": "Payment",
    "uz": "To‘lov",
    "kk": "Төлем"
  },
  "Выберите способ оплаты": {
    "ru": "Выберите способ оплаты",
    "ky": "Төлөө ыкмасын тандаңыз",
    "en": "Choose a payment method",
    "uz": "To‘lov usulini tanlang",
    "kk": "Төлем әдісін таңдаңыз"
  },
  "Как вам удобно оплатить заказ": {
    "ru": "Как вам удобно оплатить заказ",
    "ky": "Буйрутма үчүн кантип төлөгүңүз келет",
    "en": "How would you like to pay?",
    "uz": "Buyurtma uchun qanday to‘lamoqchisiz?",
    "kk": "Тапсырыс үшін қалай төлегіңіз келеді"
  },
  "Картой": {
    "ru": "Картой",
    "ky": "Карта менен",
    "en": "Card",
    "uz": "Karta bilan",
    "kk": "Картамен"
  },
  "Наличными": {
    "ru": "Наличными",
    "ky": "Накталай",
    "en": "Cash",
    "uz": "Naqd pul",
    "kk": "Қолма-қол"
  },
  "Пока недоступно": {
    "ru": "Пока недоступно",
    "ky": "Азырынча жеткиликсиз",
    "en": "Not available yet",
    "uz": "Hozircha mavjud emas",
    "kk": "Әзірге қолжетімсіз"
  },
  "Оплата при получении заказа": {
    "ru": "Оплата при получении заказа",
    "ky": "Буйрутманы алганда төлөө",
    "en": "Pay when you receive your order",
    "uz": "Buyurtmani olganda to‘lash",
    "kk": "Тапсырысты алған кезде төлеу"
  },
  "Оформляя заказ, вы принимаете": {
    "ru": "Оформляя заказ, вы принимаете",
    "ky": "Буйрутма берүү менен төмөнкүлөргө макул болосуз:",
    "en": "By placing an order, you accept the",
    "uz": "Buyurtma berish orqali quyidagilarni qabul qilasiz:",
    "kk": "Тапсырыс беру арқылы төмендегілермен келісесіз:"
  },
  "Условия заказа": {
    "ru": "Условия заказа",
    "ky": "Буйрутма шарттары",
    "en": "Order terms",
    "uz": "Buyurtma shartlari",
    "kk": "Тапсырыс шарттары"
  },
  "Кухня сейчас закрыта.": {
    "ru": "Кухня сейчас закрыта.",
    "ky": "Азыр ашкана жабык.",
    "en": "The kitchen is closed right now.",
    "uz": "Hozir oshxona yopiq.",
    "kk": "Қазір асүй жабық."
  },
  "Всего": {
    "ru": "Всего",
    "ky": "Жалпы",
    "en": "Total",
    "uz": "Jami",
    "kk": "Барлығы"
  },
  "Всего: {0}": {
    "ru": "Всего: {0}",
    "ky": "Жалпы: {0}",
    "en": "Total: {0}",
    "uz": "Jami: {0}",
    "kk": "Барлығы: {0}"
  },
  "Заказать": {
    "ru": "Заказать",
    "ky": "Буйрутма берүү",
    "en": "Place order",
    "uz": "Buyurtma berish",
    "kk": "Тапсырыс беру"
  },
  "Готово": {
    "ru": "Готово",
    "ky": "Даяр",
    "en": "Done",
    "uz": "Tayyor",
    "kk": "Дайын"
  },
  "Пакет с блюдами Накта суши": {
    "ru": "Пакет с блюдами Накта суши",
    "ky": "Накта сушинин тамактары салынган баштык",
    "en": "Bag of Nakta Sushi dishes",
    "uz": "Nakta Sushi taomlari solingan paket",
    "kk": "Накта суши тағамдары салынған пакет"
  },
  "Много вкусного\nв одном месте": {
    "ru": "Много вкусного\nв одном месте",
    "ky": "Көптөгөн даамдар\nбир жерде",
    "en": "Delicious choices,\nall in one place",
    "uz": "Mazali taomlar\nbir joyda",
    "kk": "Көптеген дәмдер\nбір жерде"
  },
  "Собрали роллы, поке, супы и горячие блюда. Готовим после оформления заказа.": {
    "ru": "Собрали роллы, поке, супы и горячие блюда. Готовим после оформления заказа.",
    "ky": "Роллдор, поке, шорполор жана ысык тамактар бир жерде. Буйрутма бергенден кийин даярдайбыз.",
    "en": "Rolls, poke, soups and hot dishes in one place. Freshly prepared after you order.",
    "uz": "Roll, poke, sho‘rva va issiq taomlar bir joyda. Buyurtma berganingizdan keyin tayyorlaymiz.",
    "kk": "Ролл, поке, сорпа және ыстық тағамдарды бір жерге жинадық. Тапсырыс бергеннен кейін дайындаймыз."
  },
  "Иконка приложения NAKTASUSHI": {
    "ru": "Иконка приложения NAKTASUSHI",
    "ky": "NAKTASUSHI колдонмосунун белгиси",
    "en": "NAKTASUSHI app icon",
    "uz": "NAKTASUSHI ilovasi belgisi",
    "kk": "NAKTASUSHI қолданбасының белгішесі"
  },
  "Качественно\nи вкусно": {
    "ru": "Качественно\nи вкусно",
    "ky": "Сапаттуу\nжана даамдуу",
    "en": "Quality you can taste",
    "uz": "Sifatli\nva mazali",
    "kk": "Сапалы\nәрі дәмді"
  },
  "Делаем выбор в пользу лучших продуктов, технологичных процессов и заботы о клиентах. В Бишкеке и Оше.": {
    "ru": "Делаем выбор в пользу лучших продуктов, технологичных процессов и заботы о клиентах. В Бишкеке и Оше.",
    "ky": "Мыкты азыктарды, заманбап даярдоо ыкмаларын жана кардарларга кам көрүүнү тандайбыз. Бишкекте жана Ошто.",
    "en": "Great ingredients, modern preparation and thoughtful service. In Bishkek and Osh.",
    "uz": "Eng yaxshi mahsulotlar, zamonaviy tayyorlash usullari va mijozlarga g‘amxo‘rlikni tanlaymiz. Bishkek va O‘shda.",
    "kk": "Ең жақсы өнімдерді, заманауи дайындау тәсілдерін және клиентке қамқорлықты таңдаймыз. Бішкек пен Ошта."
  },
  "Термосумка Накта суши": {
    "ru": "Термосумка Накта суши",
    "ky": "Накта сушинин термосумкасы",
    "en": "Nakta Sushi insulated delivery bag",
    "uz": "Nakta Sushi termosumkasi",
    "kk": "Накта суши термосөмкесі"
  },
  "Пришлём пуш\nо статусе заказа": {
    "ru": "Пришлём пуш\nо статусе заказа",
    "ky": "Буйрутманын абалын\nбилдирме менен кабарлайбыз",
    "en": "Get updates\non your order",
    "uz": "Buyurtma holati haqida\nxabar beramiz",
    "kk": "Тапсырыс күйі туралы\nхабарландыру жібереміз"
  },
  "Сами доставляем заказы и следим за скоростью. Покажем статус заказа в режиме реального времени.": {
    "ru": "Сами доставляем заказы и следим за скоростью. Покажем статус заказа в режиме реального времени.",
    "ky": "Буйрутмаларды өзүбүз жеткирип, ылдамдыгын көзөмөлдөйбүз. Буйрутманын абалын реалдуу убакытта көрсөтөбүз.",
    "en": "We deliver your orders ourselves and keep things moving. Track your order in real time.",
    "uz": "Buyurtmalarni o‘zimiz yetkazamiz va tezlikni nazorat qilamiz. Buyurtma holatini real vaqtda ko‘rsatamiz.",
    "kk": "Тапсырыстарды өзіміз жеткізіп, жылдамдығын қадағалаймыз. Тапсырыс күйін нақты уақытта көрсетеміз."
  },
  "Сердце из лосося": {
    "ru": "Сердце из лосося",
    "ky": "Лосось балыгынан жүрөк",
    "en": "Heart made of salmon",
    "uz": "Lososdan yasalgan yurak",
    "kk": "Албырттан жасалған жүрек"
  },
  "Приятного вам аппетита!": {
    "ru": "Приятного вам аппетита!",
    "ky": "Тамагыңыз таттуу болсун!",
    "en": "Enjoy your meal!",
    "uz": "Yoqimli ishtaha!",
    "kk": "Асыңыз дәмді болсын!"
  },
  "Включить пуш-уведомления": {
    "ru": "Включить пуш-уведомления",
    "ky": "Билдирмелерди күйгүзүү",
    "en": "Enable notifications",
    "uz": "Bildirishnomalarni yoqish",
    "kk": "Хабарландыруларды қосу"
  },
  "Выбрать адрес доставки": {
    "ru": "Выбрать адрес доставки",
    "ky": "Жеткирүү дарегин тандоо",
    "en": "Choose delivery address",
    "uz": "Yetkazib berish manzilini tanlash",
    "kk": "Жеткізу мекенжайын таңдау"
  },
  "Войти": {
    "ru": "Войти",
    "ky": "Кирүү",
    "en": "Sign in",
    "uz": "Kirish",
    "kk": "Кіру"
  },
  "Готовим ваш заказ": {
    "ru": "Готовим ваш заказ",
    "ky": "Буйрутмаңызды даярдап жатабыз",
    "en": "Preparing your order",
    "uz": "Buyurtmangizni tayyorlayapmiz",
    "kk": "Тапсырысыңызды дайындап жатырмыз"
  },
  "Курьер уже в пути": {
    "ru": "Курьер уже в пути",
    "ky": "Курьер жолдо",
    "en": "Courier on the way",
    "uz": "Kuryer yo‘lda",
    "kk": "Курьер жолда"
  },
  "Заказ выполнен": {
    "ru": "Заказ выполнен",
    "ky": "Буйрутма аткарылды",
    "en": "Order completed",
    "uz": "Buyurtma bajarildi",
    "kk": "Тапсырыс орындалды"
  },
  "Заказ передан на кухню": {
    "ru": "Заказ передан на кухню",
    "ky": "Буйрутма ашканага жөнөтүлдү",
    "en": "Order sent to the kitchen",
    "uz": "Buyurtma oshxonaga yuborildi",
    "kk": "Тапсырыс асүйге жіберілді"
  },
  "Кухня приняла заказ": {
    "ru": "Кухня приняла заказ",
    "ky": "Ашкана буйрутманы кабыл алды",
    "en": "The kitchen accepted your order",
    "uz": "Oshxona buyurtmani qabul qildi",
    "kk": "Асүй тапсырысты қабылдады"
  },
  "Заказ готовится": {
    "ru": "Заказ готовится",
    "ky": "Буйрутма даярдалууда",
    "en": "Order being prepared",
    "uz": "Buyurtma tayyorlanmoqda",
    "kk": "Тапсырыс дайындалуда"
  },
  "Некоторые блюда недоступны": {
    "ru": "Некоторые блюда недоступны",
    "ky": "Айрым тамактар жеткиликсиз",
    "en": "Some dishes are unavailable",
    "uz": "Ayrim taomlar mavjud emas",
    "kk": "Кейбір тағамдар қолжетімсіз"
  },
  "Кухня отклонила заказ": {
    "ru": "Кухня отклонила заказ",
    "ky": "Ашкана буйрутманы четке какты",
    "en": "The kitchen declined your order",
    "uz": "Oshxona buyurtmani rad etdi",
    "kk": "Асүй тапсырысты қабылдамады"
  },
  "Не удалось загрузить заказ": {
    "ru": "Не удалось загрузить заказ",
    "ky": "Буйрутма жүктөлгөн жок",
    "en": "Could not load the order",
    "uz": "Buyurtmani yuklab bo‘lmadi",
    "kk": "Тапсырысты жүктеу мүмкін болмады"
  },
  "Не удалось отменить заказ": {
    "ru": "Не удалось отменить заказ",
    "ky": "Буйрутманы жокко чыгаруу мүмкүн болгон жок",
    "en": "Could not cancel the order",
    "uz": "Buyurtmani bekor qilib bo‘lmadi",
    "kk": "Тапсырысты тоқтату мүмкін болмады"
  },
  "Заказ №": {
    "ru": "Заказ №",
    "ky": "Буйрутма №",
    "en": "Order #",
    "uz": "Buyurtma №",
    "kk": "Тапсырыс №"
  },
  "Повторить": {
    "ru": "Повторить",
    "ky": "Кайталоо",
    "en": "Retry",
    "uz": "Qayta urinish",
    "kk": "Қайталау"
  },
  "из": {
    "ru": "из",
    "ky": "ичинен",
    "en": "of",
    "uz": "dan",
    "kk": "ішінен"
  },
  "блюд": {
    "ru": "блюд",
    "ky": "тамак",
    "en": "dishes",
    "uz": "taom",
    "kk": "тағам"
  },
  "Отклонено:": {
    "ru": "Отклонено:",
    "ky": "Четке кагылды:",
    "en": "Declined:",
    "uz": "Rad etildi:",
    "kk": "Қабылданбады:"
  },
  "Состав заказа": {
    "ru": "Состав заказа",
    "ky": "Буйрутманын курамы",
    "en": "Order items",
    "uz": "Buyurtma tarkibi",
    "kk": "Тапсырыс құрамы"
  },
  "Готовится{0}": {
    "ru": "Готовится{0}",
    "ky": "Даярдалууда{0}",
    "en": "Preparing{0}",
    "uz": "Tayyorlanmoqda{0}",
    "kk": "Дайындалуда{0}"
  },
  " · готово {0}": {
    "ru": " · готово {0}",
    "ky": " · {0} даяр",
    "en": " · {0} ready",
    "uz": " · {0} tayyor",
    "kk": " · {0} дайын"
  },
  "Отклонено{0}": {
    "ru": "Отклонено{0}",
    "ky": "Четке кагылды{0}",
    "en": "Declined{0}",
    "uz": "Rad etildi{0}",
    "kk": "Қабылданбады{0}"
  },
  "Принято кухней": {
    "ru": "Принято кухней",
    "ky": "Ашкана кабыл алды",
    "en": "Accepted by the kitchen",
    "uz": "Oshxona qabul qildi",
    "kk": "Асүй қабылдады"
  },
  "Ожидает кухню": {
    "ru": "Ожидает кухню",
    "ky": "Ашкананын жообун күтүп жатат",
    "en": "Waiting for the kitchen",
    "uz": "Oshxona javobi kutilmoqda",
    "kk": "Асүй жауабын күтуде"
  },
  "Итого": {
    "ru": "Итого",
    "ky": "Жыйынтык",
    "en": "Total",
    "uz": "Jami",
    "kk": "Жиыны"
  },
  "Адрес не указан": {
    "ru": "Адрес не указан",
    "ky": "Дарек көрсөтүлгөн эмес",
    "en": "No address provided",
    "uz": "Manzil ko‘rsatilmagan",
    "kk": "Мекенжай көрсетілмеген"
  },
  "кв. {0}": {
    "ru": "кв. {0}",
    "ky": "бат. {0}",
    "en": "apt. {0}",
    "uz": "xon. {0}",
    "kk": "пәтер {0}"
  },
  "подъезд {0}": {
    "ru": "подъезд {0}",
    "ky": "кире бериш {0}",
    "en": "entrance {0}",
    "uz": "kirish yo‘lagi {0}",
    "kk": "кіреберіс {0}"
  },
  "этаж {0}": {
    "ru": "этаж {0}",
    "ky": "кабат {0}",
    "en": "floor {0}",
    "uz": "qavat {0}",
    "kk": "қабат {0}"
  },
  "Комментарий:": {
    "ru": "Комментарий:",
    "ky": "Комментарий:",
    "en": "Comment:",
    "uz": "Izoh:",
    "kk": "Пікір:"
  },
  "Оплата и комплектация": {
    "ru": "Оплата и комплектация",
    "ky": "Төлөм жана кошумчалар",
    "en": "Payment and extras",
    "uz": "To‘lov va qo‘shimchalar",
    "kk": "Төлем және қосымшалар"
  },
  "Приборы: {0}": {
    "ru": "Приборы: {0}",
    "ky": "Ашкана шаймандары: {0}",
    "en": "Cutlery: {0}",
    "uz": "Ovqatlanish anjomlari: {0}",
    "kk": "Ас құралдары: {0}"
  },
  "Связаться с поддержкой": {
    "ru": "Связаться с поддержкой",
    "ky": "Колдоо кызматы менен байланышуу",
    "en": "Contact support",
    "uz": "Yordam xizmatiga murojaat qilish",
    "kk": "Қолдау қызметімен байланысу"
  },
  "Отменить заказ": {
    "ru": "Отменить заказ",
    "ky": "Буйрутманы жокко чыгаруу",
    "en": "Cancel order",
    "uz": "Buyurtmani bekor qilish",
    "kk": "Тапсырысты тоқтату"
  },
  "Закрыть подтверждение отмены": {
    "ru": "Закрыть подтверждение отмены",
    "ky": "Жокко чыгарууну ырастоону жабуу",
    "en": "Close cancellation confirmation",
    "uz": "Bekor qilish tasdig‘ini yopish",
    "kk": "Тоқтатуды растауды жабу"
  },
  "Отменить заказ?": {
    "ru": "Отменить заказ?",
    "ky": "Буйрутманы жокко чыгарасызбы?",
    "en": "Cancel this order?",
    "uz": "Buyurtmani bekor qilasizmi?",
    "kk": "Тапсырысты тоқтатасыз ба?"
  },
  "После отмены восстановить заказ не получится.": {
    "ru": "После отмены восстановить заказ не получится.",
    "ky": "Жокко чыгарылган буйрутманы калыбына келтирүү мүмкүн эмес.",
    "en": "You cannot restore the order after cancelling it.",
    "uz": "Bekor qilingan buyurtmani tiklab bo‘lmaydi.",
    "kk": "Тоқтатылған тапсырысты қалпына келтіру мүмкін емес."
  },
  "Отменяем…": {
    "ru": "Отменяем…",
    "ky": "Жокко чыгарып жатабыз…",
    "en": "Cancelling…",
    "uz": "Bekor qilinmoqda…",
    "kk": "Тоқтатылуда…"
  },
  "Да, отменить": {
    "ru": "Да, отменить",
    "ky": "Ооба, жокко чыгаруу",
    "en": "Yes, cancel",
    "uz": "Ha, bekor qilish",
    "kk": "Иә, тоқтату"
  },
  "Оставить заказ": {
    "ru": "Оставить заказ",
    "ky": "Буйрутманы калтыруу",
    "en": "Keep order",
    "uz": "Buyurtmani qoldirish",
    "kk": "Тапсырысты қалдыру"
  },
  "Заказ принят!": {
    "ru": "Заказ принят!",
    "ky": "Буйрутма кабыл алынды!",
    "en": "Order received!",
    "uz": "Buyurtma qabul qilindi!",
    "kk": "Тапсырыс қабылданды!"
  },
  "Заказ": {
    "ru": "Заказ",
    "ky": "Буйрутма",
    "en": "Order",
    "uz": "Buyurtma",
    "kk": "Тапсырыс"
  },
  "Принят": {
    "ru": "Принят",
    "ky": "Кабыл алынды",
    "en": "Received",
    "uz": "Qabul qilindi",
    "kk": "Қабылданды"
  },
  "Подтверждён": {
    "ru": "Подтверждён",
    "ky": "Ырасталды",
    "en": "Confirmed",
    "uz": "Tasdiqlandi",
    "kk": "Расталды"
  },
  "Готовим": {
    "ru": "Готовим",
    "ky": "Даярдап жатабыз",
    "en": "Preparing",
    "uz": "Tayyorlanmoqda",
    "kk": "Дайындалуда"
  },
  "Готов": {
    "ru": "Готов",
    "ky": "Даяр",
    "en": "Ready",
    "uz": "Tayyor",
    "kk": "Дайын"
  },
  "В пути": {
    "ru": "В пути",
    "ky": "Жолдо",
    "en": "On the way",
    "uz": "Yo‘lda",
    "kk": "Жолда"
  },
  "Выполнен": {
    "ru": "Выполнен",
    "ky": "Аткарылды",
    "en": "Completed",
    "uz": "Bajarildi",
    "kk": "Орындалды"
  },
  "Отменён": {
    "ru": "Отменён",
    "ky": "Жокко чыгарылды",
    "en": "Cancelled",
    "uz": "Bekor qilindi",
    "kk": "Тоқтатылды"
  },
  "Заказ №{0}": {
    "ru": "Заказ №{0}",
    "ky": "Буйрутма №{0}",
    "en": "Order #{0}",
    "uz": "Buyurtma №{0}",
    "kk": "Тапсырыс №{0}"
  },
  "самовывоз": {
    "ru": "самовывоз",
    "ky": "өзү алып кетүү",
    "en": "pickup",
    "uz": "olib ketish",
    "kk": "өзіңіз алып кету"
  },
  "доставка": {
    "ru": "доставка",
    "ky": "жеткирүү",
    "en": "delivery",
    "uz": "yetkazib berish",
    "kk": "жеткізу"
  },
  "Загружаем адрес…": {
    "ru": "Загружаем адрес…",
    "ky": "Даректи жүктөп жатабыз…",
    "en": "Loading address…",
    "uz": "Manzil yuklanmoqda…",
    "kk": "Мекенжай жүктелуде…"
  },
  "Не удалось загрузить профиль": {
    "ru": "Не удалось загрузить профиль",
    "ky": "Профиль жүктөлгөн жок",
    "en": "Could not load your profile",
    "uz": "Profilni yuklab bo‘lmadi",
    "kk": "Профильді жүктеу мүмкін болмады"
  },
  "Не удалось удалить аккаунт": {
    "ru": "Не удалось удалить аккаунт",
    "ky": "Аккаунтту өчүрүү мүмкүн болгон жок",
    "en": "Could not delete the account",
    "uz": "Hisobni o‘chirib bo‘lmadi",
    "kk": "Тіркелгіні жою мүмкін болмады"
  },
  "Удалить аккаунт?": {
    "ru": "Удалить аккаунт?",
    "ky": "Аккаунтту өчүрөсүзбү?",
    "en": "Delete your account?",
    "uz": "Hisobni o‘chirasizmi?",
    "kk": "Тіркелгіні жоясыз ба?"
  },
  "Заказы, сессия и данные профиля будут удалены без возможности восстановления.": {
    "ru": "Заказы, сессия и данные профиля будут удалены без возможности восстановления.",
    "ky": "Буйрутмалар, сессия жана профиль маалыматтары калыбына келтирүү мүмкүнчүлүгүсүз өчүрүлөт.",
    "en": "Your orders, session and profile data will be permanently deleted.",
    "uz": "Buyurtmalar, seans va profil ma’lumotlari tiklash imkoniyatisiz o‘chiriladi.",
    "kk": "Тапсырыстар, сессия және профиль деректері қалпына келтіру мүмкіндігінсіз жойылады."
  },
  "Удалить": {
    "ru": "Удалить",
    "ky": "Өчүрүү",
    "en": "Delete",
    "uz": "O‘chirish",
    "kk": "Жою"
  },
  "Загружаем данные…": {
    "ru": "Загружаем данные…",
    "ky": "Маалыматтарды жүктөп жатабыз…",
    "en": "Loading your details…",
    "uz": "Ma’lumotlar yuklanmoqda…",
    "kk": "Деректер жүктелуде…"
  },
  "Не удалось загрузить данные": {
    "ru": "Не удалось загрузить данные",
    "ky": "Маалыматтар жүктөлгөн жок",
    "en": "Could not load your details",
    "uz": "Ma’lumotlarni yuklab bo‘lmadi",
    "kk": "Деректерді жүктеу мүмкін болмады"
  },
  "Активные": {
    "ru": "Активные",
    "ky": "Учурдагы",
    "en": "Active",
    "uz": "Faol",
    "kk": "Белсенді"
  },
  "История": {
    "ru": "История",
    "ky": "Тарых",
    "en": "History",
    "uz": "Tarix",
    "kk": "Тарих"
  },
  "Пока здесь пусто,": {
    "ru": "Пока здесь пусто,",
    "ky": "Азырынча бул жерде эч нерсе жок,",
    "en": "Nothing here yet,",
    "uz": "Hozircha bu yer bo‘sh,",
    "kk": "Әзірге мұнда ештеңе жоқ,"
  },
  "пора сделать первый заказ!": {
    "ru": "пора сделать первый заказ!",
    "ky": "биринчи буйрутмаңызды бериңиз!",
    "en": "time to place your first order!",
    "uz": "birinchi buyurtmangizni bering!",
    "kk": "алғашқы тапсырысыңызды беріңіз!"
  },
  "Меню": {
    "ru": "Меню",
    "ky": "Меню",
    "en": "Menu",
    "uz": "Menyu",
    "kk": "Мәзір"
  },
  "Телефон аккаунта": {
    "ru": "Телефон аккаунта",
    "ky": "Аккаунттун телефону",
    "en": "Account phone number",
    "uz": "Hisob telefon raqami",
    "kk": "Тіркелгі телефоны"
  },
  "Выйти из профиля": {
    "ru": "Выйти из профиля",
    "ky": "Профилден чыгуу",
    "en": "Sign out",
    "uz": "Profildan chiqish",
    "kk": "Профильден шығу"
  },
  "Удалить аккаунт": {
    "ru": "Удалить аккаунт",
    "ky": "Аккаунтту өчүрүү",
    "en": "Delete account",
    "uz": "Hisobni o‘chirish",
    "kk": "Тіркелгіні жою"
  },
  "Продолжить": {
    "ru": "Продолжить",
    "ky": "Улантуу",
    "en": "Continue",
    "uz": "Davom etish",
    "kk": "Жалғастыру"
  },
  "Неверный код. Осталось попыток: {0}": {
    "ru": "Неверный код. Осталось попыток: {0}",
    "ky": "Код туура эмес. Калган аракеттер: {0}",
    "en": "Incorrect code. Attempts remaining: {0}",
    "uz": "Kod noto‘g‘ri. Qolgan urinishlar: {0}",
    "kk": "Код қате. Қалған әрекеттер саны: {0}"
  },
  "Network request failed": {
    "ru": "Не удалось подключиться. Проверьте интернет и попробуйте ещё раз.",
    "ky": "Интернетке туташуу мүмкүн болгон жок. Байланышты текшерип, кайра аракет кылыңыз.",
    "en": "Could not connect. Check your internet connection and try again.",
    "uz": "Internetga ulanib bo‘lmadi. Aloqani tekshirib, qayta urinib ko‘ring.",
    "kk": "Қосылу мүмкін болмады. Интернетті тексеріп, қайталап көріңіз."
  },
  "Язык приложения": {
    "ru": "Язык приложения",
    "ky": "Колдонмонун тили",
    "en": "App language",
    "uz": "Ilova tili",
    "kk": "Қолданба тілі"
  },
  "Выберите язык": {
    "ru": "Выберите язык",
    "ky": "Тилди тандаңыз",
    "en": "Choose a language",
    "uz": "Tilni tanlang",
    "kk": "Тілді таңдаңыз"
  },
  "Закрыть выбор языка": {
    "ru": "Закрыть выбор языка",
    "ky": "Тил тандоону жабуу",
    "en": "Close language selection",
    "uz": "Til tanlashni yopish",
    "kk": "Тіл таңдауды жабу"
  },
  "Язык": {
    "ru": "Язык",
    "ky": "Тил",
    "en": "Language",
    "uz": "Til",
    "kk": "Тіл"
  },
  "и": {
    "ru": "и",
    "ky": "жана",
    "en": "and",
    "uz": "va",
    "kk": "және"
  },
  "Загружаем карту…": {
    "ru": "Загружаем карту…",
    "ky": "Картаны жүктөп жатабыз…",
    "en": "Loading map…",
    "uz": "Xarita yuklanmoqda…",
    "kk": "Карта жүктелуде…"
  },
  "Зона доставки": {
    "ru": "Зона доставки",
    "ky": "Жеткирүү аймагы",
    "en": "Delivery area",
    "uz": "Yetkazib berish hududi",
    "kk": "Жеткізу аймағы"
  },
  "Роллы": {
    "ru": "Роллы",
    "ky": "Роллдор",
    "en": "Rolls",
    "uz": "Rollar",
    "kk": "Роллдар"
  },
  "Суши": {
    "ru": "Суши",
    "ky": "Суши",
    "en": "Sushi",
    "uz": "Sushi",
    "kk": "Суши"
  },
  "Сеты": {
    "ru": "Сеты",
    "ky": "Сеттер",
    "en": "Sets",
    "uz": "Setlar",
    "kk": "Сеттер"
  },
  "Салаты": {
    "ru": "Салаты",
    "ky": "Салаттар",
    "en": "Salads",
    "uz": "Salatlar",
    "kk": "Салаттар"
  },
  "Супы": {
    "ru": "Супы",
    "ky": "Шорполор",
    "en": "Soups",
    "uz": "Sho‘rvalar",
    "kk": "Сорпалар"
  },
  "Поке": {
    "ru": "Поке",
    "ky": "Поке",
    "en": "Poke",
    "uz": "Poke",
    "kk": "Поке"
  },
  "Горячее": {
    "ru": "Горячее",
    "ky": "Ысык тамактар",
    "en": "Hot dishes",
    "uz": "Issiq taomlar",
    "kk": "Ыстық тағамдар"
  },
  "Горячие блюда": {
    "ru": "Горячие блюда",
    "ky": "Ысык тамактар",
    "en": "Hot dishes",
    "uz": "Issiq taomlar",
    "kk": "Ыстық тағамдар"
  },
  "Напитки": {
    "ru": "Напитки",
    "ky": "Суусундуктар",
    "en": "Drinks",
    "uz": "Ichimliklar",
    "kk": "Сусындар"
  },
  "Десерты": {
    "ru": "Десерты",
    "ky": "Десерттер",
    "en": "Desserts",
    "uz": "Desertlar",
    "kk": "Десерттер"
  },
  "Закуски": {
    "ru": "Закуски",
    "ky": "Жеңил тамактар",
    "en": "Sides",
    "uz": "Yengil taomlar",
    "kk": "Жеңіл тағамдар"
  },
  "Соусы": {
    "ru": "Соусы",
    "ky": "Соустар",
    "en": "Sauces",
    "uz": "Souslar",
    "kk": "Тұздықтар"
  },
  "Добавки": {
    "ru": "Добавки",
    "ky": "Кошумчалар",
    "en": "Extras",
    "uz": "Qo‘shimchalar",
    "kk": "Қосымшалар"
  },
  "Мерч": {
    "ru": "Мерч",
    "ky": "Бренд буюмдары",
    "en": "Merchandise",
    "uz": "Brend mahsulotlari",
    "kk": "Бренд тауарлары"
  },
  "Новинки": {
    "ru": "Новинки",
    "ky": "Жаңы тамактар",
    "en": "New arrivals",
    "uz": "Yangiliklar",
    "kk": "Жаңа тағамдар"
  },
  "Хиты продаж": {
    "ru": "Хиты продаж",
    "ky": "Эң популярдуу",
    "en": "Bestsellers",
    "uz": "Eng ko‘p sotilganlar",
    "kk": "Ең танымал"
  },
  "Комбо": {
    "ru": "Комбо",
    "ky": "Комбо",
    "en": "Combos",
    "uz": "Kombo",
    "kk": "Комбо"
  },
  "Шауроллы": {
    "ru": "Шауроллы",
    "ky": "Шауроллдор",
    "en": "Shaurolls",
    "uz": "Shaurrollar",
    "kk": "Шауроллдар"
  },
  "Круглосуточно": {
    "ru": "Круглосуточно",
    "ky": "Күнү-түнү",
    "en": "Open 24 hours",
    "uz": "Kecha-yu kunduz",
    "kk": "Тәулік бойы"
  },
  "{0} шт": {
    "ru": "{0} шт",
    "ky": "{0} даана",
    "en": "{0} pcs",
    "uz": "{0} dona",
    "kk": "{0} дана"
  },
  "{0} комплект": {
    "ru": "{0} комплект",
    "ky": "{0} топтом",
    "en": "{0} set",
    "uz": "{0} to‘plam",
    "kk": "{0} жиынтық"
  },
  "{0} комплекта": {
    "ru": "{0} комплекта",
    "ky": "{0} топтом",
    "en": "{0} sets",
    "uz": "{0} to‘plam",
    "kk": "{0} жиынтық"
  },
  "{0} комплектов": {
    "ru": "{0} комплектов",
    "ky": "{0} топтом",
    "en": "{0} sets",
    "uz": "{0} to‘plam",
    "kk": "{0} жиынтық"
  },
  "Убрать {0}": {
    "ru": "Убрать {0}",
    "ky": "{0} алып салуу",
    "en": "Remove {0}",
    "uz": "{0} olib tashlash",
    "kk": "{0} алып тастау"
  },
  "Выбрать {0}": {
    "ru": "Выбрать {0}",
    "ky": "{0} тандоо",
    "en": "Select {0}",
    "uz": "{0} tanlash",
    "kk": "{0} таңдау"
  },
  "Готово {0} из {1} блюд": {
    "ru": "Готово {0} из {1} блюд",
    "ky": "{1} тамактын {0} даяр",
    "en": "{0} of {1} dishes ready",
    "uz": "{1} ta taomdan {0} tasi tayyor",
    "kk": "Дайын тағамдар: {0}/{1}"
  },
  "Согласие на обработку персональных данных": {
    "ru": "Согласие на обработку персональных данных",
    "ky": "Жеке маалыматтарды иштетүүгө макулдук",
    "en": "Consent to personal data processing",
    "uz": "Shaxsiy ma’lumotlarni qayta ishlashga rozilik",
    "kk": "Жеке деректерді өңдеуге келісім"
  },
  "Неверный код": {
    "ru": "Неверный код",
    "ky": "Код туура эмес",
    "en": "Incorrect code",
    "uz": "Kod noto‘g‘ri",
    "kk": "Код қате"
  },
  "Код истёк. Запросите новый": {
    "ru": "Код истёк. Запросите новый",
    "ky": "Коддун мөөнөтү бүттү. Жаңы код сураңыз",
    "en": "The code expired. Request a new one",
    "uz": "Kod muddati tugadi. Yangi kod so‘rang",
    "kk": "Кодтың мерзімі аяқталды. Жаңа код сұраңыз"
  },
  "Слишком много попыток. Запросите новый код": {
    "ru": "Слишком много попыток. Запросите новый код",
    "ky": "Аракеттер өтө көп болду. Жаңы код сураңыз",
    "en": "Too many attempts. Request a new code",
    "uz": "Urinishlar soni oshib ketdi. Yangi kod so‘rang",
    "kk": "Әрекеттер саны тым көп. Жаңа код сұраңыз"
  },
  "Не удалось проверить код. Попробуйте позже": {
    "ru": "Не удалось проверить код. Попробуйте позже",
    "ky": "Кодду текшерүү мүмкүн болгон жок. Кийинчерээк аракет кылыңыз",
    "en": "Could not verify the code. Please try later",
    "uz": "Kodni tekshirib bo‘lmadi. Keyinroq urinib ko‘ring",
    "kk": "Кодты тексеру мүмкін болмады. Кейінірек қайталап көріңіз"
  },
  "Повторный код можно запросить через {0} сек.": {
    "ru": "Повторный код можно запросить через {0} сек.",
    "ky": "Жаңы кодду {0} секунддан кийин сурасаңыз болот.",
    "en": "You can request another code in {0} sec.",
    "uz": "Yangi kodni {0} soniyadan keyin so‘rashingiz mumkin.",
    "kk": "Жаңа кодты {0} секундтан кейін сұрай аласыз."
  },
  "Слишком много запросов. Попробуйте через час": {
    "ru": "Слишком много запросов. Попробуйте через час",
    "ky": "Сурамдар өтө көп болду. Бир сааттан кийин аракет кылыңыз",
    "en": "Too many requests. Try again in an hour",
    "uz": "So‘rovlar soni oshib ketdi. Bir soatdan keyin urinib ko‘ring",
    "kk": "Сұраулар саны тым көп. Бір сағаттан кейін қайталап көріңіз"
  },
  "Слишком много запросов с этого устройства. Попробуйте позже": {
    "ru": "Слишком много запросов с этого устройства. Попробуйте позже",
    "ky": "Бул түзмөктөн өтө көп сурам жөнөтүлдү. Кийинчерээк аракет кылыңыз",
    "en": "Too many requests from this device. Try again later",
    "uz": "Bu qurilmadan juda ko‘p so‘rov yuborildi. Keyinroq urinib ko‘ring",
    "kk": "Бұл құрылғыдан тым көп сұрау жіберілді. Кейінірек қайталап көріңіз"
  },
  "Войдите в профиль ещё раз": {
    "ru": "Войдите в профиль ещё раз",
    "ky": "Профилиңизге кайра кириңиз",
    "en": "Please sign in again",
    "uz": "Profilingizga qayta kiring",
    "kk": "Профильге қайта кіріңіз"
  },
  "Авторизация пока не настроена": {
    "ru": "Авторизация пока не настроена",
    "ky": "Кирүү кызматы азырынча жеткиликсиз",
    "en": "Sign-in is not available yet",
    "uz": "Kirish xizmati hozircha mavjud emas",
    "kk": "Кіру қызметі әзірге қолжетімсіз"
  },
  "Заказ не найден": {
    "ru": "Заказ не найден",
    "ky": "Буйрутма табылган жок",
    "en": "Order not found",
    "uz": "Buyurtma topilmadi",
    "kk": "Тапсырыс табылмады"
  },
  "Заказ уже подтверждён и не может быть отменён": {
    "ru": "Заказ уже подтверждён и не может быть отменён",
    "ky": "Буйрутма ырасталгандыктан аны жокко чыгаруу мүмкүн эмес",
    "en": "The order is already confirmed and cannot be cancelled",
    "uz": "Buyurtma tasdiqlangan, uni bekor qilib bo‘lmaydi",
    "kk": "Тапсырыс расталған, оны тоқтату мүмкін емес"
  },
  "Order must contain at least one item": {
    "ru": "В заказе должно быть хотя бы одно блюдо",
    "ky": "Буйрутмада жок дегенде бир тамак болушу керек",
    "en": "Your order must contain at least one item",
    "uz": "Buyurtmada kamida bitta taom bo‘lishi kerak",
    "kk": "Тапсырыста кемінде бір тағам болуы керек"
  },
  "One or more products do not exist": {
    "ru": "Некоторые блюда больше недоступны",
    "ky": "Айрым тамактар жеткиликсиз",
    "en": "Some items are no longer available",
    "uz": "Ayrim taomlar mavjud emas",
    "kk": "Кейбір тағамдар қолжетімсіз"
  },
  "Delivery coordinates are required": {
    "ru": "Выберите адрес доставки на карте",
    "ky": "Жеткирүү үчүн картадан даректи тандаңыз",
    "en": "Choose a delivery address on the map",
    "uz": "Yetkazib berish uchun xaritadan manzil tanlang",
    "kk": "Жеткізу үшін картадан мекенжай таңдаңыз"
  },
  "Address is outside the delivery zone": {
    "ru": "Адрес находится вне зоны доставки",
    "ky": "Дарек жеткирүү аймагынан тышкары",
    "en": "The address is outside the delivery area",
    "uz": "Manzil yetkazib berish hududidan tashqarida",
    "kk": "Мекенжай жеткізу аймағынан тыс орналасқан"
  },
  "Order total is too large": {
    "ru": "Превышена максимальная сумма заказа",
    "ky": "Буйрутманын суммасы чектен ашты",
    "en": "The order exceeds the maximum total",
    "uz": "Buyurtma summasi ruxsat etilgan miqdordan oshdi",
    "kk": "Тапсырыс сомасы шектен асты"
  },
  "Idempotency key was already used for another order": {
    "ru": "Попробуйте оформить заказ ещё раз",
    "ky": "Буйрутманы кайра тариздеп көрүңүз",
    "en": "Please try placing your order again",
    "uz": "Buyurtmani qayta rasmiylashtirib ko‘ring",
    "kk": "Тапсырысты қайта рәсімдеп көріңіз"
  },
  "{0} is unavailable": {
    "ru": "{0} is unavailable",
    "ky": "{0} жеткиликсиз",
    "en": "{0} is unavailable",
    "uz": "{0} mavjud emas",
    "kk": "{0} қолжетімсіз"
  },
  "Region {0} is unavailable": {
    "ru": "Region {0} is unavailable",
    "ky": "{0} аймагы жеткиликсиз",
    "en": "Region {0} is unavailable",
    "uz": "{0} hududi mavjud emas",
    "kk": "{0} аймағы қолжетімсіз"
  },
  "{0} is not available in region {1}": {
    "ru": "{0} is not available in region {1}",
    "ky": "{0} тамагы {1} аймагында жеткиликсиз",
    "en": "{0} is not available in {1}",
    "uz": "{0} {1} hududida mavjud emas",
    "kk": "{0} тағамы {1} аймағында қолжетімсіз"
  },
  "сом": {
    "ru": "сом",
    "ky": "сом",
    "uz": "som",
    "en": "KGS",
    "kk": "сом"
  },
  "Город": {
    "ru": "Город",
    "ky": "Шаар",
    "uz": "Shahar",
    "en": "City",
    "kk": "Қала"
  },
  "Акции": {
    "ru": "Акции",
    "ky": "Акциялар",
    "uz": "Aksiyalar",
    "en": "Promotions",
    "kk": "Акциялар"
  },
  "Категории меню": {
    "ru": "Категории меню",
    "ky": "Меню категориялары",
    "uz": "Menyu toifalari",
    "en": "Menu categories",
    "kk": "Мәзір санаттары"
  },
  "Поиск блюд": {
    "ru": "Поиск блюд",
    "ky": "Тамактарды издөө",
    "uz": "Taomlarni qidirish",
    "en": "Search dishes",
    "kk": "Тағамдарды іздеу"
  },
  "Категории": {
    "ru": "Категории",
    "ky": "Категориялар",
    "uz": "Toifalar",
    "en": "Categories",
    "kk": "Санаттар"
  },
  "Уменьшить {0}": {
    "ru": "Уменьшить {0}",
    "ky": "{0} санын азайтуу",
    "uz": "{0} miqdorini kamaytirish",
    "en": "Decrease {0}",
    "kk": "{0} санын азайту"
  },
  "Увеличить {0}": {
    "ru": "Увеличить {0}",
    "ky": "{0} санын көбөйтүү",
    "uz": "{0} miqdorini oshirish",
    "en": "Increase {0}",
    "kk": "{0} санын көбейту"
  },
  "Работа": {
    "ru": "Работа",
    "ky": "Иш",
    "uz": "Ish",
    "en": "Work",
    "kk": "Жұмыс"
  },
  "Загружаем заказы…": {
    "ru": "Загружаем заказы…",
    "ky": "Буйрутмалар жүктөлүүдө…",
    "uz": "Buyurtmalar yuklanmoqda…",
    "en": "Loading orders…",
    "kk": "Тапсырыстар жүктелуде…"
  },
  "Закрыть": {
    "ru": "Закрыть",
    "ky": "Жабуу",
    "uz": "Yopish",
    "en": "Close",
    "kk": "Жабу"
  },
  "шт.": {
    "ru": "шт.",
    "ky": "даана",
    "uz": "dona",
    "en": "pcs",
    "kk": "дана"
  },
  "Карта доступна только в браузере": {
    "ru": "Карта доступна только в браузере",
    "ky": "Карта браузерде гана жеткиликтүү",
    "uz": "Xarita faqat brauzerda mavjud",
    "en": "Map is only available in the browser",
    "kk": "Карта тек браузерде қолжетімді"
  },
  "Яндекс Карты не загрузились": {
    "ru": "Яндекс Карты не загрузились",
    "ky": "Яндекс Карта жүктөлгөн жок",
    "uz": "Yandex Xaritalar yuklanmadi",
    "en": "Yandex Maps did not load",
    "kk": "Яндекс Карта жүктелмеді"
  },
  "Не удалось загрузить Яндекс Карты": {
    "ru": "Не удалось загрузить Яндекс Карты",
    "ky": "Яндекс Картаны жүктөө мүмкүн болгон жок",
    "uz": "Yandex Xaritalarni yuklab bo‘lmadi",
    "en": "Could not load Yandex Maps",
    "kk": "Яндекс Картаны жүктеу мүмкін болмады"
  },
  "Настройки карты недоступны": {
    "ru": "Настройки карты недоступны",
    "ky": "Картанын жөндөөлөрү жеткиликсиз",
    "uz": "Xarita sozlamalari mavjud emas",
    "en": "Map settings unavailable",
    "kk": "Карта баптаулары қолжетімсіз"
  },
  "Откроемся в {0}": {
    "ru": "Откроемся в {0}",
    "ky": "{0} ачылабыз",
    "uz": "{0} da ochilamiz",
    "en": "Opens at {0}",
    "kk": "{0} ашыламыз"
  },
  "Выберите доступную кухню": {
    "ru": "Выберите доступную кухню",
    "ky": "Жеткиликтүү ашкананы тандаңыз",
    "uz": "Mavjud oshxonani tanlang",
    "en": "Choose an available kitchen",
    "kk": "Қолжетімді асүйді таңдаңыз"
  },
  "Не удалось обновить меню. Проверьте подключение и попробуйте ещё раз.": {
    "ru": "Не удалось обновить меню. Проверьте подключение и попробуйте ещё раз.",
    "ky": "Меню жаңыртылган жок. Байланышты текшерип, кайра аракет кылыңыз.",
    "uz": "Menyuni yangilab bo‘lmadi. Aloqani tekshirib, qayta urinib ko‘ring.",
    "en": "Could not refresh the menu. Check your connection and try again.",
    "kk": "Мәзір жаңартылмады. Байланысты тексеріп, қайталап көріңіз."
  },
  "Сессия истекла. Войдите в профиль ещё раз.": {
    "ru": "Сессия истекла. Войдите в профиль ещё раз.",
    "ky": "Сеанстын мөөнөтү бүттү. Профилге кайра кириңиз.",
    "uz": "Seans muddati tugadi. Profilga qayta kiring.",
    "en": "Your session expired. Sign in again.",
    "kk": "Сеанс мерзімі аяқталды. Профильге қайта кіріңіз."
  },
  "Не удалось обновить данные профиля. Проверьте подключение и попробуйте ещё раз.": {
    "ru": "Не удалось обновить данные профиля. Проверьте подключение и попробуйте ещё раз.",
    "ky": "Профиль жаңыртылган жок. Байланышты текшерип, кайра аракет кылыңыз.",
    "uz": "Profilni yangilab bo‘lmadi. Aloqani tekshirib, qayta urinib ko‘ring.",
    "en": "Could not refresh your profile. Check your connection and try again.",
    "kk": "Профиль жаңартылмады. Байланысты тексеріп, қайталап көріңіз."
  },
  "Не удалось загрузить детали заказа. Попробуйте ещё раз.": {
    "ru": "Не удалось загрузить детали заказа. Попробуйте ещё раз.",
    "ky": "Буйрутманын чоо-жайы жүктөлгөн жок. Кайра аракет кылыңыз.",
    "uz": "Buyurtma tafsilotlarini yuklab bo‘lmadi. Qayta urinib ko‘ring.",
    "en": "Could not load order details. Try again.",
    "kk": "Тапсырыс мәліметтері жүктелмеді. Қайталап көріңіз."
  },
  "Нашли для вас": {
    "ru": "Нашли для вас",
    "ky": "Сиз үчүн таптык",
    "uz": "Siz uchun topdik",
    "en": "Found for you",
    "kk": "Сіз үшін таптық"
  },
  "Введите телефон в формате +996 XXX XXX XXX.": {
    "ru": "Введите телефон в формате +996 XXX XXX XXX.",
    "ky": "Телефонду +996 XXX XXX XXX түрүндө киргизиңиз.",
    "uz": "Telefonni +996 XXX XXX XXX shaklida kiriting.",
    "en": "Enter a phone number in the format +996 XXX XXX XXX.",
    "kk": "Телефонды +996 XXX XXX XXX пішімінде енгізіңіз."
  },
  "Подтвердите, что вы не робот.": {
    "ru": "Подтвердите, что вы не робот.",
    "ky": "Робот эмес экениңизди ырастаңыз.",
    "uz": "Robot emasligingizni tasdiqlang.",
    "en": "Confirm that you are not a robot.",
    "kk": "Робот емес екеніңізді растаңыз."
  },
  "Не удалось отправить код": {
    "ru": "Не удалось отправить код",
    "ky": "Код жөнөтүлгөн жок",
    "uz": "Kodni yuborib bo‘lmadi",
    "en": "Could not send code",
    "kk": "Кодты жіберу мүмкін болмады"
  },
  "Код отправлен по SMS": {
    "ru": "Код отправлен по SMS",
    "ky": "Код SMS аркылуу жөнөтүлдү",
    "uz": "Kod SMS orqali yuborildi",
    "en": "Code sent by SMS",
    "kk": "Код SMS арқылы жіберілді"
  },
  "Телефон подтверждён": {
    "ru": "Телефон подтверждён",
    "ky": "Телефон ырасталды",
    "uz": "Telefon tasdiqlandi",
    "en": "Phone number verified",
    "kk": "Телефон расталды"
  },
  "Введите шестизначный код": {
    "ru": "Введите шестизначный код",
    "ky": "Алты орундуу кодду киргизиңиз",
    "uz": "Olti xonali kodni kiriting",
    "en": "Enter the six-digit code",
    "kk": "Алты таңбалы кодты енгізіңіз"
  },
  "Не удалось подтвердить номер": {
    "ru": "Не удалось подтвердить номер",
    "ky": "Номер ырасталган жок",
    "uz": "Raqamni tasdiqlab bo‘lmadi",
    "en": "Could not verify phone number",
    "kk": "Нөмірді растау мүмкін болмады"
  },
  "Введите телефон в формате +996 XXX XXX XXX или +7 XXX XXX-XX-XX.": {
    "ru": "Введите телефон в формате +996 XXX XXX XXX или +7 XXX XXX-XX-XX.",
    "ky": "Телефонду +996 XXX XXX XXX же +7 XXX XXX-XX-XX түрүндө киргизиңиз.",
    "uz": "Telefonni +996 XXX XXX XXX yoki +7 XXX XXX-XX-XX shaklida kiriting.",
    "en": "Enter a phone number in the format +996 XXX XXX XXX or +7 XXX XXX-XX-XX.",
    "kk": "Телефонды +996 XXX XXX XXX немесе +7 XXX XXX-XX-XX пішімінде енгізіңіз."
  },
  "Сначала подтвердите номер кодом из SMS.": {
    "ru": "Сначала подтвердите номер кодом из SMS.",
    "ky": "Адегенде номерди SMS коду менен ырастаңыз.",
    "uz": "Avval raqamni SMS kodi bilan tasdiqlang.",
    "en": "Verify your number with an SMS code first.",
    "kk": "Алдымен нөмірді SMS кодымен растаңыз."
  },
  "Не удалось отправить заказ. Попробуйте ещё раз.": {
    "ru": "Не удалось отправить заказ. Попробуйте ещё раз.",
    "ky": "Буйрутма жөнөтүлгөн жок. Кайра аракет кылыңыз.",
    "uz": "Buyurtmani yuborib bo‘lmadi. Qayta urinib ko‘ring.",
    "en": "Could not place your order. Try again.",
    "kk": "Тапсырыс жіберілмеді. Қайталап көріңіз."
  },
  "белок": {
    "ru": "белок",
    "ky": "белок",
    "uz": "oqsil",
    "en": "protein",
    "kk": "ақуыз"
  },
  "граммы": {
    "ru": "граммы",
    "ky": "грамм",
    "uz": "gramm",
    "en": "grams",
    "kk": "грамм"
  },
  "Закрыть и выбрать первый доступный город": {
    "ru": "Закрыть и выбрать первый доступный город",
    "ky": "Жабуу жана биринчи жеткиликтүү шаарды тандоо",
    "uz": "Yopish va birinchi mavjud shaharni tanlash",
    "en": "Close and choose the first available city",
    "kk": "Жабу және алғашқы қолжетімді қаланы таңдау"
  },
  "Выберите город": {
    "ru": "Выберите город",
    "ky": "Шаарды тандаңыз",
    "uz": "Shaharni tanlang",
    "en": "Choose your city",
    "kk": "Қаланы таңдаңыз"
  },
  "Чтобы показать доступное меню": {
    "ru": "Чтобы показать доступное меню",
    "ky": "Жеткиликтүү менюну",
    "uz": "Mavjud menyu va",
    "en": "To show the available menu",
    "kk": "Қолжетімді мәзір мен"
  },
  "и время доставки": {
    "ru": "и время доставки",
    "ky": "жана жеткирүү убактысын көрсөтүү үчүн",
    "uz": "yetkazish vaqtini ko‘rsatish uchun",
    "en": "and delivery times",
    "kk": "жеткізу уақытын көрсету үшін"
  },
  "Скачайте приложение Накта суши": {
    "ru": "Скачайте приложение Накта суши",
    "ky": "Накта суши колдонмосун жүктөп алыңыз",
    "uz": "Nakta Sushi ilovasini yuklab oling",
    "en": "Download the Nakta Sushi app",
    "kk": "Накта суши қолданбасын жүктеп алыңыз"
  },
  "Скачайте": {
    "ru": "Скачайте",
    "ky": "Колдонмону",
    "uz": "Ilovani",
    "en": "Download",
    "kk": "Қолданбаны"
  },
  "приложение": {
    "ru": "приложение",
    "ky": "жүктөп алыңыз",
    "uz": "yuklab oling",
    "en": "the app",
    "kk": "жүктеп алыңыз"
  },
  "Открыть профиль": {
    "ru": "Открыть профиль",
    "ky": "Профилди ачуу",
    "uz": "Profilni ochish",
    "en": "Open profile",
    "kk": "Профильді ашу"
  },
  "Войти в профиль": {
    "ru": "Войти в профиль",
    "ky": "Профилге кирүү",
    "uz": "Profilga kirish",
    "en": "Sign in to your profile",
    "kk": "Профильге кіру"
  },
  "Способ получения заказа": {
    "ru": "Способ получения заказа",
    "ky": "Буйрутманы алуу жолу",
    "uz": "Buyurtmani olish usuli",
    "en": "Order fulfilment method",
    "kk": "Тапсырысты алу тәсілі"
  },
  "Выберите ресторан для самовывоза": {
    "ru": "Выберите ресторан для самовывоза",
    "ky": "Өзүңүз алып кетүү үчүн ресторанды тандаңыз",
    "uz": "Olib ketish uchun restoranni tanlang",
    "en": "Choose a pickup restaurant",
    "kk": "Өзіңіз алып кету үшін мейрамхананы таңдаңыз"
  },
  "Кухня закрыта. {0}": {
    "ru": "Кухня закрыта. {0}",
    "ky": "Ашкана жабык. {0}",
    "uz": "Oshxona yopiq. {0}",
    "en": "Kitchen closed. {0}",
    "kk": "Асүй жабық. {0}"
  },
  "Самовывоз примерно 40 минут": {
    "ru": "Самовывоз примерно 40 минут",
    "ky": "Алып кетүү болжол менен 40 мүнөт",
    "uz": "Olib ketish taxminan 40 daqiqa",
    "en": "Pickup in about 40 minutes",
    "kk": "Алып кету шамамен 40 минут"
  },
  "Доставка примерно 45 минут": {
    "ru": "Доставка примерно 45 минут",
    "ky": "Жеткирүү болжол менен 45 мүнөт",
    "uz": "Yetkazish taxminan 45 daqiqa",
    "en": "Delivery in about 45 minutes",
    "kk": "Жеткізу шамамен 45 минут"
  },
  "~40 минут": {
    "ru": "~40 минут",
    "ky": "~40 мүнөт",
    "uz": "~40 daqiqa",
    "en": "~40 minutes",
    "kk": "~40 минут"
  },
  "от ~45 минут": {
    "ru": "от ~45 минут",
    "ky": "~45 мүнөттөн",
    "uz": "~45 daqiqadan",
    "en": "from ~45 minutes",
    "kk": "~45 минуттан"
  },
  "в": {
    "ru": "в",
    "ky": "шаарында",
    "uz": "shahrida",
    "en": "in",
    "kk": "қаласында"
  },
  "Открыть акцию: {0}": {
    "ru": "Открыть акцию: {0}",
    "ky": "Акцияны ачуу: {0}",
    "uz": "Aksiyani ochish: {0}",
    "en": "Open promotion: {0}",
    "kk": "Акцияны ашу: {0}"
  },
  "Открыть поиск": {
    "ru": "Открыть поиск",
    "ky": "Издөөнү ачуу",
    "uz": "Qidiruvni ochish",
    "en": "Open search",
    "kk": "Іздеуді ашу"
  },
  "Что ищем?": {
    "ru": "Что ищем?",
    "ky": "Эмнени издейбиз?",
    "uz": "Nima qidiramiz?",
    "en": "What are you looking for?",
    "kk": "Не іздейміз?"
  },
  "Загружаем меню…": {
    "ru": "Загружаем меню…",
    "ky": "Меню жүктөлүүдө…",
    "uz": "Menyu yuklanmoqda…",
    "en": "Loading menu…",
    "kk": "Мәзір жүктелуде…"
  },
  "Ничего не нашли — попробуйте другое название": {
    "ru": "Ничего не нашли — попробуйте другое название",
    "ky": "Эч нерсе табылган жок — башка аталышты сынаңыз",
    "uz": "Hech narsa topilmadi — boshqa nomni sinab ko‘ring",
    "en": "Nothing found — try another name",
    "kk": "Ештеңе табылмады — басқа атауды көріңіз"
  },
  "Закончилось": {
    "ru": "Закончилось",
    "ky": "Түгөндү",
    "uz": "Tugagan",
    "en": "Sold out",
    "kk": "Таусылды"
  },
  "Количество {0}": {
    "ru": "Количество {0}",
    "ky": "{0} саны",
    "uz": "{0} miqdori",
    "en": "Quantity of {0}",
    "kk": "{0} саны"
  },
  "Накта суши — доставка суши и роллов в Бишкеке и Оше": {
    "ru": "Накта суши — доставка суши и роллов в Бишкеке и Оше",
    "ky": "Накта суши — Бишкек жана Ош шаарларында суши жана ролл жеткирүү",
    "uz": "Nakta Sushi — Bishkek va O‘shda sushi va rollar yetkazish",
    "en": "Nakta Sushi — sushi and roll delivery in Bishkek and Osh",
    "kk": "Накта суши — Бішкек пен Ошта суши мен ролл жеткізу"
  },
  "Заказывайте роллы, суши, сеты, поке и горячие блюда онлайн. Выберите город, укажите адрес доставки или удобную точку самовывоза — актуальное меню и цены всегда доступны на сайте Nakta Sushi.": {
    "ru": "Заказывайте роллы, суши, сеты, поке и горячие блюда онлайн. Выберите город, укажите адрес доставки или удобную точку самовывоза — актуальное меню и цены всегда доступны на сайте Nakta Sushi.",
    "ky": "Ролл, суши, сет, поке жана ысык тамактарга онлайн буйрутма бериңиз. Шаарды тандап, жеткирүү дарегин же алып кетүү пунктун көрсөтүңүз. Учурдагы меню жана баалар Nakta Sushi сайтында.",
    "uz": "Roll, sushi, set, poke va issiq taomlarni onlayn buyurtma qiling. Shaharni, yetkazish manzilini yoki olib ketish punktini tanlang. Joriy menyu va narxlar Nakta Sushi saytida.",
    "en": "Order rolls, sushi, sets, poke and hot dishes online. Choose a city, enter your delivery address or select a pickup location. Find the latest menu and prices on Nakta Sushi.",
    "kk": "Ролл, суши, сет, поке және ыстық тағамдарға онлайн тапсырыс беріңіз. Қаланы, жеткізу мекенжайын немесе алып кету орнын таңдаңыз. Өзекті мәзір мен бағалар Nakta Sushi сайтында."
  },
  "Популярные разделы меню": {
    "ru": "Популярные разделы меню",
    "ky": "Менюнун популярдуу бөлүмдөрү",
    "uz": "Menyuning ommabop bo‘limlari",
    "en": "Popular menu sections",
    "kk": "Мәзірдің танымал бөлімдері"
  },
  "Суши и сашими": {
    "ru": "Суши и сашими",
    "ky": "Суши жана сашими",
    "uz": "Sushi va sashimi",
    "en": "Sushi and sashimi",
    "kk": "Суши және сашими"
  },
  "Контакты": {
    "ru": "Контакты",
    "ky": "Байланыштар",
    "uz": "Aloqa",
    "en": "Contact us",
    "kk": "Байланыстар"
  },
  "Электронная почта": {
    "ru": "Электронная почта",
    "ky": "Электрондук почта",
    "uz": "Elektron pochta",
    "en": "Email",
    "kk": "Электрондық пошта"
  },
  "Конфиденциальность": {
    "ru": "Конфиденциальность",
    "ky": "Купуялык",
    "uz": "Maxfiylik",
    "en": "Privacy",
    "kk": "Құпиялылық"
  },
  "Условия": {
    "ru": "Условия",
    "ky": "Шарттар",
    "uz": "Shartlar",
    "en": "Terms",
    "kk": "Шарттар"
  },
  "Удаление аккаунта": {
    "ru": "Удаление аккаунта",
    "ky": "Аккаунтту өчүрүү",
    "uz": "Hisobni o‘chirish",
    "en": "Account deletion",
    "kk": "Тіркелгіні жою"
  },
  "Все документы": {
    "ru": "Все документы",
    "ky": "Бардык документтер",
    "uz": "Barcha hujjatlar",
    "en": "All documents",
    "kk": "Барлық құжаттар"
  },
  "Профиль": {
    "ru": "Профиль",
    "ky": "Профиль",
    "uz": "Profil",
    "en": "Profile",
    "kk": "Профиль"
  },
  "Разделы профиля": {
    "ru": "Разделы профиля",
    "ky": "Профилдин бөлүмдөрү",
    "uz": "Profil bo‘limlari",
    "en": "Profile sections",
    "kk": "Профиль бөлімдері"
  },
  "Версия 0.1.0": {
    "ru": "Версия 0.1.0",
    "ky": "Нуска 0.1.0",
    "uz": "Versiya 0.1.0",
    "en": "Version 0.1.0",
    "kk": "Нұсқа 0.1.0"
  },
  "Меню профиля": {
    "ru": "Меню профиля",
    "ky": "Профилдин менюсу",
    "uz": "Profil menyusi",
    "en": "Profile menu",
    "kk": "Профиль мәзірі"
  },
  "Следующая страница через 30 секунд": {
    "ru": "Следующая страница через 30 секунд",
    "ky": "Кийинки барак 30 секунддан кийин",
    "uz": "Keyingi sahifa 30 soniyadan keyin",
    "en": "Next page in 30 seconds",
    "kk": "Келесі бет 30 секундтан кейін"
  },
  "← Предыдущее": {
    "ru": "← Предыдущее",
    "ky": "← Мурунку",
    "uz": "← Oldingi",
    "en": "← Previous",
    "kk": "← Алдыңғы"
  },
  "Следующее →": {
    "ru": "Следующее →",
    "ky": "Кийинки →",
    "uz": "Keyingi →",
    "en": "Next →",
    "kk": "Келесі →"
  },
  "Нужно выбрать": {
    "ru": "Нужно выбрать",
    "ky": "Тандоо керек",
    "uz": "Tanlash kerak",
    "en": "Selection required",
    "kk": "Таңдау қажет"
  },
  "Настройте блюдо": {
    "ru": "Настройте блюдо",
    "ky": "Тамакты жөндөңүз",
    "uz": "Taomni moslang",
    "en": "Customise your dish",
    "kk": "Тағамды баптаңыз"
  },
  "Закрыть карточку блюда": {
    "ru": "Закрыть карточку блюда",
    "ky": "Тамактын карточкасын жабуу",
    "uz": "Taom kartochkasini yopish",
    "en": "Close dish details",
    "kk": "Тағам карточкасын жабу"
  },
  "В комплекте с одной порцией этого блюда:": {
    "ru": "В комплекте с одной порцией этого блюда:",
    "ky": "Бул тамактын бир порциясына кирет:",
    "uz": "Bu taomning bir porsiyasiga kiradi:",
    "en": "Included with one portion of this dish:",
    "kk": "Бұл тағамның бір порциясына кіреді:"
  },
  "Соусы и добавки, выбранные в карточке блюда, будут сохранены в заказе отдельно.": {
    "ru": "Соусы и добавки, выбранные в карточке блюда, будут сохранены в заказе отдельно.",
    "ky": "Тамактын карточкасында тандалган соустар жана кошумчалар буйрутмада өзүнчө сакталат.",
    "uz": "Taom kartochkasida tanlangan souslar va qo‘shimchalar buyurtmada alohida saqlanadi.",
    "en": "Sauces and extras chosen in the dish card are saved separately in your order.",
    "kk": "Тағам карточкасында таңдалған тұздықтар мен қосымшалар тапсырыста бөлек сақталады."
  },
  "Вернуться к блюду": {
    "ru": "Вернуться к блюду",
    "ky": "Тамакка кайтуу",
    "uz": "Taomga qaytish",
    "en": "Back to dish",
    "kk": "Тағамға қайту"
  },
  "Выбрать доставку": {
    "ru": "Выбрать доставку",
    "ky": "Жеткирүүнү тандоо",
    "uz": "Yetkazishni tanlash",
    "en": "Choose delivery",
    "kk": "Жеткізуді таңдау"
  },
  "Выбрать самовывоз": {
    "ru": "Выбрать самовывоз",
    "ky": "Өзү алып кетүүнү тандоо",
    "uz": "Olib ketishni tanlash",
    "en": "Choose pickup",
    "kk": "Өзі алып кетуді таңдау"
  },
  "~45 минут": {
    "ru": "~45 минут",
    "ky": "~45 мүнөт",
    "uz": "~45 daqiqa",
    "en": "~45 minutes",
    "kk": "~45 минут"
  },
  "Выберите точку для самовывоза": {
    "ru": "Выберите точку для самовывоза",
    "ky": "Алып кетүү пунктун тандаңыз",
    "uz": "Olib ketish punktini tanlang",
    "en": "Choose a pickup location",
    "kk": "Алып кету орнын таңдаңыз"
  },
  "из доступных в списке или на карте": {
    "ru": "из доступных в списке или на карте",
    "ky": "тизмеден же картадан",
    "uz": "ro‘yxatdan yoki xaritadan",
    "en": "from the list or map",
    "kk": "тізімнен немесе картадан"
  },
  "В этом городе пока нет доступных кухонь": {
    "ru": "В этом городе пока нет доступных кухонь",
    "ky": "Бул шаарда азырынча жеткиликтүү ашканалар жок",
    "uz": "Bu shaharda hozircha mavjud oshxonalar yo‘q",
    "en": "No kitchens are available in this city yet",
    "kk": "Бұл қалада әзірге қолжетімді асүйлер жоқ"
  },
  "Забрать здесь": {
    "ru": "Забрать здесь",
    "ky": "Бул жерден алуу",
    "uz": "Shu yerdan olish",
    "en": "Pick up here",
    "kk": "Осы жерден алу"
  },
  "Введите адрес для доставки курьером,": {
    "ru": "Введите адрес для доставки курьером,",
    "ky": "Курьер менен жеткирүү үчүн даректи киргизиңиз,",
    "uz": "Kuryer yetkazishi uchun manzilni kiriting,",
    "en": "Enter your delivery address,",
    "kk": "Курьер жеткізуі үшін мекенжайды енгізіңіз,"
  },
  "выберите подсказку или точку на карте": {
    "ru": "выберите подсказку или точку на карте",
    "ky": "сунушту же картадагы чекитти тандаңыз",
    "uz": "taklif yoki xaritadagi nuqtani tanlang",
    "en": "choose a suggestion or a point on the map",
    "kk": "ұсынысты немесе картадағы нүктені таңдаңыз"
  },
  "Улица и номер дома": {
    "ru": "Улица и номер дома",
    "ky": "Көчө жана үйдүн номери",
    "uz": "Ko‘cha va uy raqami",
    "en": "Street and house number",
    "kk": "Көше және үй нөмірі"
  },
  "Очистить адрес": {
    "ru": "Очистить адрес",
    "ky": "Даректи тазалоо",
    "uz": "Manzilni tozalash",
    "en": "Clear address",
    "kk": "Мекенжайды тазалау"
  },
  "Заказать сюда": {
    "ru": "Заказать сюда",
    "ky": "Бул дарекке буйрутма берүү",
    "uz": "Shu manzilga buyurtma qilish",
    "en": "Deliver here",
    "kk": "Осы мекенжайға тапсырыс беру"
  },
  "Место сбора": {
    "ru": "Место сбора",
    "ky": "Даамдуу тамактардын",
    "uz": "Mazali taomlar",
    "en": "A gathering place",
    "kk": "Дәмді тағамдардың"
  },
  "вкусных блюд": {
    "ru": "вкусных блюд",
    "ky": "чогулган жери",
    "uz": "jamlangan joy",
    "en": "for delicious dishes",
    "kk": "жиналған жері"
  },
  "приборы и дополнения к блюдам": {
    "ru": "приборы и дополнения к блюдам",
    "ky": "тамактарга шаймандар жана кошумчалар",
    "uz": "taomlarga anjomlar va qo‘shimchalar",
    "en": "cutlery and extras",
    "kk": "тағамдарға ас құралдары мен қосымшалар"
  },
  "приборы": {
    "ru": "приборы",
    "ky": "шаймандар",
    "uz": "anjomlar",
    "en": "cutlery",
    "kk": "ас құралдары"
  },
  "Промокод или скидка": {
    "ru": "Промокод или скидка",
    "ky": "Промокод же арзандатуу",
    "uz": "Promokod yoki chegirma",
    "en": "Promo code or discount",
    "kk": "Промокод немесе жеңілдік"
  },
  "Нужно будет авторизоваться": {
    "ru": "Нужно будет авторизоваться",
    "ky": "Аккаунтка кирүү керек болот",
    "uz": "Hisobga kirish kerak bo‘ladi",
    "en": "You will need to sign in",
    "kk": "Тіркелгіге кіру қажет болады"
  },
  "Примерно через 40 минут": {
    "ru": "Примерно через 40 минут",
    "ky": "Болжол менен 40 мүнөттөн кийин",
    "uz": "Taxminan 40 daqiqadan keyin",
    "en": "In about 40 minutes",
    "kk": "Шамамен 40 минуттан кейін"
  },
  "Примерно через 45 минут": {
    "ru": "Примерно через 45 минут",
    "ky": "Болжол менен 45 мүнөттөн кийин",
    "uz": "Taxminan 45 daqiqadan keyin",
    "en": "In about 45 minutes",
    "kk": "Шамамен 45 минуттан кейін"
  },
  "Загружаем детали заказа…": {
    "ru": "Загружаем детали заказа…",
    "ky": "Буйрутманын чоо-жайы жүктөлүүдө…",
    "uz": "Buyurtma tafsilotlari yuklanmoqda…",
    "en": "Loading order details…",
    "kk": "Тапсырыс мәліметтері жүктелуде…"
  },
  "· готово {0}": {
    "ru": "· готово {0}",
    "ky": "· даяр: {0}",
    "uz": "· tayyor: {0}",
    "en": "· ready {0}",
    "kk": "· дайын: {0}"
  },
  "Без палочек": {
    "ru": "Без палочек",
    "ky": "Таякчасыз",
    "uz": "Tayoqchalarsiz",
    "en": "No chopsticks",
    "kk": "Таяқшаларсыз"
  },
  "Палочки: {0}": {
    "ru": "Палочки: {0}",
    "ky": "Таякчалар: {0}",
    "uz": "Tayoqchalar: {0}",
    "en": "Chopsticks: {0}",
    "kk": "Таяқшалар: {0}"
  },
  "Информация о самовывозе": {
    "ru": "Информация о самовывозе",
    "ky": "Алып кетүү жөнүндө маалымат",
    "uz": "Olib ketish haqida ma’lumot",
    "en": "Pickup information",
    "kk": "Алып кету туралы ақпарат"
  },
  "Информация о доставке": {
    "ru": "Информация о доставке",
    "ky": "Жеткирүү жөнүндө маалымат",
    "uz": "Yetkazish haqida ma’lumot",
    "en": "Delivery information",
    "kk": "Жеткізу туралы ақпарат"
  },
  "Сейчас закрыто. {0}": {
    "ru": "Сейчас закрыто. {0}",
    "ky": "Азыр жабык. {0}",
    "uz": "Hozir yopiq. {0}",
    "en": "Currently closed. {0}",
    "kk": "Қазір жабық. {0}"
  },
  "Детали": {
    "ru": "Детали",
    "ky": "Чоо-жайы",
    "uz": "Tafsilotlar",
    "en": "Details",
    "kk": "Мәліметтер"
  },
  "Время приготовления": {
    "ru": "Время приготовления",
    "ky": "Даярдоо убактысы",
    "uz": "Tayyorlash vaqti",
    "en": "Preparation time",
    "kk": "Дайындау уақыты"
  },
  "~40 мин": {
    "ru": "~40 мин",
    "ky": "~40 мүн",
    "uz": "~40 daq.",
    "en": "~40 min",
    "kk": "~40 мин"
  },
  "Стоимость самовывоза": {
    "ru": "Стоимость самовывоза",
    "ky": "Алып кетүү акысы",
    "uz": "Olib ketish narxi",
    "en": "Pickup fee",
    "kk": "Алып кету ақысы"
  },
  "Бесплатная доставка от {0}": {
    "ru": "Бесплатная доставка от {0}",
    "ky": "{0} баштап акысыз жеткирүү",
    "uz": "{0} dan bepul yetkazish",
    "en": "Free delivery from {0}",
    "kk": "{0} бастап тегін жеткізу"
  },
  "Доставка в город {0}": {
    "ru": "Доставка в город {0}",
    "ky": "{0} шаарына жеткирүү",
    "uz": "{0} shahriga yetkazish",
    "en": "Delivery to {0}",
    "kk": "{0} қаласына жеткізу"
  },
  "мин": {
    "ru": "мин",
    "ky": "мүн",
    "uz": "daq.",
    "en": "min",
    "kk": "мин"
  },
  "Рабочее время": {
    "ru": "Рабочее время",
    "ky": "Иш убактысы",
    "uz": "Ish vaqti",
    "en": "Business hours",
    "kk": "Жұмыс уақыты"
  },
  "При заказе до": {
    "ru": "При заказе до",
    "ky": "Буйрутма суммасы төмөн болсо",
    "uz": "Buyurtma summasi kam bo‘lsa",
    "en": "For orders under",
    "kk": "Тапсырыс сомасы төмен болса"
  },
  "При заказе от": {
    "ru": "При заказе от",
    "ky": "Буйрутма суммасы жогору болсо",
    "uz": "Buyurtma summasi yuqori bo‘lsa",
    "en": "For orders from",
    "kk": "Тапсырыс сомасы жоғары болса"
  },
  "До бесплатной доставки": {
    "ru": "До бесплатной доставки",
    "ky": "Акысыз жеткирүүгө чейин",
    "uz": "Bepul yetkazishgacha",
    "en": "Until free delivery",
    "kk": "Тегін жеткізуге дейін"
  },
  "Комплектация заказа": {
    "ru": "Комплектация заказа",
    "ky": "Буйрутманын комплектациясы",
    "uz": "Buyurtma to‘plami",
    "en": "Order extras",
    "kk": "Тапсырыс жинағы"
  },
  "Если не используете — это экологично": {
    "ru": "Если не используете — это экологично",
    "ky": "Колдонбосоңуз — жаратылышты сактайсыз",
    "uz": "Ishlatmasangiz — tabiatni asraysiz",
    "en": "Skip them if you do not need them",
    "kk": "Қолданбасаңыз — табиғатты сақтайсыз"
  },
  "Уменьшить: {0}": {
    "ru": "Уменьшить: {0}",
    "ky": "Азайтуу: {0}",
    "uz": "Kamaytirish: {0}",
    "en": "Decrease: {0}",
    "kk": "Азайту: {0}"
  },
  "Увеличить: {0}": {
    "ru": "Увеличить: {0}",
    "ky": "Көбөйтүү: {0}",
    "uz": "Oshirish: {0}",
    "en": "Increase: {0}",
    "kk": "Көбейту: {0}"
  },
  "К выбранным блюдам дополнительная комплектация не предусмотрена.": {
    "ru": "К выбранным блюдам дополнительная комплектация не предусмотрена.",
    "ky": "Тандалган тамактарга кошумча комплектация каралган эмес.",
    "uz": "Tanlangan taomlar uchun qo‘shimcha to‘plam ko‘zda tutilmagan.",
    "en": "No additional extras are available for these dishes.",
    "kk": "Таңдалған тағамдарға қосымша жинақ қарастырылмаған."
  },
  "Авторизация по номеру телефона": {
    "ru": "Авторизация по номеру телефона",
    "ky": "Телефон номери менен кирүү",
    "uz": "Telefon raqami orqali kirish",
    "en": "Sign in with your phone number",
    "kk": "Телефон нөмірімен кіру"
  },
  "Код подтверждения": {
    "ru": "Код подтверждения",
    "ky": "Ырастоо коду",
    "uz": "Tasdiqlash kodi",
    "en": "Verification code",
    "kk": "Растау коды"
  },
  "Получить новый код": {
    "ru": "Получить новый код",
    "ky": "Жаңы код алуу",
    "uz": "Yangi kod olish",
    "en": "Get a new code",
    "kk": "Жаңа код алу"
  },
  "Отправляем SMS…": {
    "ru": "Отправляем SMS…",
    "ky": "SMS жөнөтүлүүдө…",
    "uz": "SMS yuborilmoqda…",
    "en": "Sending SMS…",
    "kk": "SMS жіберілуде…"
  },
  "Вернуться в корзину": {
    "ru": "Вернуться в корзину",
    "ky": "Себетке кайтуу",
    "uz": "Savatga qaytish",
    "en": "Back to cart",
    "kk": "Себетке қайту"
  },
  "Оформление заказа": {
    "ru": "Оформление заказа",
    "ky": "Буйрутманы тариздөө",
    "uz": "Buyurtmani rasmiylashtirish",
    "en": "Checkout",
    "kk": "Тапсырысты рәсімдеу"
  },
  "Спасибо!": {
    "ru": "Спасибо!",
    "ky": "Рахмат!",
    "uz": "Rahmat!",
    "en": "Thank you!",
    "kk": "Рақмет!"
  },
  "Номер заказа": {
    "ru": "Номер заказа",
    "ky": "Буйрутманын номери",
    "uz": "Buyurtma raqami",
    "en": "Order number",
    "kk": "Тапсырыс нөмірі"
  },
  ". Администратор скоро проверит и подтвердит его.": {
    "ru": ". Администратор скоро проверит и подтвердит его.",
    "ky": ". Администратор жакында текшерип, ырастайт.",
    "uz": ". Administrator tez orada tekshirib tasdiqlaydi.",
    "en": ". Our team will review and confirm it shortly.",
    "kk": ". Әкімші жақында тексеріп, растайды."
  },
  "К оплате": {
    "ru": "К оплате",
    "ky": "Төлөнүүчү сумма",
    "uz": "To‘lov summasi",
    "en": "Amount due",
    "kk": "Төленетін сома"
  },
  "Вернуться в меню": {
    "ru": "Вернуться в меню",
    "ky": "Менюга кайтуу",
    "uz": "Menyuga qaytish",
    "en": "Back to menu",
    "kk": "Мәзірге қайту"
  },
  "Получатель": {
    "ru": "Получатель",
    "ky": "Алуучу",
    "uz": "Qabul qiluvchi",
    "en": "Recipient",
    "kk": "Алушы"
  },
  "Имя получателя": {
    "ru": "Имя получателя",
    "ky": "Алуучунун аты",
    "uz": "Qabul qiluvchi ismi",
    "en": "Recipient name",
    "kk": "Алушының аты"
  },
  "Ваше имя": {
    "ru": "Ваше имя",
    "ky": "Сиздин атыңыз",
    "uz": "Ismingiz",
    "en": "Your name",
    "kk": "Сіздің атыңыз"
  },
  "Изменить номер телефона": {
    "ru": "Изменить номер телефона",
    "ky": "Телефон номерин өзгөртүү",
    "uz": "Telefon raqamini o‘zgartirish",
    "en": "Change phone number",
    "kk": "Телефон нөмірін өзгерту"
  },
  "Способ оплаты": {
    "ru": "Способ оплаты",
    "ky": "Төлөм жолу",
    "uz": "To‘lov usuli",
    "en": "Payment method",
    "kk": "Төлем тәсілі"
  },
  "Пожелания к заказу": {
    "ru": "Пожелания к заказу",
    "ky": "Буйрутмага каалоолор",
    "uz": "Buyurtma uchun izohlar",
    "en": "Order notes",
    "kk": "Тапсырысқа тілектер"
  },
  "Отправляем заказ…": {
    "ru": "Отправляем заказ…",
    "ky": "Буйрутма жөнөтүлүүдө…",
    "uz": "Buyurtma yuborilmoqda…",
    "en": "Placing order…",
    "kk": "Тапсырыс жіберілуде…"
  },
  "Не удалось определить адрес": {
    "ru": "Не удалось определить адрес",
    "ky": "Дарек аныкталган жок",
    "uz": "Manzilni aniqlab bo‘lmadi",
    "en": "Could not find address",
    "kk": "Мекенжайды анықтау мүмкін болмады"
  },
  "Настраиваем карту…": {
    "ru": "Настраиваем карту…",
    "ky": "Карта жөндөлүүдө…",
    "uz": "Xarita sozlanmoqda…",
    "en": "Setting up map…",
    "kk": "Карта бапталуда…"
  },
  "Нужен бесплатный ключ Яндекс Карт": {
    "ru": "Нужен бесплатный ключ Яндекс Карт",
    "ky": "Яндекс Картанын акысыз ачкычы керек",
    "uz": "Yandex Xaritalarning bepul kaliti kerak",
    "en": "A free Yandex Maps key is required",
    "kk": "Яндекс Картаның тегін кілті қажет"
  },
  "Геосаджест: {0}": {
    "ru": "Геосаджест: {0}",
    "ky": "Дарек сунуштары: {0}",
    "uz": "Manzil takliflari: {0}",
    "en": "Address suggestions: {0}",
    "kk": "Мекенжай ұсыныстары: {0}"
  },
  "Выберите адрес в городе {0}": {
    "ru": "Выберите адрес в городе {0}",
    "ky": "{0} шаарындагы даректи тандаңыз",
    "uz": "{0} shahridagi manzilni tanlang",
    "en": "Choose an address in {0}",
    "kk": "{0} қаласындағы мекенжайды таңдаңыз"
  },
  "{0}, выбранная точка на карте": {
    "ru": "{0}, выбранная точка на карте",
    "ky": "{0}, картада тандалган чекит",
    "uz": "{0}, xaritada tanlangan nuqta",
    "en": "{0}, selected point on the map",
    "kk": "{0}, картада таңдалған нүкте"
  },
  "Адрес найден": {
    "ru": "Адрес найден",
    "ky": "Дарек табылды",
    "uz": "Manzil topildi",
    "en": "Address found",
    "kk": "Мекенжай табылды"
  },
  "Точка выбрана — при необходимости уточните адрес": {
    "ru": "Точка выбрана — при необходимости уточните адрес",
    "ky": "Чекит тандалды — керек болсо даректи тактаңыз",
    "uz": "Nuqta tanlandi — kerak bo‘lsa manzilni aniqlashtiring",
    "en": "Point selected — refine the address if needed",
    "kk": "Нүкте таңдалды — қажет болса мекенжайды нақтылаңыз"
  },
  "Место найдено": {
    "ru": "Место найдено",
    "ky": "Жер табылды",
    "uz": "Joy topildi",
    "en": "Location found",
    "kk": "Орын табылды"
  },
  "Адрес в городе {0} не найден": {
    "ru": "Адрес в городе {0} не найден",
    "ky": "{0} шаарында дарек табылган жок",
    "uz": "{0} shahrida manzil topilmadi",
    "en": "Address not found in {0}",
    "kk": "{0} қаласында мекенжай табылмады"
  },
  "Введите адрес или выберите точку на карте": {
    "ru": "Введите адрес или выберите точку на карте",
    "ky": "Даректи киргизиңиз же картадан чекит тандаңыз",
    "uz": "Manzilni kiriting yoki xaritada nuqta tanlang",
    "en": "Enter an address or choose a point on the map",
    "kk": "Мекенжайді енгізіңіз немесе картадан нүкте таңдаңыз"
  },
  "Геолокация недоступна": {
    "ru": "Геолокация недоступна",
    "ky": "Геолокация жеткиликсиз",
    "uz": "Geolokatsiya mavjud emas",
    "en": "Geolocation unavailable",
    "kk": "Геолокация қолжетімсіз"
  },
  "Разрешите доступ к геолокации в настройках браузера": {
    "ru": "Разрешите доступ к геолокации в настройках браузера",
    "ky": "Браузердин жөндөөлөрүнөн жайгашкан жерге кирүүгө уруксат бериңиз",
    "uz": "Brauzer sozlamalarida joylashuvga ruxsat bering",
    "en": "Allow location access in browser settings",
    "kk": "Браузер баптауларында орналасқан жерге рұқсат беріңіз"
  },
  "Не удалось получить геопозицию — проверьте GPS или интернет": {
    "ru": "Не удалось получить геопозицию — проверьте GPS или интернет",
    "ky": "Жайгашкан жер аныкталган жок — GPS же интернетти текшериңиз",
    "uz": "Joylashuvni aniqlab bo‘lmadi — GPS yoki internetni tekshiring",
    "en": "Could not get your location — check GPS or internet",
    "kk": "Орналасқан жер анықталмады — GPS немесе интернетті тексеріңіз"
  },
  "Не удалось определить местоположение — попробуйте ещё раз": {
    "ru": "Не удалось определить местоположение — попробуйте ещё раз",
    "ky": "Жайгашкан жер аныкталган жок — кайра аракет кылыңыз",
    "uz": "Joylashuvni aniqlab bo‘lmadi — qayta urinib ko‘ring",
    "en": "Could not find your location — try again",
    "kk": "Орналасқан жер анықталмады — қайталап көріңіз"
  },
  "Определяем местоположение…": {
    "ru": "Определяем местоположение…",
    "ky": "Жайгашкан жер аныкталууда…",
    "uz": "Joylashuv aniqlanmoqda…",
    "en": "Finding your location…",
    "kk": "Орналасқан жер анықталуда…"
  },
  "Интерактивная карта города {0}": {
    "ru": "Интерактивная карта города {0}",
    "ky": "{0} шаарынын интерактивдүү картасы",
    "uz": "{0} shahrining interaktiv xaritasi",
    "en": "Interactive map of {0}",
    "kk": "{0} қаласының интерактивті картасы"
  },
  "Подсказки адресов": {
    "ru": "Подсказки адресов",
    "ky": "Дарек сунуштары",
    "uz": "Manzil takliflari",
    "en": "Address suggestions",
    "kk": "Мекенжай ұсыныстары"
  },
  "Определить моё местоположение": {
    "ru": "Определить моё местоположение",
    "ky": "Менин жайгашкан жеримди аныктоо",
    "uz": "Joylashuvimni aniqlash",
    "en": "Find my location",
    "kk": "Менің орналасқан жерімді анықтау"
  },
  "Интерактивная карта самовывоза в городе {0}": {
    "ru": "Интерактивная карта самовывоза в городе {0}",
    "ky": "{0} шаарындагы алып кетүү пункттарынын интерактивдүү картасы",
    "uz": "{0} shahridagi olib ketish punktlarining interaktiv xaritasi",
    "en": "Interactive pickup map of {0}",
    "kk": "{0} қаласындағы алып кету орындарының интерактивті картасы"
  },
  "Проверка безопасности не настроена.": {
    "ru": "Проверка безопасности не настроена.",
    "ky": "Коопсуздук текшерүүсү жөндөлгөн эмес.",
    "uz": "Xavfsizlik tekshiruvi sozlanmagan.",
    "en": "Security verification is not configured.",
    "kk": "Қауіпсіздік тексеруі бапталмаған."
  },
  "Язык сайта": {
    "ru": "Язык сайта",
    "ky": "Сайттын тили",
    "en": "Website language",
    "uz": "Sayt tili",
    "kk": "Сайт тілі"
  },
  "Минимальная сумма собрана!": {
    "ru": "Минимальная сумма собрана!",
    "ky": "Минималдуу сумма чогулду!",
    "en": "Minimum order reached!",
    "uz": "Eng kam summa yig‘ildi!",
    "kk": "Ең аз сома жиналды!"
  }
};
