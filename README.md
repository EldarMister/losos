# Много лосося — React + NestJS + PostgreSQL

Адаптивная витрина доставки еды в стилистике `mnogolososya.ru`: каталог, поиск, карточка блюда, схема модификаторов, адрес/самовывоз, устойчивая корзина, checkout, серверный пересчёт заказа и мобильная админка.

## Структура

- `app/` — React 19 / Next-compatible frontend на vinext;
- `server/` — NestJS REST API;
- PostgreSQL — категории, товары, акции, заказы, позиции и неизменяемые снимки выбранных модификаторов;
- `docker-compose.yml` — PostgreSQL 16 для обычного локального запуска.

## Быстрый запуск

### 1. База данных

Через Docker:

```bash
npm run db:docker
```

Если PostgreSQL уже установлен в Windows, можно запустить изолированную базу на порту `55432`:

```powershell
npm run db:local
```

### 2. NestJS API

```powershell
cd server
Copy-Item .env.example .env
npm install
npm run dev
```

При локальной базе без Docker замените `DATABASE_URL` в `server/.env` на:

```text
postgresql://losos@127.0.0.1:55432/losos
```

API будет доступен по адресу `http://localhost:4000/api`.

### 3. React frontend

В другом терминале:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Сайт откроется на `http://localhost:3000`.

## API

- `GET /api/health` — состояние сервера;
- `GET /api/regions` — доступные города;
- `GET /api/categories?region=bishkek` — категории вместе с товарами;
- `GET /api/products?search=лосось&category=rolly-2&region=bishkek` — поиск и фильтрация;
- `GET /api/products/:id` — карточка товара;
- `POST /api/auth/whatsapp/request` — одноразовая ссылка на WhatsApp-бота;
- `POST /api/auth/whatsapp/status` — защищённая проверка статуса подтверждения;
- `GET|POST /api/auth/whatsapp/webhook` — проверка и события Meta WhatsApp Cloud API;
- `POST /api/auth/request-code` и `POST /api/auth/verify-code` — резервное подтверждение по SMS;
- `GET /api/auth/profile` — заказы, баланс и история NAKTA Coin, NFT клиента;
- `POST /api/auth/nfts/:id/withdraw` — защищённая заявка на вывод NFT на кошелёк;
- `POST /api/orders` — создание заказа;
- `GET /api/admin/dashboard?region=bishkek` — каталог и акции для админки;
- `GET /api/admin/analytics?region=bishkek&period=week` — агрегированная аналитика без выгрузки заказов в браузер;
- `GET /api/admin/orders?regionSlug=bishkek` — очередь заказов;
- `GET /api/admin/orders/:id` — полная карточка заказа;
- `PATCH /api/admin/orders/:id/status` — перевод заказа в следующий статус;
- `GET /api/admin/customers?region=bishkek` — клиентская база и бонусные активы;
- `GET /api/admin/loyalty/overview?region=bishkek` — состояние программ NAKTA Coin и NFT;
- `GET /api/admin/nft-withdrawals` и `PATCH /api/admin/nft-withdrawals/:id` — очередь и обработка выводов NFT.

Все `/api/admin/*` требуют заголовок `x-admin-token`. Публичного метода чтения заказа с телефоном и адресом нет.

Пример тела заказа:

```json
{
  "idempotencyKey": "checkout-unique-key",
  "regionSlug": "bishkek",
  "deliveryType": "delivery",
  "customerName": "Имя",
  "phone": "+996555123456",
  "address": "Бишкек, проспект Чуй, 123",
  "latitude": 42.8746,
  "longitude": 74.5698,
  "paymentMethod": "card",
  "utensilsCount": 1,
  "noUtensils": false,
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "modifiers": [
        { "groupId": "extra-sauce", "itemId": "sweet-chili", "quantity": 2 }
      ]
    }
  ]
}
```

Клиентская цена не считается доверенной: API заново проверяет регион, доступность, required/min/max, single/multiple, количество и доплаты по актуальному каталогу.

## NAKTA Coin и NFT

NAKTA Coin задаются отдельно для каждого блюда и фиксируются в позиции заказа. После первого перевода заказа в статус `completed` backend создаёт уникальную запись начисления и увеличивает баланс клиента. Повторный или параллельный запрос завершения не начисляет награду второй раз.

NFT — независимая программа выбранного филиала. В разделе админки «Лояльность» можно включить или остановить программу, указать выдачу за каждый 10-й, 20-й или другой завершённый заказ, изображение, сеть, контракт и metadata URI. Выданный NFT появляется отдельным активом в профиле клиента. Клиент указывает кошелёк своей сети, после чего заявка либо отправляется настроенному провайдеру, либо остаётся в очереди оператора.

Для автоматической передачи задайте только на backend:

```text
NFT_TRANSFER_WEBHOOK_URL=https://provider.example/nft/transfer
NFT_TRANSFER_WEBHOOK_TOKEN=replace-with-provider-token
```

Провайдер получает идентификатор заявки, сеть, кошелёк и metadata NFT и должен вернуть `txHash`, необязательный `tokenId` и статус `submitted` либо `withdrawn`. Без webhook URL администратор обрабатывает очередь вручную в разделе «Лояльность». Таблицы наград, уникальный ledger начислений и настройки программы создаются миграцией `1785003000000-AddLoyaltyPrograms`.

