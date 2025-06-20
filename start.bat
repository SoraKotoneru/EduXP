@echo off
REM Скрипт запуска сервера и открытия страницы в браузере

REM Переходим в папку server и устанавливаем зависимости при необходимости
pushd %~dp0server
if not exist node_modules (
  echo Installing server dependencies...
  npm install
)

echo Starting server with hot reload...
start "EduXP Server" cmd /k "npm run dev"
popd

REM Ожидаем несколько секунд, чтобы сервер успел запуститься
timeout /t 3 /nobreak >nul

echo Opening game in browser...
start "" "http://localhost:3000/game.html"

echo Done. 