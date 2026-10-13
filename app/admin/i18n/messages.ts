// Russian source phrases are stable message keys. Customer and catalogue data stays unchanged.
export type Translations = Record<"ky" | "uz" | "en" | "kk", string>;
export const messages: Record<string, Translations> = {
  "Нет соединения с сервером. Изменения не сохранены.": {
    "ky": "Сервер менен байланыш жок. Өзгөртүүлөр сакталган жок.",
    "uz": "Server bilan aloqa yo‘q. O‘zgarishlar saqlanmadi.",
    "en": "No server connection. Changes were not saved.",
    "kk": "Сервермен байланыс жоқ. Өзгерістер сақталмады."
  },
  "Сервер вернул неожиданный ответ. Повторите запрос.": {
    "ky": "Серверден күтүлбөгөн жооп келди. Кайра аракет кылыңыз.",
    "uz": "Server kutilmagan javob qaytardi. Qayta urinib ko‘ring.",
    "en": "Unexpected server response. Please try again.",
    "kk": "Сервер күтпеген жауап қайтарды. Қайталап көріңіз."
  },
  "Не удалось выполнить запрос": {
    "ky": "Сурам аткарылган жок",
    "uz": "So‘rovni bajarib bo‘lmadi",
    "en": "Request failed",
    "kk": "Сұрауды орындау мүмкін болмады"
  },
  "Не удалось проверить доступ": {
    "ky": "Кирүү укугун текшерүү мүмкүн болгон жок",
    "uz": "Kirish huquqini tekshirib bo‘lmadi",
    "en": "Could not verify access",
    "kk": "Кіру құқығын тексеру мүмкін болмады"
  },
  "Доступ к этому действию закрыт. Права обновляются.": {
    "ky": "Бул аракетке уруксат жок. Укуктар жаңыртылууда.",
    "uz": "Bu amal uchun ruxsat yo‘q. Huquqlar yangilanmoqda.",
    "en": "Access denied. Permissions are being updated.",
    "kk": "Бұл әрекетке рұқсат жоқ. Құқықтар жаңартылуда."
  },
  "Не удалось загрузить города": {
    "ky": "Шаарлар жүктөлгөн жок",
    "uz": "Shaharlarni yuklab bo‘lmadi",
    "en": "Could not load cities",
    "kk": "Қалаларды жүктеу мүмкін болмады"
  },
  "Не удалось обновить города": {
    "ky": "Шаарлар жаңыртылган жок",
    "uz": "Shaharlarni yangilab bo‘lmadi",
    "en": "Could not refresh cities",
    "kk": "Қалаларды жаңарту мүмкін болмады"
  },
  "Вы вышли на этом устройстве. Завершаем сеанс на сервере…": {
    "ky": "Бул түзмөктөн чыктыңыз. Сервердеги сеанс жабылууда…",
    "uz": "Bu qurilmada tizimdan chiqdingiz. Serverdagi seans tugatilmoqda…",
    "en": "Signed out on this device. Ending the server session…",
    "kk": "Бұл құрылғыда жүйеден шықтыңыз. Сервердегі сеанс аяқталуда…"
  },
  "Вы вышли из панели. Серверный сеанс завершён.": {
    "ky": "Панелден чыктыңыз. Сервердеги сеанс жабылды.",
    "uz": "Paneldan chiqdingiz. Serverdagi seans tugatildi.",
    "en": "Signed out. The server session has ended.",
    "kk": "Панельден шықтыңыз. Сервердегі сеанс аяқталды."
  },
  "Вы вышли на этом устройстве. Сервер недоступен: завершение серверного сеанса не подтверждено.": {
    "ky": "Бул түзмөктөн чыктыңыз. Сервер жеткиликсиз: сеанстын жабылышы ырасталган жок.",
    "uz": "Bu qurilmada tizimdan chiqdingiz. Server ishlamayapti: seans tugatilgani tasdiqlanmadi.",
    "en": "Signed out on this device. The server is unavailable; session revocation could not be confirmed.",
    "kk": "Бұл құрылғыда жүйеден шықтыңыз. Сервер қолжетімсіз: сеанстың аяқталғаны расталмады."
  },
  "Загрузка панели": {
    "ky": "Панель жүктөлүүдө",
    "uz": "Panel yuklanmoqda",
    "en": "Loading admin panel",
    "kk": "Панель жүктелуде"
  },
  "Проверяем доступ…": {
    "ky": "Кирүү укугу текшерилүүдө…",
    "uz": "Kirish huquqi tekshirilmoqda…",
    "en": "Verifying access…",
    "kk": "Кіру құқығы тексерілуде…"
  },
  "Повторить": {
    "ky": "Кайталоо",
    "uz": "Qayta urinish",
    "en": "Retry",
    "kk": "Қайталау"
  },
  "Вернуться ко входу": {
    "ky": "Кирүү барагына кайтуу",
    "uz": "Kirish sahifasiga qaytish",
    "en": "Back to sign in",
    "kk": "Кіру бетіне қайту"
  },
  "Переключить меню": {
    "ky": "Менюну ачуу же жабуу",
    "uz": "Menyuni ochish yoki yopish",
    "en": "Toggle menu",
    "kk": "Мәзірді ашу немесе жабу"
  },
  "Город": {
    "ky": "Шаар",
    "uz": "Shahar",
    "en": "City",
    "kk": "Қала"
  },
  "Светлая тема": {
    "ky": "Жарык тема",
    "uz": "Yorug‘ mavzu",
    "en": "Light theme",
    "kk": "Ашық тақырып"
  },
  "Тёмная тема": {
    "ky": "Караңгы тема",
    "uz": "Tungi mavzu",
    "en": "Dark theme",
    "kk": "Қараңғы тақырып"
  },
  "Рабочая область": {
    "ky": "Иш аймагы",
    "uz": "Ish maydoni",
    "en": "Workspace",
    "kk": "Жұмыс аймағы"
  },
  "Нет доступа к разделу": {
    "ky": "Бөлүмгө кирүүгө уруксат жок",
    "uz": "Bo‘limga kirish huquqi yo‘q",
    "en": "No access to this section",
    "kk": "Бөлімге кіруге рұқсат жоқ"
  },
  "Обратитесь к владельцу, если этот раздел нужен для работы.": {
    "ky": "Бул бөлүм жумушка керек болсо, ээсине кайрылыңыз.",
    "uz": "Bu bo‘lim ish uchun kerak bo‘lsa, egasiga murojaat qiling.",
    "en": "Contact the owner if you need this section for your work.",
    "kk": "Бұл бөлім жұмысқа қажет болса, иесіне хабарласыңыз."
  },
  "Открыть доступный раздел": {
    "ky": "Жеткиликтүү бөлүмдү ачуу",
    "uz": "Mavjud bo‘limni ochish",
    "en": "Open an available section",
    "kk": "Қолжетімді бөлімді ашу"
  },
  "Поиск раздела": {
    "ky": "Бөлүм издөө",
    "uz": "Bo‘lim qidirish",
    "en": "Search sections",
    "kk": "Бөлімді іздеу"
  },
  "Поиск раздела…": {
    "ky": "Бөлүм издөө…",
    "uz": "Bo‘lim qidirish…",
    "en": "Search sections…",
    "kk": "Бөлімді іздеу…"
  },
  "Введите название и выберите раздел": {
    "ky": "Аталышын киргизип, бөлүмдү тандаңыз",
    "uz": "Nomini kiriting va bo‘limni tanlang",
    "en": "Enter a name and select a section",
    "kk": "Атауын енгізіп, бөлімді таңдаңыз"
  },
  "Найти раздел…": {
    "ky": "Бөлүм табуу…",
    "uz": "Bo‘limni topish…",
    "en": "Find a section…",
    "kk": "Бөлімді табу…"
  },
  "Раздел не найден.": {
    "ky": "Бөлүм табылган жок.",
    "uz": "Bo‘lim topilmadi.",
    "en": "No sections found.",
    "kk": "Бөлім табылмады."
  },
  "Подтвердить действие?": {
    "ky": "Аракетти ырастайсызбы?",
    "uz": "Amalni tasdiqlaysizmi?",
    "en": "Confirm this action?",
    "kk": "Әрекетті растайсыз ба?"
  },
  "Нет": {
    "ky": "Жок",
    "uz": "Yo‘q",
    "en": "No",
    "kk": "Жоқ"
  },
  "Да": {
    "ky": "Ооба",
    "uz": "Ha",
    "en": "Yes",
    "kk": "Иә"
  },
  "Не удалось войти": {
    "ky": "Кирүү мүмкүн болгон жок",
    "uz": "Tizimga kirib bo‘lmadi",
    "en": "Could not sign in",
    "kk": "Жүйеге кіру мүмкін болмады"
  },
  "Накта суши": {
    "ky": "Накта суши",
    "uz": "Nakta Sushi",
    "en": "Nakta Sushi",
    "kk": "Накта суши"
  },
  "Создать первого владельца": {
    "ky": "Биринчи ээсин түзүү",
    "uz": "Birinchi egani yaratish",
    "en": "Create the first owner",
    "kk": "Алғашқы иесін құру"
  },
  "Вход в панель": {
    "ky": "Панелге кирүү",
    "uz": "Panelga kirish",
    "en": "Admin sign in",
    "kk": "Панельге кіру"
  },
  "Создайте учётную запись владельца для начала работы.": {
    "ky": "Ишти баштоо үчүн ээсинин аккаунтун түзүңүз.",
    "uz": "Ishni boshlash uchun egasining hisobini yarating.",
    "en": "Create an owner account to get started.",
    "kk": "Жұмысты бастау үшін иесінің тіркелгісін құрыңыз."
  },
  "Имя": {
    "ky": "Аты",
    "uz": "Ism",
    "en": "Name",
    "kk": "Аты"
  },
  "Ключ настройки": {
    "ky": "Орнотуу ачкычы",
    "uz": "Sozlash kaliti",
    "en": "Setup key",
    "kk": "Баптау кілті"
  },
  "Логин": {
    "ky": "Логин",
    "uz": "Login",
    "en": "Username",
    "kk": "Логин"
  },
  "Пароль": {
    "ky": "Сырсөз",
    "uz": "Parol",
    "en": "Password",
    "kk": "Құпиясөз"
  },
  "Проверяем…": {
    "ky": "Текшерилүүдө…",
    "uz": "Tekshirilmoqda…",
    "en": "Checking…",
    "kk": "Тексерілуде…"
  },
  "Создать владельца": {
    "ky": "Ээсин түзүү",
    "uz": "Egani yaratish",
    "en": "Create owner",
    "kk": "Иесін құру"
  },
  "Войти": {
    "ky": "Кирүү",
    "uz": "Kirish",
    "en": "Sign in",
    "kk": "Кіру"
  },
  "Обзор": {
    "ky": "Жалпы көрүнүш",
    "uz": "Umumiy ko‘rinish",
    "en": "Overview",
    "kk": "Шолу"
  },
  "Сегодня в вашем бизнесе": {
    "ky": "Бүгүнкү иш көрсөткүчтөрү",
    "uz": "Bugungi biznes ko‘rsatkichlari",
    "en": "Your business today",
    "kk": "Бүгінгі бизнес көрсеткіштері"
  },
  "Заказы": {
    "ky": "Буйрутмалар",
    "uz": "Buyurtmalar",
    "en": "Orders",
    "kk": "Тапсырыстар"
  },
  "Приём и обработка заказов": {
    "ky": "Буйрутмаларды кабыл алуу жана иштетүү",
    "uz": "Buyurtmalarni qabul qilish va qayta ishlash",
    "en": "Receive and process orders",
    "kk": "Тапсырыстарды қабылдау және өңдеу"
  },
  "Пользователи": {
    "ky": "Колдонуучулар",
    "uz": "Foydalanuvchilar",
    "en": "Users",
    "kk": "Пайдаланушылар"
  },
  "Клиенты и история заказов": {
    "ky": "Кардарлар жана буйрутмалардын таржымалы",
    "uz": "Mijozlar va buyurtmalar tarixi",
    "en": "Customers and order history",
    "kk": "Клиенттер және тапсырыстар тарихы"
  },
  "Товары": {
    "ky": "Товарлар",
    "uz": "Mahsulotlar",
    "en": "Products",
    "kk": "Тауарлар"
  },
  "Блюда, цены и доступность": {
    "ky": "Тамактар, баалар жана жеткиликтүүлүк",
    "uz": "Taomlar, narxlar va mavjudlik",
    "en": "Dishes, prices and availability",
    "kk": "Тағамдар, бағалар және қолжетімділік"
  },
  "Категории": {
    "ky": "Категориялар",
    "uz": "Toifalar",
    "en": "Categories",
    "kk": "Санаттар"
  },
  "Организация меню": {
    "ky": "Менюнун түзүлүшү",
    "uz": "Menyu tuzilishi",
    "en": "Menu organisation",
    "kk": "Мәзір құрылымы"
  },
  "Модификаторы": {
    "ky": "Модификаторлор",
    "uz": "Modifikatorlar",
    "en": "Modifiers",
    "kk": "Модификаторлар"
  },
  "Варианты выбора и дополнения": {
    "ky": "Тандоо варианттары жана кошумчалар",
    "uz": "Tanlov variantlari va qo‘shimchalar",
    "en": "Choices and add-ons",
    "kk": "Таңдау нұсқалары мен қосымшалар"
  },
  "Комплектации": {
    "ky": "Комплектациялар",
    "uz": "To‘plam tarkibi",
    "en": "Included items",
    "kk": "Жинақ құрамы"
  },
  "Что входит в каждое блюдо": {
    "ky": "Ар бир тамакка эмне кирет",
    "uz": "Har bir taomga nimalar kiradi",
    "en": "What comes with each dish",
    "kk": "Әр тағамға не кіреді"
  },
  "Акции": {
    "ky": "Акциялар",
    "uz": "Aksiyalar",
    "en": "Promotions",
    "kk": "Акциялар"
  },
  "Предложения для покупателей": {
    "ky": "Кардарлар үчүн сунуштар",
    "uz": "Xaridorlar uchun takliflar",
    "en": "Customer offers",
    "kk": "Клиенттерге арналған ұсыныстар"
  },
  "Аналитика": {
    "ky": "Аналитика",
    "uz": "Tahlil",
    "en": "Analytics",
    "kk": "Талдау"
  },
  "Продажи и показатели бизнеса": {
    "ky": "Сатуулар жана иш көрсөткүчтөрү",
    "uz": "Savdo va biznes ko‘rsatkichlari",
    "en": "Sales and business metrics",
    "kk": "Сатылымдар және бизнес көрсеткіштері"
  },
  "Города": {
    "ky": "Шаарлар",
    "uz": "Shaharlar",
    "en": "Cities",
    "kk": "Қалалар"
  },
  "Города и доступность сервиса": {
    "ky": "Шаарлар жана кызматтын жеткиликтүүлүгү",
    "uz": "Shaharlar va xizmat mavjudligi",
    "en": "Cities and service availability",
    "kk": "Қалалар және қызметтің қолжетімділігі"
  },
  "Время работы": {
    "ky": "Иш убактысы",
    "uz": "Ish vaqti",
    "en": "Business hours",
    "kk": "Жұмыс уақыты"
  },
  "Расписание и условия доставки": {
    "ky": "Жеткирүү графиги жана шарттары",
    "uz": "Yetkazish jadvali va shartlari",
    "en": "Schedule and delivery terms",
    "kk": "Жеткізу кестесі мен шарттары"
  },
  "Персонал": {
    "ky": "Кызматкерлер",
    "uz": "Xodimlar",
    "en": "Staff",
    "kk": "Қызметкерлер"
  },
  "Сотрудники и права доступа": {
    "ky": "Кызматкерлер жана кирүү укуктары",
    "uz": "Xodimlar va kirish huquqlari",
    "en": "Staff and permissions",
    "kk": "Қызметкерлер және кіру құқықтары"
  },
  "Настройки": {
    "ky": "Жөндөөлөр",
    "uz": "Sozlamalar",
    "en": "Settings",
    "kk": "Баптаулар"
  },
  "Параметры сервиса и интеграции": {
    "ky": "Кызматтын жана интеграциялардын параметрлери",
    "uz": "Xizmat va integratsiya sozlamalari",
    "en": "Service and integration settings",
    "kk": "Қызмет пен интеграция баптаулары"
  },
  "Мой профиль": {
    "ky": "Менин профилим",
    "uz": "Mening profilim",
    "en": "My profile",
    "kk": "Менің профилім"
  },
  "Учётная запись и устройства": {
    "ky": "Аккаунт жана түзмөктөр",
    "uz": "Hisob va qurilmalar",
    "en": "Account and devices",
    "kk": "Тіркелгі және құрылғылар"
  },
  "Панель управления": {
    "ky": "Башкаруу панели",
    "uz": "Boshqaruv paneli",
    "en": "Admin panel",
    "kk": "Басқару панелі"
  },
  "Меню аккаунта": {
    "ky": "Аккаунт менюсу",
    "uz": "Hisob menyusi",
    "en": "Account menu",
    "kk": "Тіркелгі мәзірі"
  },
  "Владелец": {
    "ky": "Ээси",
    "uz": "Egasi",
    "en": "Owner",
    "kk": "Иесі"
  },
  "Администратор": {
    "ky": "Администратор",
    "uz": "Administrator",
    "en": "Administrator",
    "kk": "Әкімші"
  },
  "Менеджер": {
    "ky": "Менеджер",
    "uz": "Menejer",
    "en": "Manager",
    "kk": "Менеджер"
  },
  "Выйти": {
    "ky": "Чыгуу",
    "uz": "Chiqish",
    "en": "Sign out",
    "kk": "Шығу"
  },
  "Сегодня": {
    "ky": "Бүгүн",
    "uz": "Bugun",
    "en": "Today",
    "kk": "Бүгін"
  },
  "Неделя": {
    "ky": "Апта",
    "uz": "Hafta",
    "en": "Week",
    "kk": "Апта"
  },
  "Месяц": {
    "ky": "Ай",
    "uz": "Oy",
    "en": "Month",
    "kk": "Ай"
  },
  "За всё время": {
    "ky": "Бардык убакыт",
    "uz": "Barcha vaqt",
    "en": "All time",
    "kk": "Барлық уақыт"
  },
  "Период": {
    "ky": "Мезгил",
    "uz": "Davr",
    "en": "Period",
    "kk": "Кезең"
  },
  "Выбор дат": {
    "ky": "Күндөрдү тандоо",
    "uz": "Sanalarni tanlash",
    "en": "Select dates",
    "kk": "Күндерді таңдау"
  },
  "С даты": {
    "ky": "Башталган күн",
    "uz": "Boshlanish sanasi",
    "en": "From date",
    "kk": "Басталу күні"
  },
  "По дату": {
    "ky": "Аяктаган күн",
    "uz": "Tugash sanasi",
    "en": "To date",
    "kk": "Аяқталу күні"
  },
  "С": {
    "ky": "Баштап",
    "uz": "Dan",
    "en": "From",
    "kk": "Бастап"
  },
  "По": {
    "ky": "Чейин",
    "uz": "Gacha",
    "en": "To",
    "kk": "Дейін"
  },
  "{0} сом": {
    "ky": "{0} сом",
    "uz": "{0} som",
    "en": "{0} KGS",
    "kk": "{0} сом"
  },
  "Новые": {
    "ky": "Жаңы",
    "uz": "Yangi",
    "en": "New",
    "kk": "Жаңа"
  },
  "Подтверждены": {
    "ky": "Ырасталган",
    "uz": "Tasdiqlangan",
    "en": "Confirmed",
    "kk": "Расталған"
  },
  "Готовятся": {
    "ky": "Даярдалууда",
    "uz": "Tayyorlanmoqda",
    "en": "Preparing",
    "kk": "Дайындалуда"
  },
  "Готовы": {
    "ky": "Даяр",
    "uz": "Tayyor",
    "en": "Ready",
    "kk": "Дайын"
  },
  "В пути": {
    "ky": "Жолдо",
    "uz": "Yo‘lda",
    "en": "On the way",
    "kk": "Жолда"
  },
  "Завершены": {
    "ky": "Аяктаган",
    "uz": "Yakunlangan",
    "en": "Completed",
    "kk": "Аяқталған"
  },
  "Отменены": {
    "ky": "Жокко чыгарылган",
    "uz": "Bekor qilingan",
    "en": "Cancelled",
    "kk": "Бас тартылған"
  },
  "Не удалось загрузить отчёт": {
    "ky": "Отчёт жүктөлгөн жок",
    "uz": "Hisobotni yuklab bo‘lmadi",
    "en": "Could not load report",
    "kk": "Есепті жүктеу мүмкін болмады"
  },
  "Не удалось экспортировать отчёт": {
    "ky": "Отчёт экспорттолгон жок",
    "uz": "Hisobotni eksport qilib bo‘lmadi",
    "en": "Could not export report",
    "kk": "Есепті экспорттау мүмкін болмады"
  },
  "Обновляем…": {
    "ky": "Жаңыртылууда…",
    "uz": "Yangilanmoqda…",
    "en": "Updating…",
    "kk": "Жаңартылуда…"
  },
  "Подготовка…": {
    "ky": "Даярдалууда…",
    "uz": "Tayyorlanmoqda…",
    "en": "Preparing…",
    "kk": "Дайындалуда…"
  },
  "Экспорт CSV": {
    "ky": "CSV экспорттоо",
    "uz": "CSV eksporti",
    "en": "Export CSV",
    "kk": "CSV экспорттау"
  },
  "Заказов создано": {
    "ky": "Түзүлгөн буйрутмалар",
    "uz": "Yaratilgan buyurtmalar",
    "en": "Orders created",
    "kk": "Құрылған тапсырыстар"
  },
  "Все статусы": {
    "ky": "Бардык статустар",
    "uz": "Barcha holatlar",
    "en": "All statuses",
    "kk": "Барлық күйлер"
  },
  "Выручка": {
    "ky": "Түшүм",
    "uz": "Tushum",
    "en": "Revenue",
    "kk": "Түсім"
  },
  "Завершённые заказы": {
    "ky": "Аяктаган буйрутмалар",
    "uz": "Yakunlangan buyurtmalar",
    "en": "Completed orders",
    "kk": "Аяқталған тапсырыстар"
  },
  "Средний чек": {
    "ky": "Орточо чек",
    "uz": "O‘rtacha chek",
    "en": "Average order value",
    "kk": "Орташа чек"
  },
  "По завершённым заказам": {
    "ky": "Аяктаган буйрутмалар боюнча",
    "uz": "Yakunlangan buyurtmalar bo‘yicha",
    "en": "Based on completed orders",
    "kk": "Аяқталған тапсырыстар бойынша"
  },
  "Заказов завершено": {
    "ky": "Аяктаган буйрутмалардын саны",
    "uz": "Yakunlangan buyurtmalar soni",
    "en": "Orders completed",
    "kk": "Аяқталған тапсырыстар саны"
  },
  "По времени завершения": {
    "ky": "Аяктоо убактысы боюнча",
    "uz": "Yakunlash vaqti bo‘yicha",
    "en": "By completion time",
    "kk": "Аяқталу уақыты бойынша"
  },
  "В предыдущем периоде — 0": {
    "ky": "Мурунку мезгилде — 0",
    "uz": "Oldingi davrda — 0",
    "en": "Previous period: 0",
    "kk": "Алдыңғы кезеңде — 0"
  },
  "Сравнение с предыдущим периодом": {
    "ky": "Мурунку мезгил менен салыштыруу",
    "uz": "Oldingi davr bilan taqqoslash",
    "en": "Compared with the previous period",
    "kk": "Алдыңғы кезеңмен салыстыру"
  },
  "Сравнение с": {
    "ky": "Салыштыруу:",
    "uz": "Taqqoslash:",
    "en": "Compared with",
    "kk": "Салыстыру:"
  },
  ". Часовой пояс: Бишкек (UTC+6).": {
    "ky": ". Убакыт алкагы: Бишкек (UTC+6).",
    "uz": ". Vaqt mintaqasi: Bishkek (UTC+6).",
    "en": ". Time zone: Bishkek (UTC+6).",
    "kk": ". Уақыт белдеуі: Бішкек (UTC+6)."
  },
  "Динамика выручки": {
    "ky": "Түшүмдүн өзгөрүшү",
    "uz": "Tushum dinamikasi",
    "en": "Revenue trend",
    "kk": "Түсім динамикасы"
  },
  "Сумма завершённых заказов по дням": {
    "ky": "Аяктаган буйрутмалардын күнүмдүк суммасы",
    "uz": "Yakunlangan buyurtmalarning kunlik summasi",
    "en": "Daily totals of completed orders",
    "kk": "Аяқталған тапсырыстардың күндік сомасы"
  },
  "Выручка по дням": {
    "ky": "Күндөр боюнча түшүм",
    "uz": "Kunlar bo‘yicha tushum",
    "en": "Daily revenue",
    "kk": "Күндер бойынша түсім"
  },
  "Статусы заказов": {
    "ky": "Буйрутмалардын статустары",
    "uz": "Buyurtma holatlari",
    "en": "Order statuses",
    "kk": "Тапсырыс күйлері"
  },
  "Заказы, созданные за выбранный период": {
    "ky": "Тандалган мезгилде түзүлгөн буйрутмалар",
    "uz": "Tanlangan davrda yaratilgan buyurtmalar",
    "en": "Orders created in the selected period",
    "kk": "Таңдалған кезеңде құрылған тапсырыстар"
  },
  "Другой статус": {
    "ky": "Башка статус",
    "uz": "Boshqa holat",
    "en": "Other status",
    "kk": "Басқа күй"
  },
  "Заказов за этот период нет.": {
    "ky": "Бул мезгилде буйрутмалар жок.",
    "uz": "Bu davrda buyurtmalar yo‘q.",
    "en": "No orders in this period.",
    "kk": "Бұл кезеңде тапсырыстар жоқ."
  },
  "Завершение заказов по часам": {
    "ky": "Буйрутмалардын сааттар боюнча аякташы",
    "uz": "Buyurtmalarni soatlar bo‘yicha yakunlash",
    "en": "Order completions by hour",
    "kk": "Тапсырыстардың сағаттар бойынша аяқталуы"
  },
  "Завершённые заказы по часам": {
    "ky": "Сааттар боюнча аяктаган буйрутмалар",
    "uz": "Soatlar bo‘yicha yakunlangan buyurtmalar",
    "en": "Completed orders by hour",
    "kk": "Сағаттар бойынша аяқталған тапсырыстар"
  },
  "Заказов": {
    "ky": "Буйрутмалар",
    "uz": "Buyurtmalar",
    "en": "Orders",
    "kk": "Тапсырыстар"
  },
  "Клиенты и отмены": {
    "ky": "Кардарлар жана жокко чыгаруулар",
    "uz": "Mijozlar va bekor qilishlar",
    "en": "Customers and cancellations",
    "kk": "Клиенттер және бас тартулар"
  },
  "Новые клиенты": {
    "ky": "Жаңы кардарлар",
    "uz": "Yangi mijozlar",
    "en": "New customers",
    "kk": "Жаңа клиенттер"
  },
  "Повторные клиенты": {
    "ky": "Кайра келген кардарлар",
    "uz": "Takroriy mijozlar",
    "en": "Returning customers",
    "kk": "Қайта келген клиенттер"
  },
  "Отменённые заказы": {
    "ky": "Жокко чыгарылган буйрутмалар",
    "uz": "Bekor qilingan buyurtmalar",
    "en": "Cancelled orders",
    "kk": "Бас тартылған тапсырыстар"
  },
  "Возвраты и себестоимость не учитываются в текущей системе.": {
    "ky": "Бул системада кайтаруулар жана өздүк нарк эсептелбейт.",
    "uz": "Bu tizimda qaytarishlar va tannarx hisobga olinmaydi.",
    "en": "Returns and cost of goods are not tracked in this system.",
    "kk": "Бұл жүйеде қайтарымдар мен өзіндік құн есептелмейді."
  },
  "Что выбирают гости": {
    "ky": "Кардарлардын тандоосу",
    "uz": "Mijozlar tanlovi",
    "en": "Customer favourites",
    "kk": "Клиенттердің таңдауы"
  },
  "До 50 самых популярных позиций. Суммы позиций включают доплаты, до общей скидки заказа.": {
    "ky": "Эң популярдуу 50гө чейин позиция. Суммаларга кошумча төлөмдөр кирет, бирок буйрутманын жалпы арзандатуусу кирбейт.",
    "uz": "Eng ommabop 50 tagacha mahsulot. Summalar qo‘shimcha to‘lovlarni o‘z ichiga oladi, buyurtmaning umumiy chegirmasini emas.",
    "en": "Up to 50 popular items. Totals include add-ons, before the overall order discount.",
    "kk": "Ең танымал 50 позицияға дейін. Сомаларға қосымша төлемдер кіреді, бірақ тапсырыстың жалпы жеңілдігі кірмейді."
  },
  "Название": {
    "ky": "Аталышы",
    "uz": "Nomi",
    "en": "Name",
    "kk": "Атауы"
  },
  "Количество": {
    "ky": "Саны",
    "uz": "Miqdori",
    "en": "Quantity",
    "kk": "Саны"
  },
  "Сумма": {
    "ky": "Сумма",
    "uz": "Summa",
    "en": "Amount",
    "kk": "Сома"
  },
  "Нет продаж за этот период.": {
    "ky": "Бул мезгилде сатуу болгон жок.",
    "uz": "Bu davrda savdo bo‘lmagan.",
    "en": "No sales in this period.",
    "kk": "Бұл кезеңде сатылымдар болмаған."
  },
  "Категории сохраняются в новых заказах после обновления. Для старых заказов категория не восстанавливается по текущему каталогу.": {
    "ky": "Жаңыртуудан кийин категориялар жаңы буйрутмаларда сакталат. Эски буйрутмалардын категориялары учурдагы каталогдон калыбына келтирилбейт.",
    "uz": "Yangilanishdan keyin toifalar yangi buyurtmalarda saqlanadi. Eski buyurtmalar toifalari joriy katalogdan tiklanmaydi.",
    "en": "Categories are stored on new orders after the update. Old order categories are not reconstructed from the current catalogue.",
    "kk": "Жаңартудан кейін санаттар жаңа тапсырыстарда сақталады. Ескі тапсырыстардың санаттары қазіргі каталогтан қалпына келтірілмейді."
  },
  "Работа команды": {
    "ky": "Команданын иши",
    "uz": "Jamoa faoliyati",
    "en": "Team activity",
    "kk": "Команда жұмысы"
  },
  "Учёт с {0}": {
    "ky": "Эсеп {0} күнүнөн башталат",
    "uz": "Hisob {0} dan boshlangan",
    "en": "Recorded since {0}",
    "kk": "Есеп {0} күнінен басталады"
  },
  "Учёт действий только начат": {
    "ky": "Аракеттерди эсептөө жаңы башталды",
    "uz": "Amallarni hisobga olish endi boshlandi",
    "en": "Activity tracking has just started",
    "kk": "Әрекеттерді есепке алу енді басталды"
  },
  ". Только подтверждённые действия сотрудников.": {
    "ky": ". Кызматкерлердин ырасталган аракеттери гана.",
    "uz": ". Faqat xodimlarning tasdiqlangan amallari.",
    "en": ". Confirmed staff actions only.",
    "kk": ". Тек қызметкерлердің расталған әрекеттері."
  },
  "Сотрудник": {
    "ky": "Кызматкер",
    "uz": "Xodim",
    "en": "Staff member",
    "kk": "Қызметкер"
  },
  "Смены статуса": {
    "ky": "Статус өзгөртүүлөрү",
    "uz": "Holat o‘zgarishlari",
    "en": "Status changes",
    "kk": "Күй өзгерістері"
  },
  "Завершено вручную": {
    "ky": "Кол менен аяктаган",
    "uz": "Qo‘lda yakunlangan",
    "en": "Manually completed",
    "kk": "Қолмен аяқталған"
  },
  "Действий за этот период нет.": {
    "ky": "Бул мезгилде аракеттер жок.",
    "uz": "Bu davrda amallar yo‘q.",
    "en": "No activity in this period.",
    "kk": "Бұл кезеңде әрекеттер жоқ."
  },
  "Автоматические изменения кухни не приписываются сотрудникам. История до включения журнала не восстанавливается.": {
    "ky": "Ашкананын автоматтык өзгөртүүлөрү кызматкерлерге жазылбайт. Журнал иштетилгенге чейинки таржымал калыбына келтирилбейт.",
    "uz": "Oshxonaning avtomatik o‘zgarishlari xodimlarga yozilmaydi. Jurnal yoqilishidan oldingi tarix tiklanmaydi.",
    "en": "Automatic kitchen changes are not attributed to staff. Activity before logging began is not reconstructed.",
    "kk": "Асүйдің автоматты өзгерістері қызметкерлерге жазылмайды. Журнал қосылғанға дейінгі тарих қалпына келтірілмейді."
  },
  "Как считаются показатели": {
    "ky": "Көрсөткүчтөр кантип эсептелет",
    "uz": "Ko‘rsatkichlar qanday hisoblanadi",
    "en": "How metrics are calculated",
    "kk": "Көрсеткіштер қалай есептеледі"
  },
  "Выручка — сумма итогов завершённых заказов по времени завершения. Итог берётся из сохранённого заказа; отмены не включаются. Для старых записей без времени завершения используется время последнего обновления.": {
    "ky": "Түшүм аяктаган буйрутмалардын жыйынтык суммасынан аяктоо убактысы боюнча эсептелет. Сакталган буйрутманын суммасы алынат; жокко чыгарылган буйрутмалар кирбейт. Эски жазууда аяктоо убактысы жок болсо, акыркы жаңыртуу убактысы колдонулат.",
    "uz": "Tushum yakunlangan buyurtmalar jami summasidan yakunlash vaqti bo‘yicha hisoblanadi. Saqlangan summa olinadi; bekor qilinganlar kiritilmaydi. Eski yozuvda yakunlash vaqti bo‘lmasa, oxirgi yangilanish vaqti ishlatiladi.",
    "en": "Revenue is the total of completed orders by completion time, using their saved totals and excluding cancellations. For old records without a completion time, the last update time is used.",
    "kk": "Түсім аяқталған тапсырыстардың сақталған қорытынды сомасынан аяқталу уақыты бойынша есептеледі. Бас тартылғандар кірмейді. Ескі жазбада аяқталу уақыты болмаса, соңғы жаңарту уақыты қолданылады."
  },
  "Средний чек — выручка / число завершённых заказов. Количество созданных заказов и распределение статусов считаются по дате создания, поэтому могут отличаться от числа завершённых.": {
    "ky": "Орточо чек — түшүмдү аяктаган буйрутмалардын санына бөлүү. Түзүлгөн буйрутмалар жана статустар түзүлгөн күн боюнча эсептелет, ошондуктан аяктаган буйрутмалардын санынан айырмаланышы мүмкүн.",
    "uz": "O‘rtacha chek — tushumning yakunlangan buyurtmalar soniga nisbati. Yaratilgan buyurtmalar va holatlar yaratilish sanasi bo‘yicha hisoblanadi, shuning uchun yakunlanganlar sonidan farq qilishi mumkin.",
    "en": "Average order value is revenue divided by completed orders. Created orders and status totals use creation dates, so they may differ from completed-order counts.",
    "kk": "Орташа чек — түсімді аяқталған тапсырыстар санына бөлу. Құрылған тапсырыстар мен күйлер құрылу күні бойынша есептеледі, сондықтан аяқталған тапсырыстар санынан өзгеше болуы мүмкін."
  },
  "Новый клиент — номер телефона с первым заказом в выбранном городе за период. Повторный — первый заказ был раньше периода. Возвраты и прибыль не рассчитываются: отдельных данных для них нет.": {
    "ky": "Жаңы кардар — ушул шаарда биринчи буйрутмасын тандалган мезгилде берген телефон номери. Кайра келген кардардын биринчи буйрутмасы мурда берилген. Кайтаруулар жана пайда эсептелбейт: алар үчүн өзүнчө маалымат жок.",
    "uz": "Yangi mijoz — shu shahardagi birinchi buyurtmasi tanlangan davrga to‘g‘ri kelgan telefon raqami. Takroriy mijozning ilk buyurtmasi oldinroq bo‘lgan. Qaytarish va foyda hisoblanmaydi: alohida ma’lumot yo‘q.",
    "en": "A new customer is a phone number placing its first order in the selected city during the period. A returning customer's first order predates the period. Returns and profit are not calculated because separate data is unavailable.",
    "kk": "Жаңа клиент — осы қаладағы алғашқы тапсырысы таңдалған кезеңге түскен телефон нөмірі. Қайта келген клиенттің алғашқы тапсырысы бұрынырақ берілген. Қайтарымдар мен пайда есептелмейді: бөлек деректер жоқ."
  },
  "Не удалось загрузить категории": {
    "ky": "Категориялар жүктөлгөн жок",
    "uz": "Toifalarni yuklab bo‘lmadi",
    "en": "Could not load categories",
    "kk": "Санаттарды жүктеу мүмкін болмады"
  },
  "Загрузите изображение категории": {
    "ky": "Категориянын сүрөтүн жүктөңүз",
    "uz": "Toifa rasmini yuklang",
    "en": "Upload a category image",
    "kk": "Санат суретін жүктеңіз"
  },
  "Категория обновлена": {
    "ky": "Категория жаңыртылды",
    "uz": "Toifa yangilandi",
    "en": "Category updated",
    "kk": "Санат жаңартылды"
  },
  "Категория добавлена": {
    "ky": "Категория кошулду",
    "uz": "Toifa qo‘shildi",
    "en": "Category added",
    "kk": "Санат қосылды"
  },
  "Не удалось сохранить категорию": {
    "ky": "Категория сакталган жок",
    "uz": "Toifani saqlab bo‘lmadi",
    "en": "Could not save category",
    "kk": "Санатты сақтау мүмкін болмады"
  },
  "Сначала переместите блюда ({0}) в другую категорию. Категорию с блюдами удалить нельзя.": {
    "ky": "Адегенде {0} тамакты башка категорияга жылдырыңыз. Тамактары бар категорияны өчүрүүгө болбойт.",
    "uz": "Avval {0} ta taomni boshqa toifaga ko‘chiring. Taomlari bor toifani o‘chirib bo‘lmaydi.",
    "en": "Move the {0} dishes to another category first. A category containing dishes cannot be deleted.",
    "kk": "Алдымен {0} тағамды басқа санатқа ауыстырыңыз. Тағамдары бар санатты жоюға болмайды."
  },
  "Категория будет удалена из меню всех городов, использующих этот каталог.": {
    "ky": "Категория бул каталогду колдонгон бардык шаарлардын менюсунан өчүрүлөт.",
    "uz": "Toifa ushbu katalogdan foydalanuvchi barcha shaharlar menyusidan o‘chiriladi.",
    "en": "The category will be removed from all cities using this catalogue.",
    "kk": "Санат осы каталогты пайдаланатын барлық қалалардың мәзірінен жойылады."
  },
  "Удалить категорию «{0}» полностью? {1} История заказов сохранится. Отменить удаление нельзя.": {
    "ky": "«{0}» категориясын толук өчүрөсүзбү? {1} Буйрутмалардын таржымалы сакталат. Өчүрүүнү жокко чыгарууга болбойт.",
    "uz": "«{0}» toifasini butunlay o‘chirasizmi? {1} Buyurtmalar tarixi saqlanadi. O‘chirishni bekor qilib bo‘lmaydi.",
    "en": "Permanently delete category “{0}”? {1} Order history will be kept. This cannot be undone.",
    "kk": "«{0}» санатын толығымен жоясыз ба? {1} Тапсырыстар тарихы сақталады. Жоюды болдырмау мүмкін емес."
  },
  "Категория удалена": {
    "ky": "Категория өчүрүлдү",
    "uz": "Toifa o‘chirildi",
    "en": "Category deleted",
    "kk": "Санат жойылды"
  },
  "Не удалось удалить категорию": {
    "ky": "Категория өчүрүлгөн жок",
    "uz": "Toifani o‘chirib bo‘lmadi",
    "en": "Could not delete category",
    "kk": "Санатты жою мүмкін болмады"
  },
  "Загружаем категории…": {
    "ky": "Категориялар жүктөлүүдө…",
    "uz": "Toifalar yuklanmoqda…",
    "en": "Loading categories…",
    "kk": "Санаттар жүктелуде…"
  },
  "Категории меню": {
    "ky": "Меню категориялары",
    "uz": "Menyu toifalari",
    "en": "Menu categories",
    "kk": "Мәзір санаттары"
  },
  "Добавить категорию": {
    "ky": "Категория кошуу",
    "uz": "Toifa qo‘shish",
    "en": "Add category",
    "kk": "Санат қосу"
  },
  "Найти категорию": {
    "ky": "Категория табуу",
    "uz": "Toifani topish",
    "en": "Find a category",
    "kk": "Санатты табу"
  },
  "Поиск категорий": {
    "ky": "Категорияларды издөө",
    "uz": "Toifalarni qidirish",
    "en": "Search categories",
    "kk": "Санаттарды іздеу"
  },
  "Повторить загрузку": {
    "ky": "Кайра жүктөө",
    "uz": "Qayta yuklash",
    "en": "Retry loading",
    "kk": "Қайта жүктеу"
  },
  "блюд · позиция": {
    "ky": "тамак · орун",
    "uz": "taom · tartib",
    "en": "dishes · position",
    "kk": "тағам · орын"
  },
  "категорию": {
    "ky": "категорияны",
    "uz": "toifani",
    "en": "category",
    "kk": "санатты"
  },
  "Добавьте первую категорию": {
    "ky": "Биринчи категорияны кошуңуз",
    "uz": "Birinchi toifani qo‘shing",
    "en": "Add your first category",
    "kk": "Алғашқы санатты қосыңыз"
  },
  "После этого в неё можно будет добавить блюда.": {
    "ky": "Андан кийин ага тамактарды кошо аласыз.",
    "uz": "Keyin unga taomlarni qo‘shishingiz mumkin.",
    "en": "You can then add dishes to it.",
    "kk": "Содан кейін оған тағамдарды қоса аласыз."
  },
  "Редактировать категорию": {
    "ky": "Категорияны түзөтүү",
    "uz": "Toifani tahrirlash",
    "en": "Edit category",
    "kk": "Санатты өңдеу"
  },
  "Новая категория": {
    "ky": "Жаңы категория",
    "uz": "Yangi toifa",
    "en": "New category",
    "kk": "Жаңа санат"
  },
  "Обложка категории": {
    "ky": "Категориянын мукабасы",
    "uz": "Toifa muqovasi",
    "en": "Category cover",
    "kk": "Санат мұқабасы"
  },
  "Рекомендуемый размер — 1200 × 600 px.": {
    "ky": "Сунушталган өлчөм — 1200 × 600 px.",
    "uz": "Tavsiya etilgan o‘lcham — 1200 × 600 px.",
    "en": "Recommended size: 1200 × 600 px.",
    "kk": "Ұсынылатын өлшем — 1200 × 600 px."
  },
  "Порядок отображения": {
    "ky": "Көрсөтүү тартиби",
    "uz": "Ko‘rsatish tartibi",
    "en": "Display order",
    "kk": "Көрсету реті"
  },
  "Категории с меньшим значением показаны первыми.": {
    "ky": "Мааниси кичине категориялар биринчи көрсөтүлөт.",
    "uz": "Qiymati kichik toifalar avval ko‘rsatiladi.",
    "en": "Categories with lower values appear first.",
    "kk": "Мәні кіші санаттар алдымен көрсетіледі."
  },
  "Отменить": {
    "ky": "Жокко чыгаруу",
    "uz": "Bekor qilish",
    "en": "Cancel",
    "kk": "Болдырмау"
  },
  "Сохраняем…": {
    "ky": "Сакталууда…",
    "uz": "Saqlanmoqda…",
    "en": "Saving…",
    "kk": "Сақталуда…"
  },
  "Сохранить категорию": {
    "ky": "Категорияны сактоо",
    "uz": "Toifani saqlash",
    "en": "Save category",
    "kk": "Санатты сақтау"
  },
  "Удалить город «{0}»? Удаление нельзя отменить. Города с заказами или собственным каталогом можно скрыть.": {
    "ky": "«{0}» шаарын өчүрөсүзбү? Өчүрүүнү жокко чыгарууга болбойт. Буйрутмалары же өз каталогу бар шаарды жашырсаңыз болот.",
    "uz": "«{0}» shahrini o‘chirasizmi? Buni bekor qilib bo‘lmaydi. Buyurtmalari yoki o‘z katalogi bor shaharni yashirish mumkin.",
    "en": "Delete city “{0}”? This cannot be undone. Cities with orders or their own catalogue can be hidden instead.",
    "kk": "«{0}» қаласын жоясыз ба? Мұны болдырмау мүмкін емес. Тапсырыстары немесе өз каталогы бар қаланы жасыруға болады."
  },
  "Город удалён": {
    "ky": "Шаар өчүрүлдү",
    "uz": "Shahar o‘chirildi",
    "en": "City deleted",
    "kk": "Қала жойылды"
  },
  "Не удалось удалить город": {
    "ky": "Шаар өчүрүлгөн жок",
    "uz": "Shaharni o‘chirib bo‘lmadi",
    "en": "Could not delete city",
    "kk": "Қаланы жою мүмкін болмады"
  },
  "Скрыть город «{0}»? Клиенты не смогут выбрать его для новых заказов.": {
    "ky": "«{0}» шаарын жашырасызбы? Кардарлар аны жаңы буйрутмалар үчүн тандай алышпайт.",
    "uz": "«{0}» shahrini yashirasizmi? Mijozlar uni yangi buyurtmalar uchun tanlay olmaydi.",
    "en": "Hide city “{0}”? Customers will not be able to select it for new orders.",
    "kk": "«{0}» қаласын жасырасыз ба? Клиенттер оны жаңа тапсырыстар үшін таңдай алмайды."
  },
  "Укажите название города и целое неотрицательное значение порядка": {
    "ky": "Шаардын атын жана тартип үчүн терс эмес бүтүн санды киргизиңиз",
    "uz": "Shahar nomi va tartib uchun manfiy bo‘lmagan butun sonni kiriting",
    "en": "Enter a city name and a non-negative whole number for its order",
    "kk": "Қала атауын және реті үшін теріс емес бүтін санды енгізіңіз"
  },
  "Город обновлён": {
    "ky": "Шаар жаңыртылды",
    "uz": "Shahar yangilandi",
    "en": "City updated",
    "kk": "Қала жаңартылды"
  },
  "Город добавлен. Настройте часы работы и доставку перед приёмом заказов.": {
    "ky": "Шаар кошулду. Буйрутмаларды кабыл алардан мурда иш убактысын жана жеткирүүнү жөндөңүз.",
    "uz": "Shahar qo‘shildi. Buyurtmalarni qabul qilishdan oldin ish vaqti va yetkazishni sozlang.",
    "en": "City added. Configure business hours and delivery before accepting orders.",
    "kk": "Қала қосылды. Тапсырыстарды қабылдамас бұрын жұмыс уақыты мен жеткізуді баптаңыз."
  },
  "Не удалось сохранить город": {
    "ky": "Шаар сакталган жок",
    "uz": "Shaharni saqlab bo‘lmadi",
    "en": "Could not save city",
    "kk": "Қаланы сақтау мүмкін болмады"
  },
  "Скрыть город «{0}»? Новые клиенты не смогут выбрать его для заказа.": {
    "ky": "«{0}» шаарын жашырасызбы? Жаңы кардарлар аны буйрутма үчүн тандай алышпайт.",
    "uz": "«{0}» shahrini yashirasizmi? Yangi mijozlar uni buyurtma uchun tanlay olmaydi.",
    "en": "Hide city “{0}”? New customers will not be able to select it for orders.",
    "kk": "«{0}» қаласын жасырасыз ба? Жаңа клиенттер оны тапсырыс үшін таңдай алмайды."
  },
  "Город «{0}» показан на сайте и в приложении": {
    "ky": "«{0}» шаары сайтта жана колдонмодо көрсөтүлөт",
    "uz": "«{0}» shahri sayt va ilovada ko‘rsatiladi",
    "en": "City “{0}” is visible on the website and app",
    "kk": "«{0}» қаласы сайт пен қолданбада көрсетіледі"
  },
  "Город «{0}» скрыт на сайте и в приложении": {
    "ky": "«{0}» шаары сайтта жана колдонмодо жашырылды",
    "uz": "«{0}» shahri sayt va ilovada yashirildi",
    "en": "City “{0}” is hidden on the website and app",
    "kk": "«{0}» қаласы сайт пен қолданбада жасырылды"
  },
  "Не удалось изменить видимость города": {
    "ky": "Шаардын көрүнүшүн өзгөртүү мүмкүн болгон жок",
    "uz": "Shahar ko‘rinishini o‘zgartirib bo‘lmadi",
    "en": "Could not change city visibility",
    "kk": "Қаланың көрінуін өзгерту мүмкін болмады"
  },
  "Добавить город": {
    "ky": "Шаар кошуу",
    "uz": "Shahar qo‘shish",
    "en": "Add city",
    "kk": "Қала қосу"
  },
  "Виден": {
    "ky": "Көрүнөт",
    "uz": "Ko‘rinadi",
    "en": "Visible",
    "kk": "Көрінеді"
  },
  "Скрыт": {
    "ky": "Жашырылган",
    "uz": "Yashirilgan",
    "en": "Hidden",
    "kk": "Жасырылған"
  },
  "город": {
    "ky": "шаарды",
    "uz": "shaharni",
    "en": "city",
    "kk": "қаланы"
  },
  "Скрыть": {
    "ky": "Жашыруу",
    "uz": "Yashirish",
    "en": "Hide",
    "kk": "Жасыру"
  },
  "Показать": {
    "ky": "Көрсөтүү",
    "uz": "Ko‘rsatish",
    "en": "Show",
    "kk": "Көрсету"
  },
  "{0} город {1}": {
    "ky": "{1} шаарын {0}",
    "uz": "{1} shahrini {0}",
    "en": "{0} city {1}",
    "kk": "{1} қаласын {0}"
  },
  "Городов пока нет.": {
    "ky": "Азырынча шаарлар жок.",
    "uz": "Hozircha shaharlar yo‘q.",
    "en": "No cities yet.",
    "kk": "Әзірге қалалар жоқ."
  },
  "Редактировать город": {
    "ky": "Шаарды түзөтүү",
    "uz": "Shaharni tahrirlash",
    "en": "Edit city",
    "kk": "Қаланы өңдеу"
  },
  "Новый город": {
    "ky": "Жаңы шаар",
    "uz": "Yangi shahar",
    "en": "New city",
    "kk": "Жаңа қала"
  },
  "Название города": {
    "ky": "Шаардын аталышы",
    "uz": "Shahar nomi",
    "en": "City name",
    "kk": "Қала атауы"
  },
  "Порядок в списке": {
    "ky": "Тизмедеги тартиби",
    "uz": "Ro‘yxatdagi tartibi",
    "en": "List position",
    "kk": "Тізімдегі реті"
  },
  "Города с меньшим значением показаны первыми.": {
    "ky": "Мааниси кичине шаарлар биринчи көрсөтүлөт.",
    "uz": "Qiymati kichik shaharlar avval ko‘rsatiladi.",
    "en": "Cities with lower values appear first.",
    "kk": "Мәні кіші қалалар алдымен көрсетіледі."
  },
  "Показывать город клиентам": {
    "ky": "Шаарды кардарларга көрсөтүү",
    "uz": "Shaharni mijozlarga ko‘rsatish",
    "en": "Show city to customers",
    "kk": "Қаланы клиенттерге көрсету"
  },
  "Меню и акции": {
    "ky": "Меню жана акциялар",
    "uz": "Menyu va aksiyalar",
    "en": "Menu and promotions",
    "kk": "Мәзір және акциялар"
  },
  "Можно использовать собственный каталог или содержимое другого города.": {
    "ky": "Өз каталогуңузду же башка шаардын мазмунун колдонсоңуз болот.",
    "uz": "O‘z katalogingiz yoki boshqa shahar ma’lumotlaridan foydalanishingiz mumkin.",
    "en": "Use a separate catalogue or another city's content.",
    "kk": "Өз каталогыңызды немесе басқа қаланың мазмұнын қолдана аласыз."
  },
  "Меню": {
    "ky": "Меню",
    "uz": "Menyu",
    "en": "Menu",
    "kk": "Мәзір"
  },
  "Выбранный город": {
    "ky": "Тандалган шаар",
    "uz": "Tanlangan shahar",
    "en": "Selected city",
    "kk": "Таңдалған қала"
  },
  "Собственное меню": {
    "ky": "Өз менюсу",
    "uz": "O‘z menyusi",
    "en": "Own menu",
    "kk": "Өз мәзірі"
  },
  "Собственные акции": {
    "ky": "Өз акциялары",
    "uz": "O‘z aksiyalari",
    "en": "Own promotions",
    "kk": "Өз акциялары"
  },
  "Сохранить город": {
    "ky": "Шаарды сактоо",
    "uz": "Shaharni saqlash",
    "en": "Save city",
    "kk": "Қаланы сақтау"
  },
  "Установка приложения недоступна в этом браузере. Продолжайте работу на сайте.": {
    "ky": "Бул браузерде колдонмону орнотуу мүмкүн эмес. Сайтта иштей бериңиз.",
    "uz": "Bu brauzerda ilovani o‘rnatib bo‘lmaydi. Saytda ishlashda davom eting.",
    "en": "App installation is unavailable in this browser. Continue using the website.",
    "kk": "Бұл браузерде қолданбаны орнату мүмкін емес. Сайтта жұмысты жалғастырыңыз."
  },
  "Браузер ограничил память уведомлений. Визуальные уведомления продолжают работать.": {
    "ky": "Браузер билдирүүлөрдүн эс тутумун чектеди. Көрүнүүчү билдирүүлөр иштей берет.",
    "uz": "Brauzer bildirishnomalar xotirasini chekladi. Ko‘rinadigan bildirishnomalar ishlashda davom etadi.",
    "en": "Notification storage is restricted. Visual notifications still work.",
    "kk": "Браузер хабарландырулар жадын шектеді. Көрінетін хабарландырулар жұмыс істей береді."
  },
  "Не удалось подключиться": {
    "ky": "Туташуу мүмкүн болгон жок",
    "uz": "Ulanib bo‘lmadi",
    "en": "Could not connect",
    "kk": "Қосылу мүмкін болмады"
  },
  "Браузер не поддерживает безопасный звук в нескольких вкладках. Используйте актуальный Chrome, Safari или Firefox.": {
    "ky": "Браузер бир нече өтмөктө коопсуз үн ойнотууну колдобойт. Chrome, Safari же Firefoxтун жаңы нускасын колдонуңуз.",
    "uz": "Brauzer bir nechta oynada xavfsiz ovoz ijrosini qo‘llamaydi. Chrome, Safari yoki Firefoxning yangi versiyasini ishlating.",
    "en": "Your browser cannot coordinate audio across tabs. Use an up-to-date Chrome, Safari or Firefox.",
    "kk": "Браузер бірнеше қойындыда дыбысты қауіпсіз ойнатуды қолдамайды. Chrome, Safari немесе Firefox-тың жаңа нұсқасын қолданыңыз."
  },
  "Проверочный сигнал воспроизведён": {
    "ky": "Сыноо сигналы ойнотулду",
    "uz": "Sinov signali ijro etildi",
    "en": "Test sound played",
    "kk": "Сынақ сигналы ойнатылды"
  },
  "Звук включён на этом устройстве": {
    "ky": "Бул түзмөктө үн күйгүзүлдү",
    "uz": "Bu qurilmada ovoz yoqildi",
    "en": "Sound enabled on this device",
    "kk": "Бұл құрылғыда дыбыс қосылды"
  },
  "Браузер заблокировал воспроизведение. Разрешите звук в настройках сайта и нажмите «Проверить звук».": {
    "ky": "Браузер үн ойнотууну бөгөттөдү. Сайттын жөндөөлөрүнөн үнгө уруксат берип, «Үндү текшерүү» баскычын басыңыз.",
    "uz": "Brauzer ovoz ijrosini blokladi. Sayt sozlamalarida ovozga ruxsat bering va «Ovozni tekshirish»ni bosing.",
    "en": "Audio playback is blocked. Allow sound in the site settings, then select “Test sound”.",
    "kk": "Браузер дыбыс ойнатуды бұғаттады. Сайт баптауларында дыбысқа рұқсат беріп, «Дыбысты тексеру» түймесін басыңыз."
  },
  "Не удалось отключить уведомления на сервере. Повторите попытку.": {
    "ky": "Сервердеги билдирүүлөр өчүрүлгөн жок. Кайра аракет кылыңыз.",
    "uz": "Serverdagi bildirishnomalarni o‘chirib bo‘lmadi. Qayta urinib ko‘ring.",
    "en": "Could not disable notifications on the server. Try again.",
    "kk": "Сервердегі хабарландыруларды өшіру мүмкін болмады. Қайталап көріңіз."
  },
  "Системные уведомления запрещены. Разрешите их в настройках сайта, если они нужны.": {
    "ky": "Системалык билдирүүлөргө уруксат жок. Керек болсо, сайттын жөндөөлөрүнөн уруксат бериңиз.",
    "uz": "Tizim bildirishnomalari taqiqlangan. Kerak bo‘lsa, sayt sozlamalarida ularga ruxsat bering.",
    "en": "System notifications are blocked. Allow them in site settings if needed.",
    "kk": "Жүйелік хабарландыруларға тыйым салынған. Қажет болса, сайт баптауларында рұқсат беріңіз."
  },
  "Не удалось проверить доступ к уведомлениям": {
    "ky": "Билдирүүлөргө кирүү укугу текшерилген жок",
    "uz": "Bildirishnomalar huquqini tekshirib bo‘lmadi",
    "en": "Could not verify notification access",
    "kk": "Хабарландыруларға кіру құқығын тексеру мүмкін болмады"
  },
  "Системные уведомления ещё не настроены владельцем сервера.": {
    "ky": "Системалык билдирүүлөрдү сервердин ээси азырынча жөндөй элек.",
    "uz": "Server egasi tizim bildirishnomalarini hali sozlamagan.",
    "en": "The server owner has not configured system notifications yet.",
    "kk": "Сервер иесі жүйелік хабарландыруларды әлі баптамаған."
  },
  "Не удалось сохранить подписку. Проверьте доступ и повторите попытку.": {
    "ky": "Жазылуу сакталган жок. Кирүү укугун текшерип, кайра аракет кылыңыз.",
    "uz": "Obunani saqlab bo‘lmadi. Kirish huquqini tekshiring va qayta urinib ko‘ring.",
    "en": "Could not save the subscription. Check access and try again.",
    "kk": "Жазылымды сақтау мүмкін болмады. Кіру құқығын тексеріп, қайталап көріңіз."
  },
  "Системные уведомления включены на этом устройстве.": {
    "ky": "Бул түзмөктө системалык билдирүүлөр күйгүзүлдү.",
    "uz": "Bu qurilmada tizim bildirishnomalari yoqildi.",
    "en": "System notifications enabled on this device.",
    "kk": "Бұл құрылғыда жүйелік хабарландырулар қосылды."
  },
  "Не удалось настроить уведомления": {
    "ky": "Билдирүүлөр жөндөлгөн жок",
    "uz": "Bildirishnomalarni sozlab bo‘lmadi",
    "en": "Could not configure notifications",
    "kk": "Хабарландыруларды баптау мүмкін болмады"
  },
  "В Safari откройте «Поделиться» → «На экран Домой». Затем запускайте NAKTA с экрана Домой.": {
    "ky": "Safari браузеринде «Бөлүшүү» → «Башкы экранга кошуу» тандаңыз. Андан кийин NAKTAны башкы экрандан ачыңыз.",
    "uz": "Safari’da «Ulashish» → «Bosh ekranga qo‘shish»ni tanlang. Keyin NAKTAni bosh ekrandan oching.",
    "en": "In Safari, choose Share → Add to Home Screen, then launch NAKTA from your home screen.",
    "kk": "Safari-де «Бөлісу» → «Басты экранға қосу» таңдаңыз. Содан кейін NAKTA-ны басты экраннан ашыңыз."
  },
  "Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран», если этот пункт доступен.": {
    "ky": "Браузердин менюсунан «Колдонмону орнотуу» же «Башкы экранга кошуу» жеткиликтүү болсо, тандаңыз.",
    "uz": "Brauzer menyusida mavjud bo‘lsa, «Ilovani o‘rnatish» yoki «Bosh ekranga qo‘shish»ni tanlang.",
    "en": "Open your browser menu and choose Install app or Add to Home Screen, if available.",
    "kk": "Браузер мәзірінде қолжетімді болса, «Қолданбаны орнату» немесе «Басты экранға қосу» таңдаңыз."
  },
  "Обновить приложение? Сначала сохраните открытые формы. Страница будет перезагружена.": {
    "ky": "Колдонмону жаңыртасызбы? Алгач ачык формаларды сактаңыз. Барак кайра жүктөлөт.",
    "uz": "Ilovani yangilaysizmi? Avval ochiq shakllarni saqlang. Sahifa qayta yuklanadi.",
    "en": "Update the app? Save any open forms first. The page will reload.",
    "kk": "Қолданбаны жаңартасыз ба? Алдымен ашық пішіндерді сақтаңыз. Бет қайта жүктеледі."
  },
  "Нет соединения": {
    "ky": "Байланыш жок",
    "uz": "Aloqa yo‘q",
    "en": "No connection",
    "kk": "Байланыс жоқ"
  },
  "Заказы обновляются": {
    "ky": "Буйрутмалар жаңыртылууда",
    "uz": "Buyurtmalar yangilanmoqda",
    "en": "Orders are updating live",
    "kk": "Тапсырыстар жаңартылуда"
  },
  "Подключаем обновления": {
    "ky": "Жаңыртууларга туташууда",
    "uz": "Yangilanishlarga ulanmoqda",
    "en": "Connecting to updates",
    "kk": "Жаңартуларға қосылуда"
  },
  "Обновления приостановлены": {
    "ky": "Жаңыртуулар токтотулган",
    "uz": "Yangilanishlar to‘xtatilgan",
    "en": "Updates paused",
    "kk": "Жаңартулар тоқтатылған"
  },
  "Данные могут быть неактуальны. Восстанавливаем соединение.": {
    "ky": "Маалымат эскириши мүмкүн. Байланыш калыбына келтирилүүдө.",
    "uz": "Ma’lumotlar eskirgan bo‘lishi mumkin. Aloqa tiklanmoqda.",
    "en": "Data may be out of date. Reconnecting.",
    "kk": "Деректер ескірген болуы мүмкін. Байланыс қалпына келтірілуде."
  },
  "Нет связи": {
    "ky": "Байланыш жок",
    "uz": "Aloqa yo‘q",
    "en": "Offline",
    "kk": "Байланыс жоқ"
  },
  "Обновляем приложение": {
    "ky": "Колдонмо жаңыртылууда",
    "uz": "Ilova yangilanmoqda",
    "en": "Updating app",
    "kk": "Қолданба жаңартылуда"
  },
  "Обновить приложение после сохранения": {
    "ky": "Сактагандан кийин колдонмону жаңыртуу",
    "uz": "Saqlagandan keyin ilovani yangilash",
    "en": "Update app after saving",
    "kk": "Сақтағаннан кейін қолданбаны жаңарту"
  },
  "Доступна новая версия": {
    "ky": "Жаңы нуска жеткиликтүү",
    "uz": "Yangi versiya mavjud",
    "en": "New version available",
    "kk": "Жаңа нұсқа қолжетімді"
  },
  "Уведомления и приложение": {
    "ky": "Билдирүүлөр жана колдонмо",
    "uz": "Bildirishnomalar va ilova",
    "en": "Notifications and app",
    "kk": "Хабарландырулар және қолданба"
  },
  "Уведомления": {
    "ky": "Билдирүүлөр",
    "uz": "Bildirishnomalar",
    "en": "Notifications",
    "kk": "Хабарландырулар"
  },
  "Звук, системные уведомления и установка приложения": {
    "ky": "Үн, системалык билдирүүлөр жана колдонмону орнотуу",
    "uz": "Ovoz, tizim bildirishnomalari va ilovani o‘rnatish",
    "en": "Sound, system notifications and app installation",
    "kk": "Дыбыс, жүйелік хабарландырулар және қолданбаны орнату"
  },
  "Закрыть настройки уведомлений": {
    "ky": "Билдирүү жөндөөлөрүн жабуу",
    "uz": "Bildirishnoma sozlamalarini yopish",
    "en": "Close notification settings",
    "kk": "Хабарландыру баптауларын жабу"
  },
  "Звук заказов": {
    "ky": "Буйрутмалардын үнү",
    "uz": "Buyurtmalar ovozi",
    "en": "Order sound",
    "kk": "Тапсырыс дыбысы"
  },
  "Проверить звук": {
    "ky": "Үндү текшерүү",
    "uz": "Ovozni tekshirish",
    "en": "Test sound",
    "kk": "Дыбысты тексеру"
  },
  "Выключить звук": {
    "ky": "Үндү өчүрүү",
    "uz": "Ovozni o‘chirish",
    "en": "Mute sound",
    "kk": "Дыбысты өшіру"
  },
  "Включить звук": {
    "ky": "Үндү күйгүзүү",
    "uz": "Ovozni yoqish",
    "en": "Enable sound",
    "kk": "Дыбысты қосу"
  },
  "Громкость": {
    "ky": "Үндүн деңгээли",
    "uz": "Ovoz balandligi",
    "en": "Volume",
    "kk": "Дыбыс деңгейі"
  },
  "Громкость уведомлений": {
    "ky": "Билдирүүлөрдүн үн деңгээли",
    "uz": "Bildirishnomalar ovoz balandligi",
    "en": "Notification volume",
    "kk": "Хабарландыру дыбысының деңгейі"
  },
  "Звук включён. Нажмите в панели, чтобы браузер разрешил воспроизведение.": {
    "ky": "Үн күйгүзүлгөн. Үнгө уруксат берүү үчүн панелдин ичин басыңыз.",
    "uz": "Ovoz yoqilgan. Brauzer ijroga ruxsat berishi uchun panelda bosing.",
    "en": "Sound is enabled. Click in the panel to allow playback.",
    "kk": "Дыбыс қосылған. Ойнатуға рұқсат беру үшін панель ішінде басыңыз."
  },
  "Системные уведомления": {
    "ky": "Системалык билдирүүлөр",
    "uz": "Tizim bildirishnomalari",
    "en": "System notifications",
    "kk": "Жүйелік хабарландырулар"
  },
  "Отключить системные уведомления": {
    "ky": "Системалык билдирүүлөрдү өчүрүү",
    "uz": "Tizim bildirishnomalarini o‘chirish",
    "en": "Disable system notifications",
    "kk": "Жүйелік хабарландыруларды өшіру"
  },
  "Включить системные уведомления": {
    "ky": "Системалык билдирүүлөрдү күйгүзүү",
    "uz": "Tizim bildirishnomalarini yoqish",
    "en": "Enable system notifications",
    "kk": "Жүйелік хабарландыруларды қосу"
  },
  "Недоступны в этом браузере": {
    "ky": "Бул браузерде жеткиликсиз",
    "uz": "Bu brauzerda mavjud emas",
    "en": "Unavailable in this browser",
    "kk": "Бұл браузерде қолжетімсіз"
  },
  "Приложение установлено": {
    "ky": "Колдонмо орнотулган",
    "uz": "Ilova o‘rnatilgan",
    "en": "App installed",
    "kk": "Қолданба орнатылған"
  },
  "Установить приложение": {
    "ky": "Колдонмону орнотуу",
    "uz": "Ilovani o‘rnatish",
    "en": "Install app",
    "kk": "Қолданбаны орнату"
  },
  "Как установить приложение": {
    "ky": "Колдонмону кантип орнотуу керек",
    "uz": "Ilovani qanday o‘rnatish mumkin",
    "en": "How to install the app",
    "kk": "Қолданбаны қалай орнатуға болады"
  },
  "Новый заказ №": {
    "ky": "Жаңы буйрутма №",
    "uz": "Yangi buyurtma №",
    "en": "New order #",
    "kk": "Жаңа тапсырыс №"
  },
  "Открыть заказ": {
    "ky": "Буйрутманы ачуу",
    "uz": "Buyurtmani ochish",
    "en": "Open order",
    "kk": "Тапсырысты ашу"
  },
  "Закрыть уведомление": {
    "ky": "Билдирүүнү жабуу",
    "uz": "Bildirishnomani yopish",
    "en": "Dismiss notification",
    "kk": "Хабарландыруды жабу"
  },
  "Карта доступна только в браузере": {
    "ky": "Карта браузерде гана жеткиликтүү",
    "uz": "Xarita faqat brauzerda mavjud",
    "en": "Map is only available in the browser",
    "kk": "Карта тек браузерде қолжетімді"
  },
  "Настройки карты недоступны": {
    "ky": "Картанын жөндөөлөрү жеткиликсиз",
    "uz": "Xarita sozlamalari mavjud emas",
    "en": "Map settings unavailable",
    "kk": "Карта баптаулары қолжетімсіз"
  },
  "Не задан ключ Яндекс Карт": {
    "ky": "Яндекс Картанын ачкычы көрсөтүлгөн эмес",
    "uz": "Yandex Xaritalar kaliti kiritilmagan",
    "en": "Yandex Maps key is not configured",
    "kk": "Яндекс Карта кілті көрсетілмеген"
  },
  "Яндекс Карты не загрузились": {
    "ky": "Яндекс Карта жүктөлгөн жок",
    "uz": "Yandex Xaritalar yuklanmadi",
    "en": "Yandex Maps did not load",
    "kk": "Яндекс Карта жүктелмеді"
  },
  "Не удалось загрузить Яндекс Карты": {
    "ky": "Яндекс Картаны жүктөө мүмкүн болгон жок",
    "uz": "Yandex Xaritalarni yuklab bo‘lmadi",
    "en": "Could not load Yandex Maps",
    "kk": "Яндекс Картаны жүктеу мүмкін болмады"
  },
  "Загружаем карту…": {
    "ky": "Карта жүктөлүүдө…",
    "uz": "Xarita yuklanmoqda…",
    "en": "Loading map…",
    "kk": "Карта жүктелуде…"
  },
  "Зона доставки: {0}": {
    "ky": "Жеткирүү аймагы: {0}",
    "uz": "Yetkazish hududi: {0}",
    "en": "Delivery area: {0}",
    "kk": "Жеткізу аймағы: {0}"
  },
  "{0} точек. Перетаскивайте вершины.": {
    "ky": "{0} чекит. Бурчтарын жылдырыңыз.",
    "uz": "{0} ta nuqta. Uchlarini suring.",
    "en": "{0} points. Drag the vertices.",
    "kk": "{0} нүкте. Төбелерін жылжытыңыз."
  },
  "Поставьте на карте минимум три точки.": {
    "ky": "Картага кеминде үч чекит коюңуз.",
    "uz": "Xaritaga kamida uchta nuqta qo‘ying.",
    "en": "Place at least three points on the map.",
    "kk": "Картаға кемінде үш нүкте қойыңыз."
  },
  "Зона доставки · только просмотр": {
    "ky": "Жеткирүү аймагы · көрүү гана",
    "uz": "Yetkazish hududi · faqat ko‘rish",
    "en": "Delivery area · read only",
    "kk": "Жеткізу аймағы · тек көру"
  },
  "Зона доставки пока не задана": {
    "ky": "Жеткирүү аймагы көрсөтүлө элек",
    "uz": "Yetkazish hududi hali belgilanmagan",
    "en": "Delivery area not set yet",
    "kk": "Жеткізу аймағы әлі белгіленбеген"
  },
  "Кликайте по карте, чтобы нарисовать границу.": {
    "ky": "Чек араны чийүү үчүн картаны басыңыз.",
    "uz": "Chegarani chizish uchun xaritani bosing.",
    "en": "Click the map to draw the boundary.",
    "kk": "Шекараны сызу үшін картаны басыңыз."
  },
  "Карта недоступна": {
    "ky": "Карта жеткиликсиз",
    "uz": "Xarita mavjud emas",
    "en": "Map unavailable",
    "kk": "Карта қолжетімсіз"
  },
  "Кликайте по карте, чтобы нарисовать новую границу.": {
    "ky": "Жаңы чек араны чийүү үчүн картаны басыңыз.",
    "uz": "Yangi chegarani chizish uchun xaritani bosing.",
    "en": "Click the map to draw a new boundary.",
    "kk": "Жаңа шекараны сызу үшін картаны басыңыз."
  },
  "Показать всю зону": {
    "ky": "Бүт аймакты көрсөтүү",
    "uz": "Butun hududni ko‘rsatish",
    "en": "Show entire area",
    "kk": "Бүкіл аймақты көрсету"
  },
  "Нарисовать заново": {
    "ky": "Кайра чийүү",
    "uz": "Qayta chizish",
    "en": "Redraw",
    "kk": "Қайта сызу"
  },
  "Файл больше 5 МБ": {
    "ky": "Файл 5 МБдан чоң",
    "uz": "Fayl 5 MB dan katta",
    "en": "File exceeds 5 MB",
    "kk": "Файл 5 МБ-тан үлкен"
  },
  "Не удалось прочитать изображение": {
    "ky": "Сүрөттү окуу мүмкүн болгон жок",
    "uz": "Rasmni o‘qib bo‘lmadi",
    "en": "Could not read image",
    "kk": "Суретті оқу мүмкін болмады"
  },
  "Выбранный файл не является изображением": {
    "ky": "Тандалган файл сүрөт эмес",
    "uz": "Tanlangan fayl rasm emas",
    "en": "The selected file is not an image",
    "kk": "Таңдалған файл сурет емес"
  },
  "Браузер не смог обработать изображение": {
    "ky": "Браузер сүрөттү иштете алган жок",
    "uz": "Brauzer rasmni qayta ishlay olmadi",
    "en": "The browser could not process the image",
    "kk": "Браузер суретті өңдей алмады"
  },
  "Изображение получилось слишком большим. Выберите файл меньшего размера": {
    "ky": "Сүрөт өтө чоң. Кичирээк файл тандаңыз",
    "uz": "Rasm juda katta. Kichikroq fayl tanlang",
    "en": "The image is too large. Choose a smaller file",
    "kk": "Сурет тым үлкен. Кішірек файл таңдаңыз"
  },
  "Не удалось обработать изображение": {
    "ky": "Сүрөт иштетилген жок",
    "uz": "Rasmni qayta ishlab bo‘lmadi",
    "en": "Could not process image",
    "kk": "Суретті өңдеу мүмкін болмады"
  },
  "Предпросмотр: {0}": {
    "ky": "Алдын ала көрүү: {0}",
    "uz": "Oldindan ko‘rish: {0}",
    "en": "Preview: {0}",
    "kk": "Алдын ала қарау: {0}"
  },
  "Заменить фото": {
    "ky": "Сүрөттү алмаштыруу",
    "uz": "Rasmni almashtirish",
    "en": "Replace photo",
    "kk": "Суретті ауыстыру"
  },
  "Удалить фото": {
    "ky": "Сүрөттү өчүрүү",
    "uz": "Rasmni o‘chirish",
    "en": "Remove photo",
    "kk": "Суретті жою"
  },
  "Обрабатываем изображение…": {
    "ky": "Сүрөт иштетилүүдө…",
    "uz": "Rasm qayta ishlanmoqda…",
    "en": "Processing image…",
    "kk": "Сурет өңделуде…"
  },
  "Загрузить фотографию": {
    "ky": "Сүрөт жүктөө",
    "uz": "Rasm yuklash",
    "en": "Upload photo",
    "kk": "Сурет жүктеу"
  },
  "JPG, PNG или WEBP до 5 МБ": {
    "ky": "JPG, PNG же WEBP, 5 МБга чейин",
    "uz": "JPG, PNG yoki WEBP, 5 MB gacha",
    "en": "JPG, PNG or WEBP, up to 5 MB",
    "kk": "JPG, PNG немесе WEBP, 5 МБ-қа дейін"
  },
  "Изображение по ссылке": {
    "ky": "Шилтеме аркылуу сүрөт",
    "uz": "Havola orqali rasm",
    "en": "Image from URL",
    "kk": "Сілтеме арқылы сурет"
  },
  "Ссылка на изображение": {
    "ky": "Сүрөткө шилтеме",
    "uz": "Rasm havolasi",
    "en": "Image URL",
    "kk": "Сурет сілтемесі"
  },
  "Не удалось загрузить меню": {
    "ky": "Меню жүктөлгөн жок",
    "uz": "Menyuni yuklab bo‘lmadi",
    "en": "Could not load menu",
    "kk": "Мәзірді жүктеу мүмкін болмады"
  },
  "Загрузите фотографию блюда": {
    "ky": "Тамактын сүрөтүн жүктөңүз",
    "uz": "Taom rasmini yuklang",
    "en": "Upload a dish photo",
    "kk": "Тағам суретін жүктеңіз"
  },
  "Сначала создайте категорию": {
    "ky": "Адегенде категория түзүңүз",
    "uz": "Avval toifa yarating",
    "en": "Create a category first",
    "kk": "Алдымен санат құрыңыз"
  },
  "Удалите недоступные позиции из комплектации блюда или включите их в настройках": {
    "ky": "Жеткиликсиз позицияларды тамактын комплектациясынан өчүрүңүз же жөндөөлөрдө күйгүзүңүз",
    "uz": "Mavjud bo‘lmagan mahsulotlarni taom to‘plamidan olib tashlang yoki sozlamalarda yoqing",
    "en": "Remove unavailable included items or enable them in settings",
    "kk": "Қолжетімсіз позицияларды тағам жинағынан алып тастаңыз немесе баптауларда қосыңыз"
  },
  "В комплектации одного блюда может быть не более 20 позиций": {
    "ky": "Бир тамактын комплектациясында эң көп 20 позиция болот",
    "uz": "Bitta taom to‘plamida ko‘pi bilan 20 ta mahsulot bo‘lishi mumkin",
    "en": "A dish can include at most 20 items",
    "kk": "Бір тағам жинағында ең көбі 20 позиция болуы мүмкін"
  },
  "Изменения блюда сохранены": {
    "ky": "Тамактын өзгөртүүлөрү сакталды",
    "uz": "Taom o‘zgarishlari saqlandi",
    "en": "Dish changes saved",
    "kk": "Тағам өзгерістері сақталды"
  },
  "Блюдо добавлено": {
    "ky": "Тамак кошулду",
    "uz": "Taom qo‘shildi",
    "en": "Dish added",
    "kk": "Тағам қосылды"
  },
  "Не удалось сохранить блюдо": {
    "ky": "Тамак сакталган жок",
    "uz": "Taomni saqlab bo‘lmadi",
    "en": "Could not save dish",
    "kk": "Тағамды сақтау мүмкін болмады"
  },
  "Удалить блюдо «{0}» полностью? Блюдо исчезнет из меню всех городов, использующих этот каталог. История заказов сохранится. Отменить удаление нельзя.": {
    "ky": "«{0}» тамагын толук өчүрөсүзбү? Ал бул каталогду колдонгон бардык шаарлардын менюсунан жоголот. Буйрутмалардын таржымалы сакталат. Өчүрүүнү жокко чыгарууга болбойт.",
    "uz": "«{0}» taomini butunlay o‘chirasizmi? U shu katalogdan foydalanuvchi barcha shaharlar menyusidan yo‘qoladi. Buyurtmalar tarixi saqlanadi. Buni bekor qilib bo‘lmaydi.",
    "en": "Permanently delete dish “{0}”? It will disappear from every city using this catalogue. Order history will be kept. This cannot be undone.",
    "kk": "«{0}» тағамын толығымен жоясыз ба? Ол осы каталогты пайдаланатын барлық қалалардың мәзірінен жоғалады. Тапсырыстар тарихы сақталады. Мұны болдырмау мүмкін емес."
  },
  "Блюдо полностью удалено из меню": {
    "ky": "Тамак менюдан толук өчүрүлдү",
    "uz": "Taom menyudan butunlay o‘chirildi",
    "en": "Dish permanently removed from menu",
    "kk": "Тағам мәзірден толығымен жойылды"
  },
  "Не удалось удалить блюдо": {
    "ky": "Тамак өчүрүлгөн жок",
    "uz": "Taomni o‘chirib bo‘lmadi",
    "en": "Could not delete dish",
    "kk": "Тағамды жою мүмкін болмады"
  },
  "Загружаем каталог…": {
    "ky": "Каталог жүктөлүүдө…",
    "uz": "Katalog yuklanmoqda…",
    "en": "Loading catalogue…",
    "kk": "Каталог жүктелуде…"
  },
  "Блюда": {
    "ky": "Тамактар",
    "uz": "Taomlar",
    "en": "Dishes",
    "kk": "Тағамдар"
  },
  "Добавить блюдо": {
    "ky": "Тамак кошуу",
    "uz": "Taom qo‘shish",
    "en": "Add dish",
    "kk": "Тағам қосу"
  },
  "Поиск блюд": {
    "ky": "Тамактарды издөө",
    "uz": "Taomlarni qidirish",
    "en": "Search dishes",
    "kk": "Тағамдарды іздеу"
  },
  "Поиск по названию": {
    "ky": "Аталышы боюнча издөө",
    "uz": "Nomi bo‘yicha qidirish",
    "en": "Search by name",
    "kk": "Атауы бойынша іздеу"
  },
  "Категория": {
    "ky": "Категория",
    "uz": "Toifa",
    "en": "Category",
    "kk": "Санат"
  },
  "Все категории": {
    "ky": "Бардык категориялар",
    "uz": "Barcha toifalar",
    "en": "All categories",
    "kk": "Барлық санаттар"
  },
  "Блюдо": {
    "ky": "Тамак",
    "uz": "Taom",
    "en": "Dish",
    "kk": "Тағам"
  },
  "Группы выбора": {
    "ky": "Тандоо топтору",
    "uz": "Tanlov guruhlari",
    "en": "Choice groups",
    "kk": "Таңдау топтары"
  },
  "Комплектация": {
    "ky": "Комплектация",
    "uz": "To‘plam tarkibi",
    "en": "Included items",
    "kk": "Жинақ құрамы"
  },
  "Цена": {
    "ky": "Баа",
    "uz": "Narx",
    "en": "Price",
    "kk": "Баға"
  },
  "Доступность": {
    "ky": "Жеткиликтүүлүк",
    "uz": "Mavjudlik",
    "en": "Availability",
    "kk": "Қолжетімділік"
  },
  "Действия": {
    "ky": "Аракеттер",
    "uz": "Amallar",
    "en": "Actions",
    "kk": "Әрекеттер"
  },
  "г": {
    "ky": "г",
    "uz": "g",
    "en": "g",
    "kk": "г"
  },
  "{0} групп": {
    "ky": "{0} топ",
    "uz": "{0} ta guruh",
    "en": "{0} groups",
    "kk": "{0} топ"
  },
  "{0} позиций": {
    "ky": "{0} позиция",
    "uz": "{0} ta mahsulot",
    "en": "{0} items",
    "kk": "{0} позиция"
  },
  "Доступно": {
    "ky": "Жеткиликтүү",
    "uz": "Mavjud",
    "en": "Available",
    "kk": "Қолжетімді"
  },
  "Скрыто": {
    "ky": "Жашырылган",
    "uz": "Yashirilgan",
    "en": "Hidden",
    "kk": "Жасырылған"
  },
  "блюдо": {
    "ky": "тамакты",
    "uz": "taomni",
    "en": "dish",
    "kk": "тағамды"
  },
  "В меню": {
    "ky": "Менюда",
    "uz": "Menyuda",
    "en": "On the menu",
    "kk": "Мәзірде"
  },
  "Блюда не найдены": {
    "ky": "Тамактар табылган жок",
    "uz": "Taomlar topilmadi",
    "en": "No dishes found",
    "kk": "Тағамдар табылмады"
  },
  "Измените поиск или добавьте первое блюдо.": {
    "ky": "Издөөнү өзгөртүңүз же биринчи тамакты кошуңуз.",
    "uz": "Qidiruvni o‘zgartiring yoki birinchi taomni qo‘shing.",
    "en": "Change your search or add the first dish.",
    "kk": "Іздеуді өзгертіңіз немесе алғашқы тағамды қосыңыз."
  },
  "Новое блюдо": {
    "ky": "Жаңы тамак",
    "uz": "Yangi taom",
    "en": "New dish",
    "kk": "Жаңа тағам"
  },
  "Основное": {
    "ky": "Негизги",
    "uz": "Asosiy",
    "en": "General",
    "kk": "Негізгі"
  },
  "Модификаторы ·": {
    "ky": "Модификаторлор ·",
    "uz": "Modifikatorlar ·",
    "en": "Modifiers ·",
    "kk": "Модификаторлар ·"
  },
  "Комплектация ·": {
    "ky": "Комплектация ·",
    "uz": "To‘plam tarkibi ·",
    "en": "Included items ·",
    "kk": "Жинақ құрамы ·"
  },
  "Дополнительно": {
    "ky": "Кошумча",
    "uz": "Qo‘shimcha",
    "en": "More",
    "kk": "Қосымша"
  },
  "Фотография блюда": {
    "ky": "Тамактын сүрөтү",
    "uz": "Taom rasmi",
    "en": "Dish photo",
    "kk": "Тағам суреті"
  },
  "800 × 800 px, до 5 МБ.": {
    "ky": "800 × 800 px, 5 МБга чейин.",
    "uz": "800 × 800 px, 5 MB gacha.",
    "en": "800 × 800 px, up to 5 MB.",
    "kk": "800 × 800 px, 5 МБ-қа дейін."
  },
  "Категория блюда": {
    "ky": "Тамактын категориясы",
    "uz": "Taom toifasi",
    "en": "Dish category",
    "kk": "Тағам санаты"
  },
  "Выберите категорию": {
    "ky": "Категория тандаңыз",
    "uz": "Toifani tanlang",
    "en": "Select a category",
    "kk": "Санатты таңдаңыз"
  },
  "Цена, сом": {
    "ky": "Баа, сом",
    "uz": "Narx, som",
    "en": "Price, KGS",
    "kk": "Баға, сом"
  },
  "Вес, г": {
    "ky": "Салмак, г",
    "uz": "Vazn, g",
    "en": "Weight, g",
    "kk": "Салмақ, г"
  },
  "Описание": {
    "ky": "Сүрөттөмө",
    "uz": "Tavsif",
    "en": "Description",
    "kk": "Сипаттама"
  },
  "Состав": {
    "ky": "Курамы",
    "uz": "Tarkibi",
    "en": "Ingredients",
    "kk": "Құрамы"
  },
  "Доступно для заказа": {
    "ky": "Буйрутма берүүгө жеткиликтүү",
    "uz": "Buyurtma uchun mavjud",
    "en": "Available to order",
    "kk": "Тапсырыс беруге қолжетімді"
  },
  "Комплектация одной порции": {
    "ky": "Бир порциянын комплектациясы",
    "uz": "Bir porsiya to‘plami",
    "en": "Items included with one portion",
    "kk": "Бір порция жинағы"
  },
  "Укажите бесплатные позиции. Количество умножается на число порций в заказе.": {
    "ky": "Акысыз позицияларды көрсөтүңүз. Саны буйрутмадагы порциялардын санына көбөйтүлөт.",
    "uz": "Bepul mahsulotlarni ko‘rsating. Miqdor buyurtmadagi porsiyalar soniga ko‘paytiriladi.",
    "en": "Specify free items. Quantities are multiplied by the number of portions ordered.",
    "kk": "Тегін позицияларды көрсетіңіз. Саны тапсырыстағы порциялар санына көбейтіледі."
  },
  "Количество: {0}": {
    "ky": "Саны: {0}",
    "uz": "Miqdori: {0}",
    "en": "Quantity: {0}",
    "kk": "Саны: {0}"
  },
  "Добавьте бесплатные позиции в настройках комплектации.": {
    "ky": "Комплектация жөндөөлөрүнө акысыз позицияларды кошуңуз.",
    "uz": "To‘plam sozlamalariga bepul mahsulotlarni qo‘shing.",
    "en": "Add free items in the included-item settings.",
    "kk": "Жинақ баптауларына тегін позицияларды қосыңыз."
  },
  "Недоступная позиция": {
    "ky": "Жеткиликсиз позиция",
    "uz": "Mavjud bo‘lmagan mahsulot",
    "en": "Unavailable item",
    "kk": "Қолжетімсіз позиция"
  },
  "шт.": {
    "ky": "даана",
    "uz": "dona",
    "en": "pcs",
    "kk": "дана"
  },
  "Удалить": {
    "ky": "Өчүрүү",
    "uz": "O‘chirish",
    "en": "Delete",
    "kk": "Жою"
  },
  "Отображение в меню": {
    "ky": "Менюда көрсөтүү",
    "uz": "Menyuda ko‘rsatish",
    "en": "Menu display",
    "kk": "Мәзірде көрсету"
  },
  "Старая цена, сом": {
    "ky": "Мурунку баа, сом",
    "uz": "Eski narx, som",
    "en": "Previous price, KGS",
    "kk": "Ескі баға, сом"
  },
  "Порядок в категории": {
    "ky": "Категориядагы тартиби",
    "uz": "Toifadagi tartibi",
    "en": "Position in category",
    "kk": "Санаттағы реті"
  },
  "Отметка «Новинка»": {
    "ky": "«Жаңы» белгиси",
    "uz": "«Yangi» belgisi",
    "en": "“New” badge",
    "kk": "«Жаңа» белгісі"
  },
  "Пищевая ценность": {
    "ky": "Азыктык баалуулугу",
    "uz": "Ozuqaviy qiymati",
    "en": "Nutrition",
    "kk": "Тағамдық құндылығы"
  },
  "Калории, ккал": {
    "ky": "Калория, ккал",
    "uz": "Kaloriya, kkal",
    "en": "Calories, kcal",
    "kk": "Калория, ккал"
  },
  "Белки, г": {
    "ky": "Белоктор, г",
    "uz": "Oqsil, g",
    "en": "Protein, g",
    "kk": "Ақуыздар, г"
  },
  "Жиры, г": {
    "ky": "Майлар, г",
    "uz": "Yog‘, g",
    "en": "Fat, g",
    "kk": "Майлар, г"
  },
  "Углеводы, г": {
    "ky": "Углеводдор, г",
    "uz": "Uglevodlar, g",
    "en": "Carbohydrates, g",
    "kk": "Көмірсулар, г"
  },
  "Сохранить блюдо": {
    "ky": "Тамакты сактоо",
    "uz": "Taomni saqlash",
    "en": "Save dish",
    "kk": "Тағамды сақтау"
  },
  "Доступ только для просмотра": {
    "ky": "Көрүүгө гана уруксат",
    "uz": "Faqat ko‘rish huquqi",
    "en": "Read-only access",
    "kk": "Тек көруге рұқсат"
  },
  "Новый": {
    "ky": "Жаңы",
    "uz": "Yangi",
    "en": "New",
    "kk": "Жаңа"
  },
  "Принят": {
    "ky": "Кабыл алынган",
    "uz": "Qabul qilingan",
    "en": "Accepted",
    "kk": "Қабылданған"
  },
  "Готовится": {
    "ky": "Даярдалууда",
    "uz": "Tayyorlanmoqda",
    "en": "Preparing",
    "kk": "Дайындалуда"
  },
  "Готов": {
    "ky": "Даяр",
    "uz": "Tayyor",
    "en": "Ready",
    "kk": "Дайын"
  },
  "Завершён": {
    "ky": "Аяктаган",
    "uz": "Yakunlangan",
    "en": "Completed",
    "kk": "Аяқталған"
  },
  "Отменён": {
    "ky": "Жокко чыгарылган",
    "uz": "Bekor qilingan",
    "en": "Cancelled",
    "kk": "Бас тартылған"
  },
  "Все": {
    "ky": "Баары",
    "uz": "Barchasi",
    "en": "All",
    "kk": "Барлығы"
  },
  "Принятые": {
    "ky": "Кабыл алынган",
    "uz": "Qabul qilingan",
    "en": "Accepted",
    "kk": "Қабылданған"
  },
  "Завершённые": {
    "ky": "Аяктаган",
    "uz": "Yakunlangan",
    "en": "Completed",
    "kk": "Аяқталған"
  },
  "Отменённые": {
    "ky": "Жокко чыгарылган",
    "uz": "Bekor qilingan",
    "en": "Cancelled",
    "kk": "Бас тартылған"
  },
  "Без номера": {
    "ky": "Номери жок",
    "uz": "Raqamsiz",
    "en": "No number",
    "kk": "Нөмірсіз"
  },
  "Самовывоз": {
    "ky": "Өзү алып кетүү",
    "uz": "Olib ketish",
    "en": "Pickup",
    "kk": "Өзі алып кету"
  },
  "Доставка": {
    "ky": "Жеткирүү",
    "uz": "Yetkazish",
    "en": "Delivery",
    "kk": "Жеткізу"
  },
  "Наличными": {
    "ky": "Накталай",
    "uz": "Naqd pul",
    "en": "Cash",
    "kk": "Қолма-қол"
  },
  "Онлайн": {
    "ky": "Онлайн",
    "uz": "Onlayn",
    "en": "Online",
    "kk": "Онлайн"
  },
  "Картой": {
    "ky": "Карта менен",
    "uz": "Karta orqali",
    "en": "Card",
    "kk": "Картамен"
  },
  "Принять заказ": {
    "ky": "Буйрутманы кабыл алуу",
    "uz": "Buyurtmani qabul qilish",
    "en": "Accept order",
    "kk": "Тапсырысты қабылдау"
  },
  "Начать готовить": {
    "ky": "Даярдоону баштоо",
    "uz": "Tayyorlashni boshlash",
    "en": "Start preparing",
    "kk": "Дайындауды бастау"
  },
  "Отметить готовым": {
    "ky": "Даяр деп белгилөө",
    "uz": "Tayyor deb belgilash",
    "en": "Mark as ready",
    "kk": "Дайын деп белгілеу"
  },
  "Передать курьеру": {
    "ky": "Курьерге берүү",
    "uz": "Kuryerga topshirish",
    "en": "Hand to courier",
    "kk": "Курьерге беру"
  },
  "Выдать заказ": {
    "ky": "Буйрутманы берүү",
    "uz": "Buyurtmani topshirish",
    "en": "Hand over order",
    "kk": "Тапсырысты беру"
  },
  "Завершить заказ": {
    "ky": "Буйрутманы аяктоо",
    "uz": "Buyurtmani yakunlash",
    "en": "Complete order",
    "kk": "Тапсырысты аяқтау"
  },
  "Заказы не найдены": {
    "ky": "Буйрутмалар табылган жок",
    "uz": "Buyurtmalar topilmadi",
    "en": "No orders found",
    "kk": "Тапсырыстар табылмады"
  },
  "Новых заказов пока нет": {
    "ky": "Азырынча жаңы буйрутмалар жок",
    "uz": "Hozircha yangi buyurtmalar yo‘q",
    "en": "No new orders yet",
    "kk": "Әзірге жаңа тапсырыстар жоқ"
  },
  "Измените фильтр или поисковый запрос.": {
    "ky": "Чыпканы же издөө сурамын өзгөртүңүз.",
    "uz": "Filtr yoki qidiruvni o‘zgartiring.",
    "en": "Change the filter or search query.",
    "kk": "Сүзгіні немесе іздеу сұрауын өзгертіңіз."
  },
  "Новые заказы появятся здесь автоматически.": {
    "ky": "Жаңы буйрутмалар бул жерде автоматтык түрдө пайда болот.",
    "uz": "Yangi buyurtmalar bu yerda avtomatik paydo bo‘ladi.",
    "en": "New orders will appear here automatically.",
    "kk": "Жаңа тапсырыстар мұнда автоматты түрде пайда болады."
  },
  "Не удалось загрузить заказы": {
    "ky": "Буйрутмалар жүктөлгөн жок",
    "uz": "Buyurtmalarni yuklab bo‘lmadi",
    "en": "Could not load orders",
    "kk": "Тапсырыстарды жүктеу мүмкін болмады"
  },
  "Не удалось открыть заказ": {
    "ky": "Буйрутма ачылган жок",
    "uz": "Buyurtmani ochib bo‘lmadi",
    "en": "Could not open order",
    "kk": "Тапсырысты ашу мүмкін болмады"
  },
  "Отменить заказ {0}? Вернуть его в работу будет нельзя.": {
    "ky": "{0} буйрутмасын жокко чыгарасызбы? Аны кайра иштетүүгө кайтаруу мүмкүн эмес.",
    "uz": "{0} buyurtmasini bekor qilasizmi? Uni qayta ishga qaytarib bo‘lmaydi.",
    "en": "Cancel order {0}? It cannot be returned to processing.",
    "kk": "{0} тапсырысынан бас тартасыз ба? Оны қайта өңдеуге қайтару мүмкін емес."
  },
  "Не удалось изменить статус заказа": {
    "ky": "Буйрутманын статусу өзгөртүлгөн жок",
    "uz": "Buyurtma holatini o‘zgartirib bo‘lmadi",
    "en": "Could not change order status",
    "kk": "Тапсырыс күйін өзгерту мүмкін болмады"
  },
  "Не удалось загрузить подробности заказа": {
    "ky": "Буйрутманын чоо-жайы жүктөлгөн жок",
    "uz": "Buyurtma tafsilotlarini yuklab bo‘lmadi",
    "en": "Could not load order details",
    "kk": "Тапсырыс мәліметтерін жүктеу мүмкін болмады"
  },
  "{0} — комплектация сохранена": {
    "ky": "{0} — комплектация сакталды",
    "uz": "{0} — to‘plam saqlandi",
    "en": "{0} — included items saved",
    "kk": "{0} — жинақ құрамы сақталды"
  },
  "Не удалось сохранить комплектацию": {
    "ky": "Комплектация сакталган жок",
    "uz": "To‘plamni saqlab bo‘lmadi",
    "en": "Could not save included items",
    "kk": "Жинақ құрамын сақтау мүмкін болмады"
  },
  "Обновить заказы": {
    "ky": "Буйрутмаларды жаңыртуу",
    "uz": "Buyurtmalarni yangilash",
    "en": "Refresh orders",
    "kk": "Тапсырыстарды жаңарту"
  },
  "Фильтры заказов": {
    "ky": "Буйрутма чыпкалары",
    "uz": "Buyurtma filtrlari",
    "en": "Order filters",
    "kk": "Тапсырыс сүзгілері"
  },
  "Найти заказ": {
    "ky": "Буйрутма табуу",
    "uz": "Buyurtmani topish",
    "en": "Find an order",
    "kk": "Тапсырысты табу"
  },
  "Номер, имя или телефон": {
    "ky": "Номер, аты же телефон",
    "uz": "Raqam, ism yoki telefon",
    "en": "Number, name or phone",
    "kk": "Нөмір, аты немесе телефон"
  },
  "Сбросить": {
    "ky": "Тазалоо",
    "uz": "Tozalash",
    "en": "Reset",
    "kk": "Қалпына келтіру"
  },
  "Статус заказа": {
    "ky": "Буйрутманын статусу",
    "uz": "Buyurtma holati",
    "en": "Order status",
    "kk": "Тапсырыс күйі"
  },
  "Обновляем заказы…": {
    "ky": "Буйрутмалар жаңыртылууда…",
    "uz": "Buyurtmalar yangilanmoqda…",
    "en": "Refreshing orders…",
    "kk": "Тапсырыстар жаңартылуда…"
  },
  "Не удалось показать заказы": {
    "ky": "Буйрутмаларды көрсөтүү мүмкүн болгон жок",
    "uz": "Buyurtmalarni ko‘rsatib bo‘lmadi",
    "en": "Could not display orders",
    "kk": "Тапсырыстарды көрсету мүмкін болмады"
  },
  "Список заказов": {
    "ky": "Буйрутмалардын тизмеси",
    "uz": "Buyurtmalar ro‘yxati",
    "en": "Order list",
    "kk": "Тапсырыстар тізімі"
  },
  "Заказ": {
    "ky": "Буйрутма",
    "uz": "Buyurtma",
    "en": "Order",
    "kk": "Тапсырыс"
  },
  "Клиент": {
    "ky": "Кардар",
    "uz": "Mijoz",
    "en": "Customer",
    "kk": "Клиент"
  },
  "Получение": {
    "ky": "Алуу жолу",
    "uz": "Olish usuli",
    "en": "Fulfilment",
    "kk": "Алу тәсілі"
  },
  "Статус": {
    "ky": "Статус",
    "uz": "Holat",
    "en": "Status",
    "kk": "Күйі"
  },
  "Действие": {
    "ky": "Аракет",
    "uz": "Amal",
    "en": "Action",
    "kk": "Әрекет"
  },
  "Без имени": {
    "ky": "Аты көрсөтүлгөн эмес",
    "uz": "Ism kiritilmagan",
    "en": "No name",
    "kk": "Аты көрсетілмеген"
  },
  "Адрес не указан": {
    "ky": "Дарек көрсөтүлгөн эмес",
    "uz": "Manzil kiritilmagan",
    "en": "No address provided",
    "kk": "Мекенжай көрсетілмеген"
  },
  "Заказ {0}": {
    "ky": "{0} буйрутмасы",
    "uz": "{0} buyurtmasi",
    "en": "Order {0}",
    "kk": "{0} тапсырысы"
  },
  "Загружаем актуальные сведения…": {
    "ky": "Учурдагы маалымат жүктөлүүдө…",
    "uz": "Joriy ma’lumotlar yuklanmoqda…",
    "en": "Loading current details…",
    "kk": "Өзекті мәліметтер жүктелуде…"
  },
  "Создан {0}": {
    "ky": "Түзүлгөн: {0}",
    "uz": "Yaratilgan: {0}",
    "en": "Created {0}",
    "kk": "Құрылған: {0}"
  },
  "Состав и клиент": {
    "ky": "Курамы жана кардар",
    "uz": "Tarkib va mijoz",
    "en": "Items and customer",
    "kk": "Құрамы және клиент"
  },
  "История": {
    "ky": "Таржымал",
    "uz": "Tarix",
    "en": "History",
    "kk": "Тарих"
  },
  "Клиент и получение": {
    "ky": "Кардар жана алуу жолу",
    "uz": "Mijoz va olish usuli",
    "en": "Customer and fulfilment",
    "kk": "Клиент және алу тәсілі"
  },
  "Позвонить:": {
    "ky": "Чалуу:",
    "uz": "Qo‘ng‘iroq:",
    "en": "Call:",
    "kk": "Қоңырау шалу:"
  },
  "кв. {0}": {
    "ky": "батир {0}",
    "uz": "xonadon {0}",
    "en": "apt. {0}",
    "kk": "пәтер {0}"
  },
  "подъезд {0}": {
    "ky": "кире бериш {0}",
    "uz": "kirish yo‘lagi {0}",
    "en": "entrance {0}",
    "kk": "кіреберіс {0}"
  },
  "этаж {0}": {
    "ky": "кабат {0}",
    "uz": "qavat {0}",
    "en": "floor {0}",
    "kk": "қабат {0}"
  },
  "домофон {0}": {
    "ky": "домофон {0}",
    "uz": "domofon {0}",
    "en": "intercom {0}",
    "kk": "домофон {0}"
  },
  "Без дополнительных деталей": {
    "ky": "Кошумча маалымат жок",
    "uz": "Qo‘shimcha tafsilotlar yo‘q",
    "en": "No additional details",
    "kk": "Қосымша мәліметтер жоқ"
  },
  "Комментарий клиента": {
    "ky": "Кардардын комментарийи",
    "uz": "Mijoz izohi",
    "en": "Customer comment",
    "kk": "Клиент түсініктемесі"
  },
  "Состав заказа": {
    "ky": "Буйрутманын курамы",
    "uz": "Buyurtma tarkibi",
    "en": "Order items",
    "kk": "Тапсырыс құрамы"
  },
  "Оплата": {
    "ky": "Төлөм",
    "uz": "To‘lov",
    "en": "Payment",
    "kk": "Төлем"
  },
  "Приборы": {
    "ky": "Ашкана шаймандары",
    "uz": "Ovqatlanish anjomlari",
    "en": "Utensils",
    "kk": "Ас құралдары"
  },
  "Не нужны": {
    "ky": "Керек эмес",
    "uz": "Kerak emas",
    "en": "Not needed",
    "kk": "Қажет емес"
  },
  "{0} шт.": {
    "ky": "{0} даана",
    "uz": "{0} dona",
    "en": "{0} pcs",
    "kk": "{0} дана"
  },
  "Итого": {
    "ky": "Жыйынтык",
    "uz": "Jami",
    "en": "Total",
    "kk": "Барлығы"
  },
  "Изменить комплектацию": {
    "ky": "Комплектацияны өзгөртүү",
    "uz": "To‘plamni o‘zgartirish",
    "en": "Edit included items",
    "kk": "Жинақ құрамын өзгерту"
  },
  "{0} персон": {
    "ky": "{0} киши",
    "uz": "{0} kishi",
    "en": "{0} people",
    "kk": "{0} адам"
  },
  "Дополнительная комплектация не указана.": {
    "ky": "Кошумча комплектация көрсөтүлгөн эмес.",
    "uz": "Qo‘shimcha to‘plam kiritilmagan.",
    "en": "No additional included items specified.",
    "kk": "Қосымша жинақ құрамы көрсетілмеген."
  },
  "История обработки": {
    "ky": "Иштетүү таржымалы",
    "uz": "Qayta ishlash tarixi",
    "en": "Processing history",
    "kk": "Өңдеу тарихы"
  },
  "Заказ создан": {
    "ky": "Буйрутма түзүлдү",
    "uz": "Buyurtma yaratildi",
    "en": "Order created",
    "kk": "Тапсырыс құрылды"
  },
  "Текущий статус:": {
    "ky": "Учурдагы статус:",
    "uz": "Joriy holat:",
    "en": "Current status:",
    "kk": "Қазіргі күйі:"
  },
  "Ошибка передачи на кухню": {
    "ky": "Ашканага жөнөтүүдө ката",
    "uz": "Oshxonaga yuborishda xato",
    "en": "Kitchen transfer failed",
    "kk": "Асүйге жіберу қатесі"
  },
  "Не удалось передать заказ в систему кухни. Проверьте подключение в разделе интеграции.": {
    "ky": "Буйрутма ашкананын системасына жөнөтүлгөн жок. Интеграциялар бөлүмүндө туташууну текшериңиз.",
    "uz": "Buyurtma oshxona tizimiga yuborilmadi. Integratsiyalar bo‘limida ulanishni tekshiring.",
    "en": "Could not send the order to the kitchen system. Check the connection in integrations.",
    "kk": "Тапсырыс асүй жүйесіне жіберілмеді. Интеграциялар бөлімінде қосылымды тексеріңіз."
  },
  "Отменить заказ": {
    "ky": "Буйрутманы жокко чыгаруу",
    "uz": "Buyurtmani bekor qilish",
    "en": "Cancel order",
    "kk": "Тапсырыстан бас тарту"
  },
  "Комплектация {0}": {
    "ky": "{0} комплектациясы",
    "uz": "{0} to‘plami",
    "en": "Included items for {0}",
    "kk": "{0} жинақ құрамы"
  },
  "Без приборов": {
    "ky": "Шаймансыз",
    "uz": "Anjomlarsiz",
    "en": "No utensils",
    "kk": "Ас құралдарынсыз"
  },
  "Количество персон": {
    "ky": "Кишилердин саны",
    "uz": "Kishilar soni",
    "en": "Number of people",
    "kk": "Адамдар саны"
  },
  "Палочки и салфетки": {
    "ky": "Таякчалар жана салфеткалар",
    "uz": "Tayoqchalar va salfetkalar",
    "en": "Chopsticks and napkins",
    "kk": "Таяқшалар мен майлықтар"
  },
  "Уменьшить количество персон": {
    "ky": "Кишилердин санын азайтуу",
    "uz": "Kishilar sonini kamaytirish",
    "en": "Decrease number of people",
    "kk": "Адамдар санын азайту"
  },
  "Увеличить количество персон": {
    "ky": "Кишилердин санын көбөйтүү",
    "uz": "Kishilar sonini oshirish",
    "en": "Increase number of people",
    "kk": "Адамдар санын көбейту"
  },
  "Входит в заказ:": {
    "ky": "Буйрутмага кирет:",
    "uz": "Buyurtmaga kiradi:",
    "en": "Included in the order:",
    "kk": "Тапсырысқа кіреді:"
  },
  "Уменьшить {0}": {
    "ky": "{0} санын азайтуу",
    "uz": "{0} miqdorini kamaytirish",
    "en": "Decrease {0}",
    "kk": "{0} санын азайту"
  },
  "Увеличить {0}": {
    "ky": "{0} санын көбөйтүү",
    "uz": "{0} miqdorini oshirish",
    "en": "Increase {0}",
    "kk": "{0} санын көбейту"
  },
  "Для блюд этого заказа бесплатная комплектация не указана.": {
    "ky": "Бул буйрутмадагы тамактар үчүн акысыз комплектация көрсөтүлгөн эмес.",
    "uz": "Bu buyurtmadagi taomlar uchun bepul to‘plam belgilanmagan.",
    "en": "No free included items are configured for these dishes.",
    "kk": "Бұл тапсырыстағы тағамдарға тегін жинақ құрамы көрсетілмеген."
  },
  "Сохранить комплектацию": {
    "ky": "Комплектацияны сактоо",
    "uz": "To‘plamni saqlash",
    "en": "Save included items",
    "kk": "Жинақ құрамын сақтау"
  },
  "Не удалось обновить обзор": {
    "ky": "Обзор жаңыртылган жок",
    "uz": "Umumiy ko‘rinishni yangilab bo‘lmadi",
    "en": "Could not refresh overview",
    "kk": "Шолуды жаңарту мүмкін болмады"
  },
  "Новые заказы": {
    "ky": "Жаңы буйрутмалар",
    "uz": "Yangi buyurtmalar",
    "en": "New orders",
    "kk": "Жаңа тапсырыстар"
  },
  "Ожидают обработки": {
    "ky": "Иштетүүнү күтүүдө",
    "uz": "Qayta ishlashni kutmoqda",
    "en": "Awaiting processing",
    "kk": "Өңдеуді күтуде"
  },
  "В работе": {
    "ky": "Иштетилүүдө",
    "uz": "Jarayonda",
    "en": "In progress",
    "kk": "Өңделуде"
  },
  "Все активные заказы": {
    "ky": "Бардык активдүү буйрутмалар",
    "uz": "Barcha faol buyurtmalar",
    "en": "All active orders",
    "kk": "Барлық белсенді тапсырыстар"
  },
  "Выручка сегодня": {
    "ky": "Бүгүнкү түшүм",
    "uz": "Bugungi tushum",
    "en": "Today's revenue",
    "kk": "Бүгінгі түсім"
  },
  "Завершено сегодня": {
    "ky": "Бүгүн аяктаган",
    "uz": "Bugun yakunlangan",
    "en": "Completed today",
    "kk": "Бүгін аяқталған"
  },
  "Выручка за неделю": {
    "ky": "Апталык түшүм",
    "uz": "Haftalik tushum",
    "en": "Weekly revenue",
    "kk": "Апталық түсім"
  },
  "Завершённые заказы · Бишкек, UTC+6": {
    "ky": "Аяктаган буйрутмалар · Бишкек, UTC+6",
    "uz": "Yakunlangan buyurtmalar · Bishkek, UTC+6",
    "en": "Completed orders · Bishkek, UTC+6",
    "kk": "Аяқталған тапсырыстар · Бішкек, UTC+6"
  },
  "Выручка за последние семь дней": {
    "ky": "Акыркы жети күндүн түшүмү",
    "uz": "Oxirgi yetti kun tushumi",
    "en": "Revenue over the last seven days",
    "kk": "Соңғы жеті күннің түсімі"
  },
  "Не удалось загрузить график.": {
    "ky": "График жүктөлгөн жок.",
    "uz": "Grafikni yuklab bo‘lmadi.",
    "en": "Could not load chart.",
    "kk": "Графикті жүктеу мүмкін болмады."
  },
  "Последние заказы": {
    "ky": "Акыркы буйрутмалар",
    "uz": "Oxirgi buyurtmalar",
    "en": "Recent orders",
    "kk": "Соңғы тапсырыстар"
  },
  "Обновить обзор": {
    "ky": "Обзорду жаңыртуу",
    "uz": "Umumiy ko‘rinishni yangilash",
    "en": "Refresh overview",
    "kk": "Шолуды жаңарту"
  },
  "Все заказы": {
    "ky": "Бардык буйрутмалар",
    "uz": "Barcha buyurtmalar",
    "en": "All orders",
    "kk": "Барлық тапсырыстар"
  },
  "Загружаем заказы…": {
    "ky": "Буйрутмалар жүктөлүүдө…",
    "uz": "Buyurtmalar yuklanmoqda…",
    "en": "Loading orders…",
    "kk": "Тапсырыстар жүктелуде…"
  },
  "Заказов пока нет.": {
    "ky": "Азырынча буйрутмалар жок.",
    "uz": "Hozircha buyurtmalar yo‘q.",
    "en": "No orders yet.",
    "kk": "Әзірге тапсырыстар жоқ."
  },
  "Новая группа": {
    "ky": "Жаңы топ",
    "uz": "Yangi guruh",
    "en": "New group",
    "kk": "Жаңа топ"
  },
  "Добавить группу": {
    "ky": "Топ кошуу",
    "uz": "Guruh qo‘shish",
    "en": "Add group",
    "kk": "Топ қосу"
  },
  "У блюда пока нет модификаций.": {
    "ky": "Тамактын модификациялары азырынча жок.",
    "uz": "Taomda hozircha modifikatsiyalar yo‘q.",
    "en": "This dish has no modifiers yet.",
    "kk": "Тағамда әзірге модификациялар жоқ."
  },
  "Название группы": {
    "ky": "Топтун аталышы",
    "uz": "Guruh nomi",
    "en": "Group name",
    "kk": "Топ атауы"
  },
  "Удалить группу «{0}» и все её варианты? Изменение применится после сохранения блюда.": {
    "ky": "«{0}» тобун жана анын бардык варианттарын өчүрөсүзбү? Өзгөртүү тамакты сактагандан кийин колдонулат.",
    "uz": "«{0}» guruhi va uning barcha variantlarini o‘chirasizmi? O‘zgarish taom saqlangandan keyin qo‘llanadi.",
    "en": "Delete group “{0}” and all its options? This takes effect when the dish is saved.",
    "kk": "«{0}» тобын және барлық нұсқаларын жоясыз ба? Өзгеріс тағам сақталғаннан кейін қолданылады."
  },
  "Удалить группу": {
    "ky": "Топту өчүрүү",
    "uz": "Guruhni o‘chirish",
    "en": "Delete group",
    "kk": "Топты жою"
  },
  "Выбор клиента": {
    "ky": "Кардардын тандоосу",
    "uz": "Mijoz tanlovi",
    "en": "Customer choice",
    "kk": "Клиент таңдауы"
  },
  "Один вариант": {
    "ky": "Бир вариант",
    "uz": "Bitta variant",
    "en": "Single choice",
    "kk": "Бір нұсқа"
  },
  "Несколько вариантов": {
    "ky": "Бир нече вариант",
    "uz": "Bir nechta variant",
    "en": "Multiple choices",
    "kk": "Бірнеше нұсқа"
  },
  "Минимум": {
    "ky": "Минимум",
    "uz": "Eng kam",
    "en": "Minimum",
    "kk": "Ең аз"
  },
  "Максимум": {
    "ky": "Максимум",
    "uz": "Eng ko‘p",
    "en": "Maximum",
    "kk": "Ең көп"
  },
  "Обязательный выбор": {
    "ky": "Милдеттүү тандоо",
    "uz": "Majburiy tanlov",
    "en": "Required choice",
    "kk": "Міндетті таңдау"
  },
  "Дополнительные настройки группы": {
    "ky": "Топтун кошумча жөндөөлөрү",
    "uz": "Guruhning qo‘shimcha sozlamalari",
    "en": "Additional group settings",
    "kk": "Топтың қосымша баптаулары"
  },
  "Как начислять доплату": {
    "ky": "Кошумча төлөм кантип эсептелет",
    "uz": "Qo‘shimcha to‘lov qanday hisoblanadi",
    "en": "How add-on charges apply",
    "kk": "Қосымша төлем қалай есептеледі"
  },
  "За каждую порцию блюда": {
    "ky": "Тамактын ар бир порциясы үчүн",
    "uz": "Taomning har bir porsiyasi uchun",
    "en": "Per portion",
    "kk": "Тағамның әр порциясы үшін"
  },
  "Один раз за позицию заказа": {
    "ky": "Буйрутманын бир позициясына бир жолу",
    "uz": "Buyurtmadagi bitta mahsulot uchun bir marta",
    "en": "Once per order line",
    "kk": "Тапсырыс позициясына бір рет"
  },
  "Показывать варианты": {
    "ky": "Варианттарды көрсөтүү",
    "uz": "Variantlarni ko‘rsatish",
    "en": "Display options",
    "kk": "Нұсқаларды көрсету"
  },
  "Карточками с фото": {
    "ky": "Сүрөтү бар карточкалар",
    "uz": "Rasmli kartochkalar",
    "en": "Photo cards",
    "kk": "Суретті карточкалар"
  },
  "Списком": {
    "ky": "Тизме түрүндө",
    "uz": "Ro‘yxat shaklida",
    "en": "List",
    "kk": "Тізім түрінде"
  },
  "Название варианта": {
    "ky": "Варианттын аталышы",
    "uz": "Variant nomi",
    "en": "Option name",
    "kk": "Нұсқа атауы"
  },
  "Например, дополнительный сыр": {
    "ky": "Мисалы, кошумча сыр",
    "uz": "Masalan, qo‘shimcha pishloq",
    "en": "For example, extra cheese",
    "kk": "Мысалы, қосымша ірімшік"
  },
  "Макс. кол-во": {
    "ky": "Макс. саны",
    "uz": "Eng ko‘p miqdor",
    "en": "Max. quantity",
    "kk": "Ең көп саны"
  },
  "Удалить вариант {0}": {
    "ky": "{0} вариантын өчүрүү",
    "uz": "{0} variantini o‘chirish",
    "en": "Delete option {0}",
    "kk": "{0} нұсқасын жою"
  },
  "Удалить вариант «{0}»? Изменение применится после сохранения блюда.": {
    "ky": "«{0}» вариантын өчүрөсүзбү? Өзгөртүү тамакты сактагандан кийин колдонулат.",
    "uz": "«{0}» variantini o‘chirasizmi? O‘zgarish taom saqlangandan keyin qo‘llanadi.",
    "en": "Delete option “{0}”? This takes effect when the dish is saved.",
    "kk": "«{0}» нұсқасын жоясыз ба? Өзгеріс тағам сақталғаннан кейін қолданылады."
  },
  "Фотография варианта": {
    "ky": "Варианттын сүрөтү",
    "uz": "Variant rasmi",
    "en": "Option photo",
    "kk": "Нұсқа суреті"
  },
  "Фото варианта": {
    "ky": "Варианттын сүрөтү",
    "uz": "Variant rasmi",
    "en": "Option photo",
    "kk": "Нұсқа суреті"
  },
  "Изображение для выбора в карточке блюда.": {
    "ky": "Тамактын карточкасында тандоо үчүн сүрөт.",
    "uz": "Taom kartochkasida tanlash uchun rasm.",
    "en": "Image for choosing an option in the dish card.",
    "kk": "Тағам карточкасында таңдауға арналған сурет."
  },
  "Вариант доступен клиентам": {
    "ky": "Вариант кардарларга жеткиликтүү",
    "uz": "Variant mijozlar uchun mavjud",
    "en": "Option available to customers",
    "kk": "Нұсқа клиенттерге қолжетімді"
  },
  "Добавить вариант": {
    "ky": "Вариант кошуу",
    "uz": "Variant qo‘shish",
    "en": "Add option",
    "kk": "Нұсқа қосу"
  },
  "Пароль изменён. Другие сеансы завершены.": {
    "ky": "Сырсөз өзгөртүлдү. Башка сеанстар жабылды.",
    "uz": "Parol o‘zgartirildi. Boshqa seanslar tugatildi.",
    "en": "Password changed. Other sessions have ended.",
    "kk": "Құпиясөз өзгертілді. Басқа сеанстар аяқталды."
  },
  "Не удалось изменить пароль": {
    "ky": "Сырсөз өзгөртүлгөн жок",
    "uz": "Parolni o‘zgartirib bo‘lmadi",
    "en": "Could not change password",
    "kk": "Құпиясөзді өзгерту мүмкін болмады"
  },
  "Учётная запись": {
    "ky": "Аккаунт",
    "uz": "Hisob",
    "en": "Account",
    "kk": "Тіркелгі"
  },
  "Ваш персональный доступ": {
    "ky": "Сиздин жеке кирүү укугуңуз",
    "uz": "Shaxsiy kirish huquqingiz",
    "en": "Your personal access",
    "kk": "Сіздің жеке кіру құқығыңыз"
  },
  "Роль": {
    "ky": "Роль",
    "uz": "Rol",
    "en": "Role",
    "kk": "Рөл"
  },
  "Изменить пароль": {
    "ky": "Сырсөздү өзгөртүү",
    "uz": "Parolni o‘zgartirish",
    "en": "Change password",
    "kk": "Құпиясөзді өзгерту"
  },
  "Не менее 12 символов": {
    "ky": "Кеминде 12 белги",
    "uz": "Kamida 12 ta belgi",
    "en": "At least 12 characters",
    "kk": "Кемінде 12 таңба"
  },
  "Текущий пароль": {
    "ky": "Учурдагы сырсөз",
    "uz": "Joriy parol",
    "en": "Current password",
    "kk": "Қазіргі құпиясөз"
  },
  "Новый пароль": {
    "ky": "Жаңы сырсөз",
    "uz": "Yangi parol",
    "en": "New password",
    "kk": "Жаңа құпиясөз"
  },
  "Сохранить пароль": {
    "ky": "Сырсөздү сактоо",
    "uz": "Parolni saqlash",
    "en": "Save password",
    "kk": "Құпиясөзді сақтау"
  },
  "Не удалось загрузить акции": {
    "ky": "Акциялар жүктөлгөн жок",
    "uz": "Aksiyalarni yuklab bo‘lmadi",
    "en": "Could not load promotions",
    "kk": "Акцияларды жүктеу мүмкін болмады"
  },
  "Загрузите изображение акции": {
    "ky": "Акциянын сүрөтүн жүктөңүз",
    "uz": "Aksiya rasmini yuklang",
    "en": "Upload a promotion image",
    "kk": "Акция суретін жүктеңіз"
  },
  "Укажите полную ссылку, начинающуюся с https:// или http://": {
    "ky": "https:// же http:// менен башталган толук шилтемени киргизиңиз",
    "uz": "https:// yoki http:// bilan boshlanadigan to‘liq havolani kiriting",
    "en": "Enter a full URL starting with https:// or http://",
    "kk": "https:// немесе http:// арқылы басталатын толық сілтемені енгізіңіз"
  },
  "Акция обновлена": {
    "ky": "Акция жаңыртылды",
    "uz": "Aksiya yangilandi",
    "en": "Promotion updated",
    "kk": "Акция жаңартылды"
  },
  "Акция добавлена": {
    "ky": "Акция кошулду",
    "uz": "Aksiya qo‘shildi",
    "en": "Promotion added",
    "kk": "Акция қосылды"
  },
  "Не удалось сохранить акцию": {
    "ky": "Акция сакталган жок",
    "uz": "Aksiyani saqlab bo‘lmadi",
    "en": "Could not save promotion",
    "kk": "Акцияны сақтау мүмкін болмады"
  },
  "Акция выключена": {
    "ky": "Акция өчүрүлдү",
    "uz": "Aksiya o‘chirildi",
    "en": "Promotion disabled",
    "kk": "Акция өшірілді"
  },
  "Акция включена": {
    "ky": "Акция күйгүзүлдү",
    "uz": "Aksiya yoqildi",
    "en": "Promotion enabled",
    "kk": "Акция қосылды"
  },
  "Не удалось изменить акцию": {
    "ky": "Акция өзгөртүлгөн жок",
    "uz": "Aksiyani o‘zgartirib bo‘lmadi",
    "en": "Could not update promotion",
    "kk": "Акцияны өзгерту мүмкін болмады"
  },
  "Акция удалена полностью": {
    "ky": "Акция толук өчүрүлдү",
    "uz": "Aksiya butunlay o‘chirildi",
    "en": "Promotion permanently deleted",
    "kk": "Акция толығымен жойылды"
  },
  "Не удалось удалить акцию": {
    "ky": "Акция өчүрүлгөн жок",
    "uz": "Aksiyani o‘chirib bo‘lmadi",
    "en": "Could not delete promotion",
    "kk": "Акцияны жою мүмкін болмады"
  },
  "Загружаем акции…": {
    "ky": "Акциялар жүктөлүүдө…",
    "uz": "Aksiyalar yuklanmoqda…",
    "en": "Loading promotions…",
    "kk": "Акциялар жүктелуде…"
  },
  "Акции и предложения": {
    "ky": "Акциялар жана сунуштар",
    "uz": "Aksiyalar va takliflar",
    "en": "Promotions and offers",
    "kk": "Акциялар және ұсыныстар"
  },
  "Подробнее": {
    "ky": "Кененирээк",
    "uz": "Batafsil",
    "en": "Learn more",
    "kk": "Толығырақ"
  },
  "Добавить акцию": {
    "ky": "Акция кошуу",
    "uz": "Aksiya qo‘shish",
    "en": "Add promotion",
    "kk": "Акция қосу"
  },
  "Активна": {
    "ky": "Активдүү",
    "uz": "Faol",
    "en": "Active",
    "kk": "Белсенді"
  },
  "Выключена": {
    "ky": "Өчүрүлгөн",
    "uz": "O‘chirilgan",
    "en": "Disabled",
    "kk": "Өшірілген"
  },
  "Без кнопки": {
    "ky": "Баскычсыз",
    "uz": "Tugmasiz",
    "en": "No button",
    "kk": "Түймесіз"
  },
  "· позиция": {
    "ky": "· орун",
    "uz": "· tartib",
    "en": "· position",
    "kk": "· орын"
  },
  "Выключить": {
    "ky": "Өчүрүү",
    "uz": "O‘chirish",
    "en": "Disable",
    "kk": "Өшіру"
  },
  "Включить": {
    "ky": "Күйгүзүү",
    "uz": "Yoqish",
    "en": "Enable",
    "kk": "Қосу"
  },
  "акцию": {
    "ky": "акцияны",
    "uz": "aksiyani",
    "en": "promotion",
    "kk": "акцияны"
  },
  "Акций пока нет": {
    "ky": "Азырынча акциялар жок",
    "uz": "Hozircha aksiyalar yo‘q",
    "en": "No promotions yet",
    "kk": "Әзірге акциялар жоқ"
  },
  "Добавьте предложение, чтобы показать его клиентам.": {
    "ky": "Кардарларга көрсөтүү үчүн сунуш кошуңуз.",
    "uz": "Mijozlarga ko‘rsatish uchun taklif qo‘shing.",
    "en": "Add an offer to show your customers.",
    "kk": "Клиенттерге көрсету үшін ұсыныс қосыңыз."
  },
  "Редактировать акцию": {
    "ky": "Акцияны түзөтүү",
    "uz": "Aksiyani tahrirlash",
    "en": "Edit promotion",
    "kk": "Акцияны өңдеу"
  },
  "Новая акция": {
    "ky": "Жаңы акция",
    "uz": "Yangi aksiya",
    "en": "New promotion",
    "kk": "Жаңа акция"
  },
  "Баннер акции": {
    "ky": "Акциянын баннери",
    "uz": "Aksiya banneri",
    "en": "Promotion banner",
    "kk": "Акция баннері"
  },
  "Текст кнопки": {
    "ky": "Баскычтын тексти",
    "uz": "Tugma matni",
    "en": "Button text",
    "kk": "Түйме мәтіні"
  },
  "Порядок показа": {
    "ky": "Көрсөтүү тартиби",
    "uz": "Ko‘rsatish tartibi",
    "en": "Display order",
    "kk": "Көрсету реті"
  },
  "Ссылка кнопки": {
    "ky": "Баскычтын шилтемеси",
    "uz": "Tugma havolasi",
    "en": "Button URL",
    "kk": "Түйме сілтемесі"
  },
  "Показывать предложение клиентам": {
    "ky": "Сунушту кардарларга көрсөтүү",
    "uz": "Taklifni mijozlarga ko‘rsatish",
    "en": "Show offer to customers",
    "kk": "Ұсынысты клиенттерге көрсету"
  },
  "Сохранить акцию": {
    "ky": "Акцияны сактоо",
    "uz": "Aksiyani saqlash",
    "en": "Save promotion",
    "kk": "Акцияны сақтау"
  },
  "Удалить акцию?": {
    "ky": "Акцияны өчүрөсүзбү?",
    "uz": "Aksiyani o‘chirasizmi?",
    "en": "Delete promotion?",
    "kk": "Акцияны жоясыз ба?"
  },
  "Удаление нельзя отменить.": {
    "ky": "Өчүрүүнү жокко чыгарууга болбойт.",
    "uz": "O‘chirishni bekor qilib bo‘lmaydi.",
    "en": "Deletion cannot be undone.",
    "kk": "Жоюды болдырмау мүмкін емес."
  },
  "Акция «": {
    "ky": "«",
    "uz": "«",
    "en": "Promotion “",
    "kk": "«"
  },
  "» исчезнет во всех городах, где она показывается.": {
    "ky": "» акциясы көрсөтүлгөн бардык шаарларда жоголот.",
    "uz": "» aksiyasi ko‘rsatilgan barcha shaharlarda yo‘qoladi.",
    "en": "” will disappear from every city where it is shown.",
    "kk": "» акциясы көрсетілген барлық қалаларда жоғалады."
  },
  "Удаляем…": {
    "ky": "Өчүрүлүүдө…",
    "uz": "O‘chirilmoqda…",
    "en": "Deleting…",
    "kk": "Жойылуда…"
  },
  "Удалить акцию": {
    "ky": "Акцияны өчүрүү",
    "uz": "Aksiyani o‘chirish",
    "en": "Delete promotion",
    "kk": "Акцияны жою"
  },
  "Действия: {0}": {
    "ky": "Аракеттер: {0}",
    "uz": "Amallar: {0}",
    "en": "Actions: {0}",
    "kk": "Әрекеттер: {0}"
  },
  "Редактировать": {
    "ky": "Түзөтүү",
    "uz": "Tahrirlash",
    "en": "Edit",
    "kk": "Өңдеу"
  },
  "Удалить {0} «{1}»": {
    "ky": "«{1}» {0} өчүрүү",
    "uz": "«{1}» {0} o‘chirish",
    "en": "Delete {0} “{1}”",
    "kk": "«{1}» {0} жою"
  },
  "Часы работы": {
    "ky": "Иш сааттары",
    "uz": "Ish soatlari",
    "en": "Business hours",
    "kk": "Жұмыс сағаттары"
  },
  "EDU POS": {
    "ky": "EDU POS",
    "uz": "EDU POS",
    "en": "EDU POS",
    "kk": "EDU POS"
  },
  "Пн": {
    "ky": "Дш",
    "uz": "Du",
    "en": "Mon",
    "kk": "Дс"
  },
  "Вт": {
    "ky": "Шш",
    "uz": "Se",
    "en": "Tue",
    "kk": "Сс"
  },
  "Ср": {
    "ky": "Шр",
    "uz": "Ch",
    "en": "Wed",
    "kk": "Ср"
  },
  "Чт": {
    "ky": "Бш",
    "uz": "Pa",
    "en": "Thu",
    "kk": "Бс"
  },
  "Пт": {
    "ky": "Жм",
    "uz": "Ju",
    "en": "Fri",
    "kk": "Жм"
  },
  "Сб": {
    "ky": "Иш",
    "uz": "Sh",
    "en": "Sat",
    "kk": "Сб"
  },
  "Вс": {
    "ky": "Жш",
    "uz": "Ya",
    "en": "Sun",
    "kk": "Жс"
  },
  "Ещё не выполнялась": {
    "ky": "Азырынча аткарылган эмес",
    "uz": "Hali bajarilmagan",
    "en": "Not run yet",
    "kk": "Әлі орындалмаған"
  },
  "Не удалось загрузить настройки": {
    "ky": "Жөндөөлөр жүктөлгөн жок",
    "uz": "Sozlamalarni yuklab bo‘lmadi",
    "en": "Could not load settings",
    "kk": "Баптауларды жүктеу мүмкін болмады"
  },
  "Не удалось загрузить товары": {
    "ky": "Товарлар жүктөлгөн жок",
    "uz": "Mahsulotlarni yuklab bo‘lmadi",
    "en": "Could not load products",
    "kk": "Тауарларды жүктеу мүмкін болмады"
  },
  "общего каталога": {
    "ky": "жалпы каталогдун",
    "uz": "umumiy katalogning",
    "en": "shared catalogue",
    "kk": "ортақ каталогтың"
  },
  "Для зоны доставки нужно минимум три точки": {
    "ky": "Жеткирүү аймагы үчүн кеминде үч чекит керек",
    "uz": "Yetkazish hududi uchun kamida uchta nuqta kerak",
    "en": "Delivery area requires at least three points",
    "kk": "Жеткізу аймағы үшін кемінде үш нүкте қажет"
  },
  "Настройки сохранены": {
    "ky": "Жөндөөлөр сакталды",
    "uz": "Sozlamalar saqlandi",
    "en": "Settings saved",
    "kk": "Баптаулар сақталды"
  },
  "Не удалось сохранить настройки": {
    "ky": "Жөндөөлөр сакталган жок",
    "uz": "Sozlamalarni saqlab bo‘lmadi",
    "en": "Could not save settings",
    "kk": "Баптауларды сақтау мүмкін болмады"
  },
  "Точка самовывоза обновлена": {
    "ky": "Алып кетүү пункту жаңыртылды",
    "uz": "Olib ketish punkti yangilandi",
    "en": "Pickup location updated",
    "kk": "Алып кету орны жаңартылды"
  },
  "Точка самовывоза добавлена": {
    "ky": "Алып кетүү пункту кошулду",
    "uz": "Olib ketish punkti qo‘shildi",
    "en": "Pickup location added",
    "kk": "Алып кету орны қосылды"
  },
  "Не удалось сохранить точку": {
    "ky": "Пункт сакталган жок",
    "uz": "Punktni saqlab bo‘lmadi",
    "en": "Could not save location",
    "kk": "Орынды сақтау мүмкін болмады"
  },
  "Сначала вставьте ссылку на Яндекс Карты": {
    "ky": "Алгач Яндекс Картага шилтемени киргизиңиз",
    "uz": "Avval Yandex Xaritalar havolasini kiriting",
    "en": "Paste a Yandex Maps URL first",
    "kk": "Алдымен Яндекс Карта сілтемесін енгізіңіз"
  },
  "Координаты определены": {
    "ky": "Координаттар аныкталды",
    "uz": "Koordinatalar aniqlandi",
    "en": "Coordinates found",
    "kk": "Координаттар анықталды"
  },
  "Не удалось определить координаты": {
    "ky": "Координаттар аныкталган жок",
    "uz": "Koordinatalarni aniqlab bo‘lmadi",
    "en": "Could not find coordinates",
    "kk": "Координаттарды анықтау мүмкін болмады"
  },
  "Удалить точку «{0}»?": {
    "ky": "«{0}» пунктун өчүрөсүзбү?",
    "uz": "«{0}» punktini o‘chirasizmi?",
    "en": "Delete location “{0}”?",
    "kk": "«{0}» орнын жоясыз ба?"
  },
  "Точка самовывоза удалена": {
    "ky": "Алып кетүү пункту өчүрүлдү",
    "uz": "Olib ketish punkti o‘chirildi",
    "en": "Pickup location deleted",
    "kk": "Алып кету орны жойылды"
  },
  "Не удалось удалить точку": {
    "ky": "Пункт өчүрүлгөн жок",
    "uz": "Punktni o‘chirib bo‘lmadi",
    "en": "Could not delete location",
    "kk": "Орынды жою мүмкін болмады"
  },
  "EDU POS отвечает. Получено блюд: {0}": {
    "ky": "EDU POS жооп берди. Алынган тамактар: {0}",
    "uz": "EDU POS javob berdi. Olingan taomlar: {0}",
    "en": "EDU POS is responding. Dishes received: {0}",
    "kk": "EDU POS жауап берді. Алынған тағамдар: {0}"
  },
  "EDU POS не отвечает": {
    "ky": "EDU POS жооп бербей жатат",
    "uz": "EDU POS javob bermayapti",
    "en": "EDU POS is not responding",
    "kk": "EDU POS жауап бермейді"
  },
  "Сверка завершена: сопоставлено {0} из {1}, недоступно {2}": {
    "ky": "Текшерүү бүттү: {1} ичинен {0} дал келди, {2} жеткиликсиз",
    "uz": "Tekshirish tugadi: {1} tadan {0} tasi moslandi, {2} tasi mavjud emas",
    "en": "Reconciliation complete: {0} of {1} matched, {2} unavailable",
    "kk": "Салыстыру аяқталды: {1} ішінен {0} сәйкестендірілді, {2} қолжетімсіз"
  },
  "Не удалось сверить меню": {
    "ky": "Меню текшерилген жок",
    "uz": "Menyuni solishtirib bo‘lmadi",
    "en": "Could not reconcile menu",
    "kk": "Мәзірді салыстыру мүмкін болмады"
  },
  "В EDU POS отправлено: {0} категорий и {1} блюд": {
    "ky": "EDU POSка жөнөтүлдү: {0} категория жана {1} тамак",
    "uz": "EDU POSga yuborildi: {0} ta toifa va {1} ta taom",
    "en": "Sent to EDU POS: {0} categories and {1} dishes",
    "kk": "EDU POS-қа жіберілді: {0} санат және {1} тағам"
  },
  "EDU POS не принял меню": {
    "ky": "EDU POS менюну кабыл алган жок",
    "uz": "EDU POS menyuni qabul qilmadi",
    "en": "EDU POS did not accept the menu",
    "kk": "EDU POS мәзірді қабылдамады"
  },
  "Загружаем настройки…": {
    "ky": "Жөндөөлөр жүктөлүүдө…",
    "uz": "Sozlamalar yuklanmoqda…",
    "en": "Loading settings…",
    "kk": "Баптаулар жүктелуде…"
  },
  "Город не найден.": {
    "ky": "Шаар табылган жок.",
    "uz": "Shahar topilmadi.",
    "en": "City not found.",
    "kk": "Қала табылмады."
  },
  "Разделы настроек": {
    "ky": "Жөндөө бөлүмдөрү",
    "uz": "Sozlamalar bo‘limlari",
    "en": "Settings sections",
    "kk": "Баптау бөлімдері"
  },
  "Поиск платных топпингов": {
    "ky": "Акы төлөнүүчү топпингдерди издөө",
    "uz": "Pulli toppinglarni qidirish",
    "en": "Search paid toppings",
    "kk": "Ақылы топпингтерді іздеу"
  },
  "Найти товар для топпинга": {
    "ky": "Топпинг үчүн товар табуу",
    "uz": "Topping uchun mahsulot topish",
    "en": "Find a product for a topping",
    "kk": "Топпингке арналған тауарды табу"
  },
  "Основные настройки": {
    "ky": "Негизги жөндөөлөр",
    "uz": "Asosiy sozlamalar",
    "en": "General settings",
    "kk": "Негізгі баптаулар"
  },
  "Телефон кухни": {
    "ky": "Ашкананын телефону",
    "uz": "Oshxona telefoni",
    "en": "Kitchen phone",
    "kk": "Асүй телефоны"
  },
  "Телефон поддержки": {
    "ky": "Колдоо кызматынын телефону",
    "uz": "Yordam xizmati telefoni",
    "en": "Support phone",
    "kk": "Қолдау қызметінің телефоны"
  },
  "Скрытый город недоступен для новых заказов.": {
    "ky": "Жашырылган шаар жаңы буйрутмалар үчүн жеткиликсиз.",
    "uz": "Yashirilgan shahar yangi buyurtmalar uchun mavjud emas.",
    "en": "Hidden cities are unavailable for new orders.",
    "kk": "Жасырылған қала жаңа тапсырыстар үшін қолжетімсіз."
  },
  "Расписание приёма заказов": {
    "ky": "Буйрутма кабыл алуу графиги",
    "uz": "Buyurtma qabul qilish jadvali",
    "en": "Order acceptance schedule",
    "kk": "Тапсырыс қабылдау кестесі"
  },
  "Время Бишкека · UTC+6": {
    "ky": "Бишкек убактысы · UTC+6",
    "uz": "Bishkek vaqti · UTC+6",
    "en": "Bishkek time · UTC+6",
    "kk": "Бішкек уақыты · UTC+6"
  },
  "Начало работы": {
    "ky": "Иштин башталышы",
    "uz": "Ish boshlanishi",
    "en": "Opening time",
    "kk": "Жұмыс басталуы"
  },
  "Окончание работы": {
    "ky": "Иштин аякташы",
    "uz": "Ish tugashi",
    "en": "Closing time",
    "kk": "Жұмыс аяқталуы"
  },
  "Круглосуточно": {
    "ky": "Күнү-түнү",
    "uz": "Kecha-kunduz",
    "en": "24 hours",
    "kk": "Тәулік бойы"
  },
  "Рабочие дни": {
    "ky": "Иш күндөрү",
    "uz": "Ish kunlari",
    "en": "Working days",
    "kk": "Жұмыс күндері"
  },
  "Условия доставки": {
    "ky": "Жеткирүү шарттары",
    "uz": "Yetkazish shartlari",
    "en": "Delivery terms",
    "kk": "Жеткізу шарттары"
  },
  "Минимальный заказ": {
    "ky": "Минималдуу буйрутма",
    "uz": "Eng kam buyurtma",
    "en": "Minimum order",
    "kk": "Ең аз тапсырыс"
  },
  "Максимальный заказ": {
    "ky": "Максималдуу буйрутма",
    "uz": "Eng katta buyurtma",
    "en": "Maximum order",
    "kk": "Ең көп тапсырыс"
  },
  "Стоимость доставки": {
    "ky": "Жеткирүү акысы",
    "uz": "Yetkazish narxi",
    "en": "Delivery fee",
    "kk": "Жеткізу ақысы"
  },
  "Бесплатная доставка от": {
    "ky": "Акысыз жеткирүү суммасы",
    "uz": "Bepul yetkazish summasi",
    "en": "Free delivery from",
    "kk": "Тегін жеткізу сомасы"
  },
  "Ожидаемое время, минут": {
    "ky": "Болжолдуу убакыт, мүнөт",
    "uz": "Taxminiy vaqt, daqiqa",
    "en": "Estimated time, minutes",
    "kk": "Болжамды уақыт, минут"
  },
  "Зона доставки": {
    "ky": "Жеткирүү аймагы",
    "uz": "Yetkazish hududi",
    "en": "Delivery area",
    "kk": "Жеткізу аймағы"
  },
  "Справочник бесплатной комплектации": {
    "ky": "Акысыз комплектациянын тизмеси",
    "uz": "Bepul to‘plam ma’lumotnomasi",
    "en": "Free included-item catalogue",
    "kk": "Тегін жинақ анықтамалығы"
  },
  "Меню этого города использует каталог города «": {
    "ky": "Бул шаардын менюсу «",
    "uz": "Bu shahar menyusi «",
    "en": "This city uses the catalogue of “",
    "kk": "Бұл қала мәзірі «"
  },
  "». Комплектация блюд настраивается в меню, а бесплатные позиции справочника — в настройках города «": {
    "ky": "» шаарынын каталогун колдонот. Тамактын комплектациясы менюда, акысыз позициялардын тизмеси «",
    "uz": "» shahri katalogidan foydalanadi. Taom to‘plami menyuda, bepul mahsulotlar esa «",
    "en": "”. Included items are configured in the menu; the free-item catalogue is in the settings of “",
    "kk": "» қаласының каталогын қолданады. Тағам жинағы мәзірде, ал тегін позициялар «"
  },
  "Открыть настройки:": {
    "ky": "Жөндөөлөрдү ачуу:",
    "uz": "Sozlamalarni ochish:",
    "en": "Open settings:",
    "kk": "Баптауларды ашу:"
  },
  "В справочнике пока нет бесплатных позиций.": {
    "ky": "Тизмеде азырынча акысыз позициялар жок.",
    "uz": "Ma’lumotnomada hozircha bepul mahsulotlar yo‘q.",
    "en": "No free items in the catalogue yet.",
    "kk": "Анықтамалықта әзірге тегін позициялар жоқ."
  },
  "Бесплатные позиции для комплектации блюд.": {
    "ky": "Тамактарга кошулуучу акысыз позициялар.",
    "uz": "Taomlarga qo‘shiladigan bepul mahsulotlar.",
    "en": "Free items included with dishes.",
    "kk": "Тағамдарға кіретін тегін позициялар."
  },
  "Новая позиция": {
    "ky": "Жаңы позиция",
    "uz": "Yangi mahsulot",
    "en": "New item",
    "kk": "Жаңа позиция"
  },
  "Добавить позицию": {
    "ky": "Позиция кошуу",
    "uz": "Mahsulot qo‘shish",
    "en": "Add item",
    "kk": "Позиция қосу"
  },
  "Комплектация: {0}": {
    "ky": "Комплектация: {0}",
    "uz": "To‘plam: {0}",
    "en": "Included items: {0}",
    "kk": "Жинақ құрамы: {0}"
  },
  "Изображение": {
    "ky": "Сүрөт",
    "uz": "Rasm",
    "en": "Image",
    "kk": "Сурет"
  },
  "Фото для корзины и карточки товара.": {
    "ky": "Себет жана товардын карточкасы үчүн сүрөт.",
    "uz": "Savat va mahsulot kartochkasi uchun rasm.",
    "en": "Photo for the basket and product card.",
    "kk": "Себет пен тауар карточкасына арналған сурет."
  },
  "Количество задаётся в комплектации каждого блюда.": {
    "ky": "Саны ар бир тамактын комплектациясында белгиленет.",
    "uz": "Miqdor har bir taom to‘plamida belgilanadi.",
    "en": "Quantity is set in each dish's included items.",
    "kk": "Саны әр тағамның жинағында белгіленеді."
  },
  "Доступно для выбора в блюдах": {
    "ky": "Тамактарда тандоого жеткиликтүү",
    "uz": "Taomlarda tanlash uchun mavjud",
    "en": "Available to include with dishes",
    "kk": "Тағамдарда таңдауға қолжетімді"
  },
  "Удалить «{0}» из справочника? Проверьте комплектацию блюд после сохранения.": {
    "ky": "«{0}» позициясын тизмеден өчүрөсүзбү? Сактагандан кийин тамактардын комплектациясын текшериңиз.",
    "uz": "«{0}» mahsulotini ma’lumotnomadan o‘chirasizmi? Saqlagandan keyin taomlar to‘plamini tekshiring.",
    "en": "Remove “{0}” from the catalogue? Check dish contents after saving.",
    "kk": "«{0}» позициясын анықтамалықтан жоясыз ба? Сақтағаннан кейін тағам жинағын тексеріңіз."
  },
  "В справочнике пока нет бесплатных позиций. Добавьте их, чтобы настроить комплектацию блюд.": {
    "ky": "Тизмеде азырынча акысыз позициялар жок. Тамактардын комплектациясын жөндөө үчүн аларды кошуңуз.",
    "uz": "Ma’lumotnomada bepul mahsulotlar yo‘q. Taomlar to‘plamini sozlash uchun ularni qo‘shing.",
    "en": "No free items yet. Add them to configure what comes with each dish.",
    "kk": "Анықтамалықта тегін позициялар жоқ. Тағам жинағын баптау үшін оларды қосыңыз."
  },
  "Платные топпинги": {
    "ky": "Акы төлөнүүчү топпингдер",
    "uz": "Pulli toppinglar",
    "en": "Paid toppings",
    "kk": "Ақылы топпингтер"
  },
  "Товары из меню, доступные как добавки.": {
    "ky": "Кошумча катары жеткиликтүү меню товарлары.",
    "uz": "Qo‘shimcha sifatida mavjud menyu mahsulotlari.",
    "en": "Menu products available as add-ons.",
    "kk": "Қосымша ретінде қолжетімді мәзір тауарлары."
  },
  "сом": {
    "ky": "сом",
    "uz": "som",
    "en": "KGS",
    "kk": "сом"
  },
  "Сохранить настройки": {
    "ky": "Жөндөөлөрдү сактоо",
    "uz": "Sozlamalarni saqlash",
    "en": "Save settings",
    "kk": "Баптауларды сақтау"
  },
  "Точки самовывоза": {
    "ky": "Алып кетүү пункттары",
    "uz": "Olib ketish punktlari",
    "en": "Pickup locations",
    "kk": "Алып кету орындары"
  },
  "Добавить точку": {
    "ky": "Пункт кошуу",
    "uz": "Punkt qo‘shish",
    "en": "Add location",
    "kk": "Орын қосу"
  },
  "Точка самовывоза": {
    "ky": "Алып кетүү пункту",
    "uz": "Olib ketish punkti",
    "en": "Pickup location",
    "kk": "Алып кету орны"
  },
  "Время работы не указано": {
    "ky": "Иш убактысы көрсөтүлгөн эмес",
    "uz": "Ish vaqti kiritilmagan",
    "en": "Business hours not specified",
    "kk": "Жұмыс уақыты көрсетілмеген"
  },
  "Точек самовывоза пока нет.": {
    "ky": "Азырынча алып кетүү пункттары жок.",
    "uz": "Hozircha olib ketish punktlari yo‘q.",
    "en": "No pickup locations yet.",
    "kk": "Әзірге алып кету орындары жоқ."
  },
  "Подключение EDU POS": {
    "ky": "EDU POSка туташуу",
    "uz": "EDU POS ulanishi",
    "en": "EDU POS connection",
    "kk": "EDU POS қосылымы"
  },
  "Настроено": {
    "ky": "Жөндөлгөн",
    "uz": "Sozlangan",
    "en": "Configured",
    "kk": "Бапталған"
  },
  "Не настроено": {
    "ky": "Жөндөлгөн эмес",
    "uz": "Sozlanmagan",
    "en": "Not configured",
    "kk": "Бапталмаған"
  },
  "Заказы синхронизируются каждые": {
    "ky": "Буйрутмалар синхрондолот, ар бир",
    "uz": "Buyurtmalar sinxronlanadi, har",
    "en": "Orders synchronise every",
    "kk": "Тапсырыстар синхрондалады, әр"
  },
  "сек.": {
    "ky": "сек.",
    "uz": "soniya",
    "en": "sec.",
    "kk": "сек."
  },
  "Проверить подключение": {
    "ky": "Туташууну текшерүү",
    "uz": "Ulanishni tekshirish",
    "en": "Test connection",
    "kk": "Қосылымды тексеру"
  },
  "Последняя сверка меню": {
    "ky": "Менюнун акыркы текшерүүсү",
    "uz": "Menyuning oxirgi solishtiruvi",
    "en": "Last menu reconciliation",
    "kk": "Мәзірдің соңғы салыстыруы"
  },
  "Последняя сверка стоп-листа": {
    "ky": "Стоп-тизменин акыркы текшерүүсү",
    "uz": "Stop-ro‘yxatning oxirgi solishtiruvi",
    "en": "Last unavailable-item reconciliation",
    "kk": "Стоп-тізімнің соңғы салыстыруы"
  },
  "Последняя ошибка": {
    "ky": "Акыркы ката",
    "uz": "Oxirgi xato",
    "en": "Last error",
    "kk": "Соңғы қате"
  },
  "Проверьте подключение к EDU POS. Подробности доступны в журнале сервера.": {
    "ky": "EDU POSка туташууну текшериңиз. Толук маалымат сервердин журналында.",
    "uz": "EDU POS ulanishini tekshiring. Tafsilotlar server jurnalida.",
    "en": "Check the EDU POS connection. Details are in the server log.",
    "kk": "EDU POS қосылымын тексеріңіз. Мәліметтер сервер журналында."
  },
  "Сверить меню из EDU POS": {
    "ky": "EDU POS менюсун текшерүү",
    "uz": "EDU POS menyusini solishtirish",
    "en": "Reconcile menu from EDU POS",
    "kk": "EDU POS мәзірін салыстыру"
  },
  "Обновит цены, сопоставления блюд и стоп-лист на сайте.": {
    "ky": "Сайттагы бааларды, тамактардын дал келүүсүн жана стоп-тизмени жаңыртат.",
    "uz": "Saytdagi narxlar, taom mosliklari va stop-ro‘yxatni yangilaydi.",
    "en": "Updates prices, dish mappings and unavailable items on the website.",
    "kk": "Сайттағы бағаларды, тағам сәйкестіктерін және стоп-тізімді жаңартады."
  },
  "Сверяем…": {
    "ky": "Текшерилүүдө…",
    "uz": "Solishtirilmoqda…",
    "en": "Reconciling…",
    "kk": "Салыстырылуда…"
  },
  "Сверить меню": {
    "ky": "Менюну текшерүү",
    "uz": "Menyuni solishtirish",
    "en": "Reconcile menu",
    "kk": "Мәзірді салыстыру"
  },
  "Экспортировать меню в EDU POS": {
    "ky": "Менюну EDU POSка экспорттоо",
    "uz": "Menyuni EDU POSga eksport qilish",
    "en": "Export menu to EDU POS",
    "kk": "Мәзірді EDU POS-қа экспорттау"
  },
  "Отправит категории, блюда, цены, доступность и модификации выбранного города.": {
    "ky": "Тандалган шаардын категорияларын, тамактарын, бааларын, жеткиликтүүлүгүн жана модификацияларын жөнөтөт.",
    "uz": "Tanlangan shaharning toifalari, taomlari, narxlari, mavjudligi va modifikatsiyalarini yuboradi.",
    "en": "Sends the selected city's categories, dishes, prices, availability and modifiers.",
    "kk": "Таңдалған қаланың санаттарын, тағамдарын, бағаларын, қолжетімділігін және модификацияларын жібереді."
  },
  "Экспортируем…": {
    "ky": "Экспорттолууда…",
    "uz": "Eksport qilinmoqda…",
    "en": "Exporting…",
    "kk": "Экспортталуда…"
  },
  "Экспортировать меню": {
    "ky": "Менюну экспорттоо",
    "uz": "Menyuni eksport qilish",
    "en": "Export menu",
    "kk": "Мәзірді экспорттау"
  },
  "Как работает синхронизация": {
    "ky": "Синхрондоштуруу кантип иштейт",
    "uz": "Sinxronlash qanday ishlaydi",
    "en": "How synchronisation works",
    "kk": "Синхрондау қалай жұмыс істейді"
  },
  "Принятый заказ передаётся в EDU POS. Статусы кухни обновляются автоматически; устаревший ответ не возвращает заказ на предыдущий этап.": {
    "ky": "Кабыл алынган буйрутма EDU POSка жөнөтүлөт. Ашкананын статустары автоматтык жаңыртылат; эски жооп буйрутманы мурунку баскычка кайтарбайт.",
    "uz": "Qabul qilingan buyurtma EDU POSga yuboriladi. Oshxona holatlari avtomatik yangilanadi; eskirgan javob buyurtmani oldingi bosqichga qaytarmaydi.",
    "en": "Accepted orders are sent to EDU POS. Kitchen statuses update automatically; an outdated response does not move an order back to an earlier stage.",
    "kk": "Қабылданған тапсырыс EDU POS-қа жіберіледі. Асүй күйлері автоматты жаңартылады; ескі жауап тапсырысты алдыңғы кезеңге қайтармайды."
  },
  "Редактировать точку самовывоза": {
    "ky": "Алып кетүү пунктун түзөтүү",
    "uz": "Olib ketish punktini tahrirlash",
    "en": "Edit pickup location",
    "kk": "Алып кету орнын өңдеу"
  },
  "Новая точка самовывоза": {
    "ky": "Жаңы алып кетүү пункту",
    "uz": "Yangi olib ketish punkti",
    "en": "New pickup location",
    "kk": "Жаңа алып кету орны"
  },
  "Название точки": {
    "ky": "Пункттун аталышы",
    "uz": "Punkt nomi",
    "en": "Location name",
    "kk": "Орын атауы"
  },
  "Например, Манаса": {
    "ky": "Мисалы, Манас",
    "uz": "Masalan, Manas",
    "en": "For example, Manas",
    "kk": "Мысалы, Манас"
  },
  "Адрес": {
    "ky": "Дарек",
    "uz": "Manzil",
    "en": "Address",
    "kk": "Мекенжай"
  },
  "Ежедневно, 11:00–23:00": {
    "ky": "Күн сайын, 11:00–23:00",
    "uz": "Har kuni, 11:00–23:00",
    "en": "Daily, 11:00–23:00",
    "kk": "Күн сайын, 11:00–23:00"
  },
  "Ссылка на Яндекс Карты": {
    "ky": "Яндекс Картага шилтеме",
    "uz": "Yandex Xaritalar havolasi",
    "en": "Yandex Maps URL",
    "kk": "Яндекс Карта сілтемесі"
  },
  "Определить координаты": {
    "ky": "Координаттарды аныктоо",
    "uz": "Koordinatalarni aniqlash",
    "en": "Find coordinates",
    "kk": "Координаттарды анықтау"
  },
  "Широта": {
    "ky": "Кеңдик",
    "uz": "Kenglik",
    "en": "Latitude",
    "kk": "Ендік"
  },
  "Долгота": {
    "ky": "Узундук",
    "uz": "Uzunlik",
    "en": "Longitude",
    "kk": "Бойлық"
  },
  "Порядок": {
    "ky": "Тартип",
    "uz": "Tartib",
    "en": "Order",
    "kk": "Реті"
  },
  "Точка активна": {
    "ky": "Пункт активдүү",
    "uz": "Punkt faol",
    "en": "Location active",
    "kk": "Орын белсенді"
  },
  "Сохранить точку": {
    "ky": "Пунктту сактоо",
    "uz": "Punktni saqlash",
    "en": "Save location",
    "kk": "Орынды сақтау"
  },
  "Просмотр": {
    "ky": "Көрүү",
    "uz": "Ko‘rish",
    "en": "View",
    "kk": "Көру"
  },
  "Создание": {
    "ky": "Түзүү",
    "uz": "Yaratish",
    "en": "Create",
    "kk": "Құру"
  },
  "Редактирование": {
    "ky": "Түзөтүү",
    "uz": "Tahrirlash",
    "en": "Edit",
    "kk": "Өңдеу"
  },
  "Удаление": {
    "ky": "Өчүрүү",
    "uz": "O‘chirish",
    "en": "Delete",
    "kk": "Жою"
  },
  "Экспорт": {
    "ky": "Экспорт",
    "uz": "Eksport",
    "en": "Export",
    "kk": "Экспорт"
  },
  "Смена статуса": {
    "ky": "Статус өзгөртүү",
    "uz": "Holatni o‘zgartirish",
    "en": "Change status",
    "kk": "Күйді өзгерту"
  },
  "По роли": {
    "ky": "Роль боюнча",
    "uz": "Rol bo‘yicha",
    "en": "Role default",
    "kk": "Рөл бойынша"
  },
  "Разрешить": {
    "ky": "Уруксат берүү",
    "uz": "Ruxsat berish",
    "en": "Allow",
    "kk": "Рұқсат беру"
  },
  "Запретить": {
    "ky": "Тыюу салуу",
    "uz": "Taqiqlash",
    "en": "Deny",
    "kk": "Тыйым салу"
  },
  "Настроил первого владельца": {
    "ky": "Биринчи ээсин жөндөдү",
    "uz": "Birinchi egani sozladi",
    "en": "Set up the first owner",
    "kk": "Алғашқы иесін баптады"
  },
  "Создал сотрудника": {
    "ky": "Кызматкер түздү",
    "uz": "Xodim yaratdi",
    "en": "Created a staff member",
    "kk": "Қызметкер құрды"
  },
  "Изменил данные или доступ сотрудника": {
    "ky": "Кызматкердин маалыматтарын же кирүү укугун өзгөрттү",
    "uz": "Xodim ma’lumotlari yoki huquqini o‘zgartirdi",
    "en": "Updated staff details or access",
    "kk": "Қызметкер мәліметтерін немесе кіру құқығын өзгертті"
  },
  "Изменил роль или права": {
    "ky": "Ролду же укуктарды өзгөрттү",
    "uz": "Rol yoki huquqlarni o‘zgartirdi",
    "en": "Changed role or permissions",
    "kk": "Рөлді немесе құқықтарды өзгертті"
  },
  "Вошёл в систему": {
    "ky": "Системага кирди",
    "uz": "Tizimga kirdi",
    "en": "Signed in",
    "kk": "Жүйеге кірді"
  },
  "Изменил свой пароль": {
    "ky": "Өз сырсөзүн өзгөрттү",
    "uz": "O‘z parolini o‘zgartirdi",
    "en": "Changed their password",
    "kk": "Өз құпиясөзін өзгертті"
  },
  "Изменил карточку клиента": {
    "ky": "Кардардын карточкасын өзгөрттү",
    "uz": "Mijoz kartochkasini o‘zgartirdi",
    "en": "Updated a customer record",
    "kk": "Клиент карточкасын өзгертті"
  },
  "Изменил статус заказа": {
    "ky": "Буйрутманын статусун өзгөрттү",
    "uz": "Buyurtma holatini o‘zgartirdi",
    "en": "Changed an order status",
    "kk": "Тапсырыс күйін өзгертті"
  },
  "Создал товар": {
    "ky": "Товар түздү",
    "uz": "Mahsulot yaratdi",
    "en": "Created a product",
    "kk": "Тауар құрды"
  },
  "Изменил товар": {
    "ky": "Товарды өзгөрттү",
    "uz": "Mahsulotni o‘zgartirdi",
    "en": "Updated a product",
    "kk": "Тауарды өзгертті"
  },
  "Удалил товар": {
    "ky": "Товарды өчүрдү",
    "uz": "Mahsulotni o‘chirdi",
    "en": "Deleted a product",
    "kk": "Тауарды жойды"
  },
  "Создал категорию": {
    "ky": "Категория түздү",
    "uz": "Toifa yaratdi",
    "en": "Created a category",
    "kk": "Санат құрды"
  },
  "Изменил категорию": {
    "ky": "Категорияны өзгөрттү",
    "uz": "Toifani o‘zgartirdi",
    "en": "Updated a category",
    "kk": "Санатты өзгертті"
  },
  "Удалил категорию": {
    "ky": "Категорияны өчүрдү",
    "uz": "Toifani o‘chirdi",
    "en": "Deleted a category",
    "kk": "Санатты жойды"
  },
  "Создал акцию": {
    "ky": "Акция түздү",
    "uz": "Aksiya yaratdi",
    "en": "Created a promotion",
    "kk": "Акция құрды"
  },
  "Изменил акцию": {
    "ky": "Акцияны өзгөрттү",
    "uz": "Aksiyani o‘zgartirdi",
    "en": "Updated a promotion",
    "kk": "Акцияны өзгертті"
  },
  "Удалил акцию": {
    "ky": "Акцияны өчүрдү",
    "uz": "Aksiyani o‘chirdi",
    "en": "Deleted a promotion",
    "kk": "Акцияны жойды"
  },
  "Создал город": {
    "ky": "Шаар түздү",
    "uz": "Shahar yaratdi",
    "en": "Created a city",
    "kk": "Қала құрды"
  },
  "Изменил настройки города": {
    "ky": "Шаардын жөндөөлөрүн өзгөрттү",
    "uz": "Shahar sozlamalarini o‘zgartirdi",
    "en": "Updated city settings",
    "kk": "Қала баптауларын өзгертті"
  },
  "Изменил комплектацию заказа": {
    "ky": "Буйрутманын комплектациясын өзгөрттү",
    "uz": "Buyurtma to‘plamini o‘zgartirdi",
    "en": "Updated order contents",
    "kk": "Тапсырыс жинағын өзгертті"
  },
  "Создал точку выдачи": {
    "ky": "Берүү пунктун түздү",
    "uz": "Topshirish punktini yaratdi",
    "en": "Created a pickup location",
    "kk": "Беру орнын құрды"
  },
  "Изменил точку выдачи": {
    "ky": "Берүү пунктун өзгөрттү",
    "uz": "Topshirish punktini o‘zgartirdi",
    "en": "Updated a pickup location",
    "kk": "Беру орнын өзгертті"
  },
  "Удалил точку выдачи": {
    "ky": "Берүү пунктун өчүрдү",
    "uz": "Topshirish punktini o‘chirdi",
    "en": "Deleted a pickup location",
    "kk": "Беру орнын жойды"
  },
  "Не удалось загрузить персонал": {
    "ky": "Кызматкерлер жүктөлгөн жок",
    "uz": "Xodimlarni yuklab bo‘lmadi",
    "en": "Could not load staff",
    "kk": "Қызметкерлерді жүктеу мүмкін болмады"
  },
  "Не удалось загрузить журнал": {
    "ky": "Журнал жүктөлгөн жок",
    "uz": "Jurnalni yuklab bo‘lmadi",
    "en": "Could not load activity log",
    "kk": "Журналды жүктеу мүмкін болмады"
  },
  "Закрыть карточку? Несохранённые изменения будут потеряны.": {
    "ky": "Карточканы жабасызбы? Сакталбаган өзгөртүүлөр жоголот.",
    "uz": "Kartochkani yopasizmi? Saqlanmagan o‘zgarishlar yo‘qoladi.",
    "en": "Close this record? Unsaved changes will be lost.",
    "kk": "Карточканы жабасыз ба? Сақталмаған өзгерістер жоғалады."
  },
  "Недостаточно прав для сохранения сотрудника.": {
    "ky": "Кызматкерди сактоо үчүн укуктар жетишсиз.",
    "uz": "Xodimni saqlash uchun huquq yetarli emas.",
    "en": "You do not have permission to save this staff member.",
    "kk": "Қызметкерді сақтау үшін құқық жеткіліксіз."
  },
  "Укажите имя сотрудника.": {
    "ky": "Кызматкердин атын киргизиңиз.",
    "uz": "Xodim ismini kiriting.",
    "en": "Enter the staff member's name.",
    "kk": "Қызметкердің атын енгізіңіз."
  },
  "Логин: от 3 до 100 латинских букв, цифр или символов . _ @ + -.": {
    "ky": "Логин: 3төн 100гө чейин латын тамгалары, сандар же . _ @ + - белгилери.",
    "uz": "Login: 3 dan 100 tagacha lotin harfi, raqam yoki . _ @ + - belgisi.",
    "en": "Username: 3–100 Latin letters, digits or . _ @ + - symbols.",
    "kk": "Логин: 3–100 латын әрпі, цифр немесе . _ @ + - таңбасы."
  },
  "Пароль должен содержать от 12 до 256 символов.": {
    "ky": "Сырсөз 12ден 256га чейин белгиден турушу керек.",
    "uz": "Parol 12 dan 256 tagacha belgidan iborat bo‘lishi kerak.",
    "en": "Password must contain 12–256 characters.",
    "kk": "Құпиясөз 12–256 таңбадан тұруы керек."
  },
  "Сотрудник сохранён": {
    "ky": "Кызматкер сакталды",
    "uz": "Xodim saqlandi",
    "en": "Staff member saved",
    "kk": "Қызметкер сақталды"
  },
  "Не удалось сохранить сотрудника": {
    "ky": "Кызматкер сакталган жок",
    "uz": "Xodimni saqlab bo‘lmadi",
    "en": "Could not save staff member",
    "kk": "Қызметкерді сақтау мүмкін болмады"
  },
  "Отключить": {
    "ky": "Өчүрүү",
    "uz": "O‘chirish",
    "en": "Disable",
    "kk": "Өшіру"
  },
  "Его сеансы будут завершены.": {
    "ky": "Анын сеанстары жабылат.",
    "uz": "Uning seanslari tugatiladi.",
    "en": "Their sessions will be ended.",
    "kk": "Оның сеанстары аяқталады."
  },
  "{0} доступ сотрудника «{1}»?{2}": {
    "ky": "«{1}» кызматкеринин кирүү укугун {0}? {2}",
    "uz": "«{1}» xodimining kirish huquqini {0}? {2}",
    "en": "{0} access for “{1}”? {2}",
    "kk": "«{1}» қызметкерінің кіру құқығын {0}? {2}"
  },
  "Доступ обновлён": {
    "ky": "Кирүү укугу жаңыртылды",
    "uz": "Kirish huquqi yangilandi",
    "en": "Access updated",
    "kk": "Кіру құқығы жаңартылды"
  },
  "Не удалось изменить доступ": {
    "ky": "Кирүү укугу өзгөртүлгөн жок",
    "uz": "Kirish huquqini o‘zgartirib bo‘lmadi",
    "en": "Could not change access",
    "kk": "Кіру құқығын өзгерту мүмкін болмады"
  },
  "Только владелец": {
    "ky": "Ээси гана",
    "uz": "Faqat egasi",
    "en": "Owner only",
    "kk": "Тек иесі"
  },
  "Разрешено": {
    "ky": "Уруксат берилген",
    "uz": "Ruxsat berilgan",
    "en": "Allowed",
    "kk": "Рұқсат етілген"
  },
  "Недоступно без просмотра раздела": {
    "ky": "Бөлүмдү көрүүгө уруксатсыз жеткиликсиз",
    "uz": "Bo‘limni ko‘rish huquqisiz mavjud emas",
    "en": "Requires permission to view the section",
    "kk": "Бөлімді көруге рұқсатсыз қолжетімсіз"
  },
  "Запрещено": {
    "ky": "Тыюу салынган",
    "uz": "Taqiqlangan",
    "en": "Denied",
    "kk": "Тыйым салынған"
  },
  "Нет доступа к персоналу.": {
    "ky": "Кызматкерлерге кирүү укугу жок.",
    "uz": "Xodimlar bo‘limiga kirish huquqi yo‘q.",
    "en": "No access to staff.",
    "kk": "Қызметкерлер бөліміне кіруге рұқсат жоқ."
  },
  "Сотрудники": {
    "ky": "Кызматкерлер",
    "uz": "Xodimlar",
    "en": "Staff",
    "kk": "Қызметкерлер"
  },
  "Журнал действий": {
    "ky": "Аракеттер журналы",
    "uz": "Amallar jurnali",
    "en": "Activity log",
    "kk": "Әрекеттер журналы"
  },
  "Добавить сотрудника": {
    "ky": "Кызматкер кошуу",
    "uz": "Xodim qo‘shish",
    "en": "Add staff member",
    "kk": "Қызметкер қосу"
  },
  "Всего сотрудников:": {
    "ky": "Кызматкерлердин жалпы саны:",
    "uz": "Jami xodimlar:",
    "en": "Total staff:",
    "kk": "Қызметкерлердің жалпы саны:"
  },
  ". У каждого — личная учётная запись и права доступа.": {
    "ky": ". Ар биринин жеке аккаунту жана кирүү укуктары бар.",
    "uz": ". Har birida shaxsiy hisob va kirish huquqlari bor.",
    "en": ". Each has a personal account and permissions.",
    "kk": ". Әрқайсысының жеке тіркелгісі мен кіру құқықтары бар."
  },
  "(вы)": {
    "ky": "(сиз)",
    "uz": "(siz)",
    "en": "(you)",
    "kk": "(сіз)"
  },
  "Активен": {
    "ky": "Активдүү",
    "uz": "Faol",
    "en": "Active",
    "kk": "Белсенді"
  },
  "Отключён": {
    "ky": "Өчүрүлгөн",
    "uz": "O‘chirilgan",
    "en": "Disabled",
    "kk": "Өшірілген"
  },
  "Отключить доступ": {
    "ky": "Кирүү укугун өчүрүү",
    "uz": "Kirish huquqini o‘chirish",
    "en": "Disable access",
    "kk": "Кіру құқығын өшіру"
  },
  "Включить доступ": {
    "ky": "Кирүү укугун күйгүзүү",
    "uz": "Kirish huquqini yoqish",
    "en": "Enable access",
    "kk": "Кіру құқығын қосу"
  },
  "Загружаем сотрудников…": {
    "ky": "Кызматкерлер жүктөлүүдө…",
    "uz": "Xodimlar yuklanmoqda…",
    "en": "Loading staff…",
    "kk": "Қызметкерлер жүктелуде…"
  },
  "Список недоступен": {
    "ky": "Тизме жеткиликсиз",
    "uz": "Ro‘yxat mavjud emas",
    "en": "List unavailable",
    "kk": "Тізім қолжетімсіз"
  },
  "Сотрудники не найдены": {
    "ky": "Кызматкерлер табылган жок",
    "uz": "Xodimlar topilmadi",
    "en": "No staff found",
    "kk": "Қызметкерлер табылмады"
  },
  "Последние действия": {
    "ky": "Акыркы аракеттер",
    "uz": "Oxirgi amallar",
    "en": "Recent activity",
    "kk": "Соңғы әрекеттер"
  },
  "Последние 20 событий. Время указано по Бишкеку.": {
    "ky": "Акыркы 20 окуя. Убакыт Бишкек боюнча көрсөтүлгөн.",
    "uz": "Oxirgi 20 ta voqea. Vaqt Bishkek bo‘yicha ko‘rsatilgan.",
    "en": "Last 20 events. Times are in the Bishkek time zone.",
    "kk": "Соңғы 20 оқиға. Уақыт Бішкек бойынша көрсетілген."
  },
  "Загружаем журнал…": {
    "ky": "Журнал жүктөлүүдө…",
    "uz": "Jurnal yuklanmoqda…",
    "en": "Loading activity log…",
    "kk": "Журнал жүктелуде…"
  },
  "Изменил рабочие данные": {
    "ky": "Иш маалыматтарын өзгөрттү",
    "uz": "Ish ma’lumotlarini o‘zgartirdi",
    "en": "Updated work data",
    "kk": "Жұмыс деректерін өзгертті"
  },
  "Действий пока нет.": {
    "ky": "Азырынча аракеттер жок.",
    "uz": "Hozircha amallar yo‘q.",
    "en": "No activity yet.",
    "kk": "Әзірге әрекеттер жоқ."
  },
  "Новый сотрудник": {
    "ky": "Жаңы кызматкер",
    "uz": "Yangi xodim",
    "en": "New staff member",
    "kk": "Жаңа қызметкер"
  },
  "Личная учётная запись и доступ к рабочим разделам.": {
    "ky": "Жеке аккаунт жана иш бөлүмдөрүнө кирүү укугу.",
    "uz": "Shaxsiy hisob va ish bo‘limlariga kirish huquqi.",
    "en": "Personal account and access to work sections.",
    "kk": "Жеке тіркелгі және жұмыс бөлімдеріне кіру құқығы."
  },
  "Основные данные сотрудника. Роль и права меняет владелец.": {
    "ky": "Кызматкердин негизги маалыматтары. Ролду жана укуктарды ээси өзгөртөт.",
    "uz": "Xodimning asosiy ma’lumotlari. Rol va huquqlarni egasi o‘zgartiradi.",
    "en": "Basic staff details. Only the owner changes roles and permissions.",
    "kk": "Қызметкердің негізгі мәліметтері. Рөл мен құқықтарды иесі өзгертеді."
  },
  "Закрыть карточку сотрудника": {
    "ky": "Кызматкердин карточкасын жабуу",
    "uz": "Xodim kartochkasini yopish",
    "en": "Close staff record",
    "kk": "Қызметкер карточкасын жабу"
  },
  "Данные": {
    "ky": "Маалыматтар",
    "uz": "Ma’lumotlar",
    "en": "Details",
    "kk": "Мәліметтер"
  },
  "Права доступа": {
    "ky": "Кирүү укуктары",
    "uz": "Kirish huquqlari",
    "en": "Permissions",
    "kk": "Кіру құқықтары"
  },
  "Логин нельзя изменить после создания.": {
    "ky": "Логинди түзгөндөн кийин өзгөртүүгө болбойт.",
    "uz": "Loginni yaratilgandan keyin o‘zgartirib bo‘lmaydi.",
    "en": "The username cannot be changed after creation.",
    "kk": "Логинді құрғаннан кейін өзгертуге болмайды."
  },
  "Не менее 12 символов.": {
    "ky": "Кеминде 12 белги.",
    "uz": "Kamida 12 ta belgi.",
    "en": "At least 12 characters.",
    "kk": "Кемінде 12 таңба."
  },
  "Оставьте пустым, чтобы сохранить текущий пароль. Новый пароль завершит активные сеансы сотрудника.": {
    "ky": "Учурдагы сырсөздү сактоо үчүн бош калтырыңыз. Жаңы сырсөз кызматкердин активдүү сеанстарын жабат.",
    "uz": "Joriy parolni saqlash uchun bo‘sh qoldiring. Yangi parol xodimning faol seanslarini tugatadi.",
    "en": "Leave blank to keep the current password. A new password ends the staff member's active sessions.",
    "kk": "Қазіргі құпиясөзді сақтау үшін бос қалдырыңыз. Жаңа құпиясөз қызметкердің белсенді сеанстарын аяқтайды."
  },
  "Свой пароль можно изменить в «Мой профиль».": {
    "ky": "Өз сырсөзүңүздү «Менин профилим» бөлүмүндө өзгөртө аласыз.",
    "uz": "O‘z parolingizni «Mening profilim» bo‘limida o‘zgartirishingiz mumkin.",
    "en": "Change your own password in “My profile”.",
    "kk": "Өз құпиясөзіңізді «Менің профилім» бөлімінде өзгерте аласыз."
  },
  "Полный доступ, управление сотрудниками и их правами.": {
    "ky": "Толук кирүү, кызматкерлерди жана алардын укуктарын башкаруу.",
    "uz": "To‘liq kirish, xodimlar va ularning huquqlarini boshqarish.",
    "en": "Full access, including staff and permission management.",
    "kk": "Толық қолжетімділік, қызметкерлер мен олардың құқықтарын басқару."
  },
  "Все рабочие разделы, кроме создания сотрудников и изменения прав. Можно задать исключения.": {
    "ky": "Кызматкер түзүү жана укуктарды өзгөртүүдөн башка бардык иш бөлүмдөрү. Өзгөчө уруксаттарды коюуга болот.",
    "uz": "Xodim yaratish va huquqlarni o‘zgartirishdan tashqari barcha ish bo‘limlari. Istisnolar belgilash mumkin.",
    "en": "All work sections except staff creation and permission management. Individual exceptions can be set.",
    "kk": "Қызметкер құру мен құқықтарды өзгертуден басқа барлық жұмыс бөлімдері. Жеке ерекшеліктерді орнатуға болады."
  },
  "Работа с заказами и клиентами. Остальные разделы доступны по индивидуальным разрешениям.": {
    "ky": "Буйрутмалар жана кардарлар менен иштөө. Калган бөлүмдөр жеке уруксаттар боюнча жеткиликтүү.",
    "uz": "Buyurtmalar va mijozlar bilan ishlash. Qolgan bo‘limlar alohida ruxsatlar bilan ochiladi.",
    "en": "Orders and customers. Other sections require individual permissions.",
    "kk": "Тапсырыстар мен клиенттермен жұмыс. Қалған бөлімдер жеке рұқсаттар бойынша қолжетімді."
  },
  "Сотрудник отключён и не может войти. Включить доступ можно через меню в списке сотрудников.": {
    "ky": "Кызматкер өчүрүлгөн жана кире албайт. Кирүү укугун кызматкерлер тизмесиндеги менюдан күйгүзө аласыз.",
    "uz": "Xodim o‘chirilgan va kira olmaydi. Kirish huquqini xodimlar ro‘yxati menyusida yoqishingiz mumkin.",
    "en": "This staff member is disabled and cannot sign in. Enable access from the staff list menu.",
    "kk": "Қызметкер өшірілген және кіре алмайды. Кіру құқығын қызметкерлер тізіміндегі мәзірден қоса аласыз."
  },
  "Владелец всегда имеет полный доступ.": {
    "ky": "Ээси дайыма толук укуктарга ээ.",
    "uz": "Egasi doim to‘liq huquqqa ega.",
    "en": "Owners always have full access.",
    "kk": "Иесі әрдайым толық құқыққа ие."
  },
  "Индивидуальных настроек: {0}. Они сохраняются при смене роли.": {
    "ky": "Жеке жөндөөлөр: {0}. Роль өзгөргөндө сакталат.",
    "uz": "Alohida sozlamalar: {0}. Rol o‘zgarganda saqlanadi.",
    "en": "Individual overrides: {0}. They are retained when the role changes.",
    "kk": "Жеке баптаулар: {0}. Рөл өзгергенде сақталады."
  },
  "Сбросить к правам роли": {
    "ky": "Ролдун укуктарына кайтаруу",
    "uz": "Rol huquqlariga qaytarish",
    "en": "Reset to role defaults",
    "kk": "Рөл құқықтарына қайтару"
  },
  "Права владельца нельзя ограничить. Последнего активного владельца нельзя отключить или понизить.": {
    "ky": "Ээсинин укуктарын чектөөгө болбойт. Акыркы активдүү ээсин өчүрүүгө же ролун төмөндөтүүгө болбойт.",
    "uz": "Egasining huquqlarini cheklab bo‘lmaydi. Oxirgi faol egani o‘chirib yoki rolini pasaytirib bo‘lmaydi.",
    "en": "Owner permissions cannot be restricted. The last active owner cannot be disabled or demoted.",
    "kk": "Иесінің құқықтарын шектеуге болмайды. Соңғы белсенді иесін өшіруге немесе рөлін төмендетуге болмайды."
  },
  "Галочка показывает итоговый доступ после сохранения. Без просмотра раздела остальные действия в нём недоступны. Создавать сотрудников и менять права может только владелец.": {
    "ky": "Белги сактагандан кийинки укуктарды көрсөтөт. Бөлүмдү көрүүгө уруксат жок болсо, анын башка аракеттери жеткиликсиз. Кызматкер түзүү жана укуктарды өзгөртүү ээсине гана уруксат.",
    "uz": "Belgi saqlagandan keyingi huquqlarni ko‘rsatadi. Bo‘limni ko‘rish huquqisiz undagi boshqa amallar mavjud emas. Xodim yaratish va huquqlarni o‘zgartirish faqat egasiga ruxsat.",
    "en": "The checkmark shows effective access after saving. Other actions require permission to view the section. Only the owner can create staff or change permissions.",
    "kk": "Белгі сақтағаннан кейінгі құқықтарды көрсетеді. Бөлімді көруге рұқсат болмаса, басқа әрекеттері қолжетімсіз. Қызметкер құру мен құқықтарды өзгерту тек иесіне рұқсат."
  },
  "Эти права вступят в силу после включения учётной записи.": {
    "ky": "Бул укуктар аккаунт күйгүзүлгөндөн кийин күчүнө кирет.",
    "uz": "Bu huquqlar hisob yoqilgandan keyin kuchga kiradi.",
    "en": "These permissions take effect once the account is enabled.",
    "kk": "Бұл құқықтар тіркелгі қосылғаннан кейін күшіне енеді."
  },
  "Раздел": {
    "ky": "Бөлүм",
    "uz": "Bo‘lim",
    "en": "Section",
    "kk": "Бөлім"
  },
  "Создать сотрудника": {
    "ky": "Кызматкер түзүү",
    "uz": "Xodim yaratish",
    "en": "Create staff member",
    "kk": "Қызметкер құру"
  },
  "Сохранить": {
    "ky": "Сактоо",
    "uz": "Saqlash",
    "en": "Save",
    "kk": "Сақтау"
  },
  "Закрыть": {
    "ky": "Жабуу",
    "uz": "Yopish",
    "en": "Close",
    "kk": "Жабу"
  },
  "Навигация по разделам панели.": {
    "ky": "Панелдин бөлүмдөрү боюнча навигация.",
    "uz": "Panel bo‘limlari bo‘yicha navigatsiya.",
    "en": "Navigate admin sections.",
    "kk": "Панель бөлімдері бойынша навигация."
  },
  "Есть несохранённые изменения. Покинуть страницу и потерять их?": {
    "ky": "Сакталбаган өзгөртүүлөр бар. Барактан чыгып, аларды жоготосузбу?",
    "uz": "Saqlanmagan o‘zgarishlar bor. Sahifadan chiqib, ularni yo‘qotasizmi?",
    "en": "You have unsaved changes. Leave this page and discard them?",
    "kk": "Сақталмаған өзгерістер бар. Беттен шығып, оларды жоғалтасыз ба?"
  },
  "Покинуть страницу?": {
    "ky": "Барактан чыгасызбы?",
    "uz": "Sahifadan chiqasizmi?",
    "en": "Leave this page?",
    "kk": "Беттен шығасыз ба?"
  },
  "Закрыть форму без сохранения изменений?": {
    "ky": "Өзгөртүүлөрдү сактабай форманы жабасызбы?",
    "uz": "O‘zgarishlarni saqlamasdan shaklni yopasizmi?",
    "en": "Close without saving changes?",
    "kk": "Өзгерістерді сақтамай пішінді жабасыз ба?"
  },
  "Закрыть форму?": {
    "ky": "Форманы жабасызбы?",
    "uz": "Shaklni yopasizmi?",
    "en": "Close this form?",
    "kk": "Пішінді жабасыз ба?"
  },
  "Не удалось загрузить пользователей": {
    "ky": "Колдонуучулар жүктөлгөн жок",
    "uz": "Foydalanuvchilarni yuklab bo‘lmadi",
    "en": "Could not load users",
    "kk": "Пайдаланушыларды жүктеу мүмкін болмады"
  },
  "Не удалось загрузить карточку пользователя": {
    "ky": "Колдонуучунун карточкасы жүктөлгөн жок",
    "uz": "Foydalanuvchi kartochkasini yuklab bo‘lmadi",
    "en": "Could not load user record",
    "kk": "Пайдаланушы карточкасын жүктеу мүмкін болмады"
  },
  "Карточка клиента сохранена": {
    "ky": "Кардардын карточкасы сакталды",
    "uz": "Mijoz kartochkasi saqlandi",
    "en": "Customer record saved",
    "kk": "Клиент карточкасы сақталды"
  },
  "Не удалось сохранить карточку клиента": {
    "ky": "Кардардын карточкасы сакталган жок",
    "uz": "Mijoz kartochkasini saqlab bo‘lmadi",
    "en": "Could not save customer record",
    "kk": "Клиент карточкасын сақтау мүмкін болмады"
  },
  "Клиенты": {
    "ky": "Кардарлар",
    "uz": "Mijozlar",
    "en": "Customers",
    "kk": "Клиенттер"
  },
  "Обновить": {
    "ky": "Жаңыртуу",
    "uz": "Yangilash",
    "en": "Refresh",
    "kk": "Жаңарту"
  },
  "Загружаем карточку пользователя…": {
    "ky": "Колдонуучунун карточкасы жүктөлүүдө…",
    "uz": "Foydalanuvchi kartochkasi yuklanmoqda…",
    "en": "Loading user record…",
    "kk": "Пайдаланушы карточкасы жүктелуде…"
  },
  "Карточка клиента": {
    "ky": "Кардардын карточкасы",
    "uz": "Mijoz kartochkasi",
    "en": "Customer record",
    "kk": "Клиент карточкасы"
  },
  "Последний заказ:": {
    "ky": "Акыркы буйрутма:",
    "uz": "Oxirgi buyurtma:",
    "en": "Last order:",
    "kk": "Соңғы тапсырыс:"
  },
  "Заметка сотрудников": {
    "ky": "Кызматкерлердин жазуусу",
    "uz": "Xodimlar eslatmasi",
    "en": "Staff note",
    "kk": "Қызметкерлер жазбасы"
  },
  "Всего заказов": {
    "ky": "Жалпы буйрутмалар",
    "uz": "Jami buyurtmalar",
    "en": "Total orders",
    "kk": "Жалпы тапсырыстар"
  },
  "Завершено:": {
    "ky": "Аяктаган:",
    "uz": "Yakunlangan:",
    "en": "Completed:",
    "kk": "Аяқталған:"
  },
  "Сумма покупок": {
    "ky": "Сатып алуулар суммасы",
    "uz": "Xaridlar summasi",
    "en": "Total purchases",
    "kk": "Сатып алу сомасы"
  },
  "Только завершённые заказы": {
    "ky": "Аяктаган буйрутмалар гана",
    "uz": "Faqat yakunlangan buyurtmalar",
    "en": "Completed orders only",
    "kk": "Тек аяқталған тапсырыстар"
  },
  "Дата": {
    "ky": "Күнү",
    "uz": "Sana",
    "en": "Date",
    "kk": "Күні"
  },
  "Тип": {
    "ky": "Түрү",
    "uz": "Turi",
    "en": "Type",
    "kk": "Түрі"
  },
  "Заказ №": {
    "ky": "Буйрутма №",
    "uz": "Buyurtma №",
    "en": "Order #",
    "kk": "Тапсырыс №"
  },
  "Заметка": {
    "ky": "Жазуу",
    "uz": "Eslatma",
    "en": "Note",
    "kk": "Жазба"
  },
  "Сохранить карточку": {
    "ky": "Карточканы сактоо",
    "uz": "Kartochkani saqlash",
    "en": "Save record",
    "kk": "Карточканы сақтау"
  },
  "Найти клиента": {
    "ky": "Кардар табуу",
    "uz": "Mijozni topish",
    "en": "Find a customer",
    "kk": "Клиентті табу"
  },
  "Имя или телефон": {
    "ky": "Аты же телефон",
    "uz": "Ism yoki telefon",
    "en": "Name or phone",
    "kk": "Аты немесе телефон"
  },
  "Обновить клиентов": {
    "ky": "Кардарларды жаңыртуу",
    "uz": "Mijozlarni yangilash",
    "en": "Refresh customers",
    "kk": "Клиенттерді жаңарту"
  },
  "Загружаем пользователей…": {
    "ky": "Колдонуучулар жүктөлүүдө…",
    "uz": "Foydalanuvchilar yuklanmoqda…",
    "en": "Loading users…",
    "kk": "Пайдаланушылар жүктелуде…"
  },
  "Пользователь": {
    "ky": "Колдонуучу",
    "uz": "Foydalanuvchi",
    "en": "User",
    "kk": "Пайдаланушы"
  },
  "Открыть": {
    "ky": "Ачуу",
    "uz": "Ochish",
    "en": "Open",
    "kk": "Ашу"
  },
  "Клиенты не найдены": {
    "ky": "Кардарлар табылган жок",
    "uz": "Mijozlar topilmadi",
    "en": "No customers found",
    "kk": "Клиенттер табылмады"
  },
  "Измените запрос или дождитесь первого заказа.": {
    "ky": "Сурамды өзгөртүңүз же биринчи буйрутманы күтүңүз.",
    "uz": "Qidiruvni o‘zgartiring yoki birinchi buyurtmani kuting.",
    "en": "Change your search or wait for the first order.",
    "kk": "Сұрауды өзгертіңіз немесе алғашқы тапсырысты күтіңіз."
  },
  "{0}–{1} из {2}": {
    "ky": "{2} ичинен {0}–{1}",
    "uz": "{2} tadan {0}–{1}",
    "en": "{0}–{1} of {2}",
    "kk": "{2} ішінен {0}–{1}"
  },
  "Нет записей": {
    "ky": "Жазуулар жок",
    "uz": "Yozuvlar yo‘q",
    "en": "No records",
    "kk": "Жазбалар жоқ"
  },
  "Предыдущая страница": {
    "ky": "Мурунку барак",
    "uz": "Oldingi sahifa",
    "en": "Previous page",
    "kk": "Алдыңғы бет"
  },
  "Следующая страница": {
    "ky": "Кийинки барак",
    "uz": "Keyingi sahifa",
    "en": "Next page",
    "kk": "Келесі бет"
  },
  "Закрыть форму": {
    "ky": "Форманы жабуу",
    "uz": "Shaklni yopish",
    "en": "Close form",
    "kk": "Пішінді жабу"
  },
  "Работа": {
    "ky": "Иш",
    "uz": "Ish",
    "en": "Work",
    "kk": "Жұмыс"
  },
  "Каталог": {
    "ky": "Каталог",
    "uz": "Katalog",
    "en": "Catalogue",
    "kk": "Каталог"
  },
  "Управление": {
    "ky": "Башкаруу",
    "uz": "Boshqaruv",
    "en": "Management",
    "kk": "Басқару"
  },
  "Аккаунт": {
    "ky": "Аккаунт",
    "uz": "Hisob",
    "en": "Account",
    "kk": "Тіркелгі"
  },
  "Язык панели": {
    "ky": "Панелдин тили",
    "uz": "Panel tili",
    "en": "Panel language",
    "kk": "Панель тілі"
  },
  "Язык системы": {
    "ky": "Системанын тили",
    "uz": "Tizim tili",
    "en": "System language",
    "kk": "Жүйе тілі"
  }
};

