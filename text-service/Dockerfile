FROM node:20-bullseye-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 9000
CMD ["node", "app.js"]
