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
- `POST /api/orders` — создание заказа;
- `GET /api/admin/dashboard?region=bishkek` — каталог и акции для админки;
- `GET /api/admin/orders?regionSlug=bishkek` — очередь заказов;
- `GET /api/admin/orders/:id` — полная карточка заказа;
- `PATCH /api/admin/orders/:id/status` — перевод заказа в следующий статус.

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

## Каталог и миграции

При запуске API TypeORM применяет только версионированные миграции. Полный каталог добавляется идемпотентно: отсутствующие категории, блюда и акции создаются, а изменения администратора не перезаписываются.

После изменения `app/data/catalog.ts` обновите воспроизводимый серверный снимок:

```powershell
npm --prefix server run catalog:generate
```

Ручные команды для Railway или локальной диагностики:

```powershell
npm --prefix server run build
npm --prefix server run migration:run
npm --prefix server run seed
```

## Проверка сборки

```powershell
npm run build
npm run vercel-build
npm run lint
npm test
npm run api:build
npm --prefix server test
```

`npm run vercel-build` проверяет тот же Next.js production-путь, который используется фронтендом на Vercel.
