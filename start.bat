@echo off
REM Скрипт запуска сервера и открытия страницы в браузере

REM Определяем путь к npm
set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
if not exist %NPM_CMD% (
  set "NPM_CMD=npm.cmd"
)

REM Переходим в папку server и устанавливаем зависимости при необходимости
pushd %~dp0\server
if not exist node_modules (
  echo Installing server dependencies...
  %NPM_CMD% install
)

echo Starting server with hot reload...
start "EduXP Server" cmd /k "%NPM_CMD% run dev"
popd

REM Ожидаем несколько секунд, чтобы сервер успел запуститься
timeout /t 3 /nobreak >nul

echo Opening app in browser...
start "" "http://localhost:3000/"

echo Done.

set DATESTAMP=%DATE:~6,4%-%DATE:~3,2%-%DATE:~0,2%_%TIME:~0,2%-%TIME:~3,2%
if not exist backups mkdir backups
copy server\db.sqlite backups\db_backup_%DATESTAMP%.sqlite
REM Запуск сервера
node server/index.js 