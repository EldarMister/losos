# Накта суши — mobile

Мобильный клиент на React Native + Expo для общей витрины и NestJS API проекта.

## Что уже работает

- онбординг и запрос разрешения на уведомления;
- выбор города, доставки или самовывоза;
- каталог и акции из общей PostgreSQL через `GET /api/categories` и `GET /api/promotions`;
- серверный поиск;
- карточка блюда, обязательные и необязательные модификаторы;
- постоянная корзина;
- оформление и создание заказа через общий `POST /api/orders`.

## Запуск

```powershell
cd mobile
Copy-Item .env.example .env.local
npm install
npm start
```

Для UI-разработки можно открыть проект в Expo Go. Remote push на Android проверяется только в development/release build:

```powershell
npx expo run:android
```

## Нативная карта Yandex MapKit

Экран выбора адреса на iOS и Android использует нативный Yandex MapKit, а не WebView. Создайте отдельный ключ типа **MapKit** в кабинете Яндекса, привязав его к `kg.naktasushi.mobile` (и iOS bundle identifier), и задайте его в `EXPO_PUBLIC_YANDEX_MAPKIT_API_KEY`. Для EAS Build укажите ту же переменную окружения в профиле сборки: ключ добавляется в iOS AppDelegate во время prebuild.

После добавления или обновления MapKit пересоберите нативное приложение — Expo Go не содержит этот нативный модуль:

```powershell
npx expo prebuild --clean --no-install
npx expo run:android
```

Для локального API укажите адрес компьютера в сети, а не `localhost`, например:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000/api
```

## Важное про уведомления

После входа приложение синхронизирует Expo push-токен с общим API, удаляет его при выходе и открывает `naktasushi://orders/<id>` прямо в деталях заказа. Для сборки задайте `EXPO_PUBLIC_EAS_PROJECT_ID` и настройте FCM/APNs credentials вне Git.

## Проверки

```powershell
npm run typecheck
npm run doctor
npx expo export --platform web
```
