FROM node:18-alpine

# Создаём рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json сервера и устанавливаем зависимости
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Копируем весь проект
COPY . .

# Порт приложения
EXPOSE 3000

# Переменная окружения по умолчанию для JWT_SECRET (переопределять при запуске)
ENV JWT_SECRET=change_me

# Запуск сервера
CMD ["node", "server/index.js"] 