# Nginx конфигурация для фронтенда

## Проблема
После сборки фронтенд работает на `localhost:3001` без base path. Все роуты находятся в корне (`/`, `/subscriptions`, `/servers` и т.д.), а не в `/admin/*`.

## Решение
Nginx должен перенаправлять запросы с `/admin/` на контейнер и делать rewrite путей.

## Конфигурация nginx

Добавьте в конфигурацию вашего сайта (`/etc/nginx/sites-available/sub.hyper-vpn.ru`):

```nginx
server {
    server_name sub.hyper-vpn.ru;
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend Admin Panel - основная страница и роуты
    location /admin {
        rewrite ^/admin/(.*)$ /$1 break;
        rewrite ^/admin$ / break;
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend static assets (JS, CSS, images)
    location /assets {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_cache_valid 200 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # Корень - другой контент или редирект
    location / {
        # Ваш основной контент или редирект
        return 301 https://hyper-vpn.ru;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/sub.hyper-vpn.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sub.hyper-vpn.ru/privkey.pem;
}

server {
    listen 80;
    server_name sub.hyper-vpn.ru;
    return 301 https://$server_name$request_uri;
}
```

## Как это работает

1. **Запрос:** `https://sub.hyper-vpn.ru/admin/subscriptions`
   - Nginx перехватывает по `location /admin`
   - Делает rewrite: `/admin/subscriptions` → `/subscriptions`
   - Проксирует на `http://127.0.0.1:3001/subscriptions`
   - `serve` отдает `dist/index.html` (SPA mode)
   - React Router обрабатывает роут `/subscriptions`

2. **Запрос:** `https://sub.hyper-vpn.ru/assets/index-xxx.js`
   - Nginx перехватывает по `location /assets`
   - Проксирует на `http://127.0.0.1:3001/assets/index-xxx.js`
   - `serve` отдает файл из `dist/assets/index-xxx.js`

3. **Запрос:** `https://sub.hyper-vpn.ru/api/subscriptions`
   - Nginx перехватывает по `location /api`
   - Проксирует на `http://localhost:3000/api/subscriptions`
   - Backend обрабатывает запрос

## После настройки

1. Проверьте конфигурацию:
   ```bash
   sudo nginx -t
   ```

2. Перезагрузите nginx:
   ```bash
   sudo systemctl reload nginx
   ```

3. Пересоберите и запустите фронтенд:
   ```bash
   cd /var/www/hyper-vpn/hyper-vpn-sub-front
   docker-compose up -d --build
   ```

4. Проверьте работу:
   - Откройте `https://sub.hyper-vpn.ru/admin/`
   - Должна открыться страница логина
   - В консоли браузера не должно быть ошибок MIME type

## Troubleshooting

### Ошибка "MIME type of text/html"
- Проверьте что location /assets правильно проксирует запросы
- Убедитесь что rewrite в location /admin работает корректно

### Роуты не работают (404)
- Проверьте что `serve` запущен с флагом `-s` (SPA mode)
- Убедитесь что в Dockerfile: `CMD ["serve", "-s", "dist", "-l", "3001"]`

### Стили не загружаются
- Очистите кеш браузера (Ctrl+Shift+R)
- Проверьте что контейнер запущен: `docker ps | grep hyper-vpn-frontend`
