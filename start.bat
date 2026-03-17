@echo off
title DealerHub - Gestion de Concesionario
echo.
echo  ========================================
echo    DealerHub - Iniciando servidor...
echo  ========================================
echo.
cd /d "%~dp0"
start "" http://localhost:4000
npm run dev -- -p 4000
