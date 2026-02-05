# FindMe

## Запуск проекта через докер всего

```bash
docker-compose up --build
```

## Запуск фронта и бека через контейнер

```bash
docker-compose up frontend backend
```

## Запуск обоих бд через контейнер

```bash
docker-compose up postgres redis
```

## Запуск проекта локально

## Запуск обоих бд через контейнер(обязательно, даже локально)

```bash
docker-compose up postgres redis
```

```bash
npm run dev
```

## Запуск Prisma Studio

```bash
npx prisma studio --config ./prisma.config.ts
```
