# Много лосося — React + NestJS + PostgreSQL

Полноценная локальная копия витрины `mnogolososya.ru` с адаптивным интерфейсом, каталогом, поиском, карточкой товара, адресом доставки и корзиной.

## Структура

- `app/` — React 19 / Next-compatible frontend на vinext;
- `server/` — NestJS REST API;
- PostgreSQL — категории, товары, заказы и позиции заказа;
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
- `GET /api/categories` — категории вместе с товарами;
- `GET /api/products?search=лосось&category=rolly-2` — поиск и фильтрация;
- `GET /api/products/:id` — карточка товара;
- `POST /api/orders` — создание заказа;
- `GET /api/orders/:id` — получение заказа.

При первом запуске NestJS автоматически создаёт таблицы и заполняет каталог демонстрационными данными.

## Проверка сборки

```powershell
npm run build
npm run api:build
```
