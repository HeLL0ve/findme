# FindMe — поиск потерянных питомцев

Платформа для поиска потерянных и найденных домашних животных. Пользователи могут размещать объявления, общаться в чатах, получать уведомления через браузер и Telegram.

## Стек

**Backend:** Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL, Redis, WebSocket (ws), Passport.js (Google OAuth), Nodemailer, Telegram Bot API

**Frontend:** React 19, TypeScript, Vite, Radix UI, Zustand, React Router, Leaflet, Recharts, Axios

**Инфраструктура:** Docker, Docker Compose

---

## Переменные окружения

В проекте три env-файла для разных сценариев запуска:

| Файл | Когда нужен |
|------|-------------|
| `.env` | Docker Compose — содержит все переменные включая `POSTGRES_*` |
| `backend/.env` | Локальный запуск без Docker (`REDIS_HOST=localhost`) |
| `frontend/.env` | Опционально — только если API не на `localhost:3000` |

```bash
cp .env.example .env
cp backend/.env.example backend/.env
# frontend/.env нужен только если меняешь URL API
```

Заполни значения в скопированных файлах. Реальные секреты никогда не коммить.

---

## Быстрый старт через Docker

```bash
cp .env.example .env
# заполни .env
docker-compose up --build
```

Приложение будет доступно:
- Фронтенд: http://localhost:5173
- Бэкенд API: http://localhost:3000

### Запустить только базы данных

```bash
docker-compose up postgres redis
```

### Запустить только бэкенд и фронтенд в контейнерах

```bash
docker-compose up frontend backend
```

---

## Локальная разработка

### Требования

- Node.js 20+
- Docker (для PostgreSQL и Redis)

### Установка

```bash
npm install
```

### Настройка окружения

```bash
cp backend/.env.example backend/.env
# заполни backend/.env
```

### Запуск баз данных

```bash
docker-compose up postgres redis
```

### Применить миграции

```bash
cd backend
npx prisma migrate deploy
```

### Запуск dev-серверов

```bash
npm run dev
```

Запускает бэкенд (порт 3000) и фронтенд (порт 5173) одновременно через `concurrently`.

### Prisma Studio

```bash
cd backend
npx prisma studio --config ./prisma.config.ts
```

### Миграция внутри Docker-контейнера

```bash
docker-compose exec backend npx prisma migrate dev
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
│   │   └── app.ts          # Express приложение
│   ├── uploads/            # Загруженные файлы (не в git)
│   ├── .env.example        # Пример переменных для локального запуска
│   └── Dockerfile
├── frontend/               # React приложение
│   ├── public/             # Статические файлы
│   ├── src/
│   │   ├── app/            # App, Header, Footer
│   │   ├── components/     # Переиспользуемые компоненты
│   │   ├── pages/          # Страницы
│   │   └── shared/         # Хуки, стор, утилиты
│   └── .env.example        # Пример переменных (опционально)
├── .env.example            # Пример переменных для Docker Compose
├── docker-compose.yml
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
