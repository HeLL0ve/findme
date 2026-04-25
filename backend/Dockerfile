FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

# Применяем миграции и запускаем сервер
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
