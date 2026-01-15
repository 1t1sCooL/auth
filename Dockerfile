FROM node:20-slim

WORKDIR /app

# Копируем файлы зависимостей
COPY be/package*.json ./
RUN npm install --production

# Копируем исходный код
COPY . .

# Auth-сервис обычно слушает порт (например, 3000 или 5001)
EXPOSE 3000

CMD ["node", "be/src/server"]