Object.assign(messages, {
  "Предыдущий месяц": {
    "ky": "Мурунку ай",
    "uz": "Oldingi oy",
    "en": "Previous month",
    "kk": "Алдыңғы ай"
  },
  "Следующий месяц": {
    "ky": "Кийинки ай",
    "uz": "Keyingi oy",
    "en": "Next month",
    "kk": "Келесі ай"
  },
  "Сервер отклонил запрос. Проверьте данные и повторите попытку.": {
    "ky": "Сервер сурамды четке какты. Маалыматтарды текшерип, кайра аракет кылыңыз.",
    "uz": "Server so‘rovni rad etdi. Ma’lumotlarni tekshirib, qayta urinib ko‘ring.",
    "en": "The server rejected the request. Check your details and try again.",
    "kk": "Сервер сұрауды қабылдамады. Деректерді тексеріп, қайталап көріңіз."
  },
  "Неверный логин или пароль": {
    "ky": "Логин же сырсөз туура эмес",
    "uz": "Login yoki parol noto‘g‘ri",
    "en": "Incorrect username or password",
    "kk": "Логин немесе құпиясөз қате"
  },
  "Текущий пароль неверен": {
    "ky": "Учурдагы сырсөз туура эмес",
    "uz": "Joriy parol noto‘g‘ri",
    "en": "Current password is incorrect",
    "kk": "Қазіргі құпиясөз қате"
  },
  "Последний город удалить нельзя.": {
    "ky": "Акыркы шаарды өчүрүүгө болбойт.",
    "uz": "Oxirgi shaharni o‘chirib bo‘lmaydi.",
    "en": "The last city cannot be deleted.",
    "kk": "Соңғы қаланы жоюға болмайды."
  },
  "Заказ уже изменён другим сотрудником. Обновите карточку.": {
    "ky": "Буйрутманы башка кызматкер өзгөрттү. Карточканы жаңыртыңыз.",
    "uz": "Buyurtmani boshqa xodim o‘zgartirgan. Kartochkani yangilang.",
    "en": "Another staff member has changed this order. Refresh the record.",
    "kk": "Тапсырысты басқа қызметкер өзгертті. Карточканы жаңартыңыз."
  },
  "Статус заказа изменён другим сотрудником. Обновите карточку.": {
    "ky": "Буйрутманын статусун башка кызматкер өзгөрттү. Карточканы жаңыртыңыз.",
    "uz": "Buyurtma holatini boshqa xodim o‘zgartirgan. Kartochkani yangilang.",
    "en": "Another staff member has changed the order status. Refresh the record.",
    "kk": "Тапсырыс күйін басқа қызметкер өзгертті. Карточканы жаңартыңыз."
  },
  "Недостаточно прав для этого действия": {
    "ky": "Бул аракетке укуктар жетишсиз",
    "uz": "Bu amal uchun huquq yetarli emas",
    "en": "You do not have permission for this action",
    "kk": "Бұл әрекетке құқық жеткіліксіз"
  }
});
Object.assign(messages, {
  "Сеанс завершён. Войдите снова.": { ky: "Сеанс жабылды. Кайра кириңиз.", uz: "Seans tugadi. Qayta kiring.", en: "Your session has ended. Sign in again.", kk: "Сеанс аяқталды. Қайта кіріңіз." },
  "Ошибка сервера. Повторите попытку позже.": { ky: "Серверде ката. Кийинчерээк кайра аракет кылыңыз.", uz: "Server xatosi. Keyinroq qayta urinib ko‘ring.", en: "Server error. Please try again later.", kk: "Сервер қатесі. Кейінірек қайталап көріңіз." },
  "Удаление / архивация": { ky: "Өчүрүү / архивдөө", uz: "O‘chirish / arxivlash", en: "Delete / archive", kk: "Жою / мұрағаттау" },
  "Города и точки выдачи": { ky: "Шаарлар жана берүү пункттары", uz: "Shaharlar va topshirish punktlari", en: "Cities and pickup locations", kk: "Қалалар және беру орындары" },
  "Интеграции": { ky: "Интеграциялар", uz: "Integratsiyalar", en: "Integrations", kk: "Интеграциялар" },
  "Этот логин уже занят": { ky: "Бул логин колдонулуп жатат", uz: "Bu login band", en: "This username is already taken", kk: "Бұл логин бұрыннан қолданылуда" },
});
