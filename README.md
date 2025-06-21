## Атрибуция
Изображения и иконки на этом сайте взяты с ресурса [Freepik](https://ru.freepik.com) и используются в некоммерческом проекте.

# EduXP

## Миграции базы данных (Sequelize CLI)

1. Установка:
   npm install --save-dev sequelize-cli
2. Инициализация:
   npx sequelize-cli init
3. Создание миграции:
   npx sequelize-cli migration:generate --name имя_миграции
4. Применение миграций:
   npx sequelize-cli db:migrate

## Бэкап базы данных (SQLite)

- Для Windows: используйте скрипт backup_db.bat
- Для Linux/Mac: используйте скрипт backup_db.sh

## Восстановление из бэкапа

1. Остановите сервер.
2. Скопируйте нужный файл из папки backups вместо server/db.sqlite
3. Запустите сервер.

## Рекомендации по деплою

- Не коммитьте db.sqlite в git (он уже в .gitignore)
- Для Docker используйте volume для хранения БД
- Для облака делайте регулярные бэкапы
