@echo off
title Full Stack Dev Starter

echo ===============================
echo Starting Backend Server...
echo ===============================

start "Backend" cmd /k ^
cd backend ^
npm install ^
npm run dev

timeout /t 5 /nobreak > nul

echo ===============================
echo Starting Frontend Server...
echo ===============================

start "client" cmd /k ^
cd client ^
npm install ^
npm run dev

timeout /t 5 /nobreak > nul

echo ===============================
echo Opening Browser...
echo ===============================

start http://localhost:3000

echo ===============================
echo All services started
echo ===============================

pause
