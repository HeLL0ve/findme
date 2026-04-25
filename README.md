# FindMe — поиск потерянных питомцев

Платформа для поиска потерянных и найденных домашних животных. Пользователи могут размещать объявления, общаться в чатах, получать уведомления через браузер и Telegram.

## Стек

**Backend:** Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL, Redis, WebSocket (ws), Passport.js (Google OAuth), Nodemailer, Telegram Bot API

**Frontend:** React 19, TypeScript, Vite, Radix UI, Zustand, React Router, Leaflet, Recharts, Axios

**Инфраструктура:** Docker (только базы данных), Docker Compose

---

## Переменные окружения

| Файл | Когда нужен |
|------|-------------|
| `backend/.env` | Всегда — переменные бэкенда |
| `frontend/.env` | Опционально — только если API не на `localhost:3000` |
| `.env` | Только для Docker Compose (содержит `POSTGRES_*`) |

```bash
cp backend/.env.example backend/.env
# заполни backend/.env

# .env в корне нужен только для docker-compose up
cp .env.example .env
```

---

## Запуск

### 1. Установить зависимости

```bash
npm install
```

### 2. Запустить базы данных через Docker

```bash
docker-compose up -d
```

Поднимает PostgreSQL (порт 5432) и Redis (порт 6379).

### 3. Применить миграции

```bash
cd backend
npx prisma migrate deploy
```

### 4. Запустить dev-серверы

```bash
npm run dev
```

Запускает бэкенд (порт 3000) и фронтенд (порт 5173) одновременно.

---

## Полезные команды

### Остановить базы данных

```bash
docker-compose down
```

### Prisma Studio

```bash
cd backend
npx prisma studio --config ./prisma.config.ts
```

### Создать новую миграцию

```bash
cd backend
npx prisma migrate dev --name название_миграции
```

###Применяет все еще не выполненные миграции
```bash
cd backend
npx prisma migrate deploy
```

---

## Структура проекта

```
findme/
├── backend/                # Express API
│   ├── prisma/             # Схема БД и миграции
│   ├── src/
│   │   ├── modules/        # Модули (auth, ads, chats, notifications, ...)
│   │   ├── shared/         # Общие утилиты и ошибки
│   │   ├── ws/             # WebSocket сервер
│   │   └── app.ts
│   ├── uploads/            # Загруженные файлы (не в git)
│   └── .env.example
├── frontend/               # React приложение
│   ├── public/
│   ├── src/
│   │   ├── app/            # App, Header, Footer
│   │   ├── components/     # Переиспользуемые компоненты
│   │   ├── pages/          # Страницы
│   │   └── shared/         # Хуки, стор, утилиты
│   └── .env.example
├── .env.example            # Переменные для Docker Compose
├── docker-compose.yml      # Только PostgreSQL и Redis
└── README.md
```

---

## Основные возможности

- Регистрация и вход (email/пароль, Google OAuth)
- Подтверждение email, сброс пароля
- Создание объявлений о потерянных/найденных питомцах с фото и геолокацией
- Модерация объявлений администратором
- Чаты между пользователями в реальном времени (WebSocket)
- Уведомления в браузере и через Telegram
- Избранное (localStorage)
- Счётчик просмотров объявлений
- Фильтрация по дате, типу, городу
- Карта объявлений (Leaflet)
- Жалобы на объявления и пользователей
- Поддержка пользователей через чат с администратором
- Публикация одобренных объявлений в Telegram-канал
- Административная панель со статистикой и аналитикой

---

## Дополнительные руководства

- [Настройка Gmail](./GMAIL_SETUP.md)
- [Настройка Google OAuth](./GOOGLE_AUTH_SETUP.md)
- [Cloudflare Tunnel для Telegram и Google OAuth](./CLOUDFLARED_TELEGRAM_SETUP.md)
