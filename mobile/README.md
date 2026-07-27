# Много лосося — mobile

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

Откройте QR-код в Expo Go. Проект использует Expo SDK 54 для совместимости с текущим Expo Go.

Для локального API укажите адрес компьютера в сети, а не `localhost`, например:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000/api
```

## Важное про уведомления

Запрос системного разрешения реализован. Удалённые push-уведомления на Android требуют development build и серверное хранение Expo/FCM-токена; Expo Go поддерживает только локальные уведомления.

## Проверки

```powershell
npm run typecheck
npm run doctor
npx expo export --platform web
```
