# Development mode для React + Vite приложения

FROM node:20-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходники
COPY . .

# Build аргументы для Vite переменных окружения
ARG VITE_API_URL
ARG VITE_ADMIN_USERNAME
ARG VITE_ADMIN_PASSWORD

# Создаём .env файл из build args
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env && \
    echo "VITE_ADMIN_USERNAME=${VITE_ADMIN_USERNAME}" >> .env && \
    echo "VITE_ADMIN_PASSWORD=${VITE_ADMIN_PASSWORD}" >> .env

# Здоровье контейнера
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3001/ || exit 1

EXPOSE 3001

# Запускаем Vite dev сервер с доступом извне
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
