# Multi-stage build для React + Vite приложения

# Stage 1: Build
FROM node:20-alpine AS builder

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

# Сборка приложения
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Здоровье контейнера
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