## Интеграция EDU POS

Сайт и мобильное приложение никогда не обращаются к EDU POS напрямую. Единственная точка интеграции — NestJS backend в `server/`, а `EDU_POS_API_KEY` хранится только в его переменных окружения.

```text
EDU_POS_URL=https://POS-DOMAIN/api/integration/v1
EDU_POS_API_KEY=edu_live_...
EDU_POS_TIMEOUT_MS=10000
EDU_POS_MENU_EXPORT_TIMEOUT_MS=60000
EDU_POS_MENU_EXPORT_PATH=/menu
```

После настройки backend:

- получает меню при запуске и каждые 5 минут;
- получает стоп-лист каждые 45 секунд;
- отправляет заказ с неизменяемым `externalOrderId` и POS-идентификаторами блюд;
- проверяет активные заказы каждые 7,5 секунды;
- повторяет временно неудавшуюся отправку через 5, 15, 30 и 60 секунд, сохраняя тот же `externalOrderId`;
- сохраняет POS-номер, статус, прогресс и причины отклонения позиций в PostgreSQL.

Сопоставление блюд хранится в `products.posDishId` и `products.posVariantId`. При синхронизации backend сначала использует эти поля, а для ещё не сопоставленных блюд пробует точное уникальное совпадение нормализованного названия. Идентификаторы можно указать вручную в редакторе блюда. В админке «↓ Из EDU POS» получает цены и стоп-лист, а «↑ В EDU POS» одним запросом отправляет категории, блюда, цены, доступность и модификаторы общего меню выбранного города. Если у поставщика другой путь импорта, он задаётся через `EDU_POS_MENU_EXPORT_PATH`.

Новый заказ сначала появляется в админке NAKTA Sushi. Нажатие администратором «Подтвердить заказ» отправляет его в EDU POS, но локальный статус меняется на «Подтверждён» только после успешного ответа кухни. При ошибке заказ остаётся новым, а повтор использует тот же `externalOrderId` и восстанавливает уже созданную POS-запись вместо дубля.

Административные методы (требуют `x-admin-token`):

- `GET /api/admin/edu-pos/status` — конфигурация и последние синхронизации без вывода ключа;
- `POST /api/admin/edu-pos/sync-menu` — ручная синхронизация меню;
- `POST /api/admin/edu-pos/sync-stop-list` — ручная синхронизация стоп-листа.
- `POST /api/admin/edu-pos/export-menu?region=bishkek` — экспорт полного общего меню города в EDU POS одним запросом.

Перед включением в production выполните миграции обычной командой `npm --prefix server run migration:run`, затем проверьте сопоставление всех продаваемых блюд в админке. Пока переменные EDU POS не заданы, интеграция остаётся выключенной и существующий локальный сценарий заказов продолжает работать.

## WhatsApp-авторизация

Основной способ подтверждения номера работает через официальный WhatsApp Cloud API. Пользователь вводит номер, сайт создаёт длинный одноразовый код и открывает чат с готовым сообщением. Webhook сверяет код и реальный номер отправителя, после чего сайт автоматически получает короткоживущий токен подтверждения. SMS через Nikita остаётся fallback.

Переменные backend:

```text
WHATSAPP_BOT_PHONE=996555123456
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_APP_SECRET=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=...
WHATSAPP_GRAPH_API_VERSION=v23.0
```

В Meta for Developers укажите callback:

```text
https://losos-production.up.railway.app/api/auth/whatsapp/webhook
```

Verify token должен совпадать с `WHATSAPP_WEBHOOK_VERIFY_TOKEN`; для WhatsApp Business Account нужно подписаться на поле `messages`. Секреты Meta должны храниться только в backend-переменных окружения.

## Каталог и миграции

При запуске API TypeORM применяет только версионированные миграции. Полный каталог добавляется идемпотентно: отсутствующие категории, блюда и акции создаются, а изменения администратора не перезаписываются.

После изменения `app/data/catalog.ts` обновите воспроизводимый серверный снимок:

```powershell
npm --prefix server run catalog:generate
```

Ручные команды для Railway или локальной диагностики:

```powershell
npm run build
npm run start
npm --prefix server run build
npm --prefix server run migration:run
npm --prefix server run seed
```

Frontend на Railway должен собираться и запускаться стандартным Node-runtime:

```text
Build Command: npm run build
Start Command: npm run start
```

Для карты достаточно задать в Variables frontend-сервиса `YANDEX_MAPS_API_KEY`.
Если используются отдельные ключи сервисов Яндекса, дополнительно задайте
`YANDEX_SUGGEST_API_KEY` и `YANDEX_GEOCODER_API_KEY`. После изменения Variables
нужно применить staged changes и дождаться нового deployment. Проверка настройки:
`GET /api/maps-config` должен возвращать непустые `mapsApiKey` и `suggestApiKey`,
а `GET /api/geocode?region=bishkek&q=Манаса%201` — статус `200`.

## Проверка сборки

```powershell
npm run build
npm run vercel-build
npm run lint
npm test
npm run api:build
npm --prefix server test
```

`npm run build` и `npm run vercel-build` проверяют Next.js production-путь,
который используется frontend-сервисом на Railway.
